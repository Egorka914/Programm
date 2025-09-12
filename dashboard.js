import { supabase } from "./auth.js";

let user, role = "user", full_name = "";

async function init() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    window.location.href = "index.html";
    return;
  }
  user = data.user;

  await ensureProfile();
  await refreshRole();
  renderUI();

  // подписка на обновления профиля (опционально)
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
    if (error) { console.error('Ошибка при получении роли:', error.message); role = 'user'; return; }
    role = profile?.role || 'user';
    full_name = profile?.full_name || user.email;
    console.log('role=', role);
  } catch (e) {
    console.error(e);
    role = 'user';
  }
}

function renderUI() {
  loadTasks();
  if (role === 'admin') {
    showAdminForm();
    showAdminPanel();
  } else {
    const tf = document.getElementById('taskFormContainer');
    const ap = document.getElementById('adminPanel');
    if (tf) tf.innerHTML = '';
    if (ap) ap.innerHTML = '';
  }
}

function showAdminForm() {
  const el = document.getElementById('taskFormContainer');
  if (!el) return;
  el.innerHTML = `
    <form id="taskForm" class="mb-4">
      <input type="text" id="title" placeholder="Название" class="input" required>
      <textarea id="description" placeholder="Описание" class="input" required></textarea>
      <input type="email" id="assignedTo" placeholder="Email пользователя" class="input" required>
      <button type="submit" class="btn">Создать заявку</button>
    </form>
  `;
  document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const email = document.getElementById('assignedTo').value;
    // ищем профиль по email
    const { data: profiles } = await supabase.from('profiles').select('id, email').eq('email', email);
    if (!profiles || !profiles.length) return alert('Пользователь не найден');
    const target = profiles[0];
    await supabase.from('tasks').insert([{ title, description, assigned_to: target.id, status: 'новая' }]);
    loadTasks();
    e.target.reset();
  });
}

async function loadTasks() {
  await refreshRole();
  let q = supabase.from('tasks').select('*');
  if (role !== 'admin') q = q.eq('assigned_to', user.id);
  const { data: tasks, error } = await q.order('created_at', { ascending: false });
  if (error) { console.error('Ошибка загрузки заявок:', error.message); return; }
  const list = document.getElementById('tasks');
  list.innerHTML = '';
  // подгрузим имена
  const { data: profiles } = await supabase.from('profiles').select('id, full_name, email');
  const map = {};
  profiles?.forEach(p => map[p.id] = p.full_name || p.email);
  tasks.forEach(t => {
    const executor = role === 'admin' ? (map[t.assigned_to] || '—') : '';
    list.innerHTML += `
      <div class="card">
        <p><b>${t.title}</b></p>
        <p>${t.description || ''}</p>
        <p>Статус: <span class="status">${t.status}</span></p>
        ${t.price ? `<p><b>Сумма:</b> ${t.price} ₽</p>` : ''}
        ${role === 'user' && t.status !== 'завершено' ? `
          <button onclick="updateStatus(${t.id}, 'в работе')" class="btn">В работе</button>
          <input type="number" id="price-${t.id}" placeholder="Сумма (₽)" class="input mt-2">
          <button onclick="completeTask(${t.id})" class="btn">Завершить</button>
        ` : ''}
        ${role === 'admin' ? `<button onclick="deleteTask(${t.id})" class="btn bg-red-500">Удалить</button>` : ''}
      </div>`;
  });
}

window.updateStatus = async (id, status) => {
  await supabase.from('tasks').update({ status }).eq('id', id);
  loadTasks();
};

window.completeTask = async (id) => {
  const price = document.getElementById(`price-${id}`).value;
  if (!price) return alert('Введите сумму');
  await supabase.from('tasks').update({ status: 'завершено', price }).eq('id', id);
  loadTasks();
};

window.deleteTask = async (id) => {
  if (!confirm('Точно удалить?')) return;
  await supabase.from('tasks').delete().eq('id', id);
  loadTasks();
};

function showAdminPanel() {
  const el = document.getElementById('adminPanel');
  if (!el) return;
  el.innerHTML = `<h2 class="text-lg font-bold mb-2">Админ-панель</h2><button onclick="listUsers()" class="btn">Управление пользователями</button>`;
}

window.listUsers = async () => {
  const { data: users, error } = await supabase.from('profiles').select('id, full_name, email, role');
  if (error) return alert('Ошибка: ' + error.message);
  const panel = document.getElementById('adminPanel');
  panel.innerHTML = '<h2>Пользователи</h2>';
  users.forEach(u => {
    panel.innerHTML += `
      <div class="card">
        <p>${u.full_name || u.email} — ${u.role}</p>
        <button onclick="setRole('${u.id}', 'admin')" class="btn">Сделать админом</button>
        <button onclick="setRole('${u.id}', 'user')" class="btn">Сделать пользователем</button>
      </div>`;
  });
};

window.setRole = async (id, newRole) => {
  const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
  if (error) alert('Ошибка: ' + error.message); else { alert('Роль изменена'); loadTasks(); }
};

init();