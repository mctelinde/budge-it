import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Landmark, Bell, Palette, Trash2, AlertTriangle, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ConnectedAccounts } from '@/components/ConnectedAccounts';

const settingsItems = [
  {
    title: 'Manage Categories',
    description: 'Create, edit, and organize transaction categories',
    icon: Tag,
    path: '/app/settings/categories',
  },
  {
    title: 'Accounts',
    description: 'Manage your bank accounts and payment methods',
    icon: Landmark,
    path: '/app/settings/accounts',
  },
  {
    title: 'Notifications',
    description: 'Configure alerts and reminders',
    icon: Bell,
    path: '/app/settings/notifications',
  },
  {
    title: 'Appearance',
    description: 'Customize the look and feel of the app',
    icon: Palette,
    path: '/app/settings/appearance',
  },
];

export const SettingsPage: React.FC = () => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClearData = async () => {
    setClearing(true);
    try {
      alert('Data clearing is not yet implemented with Supabase. Please use the Supabase dashboard to manage your data.');
      setConfirmOpen(false);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <p className="text-muted-foreground">Manage your application settings and preferences</p>

      {/* Settings list */}
      <Card>
        <CardContent className="p-0">
          {settingsItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={item.path}>
                <Link
                  to={item.path}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/50 transition-colors no-underline text-foreground"
                >
                  <Icon className="size-5 shrink-0 text-[#14959c] dark:text-[#1fb5bc]" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </Link>
                {index < settingsItems.length - 1 && <Separator />}
              </React.Fragment>
            );
          })}
        </CardContent>
      </Card>

      {/* Connected Accounts (Plaid) */}
      <Card>
        <CardContent className="p-4">
          <ConnectedAccounts />
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-1">Data Management</h3>
          <p className="text-xs text-muted-foreground mb-4">Manage your application data</p>
          <div className="flex items-center gap-4">
            <Trash2 className="size-9 text-destructive shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Clear All Data</p>
              <p className="text-xs text-muted-foreground">
                Remove all transactions, budgets, and settings. This action cannot be undone.
              </p>
            </div>
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 shrink-0"
              onClick={() => setConfirmOpen(true)}>
              <Trash2 className="size-4 mr-1.5" /> Clear Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onOpenChange={(o) => !clearing && setConfirmOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Confirm Clear All Data
            </DialogTitle>
          </DialogHeader>
          <Alert variant="destructive" className="border-amber-500 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30">
            <AlertDescription>This will permanently delete all your data including:</AlertDescription>
          </Alert>
          <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
            <li>All transactions</li>
            <li>All budgets and allocations</li>
            <li>All settings and preferences</li>
          </ul>
          <p className="text-sm font-semibold">This action cannot be undone. Are you sure?</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={clearing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearData} disabled={clearing}>
              {clearing ? 'Clearing…' : 'Yes, Clear All Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
