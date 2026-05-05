// Service layer for Plaid-related operations in app-v2.
// All Plaid API calls go through Supabase Edge Functions — never directly to Plaid from the browser.

import { supabase } from '@/lib/supabase';

export interface PlaidItem {
  id: string;
  itemId: string;
  institutionId: string;
  institutionName: string;
  status: 'active' | 'error' | 'disconnected';
  errorCode: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface PlaidAccount {
  id: string;
  plaidAccountId: string;
  itemId: string;
  accountId: string | null;
  name: string;
  mask: string | null;
  type: string;
  subtype: string | null;
}

function mapItemFromDb(row: Record<string, unknown>): PlaidItem {
  return {
    id: row.id as string,
    itemId: row.item_id as string,
    institutionId: row.institution_id as string,
    institutionName: row.institution_name as string,
    status: row.status as PlaidItem['status'],
    errorCode: (row.error_code as string) ?? null,
    lastSyncedAt: (row.last_synced_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function mapAccountFromDb(row: Record<string, unknown>): PlaidAccount {
  return {
    id: row.id as string,
    plaidAccountId: row.plaid_account_id as string,
    itemId: row.item_id as string,
    accountId: (row.account_id as string) ?? null,
    name: row.name as string,
    mask: (row.mask as string) ?? null,
    type: row.type as string,
    subtype: (row.subtype as string) ?? null,
  };
}

export const plaidService = {
  /** Fetch all connected institutions for the current user */
  async getItems(): Promise<PlaidItem[]> {
    const { data, error } = await supabase
      .from('plaid_items')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapItemFromDb);
  },

  /** Fetch all Plaid accounts for a given item */
  async getAccountsForItem(itemId: string): Promise<PlaidAccount[]> {
    const { data, error } = await supabase
      .from('plaid_accounts')
      .select('*')
      .eq('item_id', itemId);

    if (error) throw error;
    return (data ?? []).map(mapAccountFromDb);
  },

  /** Request a Plaid Link token from the Edge Function */
  async createLinkToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await supabase.functions.invoke('plaid-link-token', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.error) throw res.error;
    return (res.data as { link_token: string }).link_token;
  },

  /** Exchange a public token (from Plaid Link) for a stored access token */
  async exchangeToken(
    publicToken: string,
    institution: { id: string; name: string },
    accounts: { id: string; name: string; mask: string; type: string; subtype: string }[]
  ): Promise<{ item_id: string }> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await supabase.functions.invoke('plaid-exchange-token', {
      body: { public_token: publicToken, institution, accounts },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.error) throw res.error;
    return res.data as { item_id: string };
  },

  /** Trigger a manual sync for a specific item (or all items if itemId omitted) */
  async syncTransactions(itemId?: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await supabase.functions.invoke('plaid-sync-transactions', {
      body: itemId ? { item_id: itemId } : {},
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.error) throw res.error;
  },

  /** Disconnect an institution — deletes the plaid_item and its plaid_accounts */
  async disconnectItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('plaid_items')
      .delete()
      .eq('item_id', itemId);

    if (error) throw error;
  },
};
