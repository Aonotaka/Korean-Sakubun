const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const registerMessage = document.getElementById('registerMessage');
const loginMessage = document.getElementById('loginMessage');

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    name: document.getElementById('registerName').value,
    email: document.getElementById('registerEmail').value,
    userId: document.getElementById('registerUserId').value,
    password: document.getElementById('registerPassword').value,
  };

  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  registerMessage.textContent = response.ok ? '登録できました。トップページに戻って学習を続けられます。' : data.error || '登録できませんでした';
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const payload = {
    email: document.getElementById('loginEmail').value,
    password: document.getElementById('loginPassword').value,
  };

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  loginMessage.textContent = response.ok ? 'ログインしました。トップページに戻って続けてください。' : data.error || 'ログインできませんでした';
});
