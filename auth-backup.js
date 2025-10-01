// Резервная версия auth.js с глобальным Supabase клиентом
const SUPABASE_URL = "https://rhmyvdpgpupraccyoaqs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobXl2ZHBncHVwcmFjY3lvYXFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU3NzAyNiwiZXhwIjoyMDczMTUzMDI2fQ.hJUDL59uIdblNnZA46OPV27pj3L-3ffYkgZPhx6lCmg";

// Создаем глобальный клиент Supabase
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Остальной код такой же как в auth-simple.js...
// [вставьте сюда содержимое auth-simple.js начиная с функции showNotification]