// Supabase Edge Function: plaid-sync-transactions
// Fetches new/modified/removed transactions from Plaid using cursor-based sync
// (/transactions/sync) and upserts them into the transactions table.
//
// Can be invoked two ways:
//   1. By the browser (user JWT in Authorization header) — syncs only that user's items
//   2. By pg_cron (CRON_SECRET header) — syncs ALL active items for all users
//
// Request body (optional): { item_id?: string }  — sync a specific item only
//
// Required Edge Function secrets:
//   PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV
//   SUPABASE_SERVICE_ROLE_KEY
//   CRON_SECRET   (a random string you set; pg_cron sends it to authorize cron calls)

import { createClient } from 'npm:@supabase/supabase-js@2';

const PLAID_BASE_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.plaid.com',
  production: 'https://production.plaid.com',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

// Plaid transaction type returned by /transactions/sync
interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  date: string;
  name: string;
  merchant_name: string | null;
  amount: number;       // positive = expense (money leaving account), negative = credit
  category: string[] | null;
  pending: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const adminSupabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Determine caller: cron (shared secret) or user (JWT)
  const cronSecret = Deno.env.get('CRON_SECRET');
  const isCron = cronSecret && req.headers.get('x-cron-secret') === cronSecret;
  let userId: string | null = null;

  if (!isCron) {
    const userSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error } = await userSupabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    userId = user.id;
  }

  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const specificItemId: string | undefined = body?.item_id;

  const plaidEnv = Deno.env.get('PLAID_ENV') ?? 'sandbox';
  const baseUrl = PLAID_BASE_URLS[plaidEnv] ?? PLAID_BASE_URLS.sandbox;

  try {
    // Fetch items to sync
    let itemQuery = adminSupabase
      .from('plaid_items')
      .select('id, user_id, item_id, access_token, cursor')
      .eq('status', 'active');

    if (userId) itemQuery = itemQuery.eq('user_id', userId);
    if (specificItemId) itemQuery = itemQuery.eq('item_id', specificItemId);

    const { data: items, error: itemsError } = await itemQuery;
    if (itemsError) throw itemsError;

    const results: { item_id: string; added: number; modified: number; removed: number; error?: string }[] = [];

    for (const item of items ?? []) {
      try {
        const syncResult = await syncItem(item, baseUrl, adminSupabase);
        results.push({ item_id: item.item_id, ...syncResult });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error syncing item ${item.item_id}:`, message);

        // Mark item as errored so the UI can surface it
        await adminSupabase
          .from('plaid_items')
          .update({ status: 'error', error_code: message })
          .eq('item_id', item.item_id);

        results.push({ item_id: item.item_id, added: 0, modified: 0, removed: 0, error: message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('plaid-sync-transactions error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function syncItem(
  item: { id: string; user_id: string; item_id: string; access_token: string; cursor: string | null },
  baseUrl: string,
  adminSupabase: ReturnType<typeof createClient>
): Promise<{ added: number; modified: number; removed: number }> {
  let cursor = item.cursor ?? undefined;
  let addedCount = 0;
  let modifiedCount = 0;
  let removedCount = 0;
  let hasMore = true;

  // Plaid cursor-based sync: loop until has_more is false
  while (hasMore) {
    const syncRes = await fetch(`${baseUrl}/transactions/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: Deno.env.get('PLAID_CLIENT_ID'),
        secret: Deno.env.get('PLAID_SECRET'),
        access_token: item.access_token,
        cursor,
        count: 100,
      }),
    });

    const syncData = await syncRes.json();

    if (!syncRes.ok) {
      throw new Error(syncData.error_message ?? `Plaid sync error: ${syncData.error_code}`);
    }

    const { added, modified, removed, next_cursor, has_more } = syncData;

    // Build a map of plaid_account_id → our account name for description/account tagging
    const accountIds: string[] = [
      ...added.map((t: PlaidTransaction) => t.account_id),
      ...modified.map((t: PlaidTransaction) => t.account_id),
    ];
    const uniqueAccountIds = [...new Set(accountIds)];

    const { data: plaidAccounts } = await adminSupabase
      .from('plaid_accounts')
      .select('plaid_account_id, name')
      .in('plaid_account_id', uniqueAccountIds);

    const accountNameMap: Record<string, string> = {};
    for (const pa of plaidAccounts ?? []) {
      accountNameMap[pa.plaid_account_id] = pa.name;
    }

    // Upsert added transactions
    if (added.length > 0) {
      const rows = added
        .filter((t: PlaidTransaction) => !t.pending)
        .map((t: PlaidTransaction) => plaidTransactionToRow(t, item.user_id, accountNameMap));

      const { error } = await adminSupabase
        .from('transactions')
        .upsert(rows, { onConflict: 'plaid_transaction_id' });

      if (error) throw error;
      addedCount += rows.length;
    }

    // Upsert modified transactions
    if (modified.length > 0) {
      const rows = modified
        .filter((t: PlaidTransaction) => !t.pending)
        .map((t: PlaidTransaction) => plaidTransactionToRow(t, item.user_id, accountNameMap));

      const { error } = await adminSupabase
        .from('transactions')
        .upsert(rows, { onConflict: 'plaid_transaction_id' });

      if (error) throw error;
      modifiedCount += rows.length;
    }

    // Soft-delete removed transactions (null out budget assignment, mark deleted status)
    if (removed.length > 0) {
      const removedIds = removed.map((t: { transaction_id: string }) => t.transaction_id);

      const { error } = await adminSupabase
        .from('transactions')
        .update({ status: 'deleted' })
        .in('plaid_transaction_id', removedIds)
        .eq('user_id', item.user_id);

      if (error) throw error;
      removedCount += removed.length;
    }

    cursor = next_cursor;
    hasMore = has_more;
  }

  // Persist updated cursor and last_synced_at
  await adminSupabase
    .from('plaid_items')
    .update({ cursor, last_synced_at: new Date().toISOString(), status: 'active', error_code: null })
    .eq('item_id', item.item_id);

  return { added: addedCount, modified: modifiedCount, removed: removedCount };
}

function plaidTransactionToRow(
  t: PlaidTransaction,
  userId: string,
  accountNameMap: Record<string, string>
) {
  // Plaid: positive amount = money leaving the account (expense); negative = credit (income)
  const isExpense = t.amount > 0;
  return {
    user_id: userId,
    plaid_transaction_id: t.transaction_id,
    date: t.date,
    description: t.merchant_name ?? t.name,
    amount: Math.abs(t.amount),
    type: isExpense ? 'expense' : 'income',
    category: t.category?.[0] ?? 'Uncategorized',
    account: accountNameMap[t.account_id] ?? t.account_id,
    status: 'cleared',
    budget_id: null,
  };
}
