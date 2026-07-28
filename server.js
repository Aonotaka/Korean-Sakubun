const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { askAi, getProvider } = require('./services/ai');
const { validateRegistrationInput } = require('./services/validation');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isRender = Boolean(process.env.RENDER);
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');
const sessions = new Map();

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
    console.log('Loaded .env file for local development');
  } catch (error) {
    console.log('No local .env file loaded');
  }
}

function logStartupSummary() {
  const provider = getProvider();
  const hasKey = Boolean(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY);
  const adminConfigured = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
  console.log('=== Korean-Sakubun startup ===');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Host mode: ${isRender ? 'Render' : 'local'}`);
  console.log(`AI provider: ${provider}`);
  console.log(`AI key configured: ${hasKey ? 'yes' : 'no'}`);
  console.log(`Admin account configured: ${adminConfigured ? 'yes' : 'no'}`);
  console.log(`Static files served from: ${path.join(__dirname)}`);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
  return `pbkdf2$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) {
    return false;
  }
  if (!String(storedHash).startsWith('pbkdf2$')) {
    return String(storedHash) === String(password);
  }
  const [, salt, hash] = String(storedHash).split('$');
  const derived = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
  return derived === hash;
}

function normalizePasswordStorage(users) {
  return users.map((user) => {
    if (user.password && !String(user.password).startsWith('pbkdf2$')) {
      user.password = hashPassword(String(user.password));
    }
    return user;
  });
}

function isStrongPassword(password) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}

