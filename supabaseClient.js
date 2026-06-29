// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://hgxyysanxbnjbehkrvhy.supabase.co',
  'YOUR_ANON_KEY'
)
