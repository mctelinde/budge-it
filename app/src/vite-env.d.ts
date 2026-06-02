/// <reference types="vite/client" />

// Shim `process.env` so TypeScript doesn't error when type-checking
// @shared files (legacy CRA source) that reference process.env.
// These files are never executed in the v2 app — we have our own
// app-v2/src/lib/supabase.ts that uses import.meta.env instead.
declare const process: { env: Record<string, string | undefined> };