function normalizeUserId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildUserId(name, fallback = 'user') {
  const normalized = normalizeUserId(name || fallback);
  return normalized ? normalized : fallback;
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.warn('Failed to read JSON', filePath, error.message);
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function ensureSeedData() {
  let users = readJson(USERS_FILE, []);
  users = normalizePasswordStorage(users);
  const adminEmail = process.env.ADMIN_EMAIL ? String(process.env.ADMIN_EMAIL).trim() : '';
  const adminPassword = process.env.ADMIN_PASSWORD ? String(process.env.ADMIN_PASSWORD).trim() : '';
  const adminUser = users.find((user) => user.role === 'admin');

  if (adminEmail && adminPassword) {
    if (adminUser) {
      adminUser.email = adminEmail;
      adminUser.password = hashPassword(adminPassword);
    } else {
      users.unshift({
        id: 'admin-001',
        name: '管理者',
        email: adminEmail,
        password: hashPassword(adminPassword),
        role: 'admin',
        progress: { attempted: 0, correct: 0, streak: 0, reviewQueue: [] },
      });
    }
  }

  if (users.length) {
    writeJson(USERS_FILE, users);
  }

  const posts = readJson(POSTS_FILE, []);
  if (!posts.length) {
    posts.push({
      id: 'welcome-post',
      title: '韓国語作文の始め方',
      excerpt: '日本人学習者が韓国語作文を始めるときに役立つ考え方を紹介します。',
      content: '韓国語作文は、単語や文法の知識だけでなく、自然な表現を組み立てる力が必要です。まずは短い文から始めて、毎日少しずつ書くことが大切です。',
      author: '管理者',
      publishedAt: new Date().toISOString(),
      comments: [],
    });
    writeJson(POSTS_FILE, posts);
  }

  const feedback = readJson(FEEDBACK_FILE, []);
  if (!Array.isArray(feedback)) {
    writeJson(FEEDBACK_FILE, []);
  }
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  return cookieHeader.split(';').reduce((acc, part) => {
    const [key, ...valueParts] = part.trim().split('=');
    if (key) {
      acc[key] = valueParts.join('=');
    }
    return acc;
  }, {});
}

function findUserById(userId) {
  const users = readJson(USERS_FILE, []);
  return users.find((user) => user.id === userId) || null;
}

function getSessionUser(req) {
  const cookies = parseCookies(req);
  const sessionId = cookies.sessionId;
  if (!sessionId || !sessions.has(sessionId)) {
    return null;
  }
  return findUserById(sessions.get(sessionId));
}

function setSession(res, user) {
  const sessionId = crypto.randomBytes(16).toString('hex');
  sessions.set(sessionId, user.id);
  res.setHeader('Set-Cookie', `sessionId=${sessionId}; Path=/; HttpOnly; Max-Age=86400`);
  return sessionId;
}

function clearSession(res) {
  res.setHeader('Set-Cookie', 'sessionId=; Path=/; HttpOnly; Max-Age=0');
}

function saveUsers(users) {
  writeJson(USERS_FILE, users);
}

function savePosts(posts) {
  writeJson(POSTS_FILE, posts);
}

const fallbackQuestionBank = {
  beginner: [
    { prompt: '明日、友達とカフェに行きます。', answer: '내일 친구랑 카페에 가요.', hint: '「友達と」は 친구랑、「カフェ」は 카페' },
    { prompt: '今日は雨が降っています。', answer: '오늘은 비가 오고 있어요.', hint: '進行形は -고 있어요 を使います。' },
    { prompt: '私は毎朝コーヒーを飲みます。', answer: '저는 매일 아침 커피를 마셔요.', hint: '「毎朝」は 매일 아침 と表現します。' },
    { prompt: '駅の前で待っています。', answer: '역 앞에서 기다리고 있어요.', hint: '場所は -에서 を使います。' },
    { prompt: 'この本はとても面白いです。', answer: '이 책은 아주 재미있어요.', hint: '主題には -은/는 を使います。' },
  ],
  intermediate: [
    { prompt: '時間があれば、一緒に勉強しませんか。', answer: '시간이 있으면 같이 공부하지 않을래요?', hint: '仮定は -으면 を使います。' },
    { prompt: '昨日は忙しくて連絡できませんでした。', answer: '어제는 바빠서 연락하지 못했어요.', hint: '-아서/어서 で理由をつなげます。' },
    { prompt: '最近、韓国語の発音練習をしています。', answer: '요즘 한국어 발음 연습을 하고 있어요.', hint: '「最近」は 요즘 が自然です。' },
    { prompt: 'この道をまっすぐ行くと駅があります。', answer: '이 길을 곧장 가면 역이 있어요.', hint: '条件は -면 でつなげます。' },
    { prompt: '会議は午後三時から始まります。', answer: '회의는 오후 세 시부터 시작해요.', hint: '時刻は 숫자 + 시 を使います。' },
  ],
  advanced: [
    { prompt: '彼は自分の意見を冷静に説明することができた。', answer: '그는 자신의 의견을 냉정하게 설명할 수 있었다.', hint: '可能表現は -ㄹ 수 있다 を活用します。' },
    { prompt: 'この結果は予想以上に良かった。', answer: '이 결과는 예상 이상으로 좋았다.', hint: '「以上に」は 이상으로 が自然です。' },
    { prompt: '会議の前に資料を整理しておいた。', answer: '회의 전에 자료를 정리해 두었다.', hint: '-아/어 두다 は事前準備を表します。' },
    { prompt: 'その提案は社会全体に大きな影響を与える可能性がある。', answer: '그 제안은 사회 전체에 큰 영향을 줄 가능성이 있다.', hint: '「可能性がある」は 가능성이 있다 を使います。' },
    { prompt: '彼らは同じ目標に向かって努力してきた。', answer: '그들은 같은 목표를 향해 노력해 왔다.', hint: '-아/어 오다 は継続のニュアンスです。' },
  ],
};

function getFallbackQuestion(level = 'beginner') {
  const normalizedLevel = ['beginner', 'intermediate', 'advanced'].includes(level) ? level : 'beginner';
  const pool = fallbackQuestionBank[normalizedLevel];
  return pool[Math.floor(Math.random() * pool.length)];
}

function normalizeScore(value, fallback = 74) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const scaled = numeric <= 1 ? Math.round(numeric * 100) : Math.round(numeric);
  return Math.max(0, Math.min(100, scaled));
}

