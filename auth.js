import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// === ЗАМЕНИТЕ на ваши значения ===
const SUPABASE_URL = "https://rhmyvdpgpupraccyoaqs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobXl2ZHBncHVwcmFjY3lvYXFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU3NzAyNiwiZXhwIjoyMDczMTUzMDI2fQ.hJUDL59uIdblNnZA46OPV27pj3L-3ffYkgZPhx6lCmg";
// ==================================

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("loginForm");
const signupLink = document.getElementById("signupLink");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!email || !password) { alert("Введите email и пароль"); return; }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { alert("Ошибка входа: " + error.message); console.error(error); return; }
    window.location.href = "dashboard.html";
  });
}

if (signupLink) {
  signupLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = prompt("Введите email");
    const password = prompt("Введите пароль (мин. 6 символов)");
    const full_name = prompt("Введите ваше имя (будет отображаться)");

    if (!email || !password) return alert("Отмена регистрации");

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name } }
    });

    if (error) { alert("Ошибка регистрации: " + error.message); console.error(error); return; }
    alert("Регистрация успешна. Проверьте почту для подтверждения (если включено).");
  });
}