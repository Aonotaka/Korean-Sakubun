const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const registerMessage = document.getElementById('registerMessage');
const loginMessage = document.getElementById('loginMessage');
const googleSignInButton = document.getElementById('googleSignInButton');
const googleAuthStatus = document.getElementById('googleAuthStatus');

function shouldAutoPromptGoogle() {
  const params = new URLSearchParams(window.location.search);
  return params.get('provider') === 'google';
}

async function handleGoogleCredentialResponse(response) {
  const credential = String(response?.credential || '').trim();
  if (!credential) {
    if (googleAuthStatus) googleAuthStatus.textContent = 'Googleログインに失敗しました。';
    return;
  }

  if (googleAuthStatus) googleAuthStatus.textContent = 'Googleログイン中...';
  try {
    const authResponse = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    const data = await authResponse.json().catch(() => ({}));

    if (!authResponse.ok) {
      if (googleAuthStatus) googleAuthStatus.textContent = data.error || 'Googleログインできませんでした。';
      return;
    }

    if (googleAuthStatus) {
      googleAuthStatus.textContent = `${data.name || 'ユーザー'}さんでログインしました。トップページへ移動します...`;
    }
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  } catch (error) {
    if (googleAuthStatus) googleAuthStatus.textContent = 'Googleログイン中にエラーが発生しました。';
  }
}

async function initGoogleSignIn() {
  if (!googleSignInButton) return;
  try {
    const response = await fetch('/api/auth/google/config');
    const config = response.ok ? await response.json() : { enabled: false };

    if (!config.enabled || !config.clientId) {
      if (googleAuthStatus) googleAuthStatus.textContent = 'Googleログインは現在未設定です。';
      return;
    }

    if (!window.google?.accounts?.id) {
      if (googleAuthStatus) googleAuthStatus.textContent = 'Googleログインの初期化に失敗しました。';
      return;
    }

    window.google.accounts.id.initialize({
      client_id: config.clientId,
      callback: handleGoogleCredentialResponse,
      auto_select: false,
    });

    googleSignInButton.innerHTML = '';
    window.google.accounts.id.renderButton(googleSignInButton, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'pill',
      locale: 'ja',
      width: 280,
    });

    if (googleAuthStatus) googleAuthStatus.textContent = 'Googleアカウントでログインできます。';
    if (shouldAutoPromptGoogle()) {
      window.google.accounts.id.prompt();
    }
  } catch (error) {
    if (googleAuthStatus) googleAuthStatus.textContent = 'Googleログイン設定の読み込みに失敗しました。';
  }
}

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
  if (response.ok) {
    loginMessage.textContent = 'ログインしました。トップページへ移動します...';
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
    return;
  }
  loginMessage.textContent = data.error || 'ログインできませんでした';
});

initGoogleSignIn();
