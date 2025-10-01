import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// === ЗАМЕНИТЕ на ваши значения ===
const SUPABASE_URL = "https://rhmyvdpgpupraccyoaqs.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
// ==================================

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Утилита уведомлений
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  if (!notification) return;
  
  notification.textContent = message;
  notification.className = `notification ${type} show`;
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 4000);
}

// Загрузка кнопки
function setLoading(buttonId, isLoading) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  
  const text = button.querySelector('.btn-text');
  const spinner = button.querySelector('.btn-spinner');

  if (text) text.classList.toggle('hidden', isLoading);
  if (spinner) spinner.classList.toggle('hidden', !isLoading);

  button.disabled = isLoading;
}

// Вход
const form = document.getElementById("loginForm");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setLoading('loginBtn', true);
    
    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();
    
    if (!email || !password) { 
      showNotification("Введите email и пароль", "error");
      setLoading('loginBtn', false);
      return; 
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) { 
      showNotification("Ошибка входа: " + error.message, "error");
      console.error(error); 
      setLoading('loginBtn', false);
      return; 
    }
    
    showNotification("Вход выполнен успешно!", "success");
    setTimeout(() => window.location.href = "dashboard.html", 1000);
  });
}

// Регистрация
const signupLink = document.getElementById("signupLink");
if (signupLink) {
  signupLink.addEventListener("click", (e) => {
    e.preventDefault();

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Регистрация</h2>
        <form id="signupForm">
          <input type="email" id="regEmail" placeholder="Email" required>
          <input type="password" id="regPassword" placeholder="Пароль (6+ символов)" required>
          <input type="text" id="regName" placeholder="Ваше имя" required>
          <div style="display: flex; gap: 12px; margin-top: 12px;">
            <button type="button" id="cancelSignup">Отмена</button>
            <button type="submit">Зарегистрироваться</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cancelSignup').addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    document.getElementById('signupForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById("regEmail")?.value.trim();
      const password = document.getElementById("regPassword")?.value.trim();
      const full_name = document.getElementById("regName")?.value.trim();

      if (!email || !password || !full_name) {
        showNotification("Заполните все поля", "error");
        return;
      }
      if (password.length < 6) {
        showNotification("Пароль должен быть 6+ символов", "error");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name } }
      });

      if (error) {
        showNotification("Ошибка регистрации: " + error.message, "error");
        console.error(error);
        return;
      }

      showNotification("Регистрация успешна! Проверьте почту для подтверждения.", "success");
      document.body.removeChild(modal);
    });
  });
}
