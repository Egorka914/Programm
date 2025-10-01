import { supabase } from "./auth.js";

let user, role = "user", full_name = "";
let currentTab = 'tasks';

function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  if (!notification) {
    console.warn('Элемент notification не найден');
    return;
  }
  
  notification.textContent = message;
  notification.className = `notification ${type} show`;
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 4000);
}

function setLoading(buttonId, isLoading) {
  const button = document.getElementById(buttonId);
  if (!button) {
    console.warn(`Кнопка с id "${buttonId}" не найдена`);
    return;
  }
  
  const text = document.getElementById(`${buttonId}Text`);
  const spinner = document.getElementById(`${buttonId}Spinner`);
  
  if (isLoading) {
    if (text) text.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');
    button.disabled = true;
    button.classList.add('loading');
  } else {
    if (text) text.classList.remove('hidden');
    if (spinner) spinner.classList.add('hidden');
    button.disabled = false;
    button.classList.remove('loading');
  }
}

async function init() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    window.location.href = "index.html";
    return;
  }
  user = data.user;
  console.log('Пользователь:', user);

  await ensureProfile();
  await refreshRole();
  renderUI();

  supabase.channel('profiles-' + user.id)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload) => {
      refreshRole().then(renderUI);
    })
    .subscribe();
}

async function ensureProfile() {
  const { data: p, error } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
  if (!p) {
    await supabase.from('profiles').insert([{ id: user.id, full_name: user.email, role: 'user', email: user.email }]);
  }
}

async function refreshRole() {
  try {
    const { data: profile, error } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).maybeSingle();
    if (error) { 
      console.error('Ошибка при получении роли:', error.message); 
      role = 'user'; 
      return; 
    }
    role = profile?.role || 'user';
    full_name = profile?.full_name || user.email;
    console.log('Роль пользователя:', role);
  } catch (e) {
    console.error(e);
    role = 'user';
  }
}

function renderUI() {
  updateWelcomeMessage();
  setupTabs();
  loadContent();
  
  if (role === 'admin') {
    showAdminPanel();
  }
}

function updateWelcomeMessage() {
  const welcomeElement = document.getElementById('welcomeMessage');
  if (welcomeElement) {
    welcomeElement.innerHTML = `
      <div class="welcome-text">
        Добро пожаловать, <strong>${full_name}</strong>!
      </div>
      <div class="welcome-role">
        ${role === 'admin' ? 'Администратор' : 'Пользователь'}
      </div>
    `;
  }
}

function setupTabs() {
  const tabsContainer = document.getElementById('tabsContainer');
  if (!tabsContainer) return;
  
  tabsContainer.innerHTML = `
    <div class="tabs">
      <button class="tab ${currentTab === 'tasks' ? 'active' : ''}" data-tab="tasks">Мои заявки</button>
      ${role === 'admin' ? `<button class="tab ${currentTab === 'admin' ? 'active' : ''}" data-tab="admin">Управление</button>` : ''}
    </div>
  `;
  
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentTab = tab.dataset.tab;
      setupTabs();
      loadContent();
    });
  });
}

function loadContent() {
  const contentElement = document.getElementById('content');
  if (!contentElement) return;
  
  if (currentTab === 'tasks') {
    loadTasks();
    if (role === 'admin') {
      showTaskCreationForm();
    }
  } else if (currentTab === 'admin' && role === 'admin') {
    showAdminPanelContent();
  }
}

function showTaskCreationForm() {
  const el = document.getElementById('taskFormContainer');
  if (!el) return;
  
  el.innerHTML = `
    <div class="form-container">
      <h2 class="form-title">Создать новую заявку</h2>
      <form id="taskForm">
        <div class="input-group">
          <label for="title" class="label">Название заявки</label>
          <input type="text" id="title" placeholder="Введите название заявки" class="input" required>
        </div>
        
        <div class="input-group">
          <label for="description" class="label">Описание проблемы</label>
          <textarea id="description" placeholder="Опишите проблему подробно" class="input" rows="3" required></textarea>
        </div>
        
        <div class="input-group">
          <label for="assignedTo" class="label">Email пользователя</label>
          <input type="email" id="assignedTo" placeholder="Введите email пользователя" class="input" required>
        </div>
        
        <button type="submit" class="btn w-full" id="createTaskBtn">
          <span id="createTaskBtnText">Создать заявку</span>
          <div id="createTaskBtnSpinner" class="loading-spinner hidden"></div>
        </button>
      </form>
    </div>
  `;
  
  document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading('createTaskBtn', true);
    
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const email = document.getElementById('assignedTo').value;
    
    const { data: profiles } = await supabase.from('profiles').select('id, email').eq('email', email);
    if (!profiles || !profiles.length) {
      showNotification('Пользователь с таким email не найден', 'error');
      setLoading('createTaskBtn', false);
      return;
    }
    
    const target = profiles[0];
    const { error } = await supabase.from('tasks').insert([{ 
      title, 
      description, 
      assigned_to: target.id, 
      status: 'новая' 
    }]);
    
    if (error) {
      showNotification('Ошибка при создании заявки: ' + error.message, 'error');
    } else {
      showNotification('Заявка успешно создана!', 'success');
      loadTasks();
      e.target.reset();
    }
    
    setLoading('createTaskBtn', false);
  });
}

