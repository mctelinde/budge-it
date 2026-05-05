import React, { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Building2, RefreshCw, Trash2, AlertCircle, CheckCircle2, Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { plaidService, type PlaidAccount, type PlaidItem } from '@/services/plaid';

interface ConnectedAccountsProps {
  /** Called after a successful connect or sync so the parent can refresh transaction data */
  onSyncComplete?: () => void;
}

// ── PlaidLinkButton ────────────────────────────────────────────────────────────
// Isolated so usePlaidLink only mounts when we have a link token.

interface PlaidLinkButtonProps {
  linkToken: string;
  onSuccess: (publicToken: string, metadata: PlaidLinkMetadata) => void;
  onExit: () => void;
}

interface PlaidLinkMetadata {
  institution: { institution_id: string; name: string } | null;
  accounts: { id: string; name: string; mask: string; type: string; subtype: string }[];
}

const PlaidLinkButton: React.FC<PlaidLinkButtonProps> = ({ linkToken, onSuccess, onExit }) => {
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => onSuccess(public_token, metadata as unknown as PlaidLinkMetadata),
    onExit: () => onExit(),
  });

  // Open automatically once ready
  useEffect(() => {
    if (ready) open();
  }, [ready, open]);

  return null;
};

// ── ConnectedAccounts ──────────────────────────────────────────────────────────

export const ConnectedAccounts: React.FC<ConnectedAccountsProps> = ({ onSyncComplete }) => {
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [accountsByItem, setAccountsByItem] = useState<Record<string, PlaidAccount[]>>({});
  const [loading, setLoading] = useState(true);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [connectingInstitution, setConnectingInstitution] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null); // item_id being synced
  const [disconnectTarget, setDisconnectTarget] = useState<PlaidItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const fetched = await plaidService.getItems();
      setItems(fetched);

      const acctMap: Record<string, PlaidAccount[]> = {};
      await Promise.all(
        fetched.map(async (item) => {
          acctMap[item.itemId] = await plaidService.getAccountsForItem(item.itemId);
        })
      );
      setAccountsByItem(acctMap);
    } catch (err) {
      console.error('Failed to load Plaid items:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ── Connect flow ──

  const handleConnectClick = async () => {
    setError(null);
    setConnectingInstitution(true);
    try {
      const token = await plaidService.createLinkToken();
      setLinkToken(token);
    } catch (err) {
      console.error('Failed to create link token:', err);
      setError('Unable to start bank connection. Please try again.');
      setConnectingInstitution(false);
    }
  };

  const handleLinkSuccess = async (publicToken: string, metadata: PlaidLinkMetadata) => {
    setLinkToken(null);
    if (!metadata.institution) {
      setConnectingInstitution(false);
      return;
    }
    try {
      await plaidService.exchangeToken(
        publicToken,
        { id: metadata.institution.institution_id, name: metadata.institution.name },
        metadata.accounts
      );
      await loadItems();
      onSyncComplete?.();
    } catch (err) {
      console.error('Failed to exchange token:', err);
      setError('Bank connected but setup failed. Please try again.');
    } finally {
      setConnectingInstitution(false);
    }
  };

  const handleLinkExit = () => {
    setLinkToken(null);
    setConnectingInstitution(false);
  };

  // ── Sync flow ──

  const handleSync = async (itemId: string) => {
    setSyncing(itemId);
    setError(null);
    try {
      await plaidService.syncTransactions(itemId);
      await loadItems();
      onSyncComplete?.();
    } catch (err) {
      console.error('Sync failed:', err);
      setError('Sync failed. Please try again.');
    } finally {
      setSyncing(null);
    }
  };

  // ── Disconnect flow ──

  const handleDisconnectConfirm = async () => {
    if (!disconnectTarget) return;
    try {
      await plaidService.disconnectItem(disconnectTarget.itemId);
      setDisconnectTarget(null);
      await loadItems();
    } catch (err) {
      console.error('Disconnect failed:', err);
      setError('Failed to disconnect. Please try again.');
    }
  };

  // ── Render ──

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Connected Accounts</h3>
          <p className="text-xs text-muted-foreground">
            Transactions sync automatically every day via Plaid.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleConnectClick}
          disabled={connectingInstitution}
        >
          <Plug className="size-3.5 mr-1.5" />
          {connectingInstitution ? 'Opening…' : 'Connect Account'}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="size-3.5 shrink-0" /> {error}
        </p>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground py-2">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          <Building2 className="size-8 mx-auto mb-2 opacity-30" />
          No accounts connected yet. Click <strong>Connect Account</strong> to link your first institution.
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {items.map((item) => {
            const accounts = accountsByItem[item.itemId] ?? [];
            const isSyncing = syncing === item.itemId;

            return (
              <div key={item.id} className="px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{item.institutionName}</p>
                      {item.lastSyncedAt && (
                        <p className="text-xs text-muted-foreground">
                          Last synced {new Date(item.lastSyncedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.status === 'active' ? (
                      <Badge variant="outline" className="text-green-600 border-green-300 dark:text-green-400 text-xs">
                        <CheckCircle2 className="size-3 mr-1" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
                        <AlertCircle className="size-3 mr-1" /> Error
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      title="Sync now"
                      disabled={isSyncing}
                      onClick={() => handleSync(item.itemId)}
                    >
                      <RefreshCw className={`size-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      title="Disconnect"
                      onClick={() => setDisconnectTarget(item)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {accounts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-6">
                    {accounts.map((acct) => (
                      <Badge key={acct.id} variant="secondary" className="text-xs font-normal">
                        {acct.name}{acct.mask ? ` ••${acct.mask}` : ''}
                      </Badge>
                    ))}
                  </div>
                )}

                {item.errorCode && (
                  <p className="text-xs text-destructive pl-6">{item.errorCode}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Plaid Link modal — only mounts when we have a token */}
      {linkToken && (
        <PlaidLinkButton
          linkToken={linkToken}
          onSuccess={handleLinkSuccess}
          onExit={handleLinkExit}
        />
      )}

      {/* Disconnect confirmation dialog */}
      <Dialog open={!!disconnectTarget} onOpenChange={(o) => !o && setDisconnectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-destructive" />
              Disconnect {disconnectTarget?.institutionName}?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will stop automatic transaction syncing from{' '}
            <strong>{disconnectTarget?.institutionName}</strong>. Your existing transactions will not be
            deleted.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDisconnectTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDisconnectConfirm}>Disconnect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
