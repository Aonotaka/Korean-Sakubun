const loginForm = document.getElementById('loginForm');
const authMessage = document.getElementById('authMessage');
const authPanel = document.getElementById('authPanel');
const adminPanel = document.getElementById('adminPanel');
const postForm = document.getElementById('postForm');
const postTitle = document.getElementById('postTitle');
const postExcerpt = document.getElementById('postExcerpt');
const postContent = document.getElementById('postContent');
const postList = document.getElementById('postList');
const logoutBtn = document.getElementById('logoutBtn');
const loginSubmit = document.getElementById('loginSubmit');
const userList = document.getElementById('userList');
const userMessage = document.getElementById('userMessage');

function setBusy(button, isBusy) {
  if (!button) return;
  button.disabled = isBusy;
  button.textContent = isBusy ? '処理中...' : 'ログイン';
}

async function checkAuth() {
  const response = await fetch('/api/auth/me');
  const user = await response.json();
  if (user && user.role === 'admin') {
    authPanel.hidden = true;
    adminPanel.hidden = false;
    loadPosts();
    loadUsers();
  } else {
    authPanel.hidden = false;
    adminPanel.hidden = true;
    authMessage.textContent = '';
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setBusy(loginSubmit, true);
  authMessage.textContent = 'ログイン中...';
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    authMessage.textContent = data.error || 'ログインできませんでした';
    setBusy(loginSubmit, false);
    return;
  }
  authMessage.textContent = `ようこそ、${data.name}さん`;
  setBusy(loginSubmit, false);
  checkAuth();
});

postForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const response = await fetch('/api/blog/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: postTitle.value, excerpt: postExcerpt.value, content: postContent.value }),
  });
  if (response.ok) {
    postForm.reset();
    loadPosts();
    authMessage.textContent = '記事を公開しました';
  }
});

async function loadPosts() {
  const response = await fetch('/api/blog/posts');
  const posts = await response.json();
  postList.innerHTML = '';
  if (!posts.length) {
    postList.innerHTML = '<div class="card"><p>まだ公開記事がありません。</p></div>';
    return;
  }
  posts.forEach((post) => {
    const item = document.createElement('div');
    item.className = 'card';
    item.innerHTML = `<div class="panel__head"><h3>${post.title}</h3><button class="btn btn--secondary" data-id="${post.id}">削除</button></div><p>${post.excerpt || ''}</p>`;
    postList.appendChild(item);
  });
}

function renderUsers(users) {
  if (!userList) return;
  if (!users.length) {
    userList.innerHTML = '<div class="card"><p>まだユーザーがいません。</p></div>';
    return;
  }

  userList.innerHTML = '';
  users.forEach((user) => {
    const item = document.createElement('div');
    item.className = 'card';
    item.innerHTML = `
      <div class="panel__head">
        <div>
          <h3>${user.name || user.email}</h3>
          <p class="panel__hint">${user.email || ''} / ${user.plan || 'free'} / メモ ${Number(user.premiumMemoryCount) || 0} 件</p>
        </div>
        <button class="btn btn--secondary" data-user-id="${user.id}" data-plan="${user.plan === 'premium' ? 'free' : 'premium'}">${user.plan === 'premium' ? '無料に戻す' : 'プレミアムにする'}</button>
      </div>
    `;
    userList.appendChild(item);
  });
}

async function loadUsers() {
  if (!userList) return;
  try {
    if (userMessage) userMessage.textContent = 'ユーザー一覧を読み込み中...';
    const response = await fetch('/api/admin/users');
    const users = response.ok ? await response.json() : [];
    renderUsers(Array.isArray(users) ? users : []);
    if (userMessage) userMessage.textContent = 'ユーザー管理を更新しました';
  } catch (error) {
    if (userMessage) userMessage.textContent = 'ユーザー一覧の取得に失敗しました';
  }
}

postList.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const id = button.getAttribute('data-id');
  await fetch(`/api/blog/posts/${id}`, { method: 'DELETE' });
  loadPosts();
});

if (userList) {
  userList.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-user-id]');
    if (!button) return;
    const userId = button.getAttribute('data-user-id');
    const plan = button.getAttribute('data-plan');
    if (!userId || !plan) return;
    if (userMessage) userMessage.textContent = '権限を更新中...';
    const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/plan`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (userMessage) userMessage.textContent = data.error || '更新できませんでした';
      return;
    }
    if (userMessage) userMessage.textContent = 'プランを更新しました';
    loadUsers();
  });
}

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  checkAuth();
});

checkAuth();
