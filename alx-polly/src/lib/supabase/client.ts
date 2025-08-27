import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

// Client-side Supabase client (for use in client components)
export const createSupabaseClient = () => {
  return createClientComponentClient<Database>()
}
