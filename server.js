const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { askAi, getProvider } = require('./services/ai');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isRender = Boolean(process.env.RENDER);
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
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
  console.log('=== Korean-Sakubun startup ===');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Host mode: ${isRender ? 'Render' : 'local'}`);
  console.log(`AI provider: ${provider}`);
  console.log(`AI key configured: ${hasKey ? 'yes' : 'no'}`);
  console.log(`Static files served from: ${path.join(__dirname)}`);
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
  const users = readJson(USERS_FILE, []);
  const hasAdmin = users.some((user) => user.role === 'admin');
  if (!hasAdmin) {
    users.unshift({
      id: 'admin',
      name: '管理者',
      email: 'admin@korean-sakubun.com',
      password: 'korean-admin-2026',
      role: 'admin',
      progress: { attempted: 0, correct: 0, streak: 0, reviewQueue: [] },
    });
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

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
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
  const { name, email, password } = req.body;
  const users = readJson(USERS_FILE, []);
  if (!name || !email || !password) {
    return res.status(400).json({ error: '名前・メール・パスワードを入力してください' });
  }
  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'このメールアドレスはすでに登録されています' });
  }

  const user = {
    id: `${Date.now()}`,
    name,
    email,
    password,
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
  const users = readJson(USERS_FILE, []);
  const user = users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.password === password);
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
    console.warn('No AI API key found. Returning built-in fallback question.');
    return res.json({
      prompt: '明日、友達とカフェに行きます。',
      answer: '내일 친구랑 카페에 가요.',
      hint: '「友達と」は 친구랑、「カフェ」は カフェ',
    });
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

    return res.json({
      prompt: '明日、友達とカフェに行きます。',
      answer: '내일 친구랑 카페에 가요.',
      hint: '「友達と」は 친구랑、「カフェ」は カフェ',
    });
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
        'You are a kind Korean teacher for Japanese speakers. Evaluate the learner answer, keeping spacing flexibility in mind. Return JSON with status, score, feedback, explanation, correctedText, alternatives.',
      userPrompt: `Prompt: ${prompt}\nModel answer: ${modelAnswer}\nUser answer: ${userAnswer}\nLevel: ${level}`,
      temperature: 0.5,
    });

    if (result) {
      return res.json(result);
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

app.listen(PORT, () => {
  console.log(`Korean-Sakubun server running on http://localhost:${PORT}`);
  console.log(`Ready to receive requests on port ${PORT}`);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error.message);
  console.error(error.stack || 'No stack trace');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