function normalizeStatus(value, score = 74) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw.includes('正解') || raw === 'correct' || raw === 'right') return '正解';
  if (raw.includes('惜') || raw === 'almost' || raw === 'close' || raw === 'partial') return '惜しい';
  if (raw.includes('不正解') || raw === 'incorrect' || raw === 'wrong') return '不正解';
  if (score >= 90) return '正解';
  if (score >= 70) return '惜しい';
  return '不正解';
}

function hasHeavyEnglish(text) {
  const value = String(text || '');
  const words = value.match(/[A-Za-z]{4,}/g) || [];
  const totalLatinLength = words.reduce((sum, word) => sum + word.length, 0);
  return words.length >= 3 || totalLatinLength >= 18;
}

function sanitizeAlternatives(alternatives, correctedText) {
  const source = Array.isArray(alternatives) ? alternatives : [];
  const cleaned = source
    .map((item) => String(item || '').trim())
    .filter((item) => item && /[가-힣]/.test(item) && !hasHeavyEnglish(item))
    .slice(0, 3);

  if (cleaned.length) return cleaned;
  return [
    correctedText,
    `${correctedText} (丁寧体の別表現も自然です)`,
  ];
}

function sanitizeScoringResult(rawResult, modelAnswer) {
  const correctedText = /[가-힣]/.test(String(rawResult?.correctedText || ''))
    ? String(rawResult.correctedText).trim()
    : String(modelAnswer || '').trim();
  const score = normalizeScore(rawResult?.score, 74);
  const status = normalizeStatus(rawResult?.status, score);

  let feedback = String(rawResult?.feedback || '').trim();
  let explanation = String(rawResult?.explanation || '').trim();

  if (!feedback || hasHeavyEnglish(feedback)) {
    feedback = status === '正解'
      ? '自然で正しい韓国語です。'
      : status === '惜しい'
        ? '意味は伝わっています。助詞や語尾を整えるとさらに自然になります。'
        : '文法と語順を見直して、もう一度挑戦してみましょう。';
  }

  if (!explanation || hasHeavyEnglish(explanation)) {
    explanation = status === '正解'
      ? 'この文は語順・助詞・語尾のバランスが自然です。'
      : '助詞(은/는, 이/가, 을/를)と語尾(-요/-니다)の統一を意識すると改善します。';
  }

  return {
    status,
    score,
    feedback,
    explanation,
    correctedText,
    alternatives: sanitizeAlternatives(rawResult?.alternatives, correctedText),
  };
}

function getExternalTtsConfig() {
  return {
    googleAccessToken: process.env.GOOGLE_CLOUD_TTS_ACCESS_TOKEN || '',
    openAiApiKey: process.env.OPENAI_API_KEY || '',
  };
}

function getPreferredExternalTtsProvider(requested = 'auto') {
  const config = getExternalTtsConfig();
  if (requested === 'google-cloud' && config.googleAccessToken) return 'google-cloud';
  if (requested === 'openai' && config.openAiApiKey) return 'openai';
  if (config.googleAccessToken) return 'google-cloud';
  if (config.openAiApiKey) return 'openai';
  return null;
}

async function synthesizeWithGoogleCloudTts(text, voiceName = 'ko-KR-Neural2-A') {
  const accessToken = getExternalTtsConfig().googleAccessToken;
  if (!accessToken) {
    return { ok: false, status: 503, error: 'GOOGLE_CLOUD_TTS_ACCESS_TOKEN is not configured' };
  }

  const requestBody = {
    input: { text },
    voice: {
      languageCode: 'ko-KR',
      name: voiceName,
      ssmlGender: 'FEMALE',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.98,
      pitch: 0,
    },
  };

  const url = 'https://texttospeech.googleapis.com/v1/text:synthesize';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { ok: false, status: response.status, error: errorText };
  }

  const data = await response.json();
  if (!data.audioContent) {
    return { ok: false, status: 502, error: 'No audio content returned from Cloud TTS' };
  }

  return {
    ok: true,
    audioBase64: data.audioContent,
    provider: 'google-cloud-tts',
    voice: voiceName,
  };
}

