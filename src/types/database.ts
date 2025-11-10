export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          title: string
          amount: number
          period: 'monthly' | 'weekly' | 'yearly'
          spent: number
          starting_balance: number
          start_date: string
          rollover_day: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          amount: number
          period: 'monthly' | 'weekly' | 'yearly'
          spent?: number
          starting_balance?: number
          start_date?: string
          rollover_day?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          amount?: number
          period?: 'monthly' | 'weekly' | 'yearly'
          spent?: number
          starting_balance?: number
          start_date?: string
          rollover_day?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          budget_id: string | null
          date: string
          description: string
          amount: number
          type: 'income' | 'expense'
          category: string
          account: string
          notes: string | null
          status: 'pending' | 'cleared' | 'reconciled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          budget_id?: string | null
          date: string
          description: string
          amount: number
          type: 'income' | 'expense'
          category: string
          account: string
          notes?: string | null
          status?: 'pending' | 'cleared' | 'reconciled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          budget_id?: string | null
          date?: string
          description?: string
          amount?: number
          type?: 'income' | 'expense'
          category?: string
          account?: string
          notes?: string | null
          status?: 'pending' | 'cleared' | 'reconciled'
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'income' | 'expense'
          color: string | null
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'income' | 'expense'
          color?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'income' | 'expense'
          color?: string | null
          icon?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
