const googleSignInButton = document.getElementById('googleSignInButton');
const googleAuthStatus = document.getElementById('googleAuthStatus');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

function shouldAutoPromptGoogle() {
  const params = new URLSearchParams(window.location.search);
  return params.get('provider') === 'google';
}

function redirectToAdminLogin(adminLoginPath) {
  const targetPath = String(adminLoginPath || '').trim();
  if (!targetPath) return false;
  if (googleAuthStatus) {
    googleAuthStatus.textContent = '管理者アカウントを確認しました。管理者専用ログイン画面へ移動します...';
  }
  setTimeout(() => {
    window.location.href = targetPath;
  }, 600);
  return true;
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
      if (data.code === 'ADMIN_PASSWORD_LOGIN_REQUIRED' && redirectToAdminLogin(data.adminLoginPath)) {
        return;
      }
      if (googleAuthStatus) googleAuthStatus.textContent = data.error || 'Googleログインできませんでした。';
      return;
    }

    if (googleAuthStatus) googleAuthStatus.textContent = `${data.name || 'ユーザー'}さんでログインしました。トップページへ移動します...`;
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

if (loginForm) {
  // Reserved for admin password login pages that reuse this script.
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
      if (loginMessage) loginMessage.textContent = 'ログインしました。トップページへ移動します...';
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
      return;
    }
    if (loginMessage) loginMessage.textContent = data.error || 'ログインできませんでした';
  });
}

initGoogleSignIn();