async function synthesizeWithOpenAiTts(text, voiceName = 'alloy') {
  const apiKey = getExternalTtsConfig().openAiApiKey;
  if (!apiKey) {
    return { ok: false, status: 503, error: 'OPENAI_API_KEY is not configured' };
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
      voice: voiceName,
      input: text,
      format: 'mp3',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { ok: false, status: response.status, error: errorText };
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBase64 = Buffer.from(arrayBuffer).toString('base64');

  return {
    ok: true,
    audioBase64,
    provider: 'openai-tts',
    voice: voiceName,
  };
}

logStartupSummary();
ensureSeedData();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/blog', (_req, res) => {
  res.sendFile(path.join(__dirname, 'blog.html'));
});

app.get('/login', (_req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/login.html', (_req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

const ADMIN_SECRET_PATH = process.env.ADMIN_SECRET_PATH || '/korean-admin-secret';

app.get(ADMIN_SECRET_PATH, (req, res) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin', (_req, res) => {
  res.redirect('/');
});

app.get('/admin.html', (_req, res) => {
  res.redirect('/');
});

app.get('/what-is-korean-composition', (_req, res) => {
  res.sendFile(path.join(__dirname, 'what-is-korean-composition.html'));
});

app.get('/what-is-korean-composition.html', (_req, res) => {
  res.sendFile(path.join(__dirname, 'what-is-korean-composition.html'));
});

app.get('/learning-tips', (_req, res) => {
  res.sendFile(path.join(__dirname, 'learning-tips.html'));
});

app.get('/learning-tips.html', (_req, res) => {
  res.sendFile(path.join(__dirname, 'learning-tips.html'));
});

app.get('/api/auth/me', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.json(null);
  }
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, userId } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const users = readJson(USERS_FILE, []);
  const validation = validateRegistrationInput({ name, email: normalizedEmail, password, userId });

  if (!validation.isValid) {
    return res.status(400).json({ error: validation.errors[0] || '入力内容を確認してください', errors: validation.errors });
  }
  if (users.some((candidate) => candidate.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ error: 'このメールアドレスはすでに登録されています' });
  }

  const generatedId = normalizeUserId(userId) || buildUserId(name, `user-${Date.now()}`);
  if (users.some((candidate) => candidate.id === generatedId)) {
    return res.status(409).json({ error: 'このユーザーIDはすでに使われています' });
  }

  const user = {
    id: generatedId,
    name: String(name).trim(),
    email: normalizedEmail,
    password: hashPassword(password),
    role: 'user',
    progress: { attempted: 0, correct: 0, streak: 0, reviewQueue: [] },
  };
  users.push(user);
  saveUsers(users);
  setSession(res, user);
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const users = normalizePasswordStorage(readJson(USERS_FILE, []));
  const user = users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase() && verifyPassword(password, candidate.password));
  if (!user) {
    return res.status(401).json({ error: 'メールアドレスまたはパスワードが違います' });
  }
  setSession(res, user);
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.post('/api/auth/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

app.get('/api/progress', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.json(null);
  }
  res.json(user.progress || { attempted: 0, correct: 0, streak: 0, reviewQueue: [] });
});

app.post('/api/progress', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }
  const users = readJson(USERS_FILE, []);
  const currentUser = users.find((candidate) => candidate.id === user.id);
  if (!currentUser) {
    return res.status(404).json({ error: 'ユーザーが見つかりません' });
  }
  currentUser.progress = req.body || { attempted: 0, correct: 0, streak: 0, reviewQueue: [] };
  saveUsers(users);
  res.json(currentUser.progress);
});

