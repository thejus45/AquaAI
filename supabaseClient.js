// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://hgxyysanxbnjbehkrvhy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhneHl5c2FueGJuamJlaGtydmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NTg5MzQsImV4cCI6MjA5ODIzNDkzNH0.HsKrkvn4duQphw52FYptCf1oBKw-A62f6y2wHtOvNCg'
)
