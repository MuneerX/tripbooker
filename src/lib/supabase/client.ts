
import { createClient } from '@supabase/supabase-js'
import type { TourPackage } from '@/lib/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Note: The database schema is not available to the AI, so this is a generic type.
// You will need to define the correct types for your database schema.
type SupabaseTables = {
  tour_packages: TourPackage
}

export const supabase = createClient<SupabaseTables>(supabaseUrl, supabaseAnonKey)
