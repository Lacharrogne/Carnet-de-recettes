import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

console.log('SUPABASE URL:', supabaseUrl)
console.log('SUPABASE KEY PRESENTE:', !!supabaseKey)

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variables Supabase manquantes dans .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseKey)