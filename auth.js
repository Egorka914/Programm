
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// === ЗАМЕНИТЕ на ваши значения ===
const SUPABASE_URL = "https://rhmyvdpgpupraccyoaqs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobXl2ZHBncHVwcmFjY3lvYXFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU3NzAyNiwiZXhwIjoyMDczMTUzMDI2fQ.hJUDL59uIdblNnZA46OPV27pj3L-3ffYkgZPhx6lCmg";
// ==================================

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Утилиты для уведомлений
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  if (!notification) return;
  
  notification.textContent = message;
  notification.className = `notification ${type} show`;
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 4000);
}

// Функция для отображения/скрытия загрузки
function setLoading(buttonId, isLoading) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  
  const text = button.querySelector(`#${buttonId}Text`);
  const spinner = button.querySelector(`#${buttonId}Spinner`);
  
  if (isLoading) {
    text.classList.add('hidden');
    spinner.classList.remove('hidden');
    button.disabled = true;
  } else {
    text.classList.remove('hidden');
    spinner.classList.add('hidden');
    button.disabled = false;
  }
}

const form = document.getElementById("loginForm");
const signupLink = document.getElementById("signupLink");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setLoading('loginBtn', true);
    
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    
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
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1000);
  });
}

if (signupLink) {
  signupLink.addEventListener("click", async (e) => {
    e.preventDefault();
    
    // Создаем модальное окно для регистрации
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;
    
    modal.innerHTML = `
      <div style="background: white; padding: 24px; border-radius: 12px; width: 90%; max-width: 400px;">
        <h2 style="margin-bottom: 20px; text-align: center;">Регистрация</h2>
        <form id="signupForm">
          <div class="input-group">
            <label for="regEmail" class="label">Email</label>
            <input type="email" id="regEmail" placeholder="Введите email" class="input" required>
          </div>
          <div class="input-group">
            <label for="regPassword" class="label">Пароль</label>
            <input type="password" id="regPassword" placeholder="Не менее 6 символов" class="input" required>
          </div>
          <div class="input-group">
            <label for="regName" class="label">Ваше имя</label>
            <input type="text" id="regName" placeholder="Будет отображаться в системе" class="input" required>
          </div>
          <div style="display: flex; gap: 12px; margin-top: 20px;">
            <button type="button" id="cancelSignup" class="btn btn-outline" style="flex: 1;">Отмена</button>
            <button type="submit" class="btn" style="flex: 1;">Зарегистрироваться</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Обработчики для модального окна
    document.getElementById('cancelSignup').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById("regEmail").value.trim();
      const password = document.getElementById("regPassword").value.trim();
      const full_name = document.getElementById("regName").value.trim();

      if (!email || !password || !full_name) {
        showNotification("Заполните все поля", "error");
        return;
      }
      
      if (password.length < 6) {
        showNotification("Пароль должен содержать не менее 6 символов", "error");
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