async function loadTasks() {
  await refreshRole();
  let q = supabase.from('tasks').select('*');
  if (role !== 'admin') q = q.eq('assigned_to', user.id);
  const { data: tasks, error } = await q.order('created_at', { ascending: false });
  
  if (error) { 
    console.error('Ошибка загрузки заявок:', error.message); 
    showNotification('Ошибка загрузки заявок', 'error');
    return; 
  }
  
  const list = document.getElementById('tasks');
  if (!list) return;
  
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, email');
  const map = {};
  profiles?.forEach(p => map[p.id] = p.full_name || p.email);
  
  if (!tasks || tasks.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div>📋</div>
        <h3>Заявок пока нет</h3>
        <p>${role === 'admin' ? 'Создайте первую заявку с помощью формы выше' : 'Ожидайте, когда администратор создаст для вас заявку'}</p>
      </div>
    `;
    return;
  }
  
  list.innerHTML = '';
  tasks.forEach(t => {
    const executor = role === 'admin' ? (map[t.assigned_to] || '—') : '';
    const statusClass = 
      t.status === 'новая' ? 'status-new' : 
      t.status === 'в работе' ? 'status-in-progress' : 
      'status-completed';
    
    list.innerHTML += `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">${t.title}</h3>
          <span class="status ${statusClass}">${t.status}</span>
        </div>
        
        <p class="card-description">${t.description || 'Описание отсутствует'}</p>
        
        <div class="card-meta">
          <div class="meta-item">
            <span>👤</span>
            <span>${executor || 'Назначено вам'}</span>
          </div>
          <div class="meta-item">
            <span>📅</span>
            <span>${new Date(t.created_at).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
        
        ${t.price ? `<div class="price-display">${t.price} ₽</div>` : ''}
        
        <div class="card-actions">
          ${role === 'user' && t.status !== 'завершено' ? `
            <button onclick="updateStatus(${t.id}, 'в работе')" class="btn btn-warning btn-small">Взять в работу</button>
            <input type="number" id="price-${t.id}" placeholder="Сумма (₽)" class="input">
            <button onclick="completeTask(${t.id})" class="btn btn-secondary btn-small">Завершить</button>
          ` : ''}
          ${role === 'admin' ? `
            <button onclick="deleteTask(${t.id})" class="btn btn-danger btn-small">Удалить</button>
          ` : ''}
        </div>
      </div>
    `;
  });
}

window.updateStatus = async (id, status) => {
  const { error } = await supabase.from('tasks').update({ status }).eq('id', id);
  if (error) {
    showNotification('Ошибка обновления статуса: ' + error.message, 'error');
  } else {
    showNotification('Статус обновлен!', 'success');
    loadTasks();
  }
};

window.completeTask = async (id) => {
  const price = document.getElementById(`price-${id}`)?.value;
  if (!price) {
    showNotification('Введите сумму перед завершением заявки', 'error');
    return;
  }
  
  const { error } = await supabase.from('tasks').update({ status: 'завершено', price }).eq('id', id);
  if (error) {
    showNotification('Ошибка завершения заявки: ' + error.message, 'error');
  } else {
    showNotification('Заявка завершена!', 'success');
    loadTasks();
  }
};

window.deleteTask = async (id) => {
  if (!confirm('Вы уверены, что хотите удалить эту заявку?')) return;
  
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) {
    showNotification('Ошибка удаления заявки: ' + error.message, 'error');
  } else {
    showNotification('Заявка удалена!', 'success');
    loadTasks();
  }
};

function showAdminPanel() {
  const el = document.getElementById('adminPanel');
  if (!el) return;
  
  el.innerHTML = `
    <div class="form-container">
      <h2 class="form-title">Панель администратора</h2>
      <button onclick="listUsers()" class="btn">Управление пользователями</button>
    </div>
  `;
}

function showAdminPanelContent() {
  const contentElement = document.getElementById('content');
  if (!contentElement) return;
  
  contentElement.innerHTML = `
    <div id="adminPanelContent">
      <div class="form-container">
        <h2 class="form-title">Панель администратора</h2>
        <div class="card-actions">
          <button onclick="listUsers()" class="btn">Управление пользователями</button>
          <button onclick="showTaskCreationForm(); currentTab = 'tasks'; setupTabs(); loadContent();" class="btn btn-secondary">Создать заявку</button>
        </div>
      </div>
      <div id="usersList"></div>
    </div>
  `;
}

window.listUsers = async () => {
  const { data: users, error } = await supabase.from('profiles').select('id, full_name, email, role');
  if (error) {
    showNotification('Ошибка загрузки пользователей: ' + error.message, 'error');
    return;
  }
  
  const panel = document.getElementById('usersList') || document.getElementById('adminPanelContent');
  if (!panel) return;
  
  panel.innerHTML = `
    <div class="form-container">
      <h2 class="form-title">Управление пользователями</h2>
      <div class="space-y-4">
        ${users.map(u => `
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">${u.full_name || u.email}</h3>
              <span class="user-badge ${u.role === 'admin' ? 'admin-badge' : ''}">${u.role}</span>
            </div>
            <p class="card-description">${u.email}</p>
            <div class="card-actions">
              <button onclick="setRole('${u.id}', 'admin')" class="btn btn-small ${u.role === 'admin' ? 'active' : ''}">Сделать админом</button>
              <button onclick="setRole('${u.id}', 'user')" class="btn btn-outline btn-small ${u.role === 'user' ? 'active' : ''}">Сделать пользователем</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

window.setRole = async (id, newRole) => {
  const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
  if (error) {
    showNotification('Ошибка изменения роли: ' + error.message, 'error');
  } else {
    showNotification('Роль пользователя изменена!', 'success');
    if (id === user.id) {
      await refreshRole();
      renderUI();
    } else {
      listUsers();
    }
  }
};

init();