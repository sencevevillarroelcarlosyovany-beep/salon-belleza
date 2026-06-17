// Configuración de Supabase
const SUPABASE_URL = 'https://frjmozrimrwrkcbrinkn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyam1venJpbXJ3cmtjYnJpbmtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDM3ODAsImV4cCI6MjA5NzI3OTc4MH0.xKImKf_HWTahEOVzIaX50-v8Eh7HTJdmSvklgS88lYI';

// Inicializar cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);