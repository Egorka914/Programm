
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// === ЗАМЕНИТЕ на ваши значения ===
const SUPABASE_URL = "https://rhmyvdpgpupraccyoaqs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobXl2ZHBncHVwcmFjY3lvYXFzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzU3NzAyNiwiZXhwIjoyMDczMTUzMDI2fQ.hJUDL59uIdblNnZA46OPV27pj3L-3ffYkgZPhx6lCmg";
// ==================================

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Упрощенная функция уведомлений
function showNotification(message, type = 'info') {
  alert(message); // Временно используем alert для простоты
}

// ОЧЕНЬ ПРОСТАЯ функция загрузки - без classList
function setLoading(isLoading) {
  const button = document.getElementById("loginBtn");
  if (!button) {
    console.error("Кнопка loginBtn не найдена!");
    return;
  }
  
  if (isLoading) {
    button.textContent = "Загрузка...";
    button.disabled = true;
  } else {
    button.textContent = "Войти в систему";
    button.disabled = false;
  }
}

// Основной код
console.log("Скрипт auth.js загружен");

// Ждем полной загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM полностью загружен");
  
  const form = document.getElementById("loginForm");
  const signupLink = document.getElementById("signupLink");

  console.log("Найдена форма:", !!form);
  console.log("Найдена ссылка регистрации:", !!signupLink);

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Обработка отправки формы");
      
      setLoading(true);
      
      const email = document.getElementById("email");
      const password = document.getElementById("password");
      
      if (!email || !password) {
        showNotification("Поля email и пароль не найдены");
        setLoading(false);
        return;
      }
      
      const emailValue = email.value.trim();
      const passwordValue = password.value.trim();
      
      if (!emailValue || !passwordValue) { 
        showNotification("Введите email и пароль");
        setLoading(false);
        return; 
      }

      try {
        console.log("Попытка входа с email:", emailValue);
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email: emailValue, 
          password: passwordValue 
        });
        
        if (error) { 
          showNotification("Ошибка входа: " + error.message);
          console.error("Ошибка Supabase:", error); 
          setLoading(false);
          return; 
        }
        
        console.log("Вход успешен, данные:", data);
        showNotification("Вход выполнен успешно!");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1000);
      } catch (err) {
        showNotification("Ошибка сети: " + err.message);
        console.error("Ошибка сети:", err);
        setLoading(false);
      }
    });
  } else {
    console.error("Форма loginForm не найдена в DOM!");
  }

  if (signupLink) {
    signupLink.addEventListener("click", async (e) => {
      e.preventDefault();
      
      const email = prompt("Введите email:");
      const password = prompt("Введите пароль (мин. 6 символов):");
      const full_name = prompt("Введите ваше имя:");
      
      if (!email || !password || !full_name) {
        showNotification("Все поля обязательны для заполнения");
        return;
      }
      
      if (password.length < 6) {
        showNotification("Пароль должен содержать не менее 6 символов");
        return;
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email, 
          password,
          options: { data: { full_name } }
        });

        if (error) { 
          showNotification("Ошибка регистрации: " + error.message); 
          console.error(error); 
          return; 
        }
        
        showNotification("Регистрация успешна! Проверьте почту для подтверждения.");
      } catch (err) {
        showNotification("Ошибка сети: " + err.message);
      }
    });
  } else {
    console.error("Ссылка signupLink не найдена в DOM!");
  }
});