app.post('/api/generate-question', async (req, res) => {
  const { level = 'beginner', style = 'short' } = req.body;
  const provider = getProvider();
  const hasRequiredKey = Boolean(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY);

  if (!hasRequiredKey) {
    console.warn('No AI API key found. Returning random built-in fallback question.');
    return res.json(getFallbackQuestion(level));
  }

  try {
    const result = await askAi({
      provider,
      systemPrompt:
        'You are a Korean language teaching assistant. Create one short Japanese sentence for learners and provide a natural Korean translation and a helpful hint.',
      userPrompt: `Create one ${style} Japanese sentence for a ${level} Korean learner. Return JSON with fields prompt, answer, hint.`,
      temperature: 0.7,
    });

    if (result) {
      return res.json(result);
    }

    return res.json(getFallbackQuestion(level));
  } catch (error) {
    console.error(`${provider} generation failed:`, error.message);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

app.post('/api/score-answer', async (req, res) => {
  const { prompt, modelAnswer, userAnswer, level = 'beginner' } = req.body;
  const provider = getProvider();
  const hasRequiredKey = Boolean(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY);

  if (!hasRequiredKey) {
    console.warn('No AI API key found. Returning built-in fallback scoring.');
    return res.json({
      status: '惜しい',
      score: 74,
      feedback: '自然な表現に近づいています。分かち書きと助詞を確認してください。',
      explanation: 'この文では、助詞や語尾の選び方がポイントです。',
      correctedText: modelAnswer,
      alternatives: ['自然な韓国語ならこの形が近いです', '別解: もう少し柔らかい表現も可能です'],
    });
  }

  try {
    const result = await askAi({
      provider,
      systemPrompt:
        'You are a kind Korean teacher for Japanese speakers. Evaluate with flexibility for Korean spacing, and polite-form variations like 해요/예요/이에요 vs 합니다/입니다. If meaning and grammar are acceptable, treat as 正解 or 惜しい. Return JSON only with fields: status (must be one of 正解/惜しい/不正解), score (0-100), feedback (Japanese), explanation (Japanese), correctedText (Korean), alternatives (Korean examples array). Do not mix English in feedback or explanation.',
      userPrompt: `Prompt: ${prompt}\nModel answer: ${modelAnswer}\nUser answer: ${userAnswer}\nLevel: ${level}`,
      temperature: 0.5,
    });

    if (result) {
      return res.json(sanitizeScoringResult(result, modelAnswer));
    }

    return res.json({
      status: '惜しい',
      score: 74,
      feedback: '自然な表現に近づいています。分かち書きと助詞を確認してください。',
      explanation: 'この文では、助詞や語尾の選び方がポイントです。',
      correctedText: modelAnswer,
      alternatives: ['自然な韓国語ならこの形が近いです', '別解: もう少し柔らかい表現も可能です'],
    });
  } catch (error) {
    console.error(`${provider} scoring failed:`, error.message);
    res.status(500).json({ error: 'Failed to score answer' });
  }
});

app.get('/api/tts/status', (_req, res) => {
  const config = getExternalTtsConfig();
  const providers = [];
  if (config.googleAccessToken) providers.push('google-cloud');
  if (config.openAiApiKey) providers.push('openai');
  const available = providers.length > 0;

  res.json({
    available,
    providers,
    provider: providers[0] || 'browser-fallback',
    defaultVoice: providers[0] === 'openai' ? 'alloy' : 'ko-KR-Neural2-A',
  });
});

app.post('/api/tts/synthesize', async (req, res) => {
  const text = String(req.body?.text || '').trim();
  const requestedProvider = String(req.body?.provider || 'auto').trim();

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (text.length > 450) {
    return res.status(400).json({ error: 'Text is too long for one request' });
  }

  if (!/[가-힣]/.test(text)) {
    return res.status(400).json({ error: 'Korean text is required for this endpoint' });
  }

  try {
    const provider = getPreferredExternalTtsProvider(requestedProvider);
    if (!provider) {
      return res.status(503).json({ error: 'No external TTS provider configured' });
    }

    const result = provider === 'google-cloud'
      ? await synthesizeWithGoogleCloudTts(text, 'ko-KR-Neural2-A')
      : await synthesizeWithOpenAiTts(text, 'alloy');

    if (!result.ok) {
      return res.status(result.status || 502).json({ error: 'External TTS failed', detail: result.error || 'unknown' });
    }

    return res.json({
      audioBase64: result.audioBase64,
      provider: result.provider,
      voice: result.voice,
    });
  } catch (error) {
    console.error('Cloud TTS synthesis failed:', error.message);
    return res.status(500).json({ error: 'Cloud TTS synthesis failed' });
  }
});

app.get('/api/feedback', (_req, res) => {
  const feedback = readJson(FEEDBACK_FILE, []);
  const safeFeedback = Array.isArray(feedback) ? feedback.slice(0, 50) : [];
  res.json(safeFeedback);
});

app.post('/api/feedback', (req, res) => {
  const name = String(req.body?.name || '匿名').trim().slice(0, 24);
  const comment = String(req.body?.comment || '').trim();

  if (!comment) {
    return res.status(400).json({ error: 'コメントを入力してください' });
  }

  if (comment.length > 280) {
    return res.status(400).json({ error: 'コメントは280文字以内で入力してください' });
  }

  const feedback = readJson(FEEDBACK_FILE, []);
  const safeFeedback = Array.isArray(feedback) ? feedback : [];
  const newItem = {
    id: `feedback-${Date.now()}`,
    name: name || '匿名',
    comment,
    createdAt: new Date().toISOString(),
  };

  safeFeedback.unshift(newItem);
  writeJson(FEEDBACK_FILE, safeFeedback.slice(0, 100));
  res.status(201).json(newItem);
});

app.get('/api/blog/posts', (_req, res) => {
  const posts = readJson(POSTS_FILE, []);
  res.json(posts);
});

app.get('/api/blog/posts/:id', (req, res) => {
  const posts = readJson(POSTS_FILE, []);
  const post = posts.find((item) => item.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json(post);
});

app.post('/api/blog/posts', (req, res) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: '管理者のみ投稿できます' });
  }
  const posts = readJson(POSTS_FILE, []);
  const newPost = {
    id: `post-${Date.now()}`,
    title: req.body.title || '無題の投稿',
    excerpt: req.body.excerpt || '',
    content: req.body.content || '',
    author: user.name,
    publishedAt: new Date().toISOString(),
    comments: [],
  };
  posts.unshift(newPost);
  savePosts(posts);
  res.json(newPost);
});

