import { createClient } from '@supabase/supabase-js'

// Forzamos los strings directamente para puentear el caché de Next.js
const supabaseUrl = 'https://hqafmiqatbwzhcqspgfk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxYWZtaXFhdGJ3emhjcXNwZ2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MjIzNzAsImV4cCI6MjA5MDQ5ODM3MH0.ZKc9yAmaNylTqmY6Wze0DtueH1pdvGYMBDZtjtUPAU4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)