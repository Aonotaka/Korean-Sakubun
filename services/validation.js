function validateRegistrationInput({ name, email, password, userId }) {
  const errors = [];

  if (!name || String(name).trim().length < 2) {
    errors.push('名前は2文字以上で入力してください');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    errors.push('有効なメールアドレスを入力してください');
  }

  if (!userId || String(userId).trim().length < 3) {
    errors.push('ユーザーIDは3文字以上で入力してください');
  } else if (!/^[a-z0-9-]+$/.test(String(userId).trim().toLowerCase())) {
    errors.push('ユーザーIDは英数字とハイフンのみ使用できます');
  }

  if (!password || String(password).length < 12) {
    errors.push('パスワードは12文字以上で入力してください');
  } else {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      errors.push('パスワードは大文字・小文字・数字・記号をすべて含めてください');
    }
  }

  return { isValid: errors.length === 0, errors };
}

if (typeof module !== 'undefined') {
  module.exports = { validateRegistrationInput };
}