app.put('/api/blog/posts/:id', (req, res) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: '管理者のみ編集できます' });
  }
  const posts = readJson(POSTS_FILE, []);
  const post = posts.find((item) => item.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  post.title = req.body.title || post.title;
  post.excerpt = req.body.excerpt || post.excerpt;
  post.content = req.body.content || post.content;
  post.author = req.body.author || post.author;
  savePosts(posts);
  res.json(post);
});

app.delete('/api/blog/posts/:id', (req, res) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: '管理者のみ削除できます' });
  }
  const posts = readJson(POSTS_FILE, []);
  const filtered = posts.filter((item) => item.id !== req.params.id);
  if (filtered.length === posts.length) {
    return res.status(404).json({ error: 'Post not found' });
  }
  savePosts(filtered);
  res.json({ ok: true });
});

app.post('/api/blog/posts/:id/comments', (req, res) => {
  const posts = readJson(POSTS_FILE, []);
  const post = posts.find((item) => item.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  post.comments.push({
    id: `comment-${Date.now()}`,
    author: req.body.author || '匿名',
    comment: req.body.comment || '',
    createdAt: new Date().toISOString(),
  });
  savePosts(posts);
  res.json(post);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Korean-Sakubun server running on http://localhost:${PORT}`);
    console.log(`Ready to receive requests on port ${PORT}`);
  });
}

module.exports = {
  app,
  validateRegistrationInput,
};

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error.message);
  console.error(error.stack || 'No stack trace');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
