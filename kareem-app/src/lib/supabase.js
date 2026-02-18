import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jyulpqqbdlmqphssuryn.supabase.co'
const supabaseAnonKey = 'sb_publishable_SJsaF1IZp_zUkQCOfzhjdQ_EzXfBoLN'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
