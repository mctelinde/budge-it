// Supabase Edge Function: plaid-link-token
// Creates a Plaid Link token and returns it to the browser.
// The browser uses this token to initialize the Plaid Link modal (react-plaid-link).
//
// Required Edge Function secrets (set via Supabase dashboard or CLI):
//   PLAID_CLIENT_ID
//   PLAID_SECRET       (sandbox or production secret)
//   PLAID_ENV          ("sandbox" or "production")

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
    // Authenticate the user via the Supabase JWT in the Authorization header
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

    const plaidEnv = Deno.env.get('PLAID_ENV') ?? 'sandbox';
    const baseUrl = PLAID_BASE_URLS[plaidEnv] ?? PLAID_BASE_URLS.sandbox;

    const response = await fetch(`${baseUrl}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: Deno.env.get('PLAID_CLIENT_ID'),
        secret: Deno.env.get('PLAID_SECRET'),
        client_name: 'Budge-It',
        user: { client_user_id: user.id },
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Plaid link/token/create error:', data);
      return new Response(JSON.stringify({ error: data.error_message ?? 'Plaid error' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ link_token: data.link_token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('plaid-link-token error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
