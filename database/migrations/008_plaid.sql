-- Migration 008: Plaid integration tables
-- plaid_items: one row per connected institution per user (holds Plaid access token)
-- plaid_accounts: maps Plaid account IDs to our accounts table
-- Also adds plaid_transaction_id to transactions for dedup and removal handling

-- ==================== plaid_items ====================

CREATE TABLE public.plaid_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id          TEXT NOT NULL UNIQUE,
  access_token     TEXT NOT NULL,
  institution_id   TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  cursor           TEXT,           -- Plaid transactions/sync cursor; NULL = full historical load pending
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error', 'disconnected')),
  error_code       TEXT,
  last_synced_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plaid_items_user_id ON public.plaid_items(user_id);

ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plaid_items" ON public.plaid_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plaid_items" ON public.plaid_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plaid_items" ON public.plaid_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plaid_items" ON public.plaid_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at_plaid_items
  BEFORE UPDATE ON public.plaid_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==================== plaid_accounts ====================

CREATE TABLE public.plaid_accounts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id           TEXT NOT NULL REFERENCES public.plaid_items(item_id) ON DELETE CASCADE,
  plaid_account_id  TEXT NOT NULL UNIQUE,
  account_id        UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  mask              TEXT,          -- last 4 digits
  type              TEXT NOT NULL, -- depository, credit, loan, investment, other
  subtype           TEXT,          -- checking, savings, credit card, etc.
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plaid_accounts_user_id ON public.plaid_accounts(user_id);
CREATE INDEX idx_plaid_accounts_item_id ON public.plaid_accounts(item_id);

ALTER TABLE public.plaid_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plaid_accounts" ON public.plaid_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plaid_accounts" ON public.plaid_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plaid_accounts" ON public.plaid_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plaid_accounts" ON public.plaid_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- ==================== transactions: add plaid_transaction_id ====================

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS plaid_transaction_id TEXT UNIQUE;

CREATE INDEX idx_transactions_plaid_transaction_id
  ON public.transactions(plaid_transaction_id)
  WHERE plaid_transaction_id IS NOT NULL;
