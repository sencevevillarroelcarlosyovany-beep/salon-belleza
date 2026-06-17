// ========================================
// CONFIGURACIÓN
// ========================================

const SUPABASE_URL = 'https://frjmozrimrwrkcbrinkn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YhH4zI7dv_fmUbm9Bf0VKA_Hxk9U2h1'; // REEMPLAZA CON TU CLAVE

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('✅ Configuración cargada');