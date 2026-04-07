# Copilot Instructions — budge-it

## Commands

```bash
npm start          # Dev server at localhost:3000
npm run build      # Production build
npm test           # Run all tests (interactive watch mode)
npm test -- --testPathPattern=MyComponent --watchAll=false  # Run single test file
```

Linting runs automatically during build via react-scripts (ESLint with `react-app` config). There is no standalone lint command.

## Local Deployment

The app is served in production mode using [PM2](https://pm2.keymetrics.io/) + the `serve` static file server. The PM2 configuration lives in `ecosystem.config.js`.

```bash
npm run deploy     # Build + start (or restart if already running)
npm run serve      # Start without rebuilding
npm run stop       # Stop the server
npm run restart    # Restart without rebuilding
npm run status     # Show PM2 process status
npm run logs       # Tail server logs
```

The app runs on **http://localhost:3000** with no console window — PM2 manages it as a background daemon. To configure PM2 to auto-start on Windows login, run `pm2 startup` once and follow its instructions.

> **Note for Copilot:** When verifying the app is running, check `npm run status` or `Invoke-WebRequest http://localhost:3000`. Do **not** use `detach: true` when starting the server — the PM2 daemon already handles backgrounding.

Database migrations live in `database/migrations/`. Run them via the Supabase Management API (see **Supabase Operations** section below).

## Architecture

This is a React + TypeScript personal finance app. The data layer flows:

```
AuthContext (auth state)
    ↓
Page component (e.g. TransactionsPage)
    ↓  useEffect on mount + after every mutation
src/services/database.ts  ←→  Supabase (PostgreSQL + Auth)
```

**Key files:**
- `src/services/database.ts` — all Supabase CRUD; the only place that touches the database directly
- `src/contexts/AuthContext.tsx` — provides `user`, `session`, `signIn`, `signOut` via `useAuth()`
- `src/lib/supabase.ts` — single Supabase client instance
- `src/App.tsx` — routing with `ProtectedRoute` wrapper that redirects to `/auth` when unauthenticated

**Pages** (`src/pages/`) fetch their own data on mount and re-fetch after every mutation — there is no shared cache or global data store. Auth state is the only global context.

**Components** (`src/components/`) are pure UI — they receive data and callbacks as props and do not call services directly.

## Type System & snake_case ↔ camelCase Mapping

The database uses `snake_case`; the app uses `camelCase`. The service layer in `src/services/database.ts` maps between them via `mapBudgetFromDb()` and `mapTransactionFromDb()`.

| DB column (`src/types/database.ts`) | App type (`src/types/transaction.ts`) |
|--------------------------------------|---------------------------------------|
| `budget_id` | `budgetId` |
| `starting_balance` | `startingBalance` |
| `start_date` | `startDate` |
| `rollover_day` | `rolloverDay` |
| `display_order` | `displayOrder` |
| `created_at` | `createdAt` |

Always use app-layer camelCase types (`Transaction`, `Budget` from `src/types/transaction.ts`) in components and pages. Only use `src/types/database.ts` types inside `src/services/database.ts`.

## Key Conventions

**Service layer pattern** — all DB access goes through the three service objects in `src/services/database.ts`: `budgetService`, `transactionService`, `categoryService`. Add new queries there, not inline in components.

**Styling** — MUI `sx` prop exclusively. No CSS modules or separate stylesheets for component styles. Theme-aware colors use `theme.palette.mode === 'dark'` conditionals inline. Access the theme via `useTheme()`.

**Component exports** — named exports only (e.g. `export const BudgetCard: React.FC<BudgetCardProps>`). Props interfaces are defined inline above the component and named `<ComponentName>Props`.

**Callback prop naming** — event handler props use the `on` prefix: `onEdit`, `onDelete`, `onManageTransactions`.

**Responsive layout** — `useMediaQuery(theme.breakpoints.down('sm'))` determines mobile vs desktop. `TransactionTable` renders MUI `DataGrid` on desktop and custom card list on mobile.

**HTML entities in descriptions** — use `decodeHtmlEntities()` from `src/utils/textUtils.ts` when rendering any transaction description (e.g. `&amp;` → `&`). Also apply it at import time in `src/utils/csvImport.ts`.

**CSV import** — `src/utils/csvImport.ts` supports Chase, PayPal, and TFCU formats. Each has its own row interface and parser function. Add new bank formats here.

**Budget calculations** — period math (elapsed periods, cumulative budget, rollover day) lives in `src/utils/budgetCalculations.ts`. Chart data generation is in `src/utils/budgetGraphData.ts`.

## MCP Servers

**Playwright** (`.vscode/mcp.json`) — use for browser automation and UI verification against the running dev server at `http://localhost:3000`. Requires the dev server to be running (`npm start`) before using Playwright tools.

## Environment

```
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_ANON_KEY=...
```

The anon key is subject to Supabase Row Level Security (RLS) — all queries are automatically scoped to the authenticated user. A service role key (bypasses RLS) should never be committed and is only used for admin/migration tasks.

## Supabase Operations

**Project details:**
- Project ref: `xmkvrywwgtmiupgchlkq`
- Project URL: `https://xmkvrywwgtmiupgchlkq.supabase.co`
- Credentials are in `.env.local` (anon key) — service role key is provided by the user at runtime; never commit it

**Credential hierarchy — what each key unlocks:**

| Key | Stored in | Can do |
|-----|-----------|--------|
| Anon key (`REACT_APP_SUPABASE_ANON_KEY`) | `.env.local` | REST CRUD scoped by RLS |
| Service role key (user-provided) | never committed | REST CRUD bypassing RLS, but still **no DDL** |
| Personal Access Token (PAT) | user's Supabase account | Management API — DDL, schema changes, migrations |

**Running migrations (DDL):**

The service role key does **not** work for DDL. To run a migration, use the Supabase Management API with a **Personal Access Token (PAT)**. The PAT is stored in `.env.local` as `SUPABASE_PAT` — read it from there; do **not** ask the user for it. Then:

```powershell
$pat = (Get-Content .env.local | Select-String "SUPABASE_PAT").ToString().Split("=",2)[1].Trim()
$projectRef = "xmkvrywwgtmiupgchlkq"
$sql = Get-Content "database/migrations/NNN_name.sql" -Raw
$body = @{ query = $sql } | ConvertTo-Json -Depth 10
Invoke-RestMethod `
  -Uri "https://api.supabase.com/v1/projects/$projectRef/database/query" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $pat"; "Content-Type" = "application/json" } `
  -Body $body
```

Verify the migration ran by querying the new table via the REST API with the anon key.

**Bypassing RLS (service role key) for data operations:**

```powershell
$serviceKey = "<service role key from user>"
$url = "https://xmkvrywwgtmiupgchlkq.supabase.co"
Invoke-RestMethod -Uri "$url/rest/v1/<table>?select=*&limit=5" `
  -Headers @{ "apikey" = $serviceKey; "Authorization" = "Bearer $serviceKey" }
```

**Do not use:**
- `api.supabase.com` with the service role key — returns 401; it only accepts PATs
- `{project}.supabase.co/pg/query` — 404 on this project (pg-meta not exposed)
- `npx supabase` CLI — not installed; avoid prompting to install during tasks

## Database Schema Notes

- `transactions.budget_id` is nullable (`ON DELETE SET NULL`) — transactions can exist without a budget
- `budgets.display_order` and `budgets.pinned` were added via migrations 001 and 002
- The `src/db/` directory contains a legacy Dexie.js (IndexedDB) implementation that is not actively used
