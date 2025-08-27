// Database types from Supabase
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      polls: {
        Row: {
          id: string
          title: string
          description: string | null
          created_by: string
          created_at: string
          expires_at: string
          is_active: boolean
          allow_multiple_votes: boolean
          require_auth: boolean
          qr_code_url: string | null
          total_votes: number
          settings: any
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          created_by: string
          created_at?: string
          expires_at: string
          is_active?: boolean
          allow_multiple_votes?: boolean
          require_auth?: boolean
          qr_code_url?: string | null
          total_votes?: number
          settings?: any
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          created_by?: string
          created_at?: string
          expires_at?: string
          is_active?: boolean
          allow_multiple_votes?: boolean
          require_auth?: boolean
          qr_code_url?: string | null
          total_votes?: number
          settings?: any
        }
      }
      poll_options: {
        Row: {
          id: string
          poll_id: string
          text: string
          description: string | null
          order_index: number
          vote_count: number
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          text: string
          description?: string | null
          order_index?: number
          vote_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          text?: string
          description?: string | null
          order_index?: number
          vote_count?: number
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          poll_id: string
          option_id: string
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          option_id: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          option_id?: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      poll_views: {
        Row: {
          id: string
          poll_id: string
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          referrer: string | null
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          created_at?: string
        }
      }
    }
  }
}

// Application types
export type Poll = Database['public']['Tables']['polls']['Row'] & {
  poll_options: PollOption[]
  profiles: Pick<Database['public']['Tables']['profiles']['Row'], 'username' | 'full_name'>
  user_vote?: Vote
}

export type PollOption = Database['public']['Tables']['poll_options']['Row']

export type Vote = Database['public']['Tables']['votes']['Row']

export type Profile = Database['public']['Tables']['profiles']['Row']

export type PollView = Database['public']['Tables']['poll_views']['Row']

// API Response types
export interface PollsResponse {
  polls: Poll[]
  total: number
  page: number
  limit: number
}

export interface PollResponse {
  poll: Poll
}

export interface VoteResponse {
  success: boolean
  vote: Vote
  poll: Poll
}
