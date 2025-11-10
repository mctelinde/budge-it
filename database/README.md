# Database Migrations

This directory contains SQL migration scripts for the Supabase database.

## Running Migrations

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project
3. Go to the **SQL Editor** in the left sidebar
4. Run each migration script in order (by number prefix)

## Migration History

### 001_add_display_order.sql
Adds `display_order` column to the `budgets` table to support custom ordering of budget cards.

**Features:**
- Adds `display_order` INTEGER column (default: 0)
- Creates index for query performance
- Initializes existing budgets with order based on creation date

### 002_add_pinned.sql
Adds `pinned` column to the `budgets` table to support pinning budgets to the Transactions page.

**Features:**
- Adds `pinned` BOOLEAN column (default: false)
- Creates partial index for filtering pinned budgets efficiently

## Notes

- All migrations use `IF NOT EXISTS` to be safely re-runnable
- Migrations are designed to work on existing data without data loss
- Always backup your database before running migrations in production
