// Supabase Edge Function: plaid-exchange-token
// Called by the browser after Plaid Link completes successfully.
// Exchanges the one-time public_token for a permanent access_token,
// stores the Item in plaid_items, and seeds plaid_accounts + accounts.
//
// Request body: { public_token: string, institution: { id: string, name: string }, accounts: PlaidAccount[] }
//   where PlaidAccount = { id: string, name: string, mask: string, type: string, subtype: string }
//
// Required Edge Function secrets:
//   PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV

import { createClient } from 'npm:@supabase/supabase-js@2';

const PLAID_BASE_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.plaid.com',
  production: 'https://production.plaid.com',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth via user JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { public_token, institution, accounts } = await req.json();

    if (!public_token || !institution || !accounts?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Exchange public_token for access_token via Plaid
    const plaidEnv = Deno.env.get('PLAID_ENV') ?? 'sandbox';
    const baseUrl = PLAID_BASE_URLS[plaidEnv] ?? PLAID_BASE_URLS.sandbox;

    const exchangeRes = await fetch(`${baseUrl}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: Deno.env.get('PLAID_CLIENT_ID'),
        secret: Deno.env.get('PLAID_SECRET'),
        public_token,
      }),
    });

    const exchangeData = await exchangeRes.json();

    if (!exchangeRes.ok) {
      console.error('Plaid exchange error:', exchangeData);
      return new Response(JSON.stringify({ error: exchangeData.error_message ?? 'Plaid exchange failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { access_token, item_id } = exchangeData;

    // Use service-role client for inserts (bypasses RLS for server-side operations)
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Upsert plaid_items row (handles reconnecting an existing institution)
    const { error: itemError } = await adminSupabase
      .from('plaid_items')
      .upsert({
        user_id: user.id,
        item_id,
        access_token,
        institution_id: institution.id,
        institution_name: institution.name,
        status: 'active',
        cursor: null,
      }, { onConflict: 'item_id' });

    if (itemError) throw itemError;

    // For each Plaid account, ensure a matching row in our accounts table exists,
    // then insert/upsert into plaid_accounts.
    for (const acct of accounts) {
      // Find or create an accounts row with a matching name
      let accountId: string | null = null;

      const { data: existingAccount } = await adminSupabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .ilike('name', acct.name)
        .maybeSingle();

      if (existingAccount) {
        accountId = existingAccount.id;
      } else {
        // Map Plaid account type to our account type
        const accountType = acct.type === 'credit' ? 'credit_card' : 'bank';

        const { data: newAccount, error: acctError } = await adminSupabase
          .from('accounts')
          .insert({
            user_id: user.id,
            name: acct.name,
            type: accountType,
            current_balance: 0,
            notes: `${institution.name} – imported via Plaid`,
          })
          .select('id')
          .single();

        if (acctError) throw acctError;
        accountId = newAccount.id;
      }

      // Upsert plaid_accounts row
      const { error: plaidAcctError } = await adminSupabase
        .from('plaid_accounts')
        .upsert({
          user_id: user.id,
          item_id,
          plaid_account_id: acct.id,
          account_id: accountId,
          name: acct.name,
          mask: acct.mask,
          type: acct.type,
          subtype: acct.subtype,
        }, { onConflict: 'plaid_account_id' });

      if (plaidAcctError) throw plaidAcctError;
    }

    return new Response(JSON.stringify({ success: true, item_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('plaid-exchange-token error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
