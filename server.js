const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Stripe = require('stripe');
const { askAi, getProvider } = require('./services/ai');
const { validateRegistrationInput } = require('./services/validation');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const isRender = Boolean(process.env.RENDER);
const DEFAULT_DATA_DIR = path.join(__dirname, 'data');
const TEMP_DATA_DIR = path.join('/tmp', 'korean-sakubun');

function isUsableDataDir(candidatePath) {
  try {
    fs.mkdirSync(candidatePath, { recursive: true });
    fs.accessSync(candidatePath, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
}

function resolveDataDir() {
  const configuredDataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : null;
  const candidates = [configuredDataDir, DEFAULT_DATA_DIR, TEMP_DATA_DIR].filter(Boolean);
  const attempted = [];

  for (const candidate of candidates) {
    if (attempted.includes(candidate)) continue;
    attempted.push(candidate);
    if (isUsableDataDir(candidate)) {
      if (configuredDataDir && candidate !== configuredDataDir) {
        console.warn(`Configured DATA_DIR is not writable: ${configuredDataDir}. Falling back to: ${candidate}`);
      }
      return candidate;
    }
  }

  throw new Error(`No writable DATA_DIR found. Tried: ${attempted.join(', ')}`);
}

const DATA_DIR = resolveDataDir();
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const USER_AUDIT_LOG_FILE = path.join(DATA_DIR, 'user-events.log');
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const STRIPE_SECRET_KEY = String(process.env.STRIPE_SECRET_KEY || '').trim();
const STRIPE_PRICE_ID = String(process.env.STRIPE_PRICE_ID || '').trim();
const STRIPE_WEBHOOK_SECRET = String(process.env.STRIPE_WEBHOOK_SECRET || '').trim();
const STRIPE_SUCCESS_URL = String(process.env.STRIPE_SUCCESS_URL || '').trim();
const STRIPE_CANCEL_URL = String(process.env.STRIPE_CANCEL_URL || '').trim();
const STRIPE_PAYMENT_LINK_URL = String(process.env.STRIPE_PAYMENT_LINK_URL || 'https://buy.stripe.com/14A4gyaqT6qi44IfMS6Zy00').trim();
const stripeClient = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
const PREMIUM_ACCESS_EMAILS = new Set(
  String(process.env.PREMIUM_ACCESS_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);
const sessions = new Map();
const FEEDBACK_MAX_ITEMS = Math.max(0, Number(process.env.FEEDBACK_MAX_ITEMS) || 0);
const USER_AUDIT_MAX_ITEMS = Math.max(0, Number(process.env.USER_AUDIT_MAX_ITEMS) || 0);

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
  const googleClientConfigured = Boolean(String(process.env.GOOGLE_CLIENT_ID || '').trim());
  console.log('=== Korean-Sakubun startup ===');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Host mode: ${isRender ? 'Render' : 'local'}`);
  console.log(`Resolved DATA_DIR: ${DATA_DIR}`);
  console.log(`AI provider: ${provider}`);
  console.log(`AI key configured: ${hasKey ? 'yes' : 'no'}`);
  console.log(`Admin account configured: ${adminConfigured ? 'yes' : 'no'}`);
  console.log(`Google login configured: ${googleClientConfigured ? 'yes' : 'no'}`);
  console.log(`Static files served from: ${path.join(__dirname)}`);

  const status = getDeploymentConfigStatus();
  if (status.missingRequired.length) {
    console.warn(`Missing required env keys: ${status.missingRequired.join(', ')}`);
  }
  if (status.missingRecommended.length) {
    console.warn(`Missing recommended env keys: ${status.missingRecommended.join(', ')}`);
  }
}

function getDeploymentConfigStatus() {
  const aiProvider = getProvider();
  const required = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_SECRET_PATH', 'DATA_DIR'];
  const recommended = ['GOOGLE_CLIENT_ID'];

  if (aiProvider === 'groq') {
    required.push('GROQ_API_KEY');
  }
  if (aiProvider === 'openai') {
    required.push('OPENAI_API_KEY');
  }
  if (aiProvider === 'google' || aiProvider === 'gemini') {
    required.push('GOOGLE_AI_API_KEY');
  }

  const isMissing = (key) => !String(process.env[key] || '').trim();
  const missingRequired = required.filter(isMissing);
  const missingRecommended = recommended.filter(isMissing);

  return {
    aiProvider,
    missingRequired,
    missingRecommended,
    configured: {
      ADMIN_EMAIL: !isMissing('ADMIN_EMAIL'),
      ADMIN_PASSWORD: !isMissing('ADMIN_PASSWORD'),
      ADMIN_SECRET_PATH: !isMissing('ADMIN_SECRET_PATH'),
      DATA_DIR: !isMissing('DATA_DIR'),
      GOOGLE_CLIENT_ID: !isMissing('GOOGLE_CLIENT_ID'),
      GROQ_API_KEY: !isMissing('GROQ_API_KEY'),
      OPENAI_API_KEY: !isMissing('OPENAI_API_KEY'),
      GOOGLE_AI_API_KEY: !isMissing('GOOGLE_AI_API_KEY'),
      GEMINI_API_KEY: !isMissing('GEMINI_API_KEY'),
      PREMIUM_ACCESS_EMAILS: !isMissing('PREMIUM_ACCESS_EMAILS'),
      GOOGLE_CLOUD_TTS_ACCESS_TOKEN: !isMissing('GOOGLE_CLOUD_TTS_ACCESS_TOKEN'),
      STRIPE_SECRET_KEY: !isMissing('STRIPE_SECRET_KEY'),
      STRIPE_PRICE_ID: !isMissing('STRIPE_PRICE_ID'),
      STRIPE_WEBHOOK_SECRET: !isMissing('STRIPE_WEBHOOK_SECRET'),
    },
  };
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

function normalizeProgress(progress) {
  const source = progress && typeof progress === 'object' ? progress : {};
  return {
    attempted: Number(source.attempted) || 0,
    correct: Number(source.correct) || 0,
    streak: Number(source.streak) || 0,
    reviewQueue: Array.isArray(source.reviewQueue) ? source.reviewQueue : [],
  };
}

function toDayKey(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function normalizePromptKey(text) {
  return String(text || '').trim().replace(/\s+/g, ' ').slice(0, 140);
}

function parseLegacyPromptFromNote(note) {
  const raw = String(note || '').trim();
  if (!raw) return '';
  const matched = raw.match(/お題:\s*(.+?)\s*\/\s*あなたの回答:/);
  return matched ? String(matched[1] || '').trim() : '';
}

function parseLegacyGrammarLabel(memoryTitle, memoryTags) {
  const title = String(memoryTitle || '').trim();
  const fromTitle = title.match(/^\[誤答ログ\]\s*(.+)$/);
  if (fromTitle && fromTitle[1]) {
    return String(fromTitle[1]).trim();
  }
  const tags = Array.isArray(memoryTags) ? memoryTags : [];
  const candidate = tags.map((tag) => String(tag).trim()).find((tag) => tag && tag !== '誤答ログ' && tag !== '文法別作文');
  return candidate || 'legacy-grammar';
}

function inferLegacyMistakeSource(memory, normalizedTags, createdAt) {
  const hasMistakeTag = normalizedTags.includes('誤答ログ');
  if (!hasMistakeTag) {
    return { sourceType: '', sourceKey: '', sourceDateKey: '' };
  }

  const prompt = parseLegacyPromptFromNote(memory.note);
  const grammar = parseLegacyGrammarLabel(memory.title, normalizedTags);
  const sourceKey = `${grammar}::${normalizePromptKey(prompt)}`.slice(0, 160);
  return {
    sourceType: 'grammar-mistake',
    sourceKey,
    sourceDateKey: toDayKey(createdAt),
  };
}

function normalizePremiumMemory(memory) {
  if (!memory || typeof memory !== 'object') {
    return null;
  }

  const text = String(memory.text || '').trim();
  if (!text) {
    return null;
  }

  const tags = Array.isArray(memory.tags)
    ? memory.tags
    : String(memory.tags || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

  const normalizedTags = tags
    .map((tag) => String(tag).trim().slice(0, 24))
    .filter(Boolean)
    .slice(0, 8);

  const tone = ['daily', 'business', 'exam', 'free'].includes(String(memory.tone || '').trim())
    ? String(memory.tone || '').trim()
    : 'free';

  const reviewCount = Math.max(0, Number(memory.reviewCount) || 0);
  const targetRepeats = Math.max(1, Math.min(20, Number(memory.targetRepeats) || 3));
  const createdAt = String(memory.createdAt || new Date().toISOString());
  const updatedAt = String(memory.updatedAt || new Date().toISOString());
  const reviewHistory = Array.isArray(memory.reviewHistory)
    ? memory.reviewHistory
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(-120)
    : [];
  const achievedAt = String(memory.achievedAt || (reviewCount >= targetRepeats ? updatedAt : '')).trim();
  const legacySource = inferLegacyMistakeSource(memory, normalizedTags, createdAt);
  const sourceType = String(memory.sourceType || legacySource.sourceType || '').trim().slice(0, 32);
  const sourceKey = String(memory.sourceKey || legacySource.sourceKey || '').trim().slice(0, 160);
  const sourceDateKey = String(memory.sourceDateKey || legacySource.sourceDateKey || '').trim().slice(0, 16);

  return {
    id: String(memory.id || `memory-${Date.now()}`),
    title: String(memory.title || '').trim().slice(0, 80),
    text: text.slice(0, 280),
    note: String(memory.note || '').trim().slice(0, 220),
    tags: normalizedTags,
    tone,
    isFavorite: Boolean(memory.isFavorite),
    targetRepeats,
    reviewCount,
    reviewHistory,
    achievedAt,
    sourceType,
    sourceKey,
    sourceDateKey,
    nextReviewAt: String(memory.nextReviewAt || createdAt),
    lastReviewedAt: String(memory.lastReviewedAt || '').trim(),
    createdAt,
    updatedAt,
  };
}

function computeNextPremiumReviewAt(reviewCount = 0) {
  const scheduleDays = [1, 3, 7, 14, 30, 45];
  const index = Math.max(0, Math.min(scheduleDays.length - 1, Number(reviewCount) || 0));
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + scheduleDays[index]);
  return nextDate.toISOString();
}

function buildPremiumReviewPriority(memory, nowMs = Date.now()) {
  const source = memory && typeof memory === 'object' ? memory : {};
  const reviewCount = Math.max(0, Number(source.reviewCount) || 0);
  const targetRepeats = Math.max(1, Number(source.targetRepeats) || 3);
  const nextReviewMs = new Date(String(source.nextReviewAt || '')).getTime();
  const hasValidNextReview = Number.isFinite(nextReviewMs);
  const overdueDays = hasValidNextReview
    ? Math.max(0, Math.floor((nowMs - nextReviewMs) / (24 * 60 * 60 * 1000)))
    : 0;
  const remainingRepeats = Math.max(0, targetRepeats - reviewCount);
  const hasMistakeTag = Array.isArray(source.tags)
    ? source.tags.some((tag) => String(tag).trim() === '誤答ログ')
    : false;
  const mistakeBoost = String(source.sourceType || '').trim() === 'grammar-mistake' || hasMistakeTag ? 2 : 0;
  const dueBoost = hasValidNextReview ? (nextReviewMs <= nowMs ? 4 : 0) : 1;
  const priority = (overdueDays * 3) + (remainingRepeats * 2) + dueBoost + mistakeBoost;
  const isDue = hasValidNextReview ? nextReviewMs <= nowMs : (reviewCount < targetRepeats);

  return {
    isDue,
    overdueDays,
    remainingRepeats,
    priority,
  };
}

function normalizeUserRecord(user) {
  const normalized = { ...user };
  normalized.progress = normalizeProgress(normalized.progress);
  normalized.is_premium = Boolean(normalized.is_premium || normalized.plan === 'premium');
  normalized.plan = normalized.is_premium ? 'premium' : 'free';
  normalized.premiumMemories = Array.isArray(normalized.premiumMemories)
    ? normalized.premiumMemories.map(normalizePremiumMemory).filter(Boolean)
    : [];
  return normalized;
}

function isPremiumUser(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.is_premium) return true;
  if (user.plan === 'premium') return true;
  const email = String(user.email || '').trim().toLowerCase();
  return PREMIUM_ACCESS_EMAILS.has(email);
}

function ensureJsonSeed(filePath, seedValue) {
  if (fs.existsSync(filePath)) {
    return;
  }
  writeJson(filePath, seedValue);
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

function buildUniqueUserId(users, preferredBase, fallbackPrefix = 'user') {
  const base = buildUserId(preferredBase, fallbackPrefix);
  const existing = new Set((users || []).map((user) => String(user.id || '').trim()));
  if (!existing.has(base)) {
    return base;
  }

  for (let i = 2; i < 10000; i += 1) {
    const candidate = `${base}-${i}`;
    if (!existing.has(candidate)) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
}

async function verifyGoogleIdToken(idToken) {
  const token = String(idToken || '').trim();
  if (!token) {
    return { ok: false, error: 'Google認証トークンがありません' };
  }

  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
    if (!response.ok) {
      return { ok: false, error: 'Googleトークンの検証に失敗しました' };
    }

    const data = await response.json();
    const configuredClientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
    if (configuredClientId && data.aud !== configuredClientId) {
      return { ok: false, error: 'GoogleクライアントIDが一致しません' };
    }

    const emailVerified = String(data.email_verified || '').toLowerCase() === 'true' || data.email_verified === true;
    if (!data.sub || !data.email || !emailVerified) {
      return { ok: false, error: 'Googleアカウント情報を確認できませんでした' };
    }

    return {
      ok: true,
      profile: {
        sub: String(data.sub),
        email: String(data.email).trim().toLowerCase(),
        name: String(data.name || '').trim() || 'Googleユーザー',
        picture: String(data.picture || '').trim(),
      },
    };
  } catch (error) {
    return { ok: false, error: 'Google検証処理でエラーが発生しました' };
  }
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
  const dirPath = path.dirname(filePath);
  const payload = JSON.stringify(data, null, 2);
  fs.mkdirSync(dirPath, { recursive: true });
  const tempPath = path.join(
    dirPath,
    `${path.basename(filePath)}.${process.pid}.${Date.now()}.${crypto.randomBytes(6).toString('hex')}.tmp`,
  );

  try {
    fs.writeFileSync(tempPath, payload, 'utf8');
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    try {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    } catch (_cleanupError) {
      // Cleanup failures should not hide the original write error.
    }

    if (['EXDEV', 'EPERM', 'EACCES', 'ENOENT'].includes(error.code)) {
      fs.writeFileSync(filePath, payload, 'utf8');
      return;
    }

    throw error;
  }
}

function maskEmail(email) {
  const value = String(email || '').trim().toLowerCase();
  if (!value || !value.includes('@')) {
    return '';
  }
  const [localPart, domainPart] = value.split('@');
  if (!domainPart) {
    return '';
  }
  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}***@${domainPart}`;
}

function trimAuditLogIfNeeded(filePath, maxItems) {
  if (!(maxItems > 0) || !fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw) {
    return;
  }

  const lines = raw.trimEnd().split('\n');
  if (lines.length <= maxItems) {
    return;
  }

  const retained = lines.slice(-maxItems).join('\n');
  fs.writeFileSync(filePath, `${retained}\n`, 'utf8');
}

function getRequestAuditMeta(req) {
  return {
    method: String(req.method || '').trim(),
    path: String(req.originalUrl || req.url || '').trim().slice(0, 180),
    ip: String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
      .split(',')[0]
      .trim()
      .slice(0, 80),
    userAgent: String(req.headers['user-agent'] || '').trim().slice(0, 180),
  };
}

function appendUserAuditLog(entry) {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      action: String(entry?.action || 'unknown').trim().slice(0, 64),
      status: String(entry?.status || 'success').trim().slice(0, 24),
      actor: {
        userId: String(entry?.actor?.userId || '').trim().slice(0, 80),
        email: String(entry?.actor?.email || '').trim().slice(0, 120),
        role: String(entry?.actor?.role || '').trim().slice(0, 24),
        authProvider: String(entry?.actor?.authProvider || '').trim().slice(0, 24),
      },
      target: entry?.target && typeof entry.target === 'object' ? entry.target : {},
      details: entry?.details && typeof entry.details === 'object' ? entry.details : {},
      request: entry?.request && typeof entry.request === 'object' ? entry.request : {},
    };

    fs.mkdirSync(path.dirname(USER_AUDIT_LOG_FILE), { recursive: true });
    fs.appendFileSync(USER_AUDIT_LOG_FILE, `${JSON.stringify(payload)}\n`, 'utf8');
    trimAuditLogIfNeeded(USER_AUDIT_LOG_FILE, USER_AUDIT_MAX_ITEMS);
  } catch (error) {
    console.warn('Failed to append user audit log:', error.message);
  }
}

function ensureSeedData() {
  const seedUsers = readJson(path.join(DEFAULT_DATA_DIR, 'users.json'), []);
  const seedPosts = readJson(path.join(DEFAULT_DATA_DIR, 'posts.json'), []);
  const seedFeedback = readJson(path.join(DEFAULT_DATA_DIR, 'feedback.json'), []);

  let users = normalizePasswordStorage(readJson(USERS_FILE, seedUsers));
  users = users.map(normalizeUserRecord);
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
        plan: 'premium',
        progress: { attempted: 0, correct: 0, streak: 0, reviewQueue: [] },
        premiumMemories: [],
      });
    }
  }

  if (users.length || !fs.existsSync(USERS_FILE)) {
    writeJson(USERS_FILE, users);
  }

  const posts = readJson(POSTS_FILE, seedPosts);
  if (!posts.length && seedPosts.length) {
    writeJson(POSTS_FILE, seedPosts);
  } else if (!fs.existsSync(POSTS_FILE)) {
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

  const feedback = readJson(FEEDBACK_FILE, seedFeedback);
  if (Array.isArray(feedback)) {
    if (!fs.existsSync(FEEDBACK_FILE)) {
      writeJson(FEEDBACK_FILE, feedback);
    }
  } else {
    writeJson(FEEDBACK_FILE, []);
  }

  ensureJsonSeed(SESSIONS_FILE, []);
}

function loadSessionsFromDisk() {
  const stored = readJson(SESSIONS_FILE, []);
  const now = Date.now();
  sessions.clear();

  if (Array.isArray(stored)) {
    stored.forEach((item) => {
      const sessionId = String(item?.sessionId || '').trim();
      const userId = String(item?.userId || '').trim();
      const createdAt = new Date(item?.createdAt || now).getTime();
      const lastSeenAt = new Date(item?.lastSeenAt || item?.createdAt || now).getTime();
      if (!sessionId || !userId) {
        return;
      }
      if (Number.isFinite(lastSeenAt) && now - lastSeenAt <= SESSION_TTL_MS) {
        sessions.set(sessionId, { userId, createdAt: createdAt || now, lastSeenAt: lastSeenAt || now });
      }
    });
  }
}

function persistSessions() {
  const stored = Array.from(sessions.entries()).map(([sessionId, record]) => ({
    sessionId,
    userId: record.userId,
    createdAt: new Date(record.createdAt || Date.now()).toISOString(),
    lastSeenAt: new Date(record.lastSeenAt || record.createdAt || Date.now()).toISOString(),
  }));
  writeJson(SESSIONS_FILE, stored);
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
  const users = normalizePasswordStorage(readJson(USERS_FILE, []));
  return users.map(normalizeUserRecord).find((user) => user.id === userId) || null;
}

function findUserByStripeCustomerId(customerId) {
  const normalizedCustomerId = String(customerId || '').trim();
  if (!normalizedCustomerId) return null;
  const users = normalizePasswordStorage(readJson(USERS_FILE, [])).map(normalizeUserRecord);
  return users.find((user) => String(user.stripeCustomerId || '').trim() === normalizedCustomerId) || null;
}

function findUserByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;
  const users = normalizePasswordStorage(readJson(USERS_FILE, [])).map(normalizeUserRecord);
  return users.find((user) => String(user.email || '').trim().toLowerCase() === normalizedEmail) || null;
}

function getBaseUrl(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol || 'http';
  const host = String(req.headers['x-forwarded-host'] || req.get('host') || '').split(',')[0].trim();
  if (!host) {
    return `http://localhost:${PORT}`;
  }
  return `${protocol}://${host}`;
}

function getSessionUser(req) {
  const cookies = parseCookies(req);
  const sessionId = cookies.sessionId;
  if (!sessionId || !sessions.has(sessionId)) {
    return null;
  }

  const sessionRecord = sessions.get(sessionId);
  const lastSeenAt = Number(sessionRecord.lastSeenAt || sessionRecord.createdAt || 0);
  if (Number.isFinite(lastSeenAt) && Date.now() - lastSeenAt > SESSION_TTL_MS) {
    sessions.delete(sessionId);
    persistSessions();
    return null;
  }

  sessionRecord.lastSeenAt = Date.now();
  const user = findUserById(sessionRecord.userId);
  if (!user) {
    sessions.delete(sessionId);
    persistSessions();
    return null;
  }

  return user;
}

function setSession(res, user) {
  const sessionId = crypto.randomBytes(16).toString('hex');
  sessions.set(sessionId, { userId: user.id, createdAt: Date.now(), lastSeenAt: Date.now() });
  persistSessions();
  res.setHeader('Set-Cookie', `sessionId=${sessionId}; Path=/; HttpOnly; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`);
  return sessionId;
}

function clearSession(req, res) {
  const cookies = parseCookies(req);
  const sessionId = cookies.sessionId;
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
    persistSessions();
  }
  res.setHeader('Set-Cookie', 'sessionId=; Path=/; HttpOnly; Max-Age=0');
}

function updateUserRecord(userId, updater) {
  const users = normalizePasswordStorage(readJson(USERS_FILE, []));
  const normalizedUsers = users.map(normalizeUserRecord);
  const index = normalizedUsers.findIndex((user) => user.id === userId);
  if (index < 0) {
    return null;
  }

  const current = normalizedUsers[index];
  const updated = normalizeUserRecord(updater({ ...current }) || current);
  normalizedUsers[index] = updated;
  saveUsers(normalizedUsers);
  return updated;
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

const grammarMasterList = [
  {
    categoryId: 'beginner',
    categoryName: '初級文法',
    items: [
      {
        id: 'beg-copula-polite',
        level: 'beginner',
        category: '指定詞・基本語尾',
        grammar: '~이에요/예요, ~입니다/입니까?',
        meaning: '〜です / ですか',
        hint: '名詞の後ろに -이에요/예요 を使います。',
        sampleJapanese: '私は日本人です。',
        sampleAnswer: '저는 일본 사람이에요.',
        checkpoints: ['이에요', '예요', '입니다', '입니까'],
      },
      {
        id: 'beg-negative',
        level: 'beginner',
        category: '否定表現',
        grammar: '안 ~ / ~지 않다, 못 ~ / ~지 못하다',
        meaning: '〜しない / 〜できない',
        hint: '否定は 안 または -지 않다、不能は 못 または -지 못하다 を使います。',
        sampleJapanese: '私は今日は運動しません。',
        sampleAnswer: '저는 오늘 운동하지 않아요.',
        checkpoints: ['안 ', '지 않', '못 ', '지 못'],
      },
      {
        id: 'beg-past-future',
        level: 'beginner',
        category: '過去形・未来形',
        grammar: '~았/었어요, ~을/ㄹ 거예요',
        meaning: '〜しました / 〜するつもりです',
        hint: '過去は -았/었어요、未来は -을/ㄹ 거예요 を使います。',
        sampleJapanese: '昨日は図書館で勉強しました。',
        sampleAnswer: '어제는 도서관에서 공부했어요.',
        checkpoints: ['았어요', '었어요', '했어요', '거예요'],
      },
      {
        id: 'beg-progress-state',
        level: 'beginner',
        category: '進行・状態',
        grammar: '~고 있다, ~아/어 있다',
        meaning: '〜している / 〜してある',
        hint: '進行は -고 있다、状態は -아/어 있다 を使います。',
        sampleJapanese: '今、友達を待っています。',
        sampleAnswer: '지금 친구를 기다리고 있어요.',
        checkpoints: ['고 있어', '아 있어', '어 있어'],
      },
      {
        id: 'beg-desire-intent',
        level: 'beginner',
        category: '願望・意図',
        grammar: '~고 싶다, ~을/ㄹ게요',
        meaning: '〜したい / 〜しますね',
        hint: '願望は -고 싶다、意図は -을/ㄹ게요 を使います。',
        sampleJapanese: '韓国料理を食べたいです。',
        sampleAnswer: '한국 음식을 먹고 싶어요.',
        checkpoints: ['고 싶', 'ㄹ게요', '을게요'],
      },
      {
        id: 'beg-suggestion-connector',
        level: 'beginner',
        category: '提案・勧誘',
        grammar: '~을/ㄹ까요?, ~아/어서',
        meaning: '〜しましょうか / 〜して・〜だから',
        hint: '提案は -을/ㄹ까요?、接続は -아/어서 を使います。',
        sampleJapanese: '一緒に映画を見に行きましょうか。',
        sampleAnswer: '같이 영화 보러 갈까요?',
        checkpoints: ['까요', '아서', '어서'],
      },
    ],
  },
  {
    categoryId: 'intermediate',
    categoryName: '中級文法',
    items: [
      {
        id: 'int-reason-cause',
        level: 'intermediate',
        category: '理由・原因',
        grammar: '~기 때문에, ~느라고',
        meaning: '〜だから / 〜するせいで',
        hint: '理由の説明は -기 때문에、原因強調は -느라고 を使います。',
        sampleJapanese: '雨が降ったので遅れました。',
        sampleAnswer: '비가 왔기 때문에 늦었어요.',
        checkpoints: ['기 때문에', '느라고'],
      },
      {
        id: 'int-condition',
        level: 'intermediate',
        category: '条件・仮定',
        grammar: '~으면/면, ~아/어야',
        meaning: '〜なら / 〜しなければ',
        hint: '条件は -으면/면、必須条件は -아/어야 を使います。',
        sampleJapanese: '時間があれば連絡してください。',
        sampleAnswer: '시간이 있으면 연락해 주세요.',
        checkpoints: ['으면', '면', '아야', '어야'],
      },
      {
        id: 'int-contrast',
        level: 'intermediate',
        category: '逆説・コントラスト',
        grammar: '~지만, ~ㄴ/는데',
        meaning: '〜だけど / 〜のに・〜ですが',
        hint: '逆接は -지만、背景説明や対比は -는데 を使います。',
        sampleJapanese: '忙しいですが、手伝います。',
        sampleAnswer: '바쁘지만 도와줄게요.',
        checkpoints: ['지만', '는데', '은데'],
      },
      {
        id: 'int-purpose',
        level: 'intermediate',
        category: '目的・手段',
        grammar: '~으러/러, ~기 위해(서)',
        meaning: '〜しに / 〜するために',
        hint: '目的地への移動は -으러/러、一般目的は -기 위해(서) を使います。',
        sampleJapanese: '韓国語を勉強するために韓国へ行きます。',
        sampleAnswer: '한국어를 공부하기 위해 한국에 가요.',
        checkpoints: ['으러', '러', '기 위해', '기 위해서'],
      },
      {
        id: 'int-experience-ability',
        level: 'intermediate',
        category: '経験・能力',
        grammar: '~ㄴ/은 적이 있다/없다, ~을/ㄹ 수 있다/없다',
        meaning: '〜したことがある/ない, 〜できる/できない',
        hint: '経験は -적이 있다/없다、能力は -을/ㄹ 수 있다/없다 を使います。',
        sampleJapanese: '韓国に行ったことがあります。',
        sampleAnswer: '한국에 간 적이 있어요.',
        checkpoints: ['적이 있', '적이 없', '수 있', '수 없'],
      },
      {
        id: 'int-guess-quote',
        level: 'intermediate',
        category: '推測・伝聞',
        grammar: '~것 같다, ~다고 하다',
        meaning: '〜のようだ / 〜だそうだ',
        hint: '推測は -것 같다、伝聞は -다고 하다 を使います。',
        sampleJapanese: '彼は今日来ないようです。',
        sampleAnswer: '그는 오늘 안 올 것 같아요.',
        checkpoints: ['것 같', '다고 하'],
      },
    ],
  },
  {
    categoryId: 'upper-intermediate',
    categoryName: '中上級文法',
    items: [
      {
        id: 'up-change-result',
        level: 'advanced',
        category: '変化・結果',
        grammar: '~게 되다',
        meaning: '〜するようになる',
        hint: '状態変化や結果を表すときは -게 되다 を使います。',
        sampleJapanese: '毎日練習して、韓国語を自然に話せるようになりました。',
        sampleAnswer: '매일 연습해서 한국어를 자연스럽게 말하게 되었어요.',
        checkpoints: ['게 되'],
      },
      {
        id: 'up-obligation-emphasis',
        level: 'advanced',
        category: '義務・強調',
        grammar: '~아/어야 하다',
        meaning: '〜しなければならない',
        hint: '義務や必要性を強く示すときは -아/어야 하다 を使います。',
        sampleJapanese: '明日までにこの報告書を提出しなければなりません。',
        sampleAnswer: '내일까지 이 보고서를 제출해야 해요.',
        checkpoints: ['해야', '아야', '어야'],
      },
      {
        id: 'up-contrast-formal',
        level: 'advanced',
        category: '対比・転換',
        grammar: '~는 반면(에)',
        meaning: '〜である一方で',
        hint: '二つの事実を対比するときは -는 반면(에) を使います。',
        sampleJapanese: '兄は外向的な一方で、私は静かな性格です。',
        sampleAnswer: '형은 외향적인 반면에 저는 조용한 성격이에요.',
        checkpoints: ['반면'],
      },
      {
        id: 'up-addition',
        level: 'advanced',
        category: '追加・並列',
        grammar: '~(으)ㄹ 뿐만 아니라',
        meaning: '〜だけでなく',
        hint: '追加情報を重ねるときは -(으)ㄹ 뿐만 아니라 を使います。',
        sampleJapanese: 'この本は面白いだけでなく、実用的でもあります。',
        sampleAnswer: '이 책은 재미있을 뿐만 아니라 실용적이기도 해요.',
        checkpoints: ['뿐만 아니라'],
      },
      {
        id: 'up-proportional',
        level: 'advanced',
        category: '比例表現',
        grammar: '~(으)ㄹ수록',
        meaning: '〜すればするほど',
        hint: '比例的な変化を表すときは -(으)ㄹ수록 を使います。',
        sampleJapanese: '練習すればするほど自信がつきます。',
        sampleAnswer: '연습할수록 자신감이 생겨요.',
        checkpoints: ['수록'],
      },
      {
        id: 'up-pretend',
        level: 'advanced',
        category: 'ふり・仮装',
        grammar: '~(으)ㄴ/는 척하다',
        meaning: '〜するふりをする',
        hint: '実際とは違う行動を装うときは -(으)ㄴ/는 척하다 を使います。',
        sampleJapanese: '彼は聞こえないふりをしました。',
        sampleAnswer: '그는 못 들은 척했어요.',
        checkpoints: ['척하'],
      },
    ],
  },
];

const grammarMasterMap = new Map(
  grammarMasterList.flatMap((category) => category.items.map((item) => [item.id, item])),
);

const fallbackReplyBank = {
  beginner: [
    {
      prompt: '友達からのメッセージ',
      situation: '친구: 今日の夜、少し話せる？',
      answer: '네, 가능해요. 무슨 일이에요?',
      hint: '相手の質問に短く返して、次の話題を促す形が自然です。',
      followUp: '친구: 별일은 아니고, 그냥 오늘 하루 어땠는지 궁금했어.',
    },
    {
      prompt: '友達からのメッセージ',
      situation: '친구: 明日カフェに行かない？',
      answer: '좋아요. 몇 시에 만날까요?',
      hint: '誘いに答えるときは、賛成 + 時間確認が自然です。',
      followUp: '친구: 오후 2시는 어때?',
    },
  ],
  intermediate: [
    {
      prompt: '友達からのメッセージ',
      situation: '친구: さっき送った写真見た？',
      answer: '네, 봤어요. 정말 예쁘네요.',
      hint: '感想を一言添えると会話が続きやすくなります。',
      followUp: '친구: 그렇지? 다음에 같이 가자.',
    },
    {
      prompt: '友達からのメッセージ',
      situation: '친구: 週末、引っ越しを手伝ってくれる？',
      answer: '물론이죠. 몇 시에 가면 될까요?',
      hint: '手伝えるなら、丁寧に了承して具体的な確認をします。',
      followUp: '친구: 토요일 오전 10시쯤 오면 돼.',
    },
  ],
  advanced: [
    {
      prompt: '友達からのメッセージ',
      situation: '친구: 例の企画、今日中に見直しておける？',
      answer: '네, 오늘 안에 검토해서 내일 아침에 보내드릴게요.',
      hint: '期限と約束を明確にすると自然です。',
      followUp: '친구: 고마워. 부탁할게!',
    },
    {
      prompt: '友達からのメッセージ',
      situation: '친구: 来月の旅行、宿だけ先に予約しようか？',
      answer: '좋아요. 위치랑 가격을 같이 비교해 볼까요?',
      hint: '提案に乗るときは、次の行動を添えると会話が滑らかです。',
      followUp: '친구: 응, 내가 몇 군데 골라볼게.',
    },
  ],
};

const fallbackImageBank = {
  beginner: [
    {
      prompt: '画像を見て、韓国語で1〜2文の描写を書いてください。',
      scene: '公園で人と犬が散歩している午後の風景',
      answer: '공원에서 사람들이 강아지와 함께 산책하고 있어요.',
      hint: '場所(공원에서)と動作(-고 있어요)を入れると自然です。',
      targetWords: '6-12',
      vocabFocus: '日常の場所・人・動作',
      grammarFocus: '-고 있어요, 에서/와 함께',
    },
    {
      prompt: '画像を見て、韓国語で1〜2文の描写を書いてください。',
      scene: 'カフェで二人がノートPCを見ながら話している場面',
      answer: '카페에서 두 사람이 노트북을 보면서 이야기하고 있어요.',
      hint: '同時動作は -면서 を使うと描写しやすいです。',
      targetWords: '7-13',
      vocabFocus: '場所・人数・基本動詞',
      grammarFocus: '-면서, -고 있어요',
    },
  ],
  intermediate: [
    {
      prompt: '画像を見て、韓国語で1〜2文の描写を書いてください。',
      scene: '雨の中で傘を差しながらバス停で待っている人たち',
      answer: '비가 오는 날에 사람들이 우산을 쓰고 버스 정류장에서 기다리고 있어요.',
      hint: '背景(비가 오는 날)と場所(버스 정류장에서)を組み合わせると自然です。',
      targetWords: '10-18',
      vocabFocus: '天気・移動・公共空間',
      grammarFocus: '-는 날, -고, 에서',
    },
    {
      prompt: '画像を見て、韓国語で1〜2文の描写を書いてください。',
      scene: '夕方の市場で店員と客が会話している様子',
      answer: '저녁 시장에서 상인과 손님이 대화하고 있어요.',
      hint: '人物の関係(상인/손님)を入れると情報量が増えます。',
      targetWords: '10-18',
      vocabFocus: '職業・時間帯・会話動詞',
      grammarFocus: '와/과, -고 있어요',
    },
  ],
  advanced: [
    {
      prompt: '画像を見て、韓国語で1〜2文の描写を書いてください。',
      scene: '会議室で資料を見ながら議論している複数のメンバー',
      answer: '회의실에서 여러 구성원이 자료를 검토하며 진지하게 토론하고 있다.',
      hint: '連結語尾(-며)を使うと描写が滑らかになります。',
      targetWords: '14-26',
      vocabFocus: '抽象名詞・会議語彙・態度副詞',
      grammarFocus: '-며, 고급 서술어 선택',
    },
    {
      prompt: '画像を見て、韓国語で1〜2文の描写を書いてください。',
      scene: '夜の街で信号を待つ人と流れる車の光',
      answer: '밤거리에서 사람들이 신호를 기다리고 있고, 차 불빛이 길게 이어지고 있다.',
      hint: '並列構文(-고)で複数の要素を自然につなげます。',
      targetWords: '14-26',
      vocabFocus: '描写副詞・都市表現・連結表現',
      grammarFocus: '-고 있고, 관찰형 서술',
    },
  ],
};

function getImageDifficultyProfile(level = 'beginner') {
  if (level === 'advanced') {
    return {
      targetWords: '14-26',
      sentenceGuide: '2文推奨。接続語尾を使い、描写対象を2つ以上含める。',
      vocabFocus: '抽象語彙・副詞・関係語',
      grammarFocus: '-며, -고 있고, 관찰형 종결',
      feedbackStrictness: 'high',
    };
  }
  if (level === 'intermediate') {
    return {
      targetWords: '10-18',
      sentenceGuide: '1〜2文。時間・場所・人物の要素を2つ以上入れる。',
      vocabFocus: '状況語彙・行動語彙',
      grammarFocus: '-고 있어요, -면서, 에서/으로',
      feedbackStrictness: 'medium',
    };
  }
  return {
    targetWords: '6-12',
    sentenceGuide: '1文中心。主語・場所・動作を明確にする。',
    vocabFocus: '基本名詞・基本動詞',
    grammarFocus: '-고 있어요, 은/는, 이/가',
    feedbackStrictness: 'gentle',
  };
}

function getPracticeMode(value) {
  const normalized = String(value || 'grammar').trim().toLowerCase();
  if (normalized === 'grammar') return 'grammar';
  if (normalized === 'reply') return 'reply';
  if (normalized === 'image') return 'image';
  return 'translation';
}

function getGrammarById(grammarId) {
  return grammarMasterMap.get(String(grammarId || '').trim()) || null;
}

function getFallbackGrammarQuestion(grammarId) {
  const grammar = getGrammarById(grammarId) || grammarMasterList[0].items[0];
  return {
    japanese_question: grammar.sampleJapanese,
    target_grammar: grammar.grammar,
    model_answer: grammar.sampleAnswer,
    hint: grammar.hint,
    grammar_id: grammar.id,
  };
}

function detectGrammarUsage(grammar, answerText) {
  const answer = String(answerText || '');
  const checkpoints = Array.isArray(grammar?.checkpoints) ? grammar.checkpoints : [];
  if (!checkpoints.length) return true;
  return checkpoints.some((marker) => answer.includes(marker));
}

function getFallbackQuestion(level = 'beginner') {
  const normalizedLevel = ['beginner', 'intermediate', 'advanced'].includes(level) ? level : 'beginner';
  const pool = fallbackQuestionBank[normalizedLevel];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getFallbackReplyPrompt(level = 'beginner', previousFollowUp = '') {
  const normalizedLevel = ['beginner', 'intermediate', 'advanced'].includes(level) ? level : 'beginner';
  const pool = fallbackReplyBank[normalizedLevel];
  const base = pool[Math.floor(Math.random() * pool.length)];
  if (!previousFollowUp) {
    return base;
  }

  return {
    ...base,
    situation: String(previousFollowUp).trim(),
    prompt: '友達からのメッセージ',
    answer: base.answer,
    followUp: base.followUp || '친구: 응, 다음 이야기 이어서 하자.',
  };
}

function getFallbackImageQuestion(level = 'beginner') {
  const normalizedLevel = ['beginner', 'intermediate', 'advanced'].includes(level) ? level : 'beginner';
  const pool = fallbackImageBank[normalizedLevel];
  const base = pool[Math.floor(Math.random() * pool.length)];
  const profile = getImageDifficultyProfile(normalizedLevel);
  return {
    ...base,
    imageUrl: buildSceneSvgDataUri(base.scene),
    targetWords: base.targetWords || profile.targetWords,
    sentenceGuide: profile.sentenceGuide,
    vocabFocus: base.vocabFocus || profile.vocabFocus,
    grammarFocus: base.grammarFocus || profile.grammarFocus,
  };
}

function escapeSvgText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildSceneSvgDataUri(sceneText = '公園で人と犬が散歩している風景') {
  const scene = escapeSvgText(sceneText).slice(0, 64);
  const raw = String(sceneText || '').toLowerCase();
  const isPark = /공원|公園|park/.test(raw);
  const isCafe = /카페|喫茶|cafe/.test(raw);
  const isRain = /비|雨|rain/.test(raw);
  const isMeeting = /회의|会議|meeting/.test(raw);
  const isMarket = /시장|市場|market/.test(raw);
  const isNight = /밤|夜|night/.test(raw);
  const skyColor = isNight ? '#1e293b' : isRain ? '#dbeafe' : isCafe ? '#fff3e0' : '#dbeafe';
  const groundColor = isPark ? '#86efac' : isMarket ? '#fed7aa' : isMeeting ? '#e5e7eb' : '#c7f9cc';
  const sunColor = isNight ? '#f8fafc' : '#facc15';
  const treeColor = isPark ? '#16a34a' : isMarket ? '#22c55e' : isMeeting ? '#64748b' : '#2f855a';
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768" viewBox="0 0 1024 768">',
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${skyColor}"/><stop offset="100%" stop-color="#f8fafc"/></linearGradient></defs>`,
    '<rect width="1024" height="768" fill="url(#bg)"/>',
    `<circle cx="170" cy="150" r="92" fill="${sunColor}" fill-opacity="0.34"/>`,
    '<ellipse cx="260" cy="190" rx="80" ry="42" fill="#ffffff" fill-opacity="0.62"/>',
    '<ellipse cx="330" cy="135" rx="110" ry="54" fill="#ffffff" fill-opacity="0.54"/>',
    '<ellipse cx="760" cy="150" rx="84" ry="40" fill="#ffffff" fill-opacity="0.58"/>',
    `<rect x="0" y="500" width="1024" height="268" fill="${groundColor}" fill-opacity="0.72"/>`,
    isPark ? '<g><rect x="104" y="360" width="152" height="98" rx="18" fill="#f59e0b"/><rect x="120" y="374" width="120" height="14" rx="7" fill="#fde68a"/><rect x="156" y="404" width="86" height="112" rx="14" fill="#fef3c7"/><rect x="182" y="432" width="36" height="54" rx="18" fill="#60a5fa"/><circle cx="208" cy="416" r="18" fill="#fda4af"/><path d="M286 564c24-84 58-126 120-126s92 42 124 126" fill="none" stroke="#15803d" stroke-width="10" stroke-linecap="round"/><rect x="458" y="356" width="164" height="118" rx="18" fill="#fbbf24"/><path d="M490 470l64-102 64 102" fill="#fb923c"/><rect x="500" y="470" width="44" height="82" rx="10" fill="#eab308"/><circle cx="360" cy="392" r="42" fill="#22c55e"/><rect x="350" y="428" width="18" height="92" rx="9" fill="#8b5a2b"/><circle cx="360" cy="360" r="54" fill="${treeColor}" fill-opacity="0.88"/><circle cx="708" cy="426" r="26" fill="#fde68a"/><circle cx="792" cy="438" r="22" fill="#fda4af"/><circle cx="744" cy="468" r="24" fill="#93c5fd"/><circle cx="820" cy="468" r="20" fill="#fca5a5"/><circle cx="742" cy="422" r="18" fill="#334155" fill-opacity="0.75"/><circle cx="820" cy="424" r="18" fill="#334155" fill-opacity="0.75"/><path d="M734 486c18-20 32-28 48-28s30 8 46 28" fill="none" stroke="#334155" stroke-width="6" stroke-linecap="round"/></g>' : '',
    isCafe ? '<g><rect x="110" y="342" width="280" height="186" rx="22" fill="#fff7ed" stroke="#fdba74"/><rect x="130" y="360" width="120" height="22" rx="11" fill="#fde68a"/><rect x="132" y="400" width="128" height="82" rx="16" fill="#dbeafe"/><rect x="274" y="388" width="80" height="94" rx="18" fill="#fee2e2"/><circle cx="170" cy="440" r="16" fill="#93c5fd"/><circle cx="212" cy="440" r="16" fill="#93c5fd"/><circle cx="314" cy="430" r="18" fill="#fda4af"/><rect x="418" y="390" width="138" height="74" rx="20" fill="#fde68a"/><circle cx="482" cy="426" r="18" fill="#22c55e"/><rect x="448" y="362" width="16" height="122" rx="8" fill="#92400e"/></g>' : '',
    isRain ? '<g opacity="0.72"><path d="M210 282l-16 30" stroke="#3b82f6" stroke-width="4"/><path d="M270 254l-16 30" stroke="#3b82f6" stroke-width="4"/><path d="M334 292l-16 30" stroke="#3b82f6" stroke-width="4"/><path d="M400 258l-16 30" stroke="#3b82f6" stroke-width="4"/><path d="M462 286l-16 30" stroke="#3b82f6" stroke-width="4"/></g><path d="M170 462c96-122 192-122 296 0" fill="#94a3b8" opacity="0.34"/><path d="M600 446c68-92 118-92 188 0" fill="#64748b" opacity="0.18"/><circle cx="680" cy="456" r="24" fill="#fda4af"/><circle cx="760" cy="470" r="24" fill="#93c5fd"/><path d="M656 478c16-18 32-26 48-26s30 8 46 26" fill="none" stroke="#334155" stroke-width="5" stroke-linecap="round"/></g>' : '',
    isMeeting ? '<g><rect x="150" y="300" width="724" height="252" rx="28" fill="#ffffff" stroke="#cbd5e1"/><rect x="202" y="356" width="620" height="26" rx="13" fill="#e2e8f0"/><rect x="202" y="398" width="520" height="26" rx="13" fill="#cbd5e1"/><circle cx="242" cy="480" r="26" fill="#93c5fd"/><circle cx="300" cy="478" r="22" fill="#fda4af"/><circle cx="726" cy="480" r="24" fill="#fde68a"/><rect x="452" y="428" width="120" height="78" rx="20" fill="#dbeafe"/><path d="M468 452h88" stroke="#475569" stroke-width="6" stroke-linecap="round"/><path d="M490 470h44" stroke="#475569" stroke-width="6" stroke-linecap="round"/></g>' : '',
    isMarket ? '<g><rect x="110" y="364" width="804" height="124" rx="20" fill="#fff7ed" stroke="#fdba74"/><rect x="110" y="334" width="804" height="52" rx="18" fill="#fb7185" opacity="0.8"/><rect x="176" y="406" width="90" height="82" rx="10" fill="#fde68a"/><rect x="288" y="398" width="92" height="90" rx="10" fill="#bfdbfe"/><rect x="400" y="410" width="80" height="78" rx="10" fill="#fecaca"/><rect x="514" y="404" width="86" height="84" rx="10" fill="#bbf7d0"/><circle cx="664" cy="448" r="28" fill="#fda4af"/><circle cx="736" cy="446" r="26" fill="#93c5fd"/><circle cx="694" cy="472" r="22" fill="#fcd34d"/><circle cx="784" cy="472" r="20" fill="#86efac"/></g>' : '',
    '</svg>',
  ].join('');
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
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

function sanitizeFollowUp(rawResult, fallbackFollowUp) {
  const source = String(rawResult?.followUp || rawResult?.nextTurn || rawResult?.conversationFollowUp || '').trim();
  if (source && /[가-힣]/.test(source) && !hasHeavyEnglish(source)) {
    return source;
  }
  return fallbackFollowUp ? String(fallbackFollowUp).trim() : '';
}

function buildQuestionGenerationPrompts(level, style) {
  return {
    systemPrompt: [
      'You are an expert Korean writing teacher for Japanese learners.',
      'Create one concise Japanese sentence and its natural Korean answer.',
      'Rules:',
      '- The prompt must be in Japanese.',
      '- The answer must be natural Korean.',
      '- The hint must be in Japanese and explain the key grammar point briefly.',
      '- Return valid JSON only with the fields prompt, answer, and hint.',
      '- Do not add markdown, code fences, or extra text.',
    ].join(' '),
    userPrompt: [
      `Create one ${style} Japanese sentence for a ${level} Korean learner.`,
      'Use a situation that is natural for everyday study.',
      'Return JSON only.',
    ].join(' '),
  };
}

function buildGrammarGenerationPrompts(selectedGrammar, level = 'beginner') {
  const grammarLabel = selectedGrammar?.grammar || '';
  return {
    systemPrompt: [
      'あなたは韓国語の専門講師です。',
      `ターゲット文法: ${grammarLabel}`,
      '',
      '【指示】',
      '指定されたターゲット文法を自然に使う必要がある日本語のお題（作文問題）を1つ作成し、以下のJSONフォーマットで出力してください。',
      '{',
      '"japanese_question": "日本語のお題",',
      '"target_grammar": "指定された文法",',
      '"model_answer": "模範解答の韓国語",',
      '"hint": "ヒント"',
      '}',
      '追加ルール:',
      '- お題は日本語で作成すること。',
      '- 模範解答は自然な韓国語1文〜2文で作成すること。',
      '- hintは日本語で、ターゲット文法の使い方を短く説明すること。',
      '- JSON以外を出力しないこと。',
    ].join('\n'),
    userPrompt: [
      `学習者レベル: ${level}`,
      `指定文法ID: ${selectedGrammar?.id || ''}`,
      `指定文法: ${grammarLabel}`,
      `意味: ${selectedGrammar?.meaning || ''}`,
      '日本語のお題を1つだけ作ってください。',
    ].join('\n'),
  };
}

function buildReplyGenerationPrompts(level, previousFollowUp = '') {
  return {
    systemPrompt: [
      'You are an expert Korean conversation practice generator for Japanese learners.',
      'Create a short, natural chat reply exercise based on a friend message.',
      'Rules:',
      '- Return valid JSON only with the fields prompt, situation, answer, hint, and followUp.',
      '- prompt must be a short Japanese label such as 友達からのメッセージ.',
      '- situation must be the incoming friend message in natural Korean.',
      '- answer must be one natural Korean reply the learner should practice.',
      '- hint must be Japanese and explain the key point briefly.',
      '- followUp must be a short Korean continuation from the friend.',
      previousFollowUp ? `- Continue naturally from this previous message: ${previousFollowUp}` : '- This is the first turn in the conversation.',
      '- Keep the situation realistic and everyday.',
      '- Do not add markdown, code fences, or extra text.',
    ].join(' '),
    userPrompt: [
      `Create one reply training scenario for a ${level} Korean learner.`,
      'Use a message from a friend in an everyday situation.',
      previousFollowUp ? `Continue from this prior message: ${previousFollowUp}` : 'Start a new conversation.',
      'Return JSON only.',
    ].join(' '),
  };
}

function buildImageGenerationPrompts(level) {
  const profile = getImageDifficultyProfile(level);
  return {
    systemPrompt: [
      'You are an expert Korean writing teacher for Japanese learners.',
      'Create one image-description writing task.',
      'Rules:',
      '- Return valid JSON only with the fields prompt, scene, answer, hint, imagePrompt, targetWords, vocabFocus, and grammarFocus.',
      '- prompt must be in Japanese and instruct the learner to describe an image in Korean.',
      '- scene must be a short Japanese scene summary.',
      '- answer must be one natural Korean sample description (1-2 sentences).',
      '- hint must be in Japanese and brief.',
      '- imagePrompt must be a highly detailed English prompt for generating a warm picture-book illustration of the scene, not a photo.',
      '- imagePrompt must include: location, subjects, action, time/light, foreground, middle ground, background, camera framing, mood, and visual style.',
      '- imagePrompt should favor watercolor, colored-pencil, or storybook illustration styling with bright but gentle colors and a clear hand-drawn look.',
      '- imagePrompt should ask for multiple visible objects, natural gestures, and enough environmental detail that a learner can describe the scene in 1-2 sentences.',
      '- imagePrompt should describe clearly visible children or people, natural outdoor detail, and a lively composition when the scene allows it.',
      '- imagePrompt must explicitly say: no text, no letters, no watermark, no logo, no UI, no captions.',
      `- targetWords must match this word range: ${profile.targetWords}.`,
      `- vocabFocus must align with this focus: ${profile.vocabFocus}.`,
      `- grammarFocus must align with this focus: ${profile.grammarFocus}.`,
      `- Sentence guide: ${profile.sentenceGuide}.`,
      '- Keep the scene realistic and easy to describe.',
      '- Do not add markdown, code fences, or extra text.',
    ].join(' '),
    userPrompt: [
      `Create one image-description task for a ${level} Korean learner.`,
      `Word target: ${profile.targetWords}.`,
      `Vocabulary focus: ${profile.vocabFocus}.`,
      `Grammar focus: ${profile.grammarFocus}.`,
      `Sentence guide: ${profile.sentenceGuide}.`,
      'The image should look like a warm children’s picture-book illustration with rich background detail, multiple visible objects, and a clear foreground/midground/background composition.',
      'Depending on the task, the scene may show a park, schoolyard, cafe, market, rainy street, or meeting room, but it should never look minimal or empty.',
      'Return JSON only.',
    ].join(' '),
  };
}

function buildScoringPrompts({ prompt, modelAnswer, userAnswer, level }) {
  return {
    systemPrompt: [
      'You are a precise and encouraging Korean writing instructor for Japanese learners.',
      'Judge the learner answer fairly and conservatively.',
      'Rules:',
      '- Prefer 正解 when the sentence is grammatical, natural enough, and faithful in meaning.',
      '- Use 惜しい only when the meaning mostly works but one or two grammar, particle, spacing, or tone issues should be fixed.',
      '- Use 不正解 only when the meaning is wrong, unclear, or the grammar is seriously broken.',
      '- If the meaning is correct and the grammar is acceptable, mark it as correct even when the wording differs from the model answer.',
      '- Treat polite-form variations such as 해요 and 합니다 as correct unless the task explicitly requires one style.',
      '- If the only issue is spacing, mark it as correct and mention spacing in the explanation.',
      '- Return valid JSON only. Do not add markdown, code fences, or extra text.',
      '- feedback and explanation must be written in Japanese.',
      '- correctedText and alternatives must be natural Korean.',
      '- Never include English words in feedback or explanation.',
      '- Use exactly these fields: status, score, feedback, explanation, correctedText, alternatives.',
      'Examples:',
      'Input answer: 저는 학교에 갑니다.',
      'Expected judgment: correct even if the model answer is 저는 학교에 가요.',
      'Output JSON: {"status":"正解","score":98,"feedback":"自然で正しい韓国語です。","explanation":"丁寧体の違いはありますが、意味と文法は正しいです。","correctedText":"저는 학교에 가요.","alternatives":["저는 학교에 갑니다.","저는 학교에 가요."]}',
      'Input answer: 저는 학교에갑니다.',
      'Expected judgment: spacing only.',
      'Output JSON: {"status":"正解","score":95,"feedback":"意味は正しく伝わっています。","explanation":"分かち書きだけ直すとさらに自然です。","correctedText":"저는 학교에 갑니다.","alternatives":["저는 학교에 가요.","저는 학교에 갑니다."]}',
    ].join(' '),
    userPrompt: [
      `Prompt: ${prompt}`,
      `Model answer: ${modelAnswer}`,
      `User answer: ${userAnswer}`,
      `Level: ${level}`,
      'Return JSON only.',
    ].join('\n'),
  };
}

function buildGrammarScoringPrompts({ prompt, modelAnswer, userAnswer, level, targetGrammar }) {
  return {
    systemPrompt: [
      'あなたは韓国語作文の採点講師です。',
      '学習者の回答を、公平かつ実用的に採点してください。',
      '必須判定:',
      '1) 意味が日本語お題に合っているか',
      '2) 韓国語として自然か',
      '3) 指定されたターゲット文法が正しく使われているか',
      '出力は必ずJSONのみ。',
      'フィールド:',
      '{"status":"正解|惜しい|不正解","score":0-100,"feedback":"日本語","explanation":"日本語","correctedText":"韓国語","alternatives":["韓国語"],"grammarUsed":true/false,"grammarFeedback":"日本語"}',
      '判定ルール:',
      '- grammarUsed が false の場合は、status を 正解 にしないこと。',
      '- grammarUsed が true で意味と文法が自然なら 正解 を優先すること。',
      '- feedback と explanation と grammarFeedback は日本語で書くこと。',
    ].join('\n'),
    userPrompt: [
      `レベル: ${level}`,
      `ターゲット文法: ${targetGrammar}`,
      `お題: ${prompt}`,
      `模範解答: ${modelAnswer}`,
      `学習者回答: ${userAnswer}`,
      'JSONのみで返答してください。',
    ].join('\n'),
  };
}

function buildReplyScoringPrompts({ prompt, situation, modelAnswer, userAnswer, level }) {
  return {
    systemPrompt: [
      'You are a precise and encouraging Korean conversation coach for Japanese learners.',
      'Judge replies to friend messages fairly and conservatively.',
      'Rules:',
      '- Prefer 正解 when the reply fits the situation naturally, even if the wording differs from the sample answer.',
      '- Use 惜しい only when the reply mostly works but sounds slightly unnatural or has one or two grammar, spacing, or tone issues.',
      '- Use 不正解 only when the reply does not fit the situation or has serious grammar problems.',
      '- Accept a reply as correct when the meaning is appropriate and the grammar is natural, even if it differs from the sample answer.',
      '- Treat polite-form variations such as 해요 and 합니다 as correct unless the task explicitly requires one style.',
      '- If the only issue is spacing, mark it as correct and mention spacing in the explanation.',
      '- Return valid JSON only with the fields status, score, feedback, explanation, correctedText, alternatives, and followUp.',
      '- feedback and explanation must be written in Japanese.',
      '- correctedText, alternatives, and followUp must be natural Korean.',
      '- Never include English words in feedback or explanation.',
      '- Use the sample answer as a reference, not as the only acceptable reply.',
      'Examples:',
      'Input reply: 네, 가능해요. 무슨 일이에요?',
      'Expected judgment: correct for a message asking if the learner can talk tonight.',
      'Output JSON: {"status":"正解","score":98,"feedback":"自然な返答です。","explanation":"相手の質問に自然に返し、次の話題も促せています。","correctedText":"네, 가능해요. 무슨 일이에요?","alternatives":["네, 괜찮아요. 왜요?","물론이죠. 무슨 일이에요?"],"followUp":"친구: 오늘 잠깐 상담하고 싶은 게 있어."}',
    ].join(' '),
    userPrompt: [
      `Prompt: ${prompt}`,
      `Situation: ${situation}`,
      `Model answer: ${modelAnswer}`,
      `User answer: ${userAnswer}`,
      `Level: ${level}`,
      'Return JSON only.',
    ].join('\n'),
  };
}

function buildImageScoringPrompts({ prompt, situation, modelAnswer, userAnswer, level }) {
  const profile = getImageDifficultyProfile(level);
  return {
    systemPrompt: [
      'You are a precise and encouraging Korean writing instructor for Japanese learners.',
      'Judge a learner description of an image scene fairly and conservatively.',
      'Rules:',
      '- Prefer 正解 when the learner sentence is grammatical and describes the given scene naturally.',
      '- Use 惜しい only when meaning mostly works but grammar, particles, spacing, or wording should be improved.',
      '- Use 不正解 only when the sentence is unrelated to the scene or has serious grammar issues.',
      '- Accept wording variation if the scene description remains natural and faithful.',
      '- Return valid JSON only with fields: status, score, feedback, explanation, correctedText, alternatives.',
      '- feedback and explanation must be in Japanese.',
      '- correctedText and alternatives must be natural Korean.',
      `- Level strictness is ${profile.feedbackStrictness}.`,
      `- Expected word range: ${profile.targetWords}.`,
      `- Vocabulary focus: ${profile.vocabFocus}.`,
      `- Grammar focus: ${profile.grammarFocus}.`,
      '- Never include English words in feedback or explanation.',
      '- Do not add markdown, code fences, or extra text.',
    ].join(' '),
    userPrompt: [
      `Prompt: ${prompt}`,
      `Scene: ${situation}`,
      `Model answer: ${modelAnswer}`,
      `User answer: ${userAnswer}`,
      `Level: ${level}`,
      'Return JSON only.',
    ].join('\n'),
  };
}

function sanitizeScoringResult(rawResult, modelAnswer) {
  const correctedTextValue = rawResult?.correctedText || rawResult?.corrected_text || '';
  const correctedText = /[가-힣]/.test(String(correctedTextValue || ''))
    ? String(correctedTextValue).trim()
    : String(modelAnswer || '').trim();
  const inferredStatus = rawResult?.status
    || (rawResult?.is_correct === true ? '正解' : rawResult?.is_correct === false ? '不正解' : '');
  const scoreFallback = inferredStatus === '正解' ? 95 : inferredStatus === '不正解' ? 45 : 74;
  const score = normalizeScore(rawResult?.score, scoreFallback);
  const status = normalizeStatus(inferredStatus, score);

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
    alternatives: sanitizeAlternatives(rawResult?.alternatives || rawResult?.alternative_expressions, correctedText),
    followUp: sanitizeFollowUp(rawResult, ''),
  };
}

function sanitizeReplyGenerationResult(rawResult, fallback) {
  const prompt = String(rawResult?.prompt || fallback.prompt || '友達からのメッセージ').trim();
  const situation = String(rawResult?.situation || fallback.situation || '').trim();
  const answer = String(rawResult?.answer || fallback.answer || '').trim();
  const hint = String(rawResult?.hint || fallback.hint || '').trim();
  const followUp = sanitizeFollowUp(rawResult, fallback.followUp);

  return {
    mode: 'reply',
    prompt,
    situation,
    answer,
    hint,
    followUp,
  };
}

function sanitizeQuestionGenerationResult(rawResult, fallback) {
  const prompt = String(rawResult?.prompt || fallback.prompt || '').trim();
  const answer = String(rawResult?.answer || fallback.answer || '').trim();
  const hint = String(rawResult?.hint || fallback.hint || '').trim();

  return {
    mode: 'translation',
    prompt,
    answer,
    hint,
  };
}

function sanitizeImageGenerationResult(rawResult, fallback) {
  const prompt = String(rawResult?.prompt || fallback.prompt || '').trim();
  const scene = String(rawResult?.scene || fallback.scene || '').trim();
  const answer = String(rawResult?.answer || fallback.answer || '').trim();
  const hint = String(rawResult?.hint || fallback.hint || '').trim();
  const imagePrompt = String(rawResult?.imagePrompt || rawResult?.image_prompt || '').trim();
  const imageUrl = String(rawResult?.imageUrl || fallback.imageUrl || '').trim();
  const targetWords = String(rawResult?.targetWords || fallback.targetWords || '').trim();
  const vocabFocus = String(rawResult?.vocabFocus || fallback.vocabFocus || '').trim();
  const grammarFocus = String(rawResult?.grammarFocus || fallback.grammarFocus || '').trim();
  const sentenceGuide = String(rawResult?.sentenceGuide || fallback.sentenceGuide || '').trim();

  return {
    mode: 'image',
    prompt,
    scene,
    answer,
    hint,
    imagePrompt,
    imageUrl,
    targetWords,
    vocabFocus,
    grammarFocus,
    sentenceGuide,
  };
}

async function generateOpenAiImageDataUri(prompt) {
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) return '';

  try {
    const basePrompt = String(prompt || 'A realistic everyday scene for Korean writing practice.').trim();
    const refinedPrompt = [
      basePrompt,
      'photorealistic, natural lighting, clear composition, medium detail',
      'no text, no letters, no watermark, no logo, no UI elements',
    ].join(', ');

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
        prompt: refinedPrompt,
        size: '1024x1024',
        quality: 'high',
        background: 'auto',
        response_format: 'b64_json',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('OpenAI image generation failed:', response.status, errorText);
      return '';
    }

    const data = await response.json();
    const b64 = data?.data?.[0]?.b64_json || '';
    return b64 ? `data:image/png;base64,${b64}` : '';
  } catch (error) {
    console.warn('OpenAI image generation request error:', error.message);
    return '';
  }
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

ensureSeedData();
loadSessionsFromDisk();
logStartupSummary();

app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripeClient) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }

  let event;
  if (STRIPE_WEBHOOK_SECRET) {
    try {
      const signature = req.headers['stripe-signature'];
      event = stripeClient.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      console.error('Stripe webhook signature verification failed:', error.message);
      return res.status(400).json({ error: 'Invalid Stripe signature' });
    }
  } else {
    try {
      event = JSON.parse(req.body.toString('utf8'));
    } catch (error) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }
  }

  if (event.type === 'customer.subscription.created') {
    const subscription = event.data?.object || {};
    const userId = String(subscription.metadata?.userId || '').trim();
    const customerId = String(subscription.customer || '').trim();
    let targetUserId = userId;

    if (!targetUserId && customerId) {
      const foundUser = findUserByStripeCustomerId(customerId);
      targetUserId = foundUser ? foundUser.id : '';
    }

    if (!targetUserId && customerId && stripeClient) {
      try {
        const customer = await stripeClient.customers.retrieve(customerId);
        const customerEmail = String(customer?.email || '').trim().toLowerCase();
        const foundUserByEmail = customerEmail ? findUserByEmail(customerEmail) : null;
        targetUserId = foundUserByEmail ? foundUserByEmail.id : '';
      } catch (error) {
        console.warn('Stripe webhook: could not resolve customer email', error.message);
      }
    }

    if (!targetUserId) {
      console.warn('Stripe webhook: no matching user for subscription.created', subscription.id || '(no subscription id)');
      return res.json({ received: true });
    }

    updateUserRecord(targetUserId, (record) => {
      record.plan = 'premium';
      record.is_premium = true;
      if (customerId) record.stripeCustomerId = customerId;
      record.stripeSubscriptionId = String(subscription.id || '').trim() || record.stripeSubscriptionId || '';
      return record;
    });
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data?.object || {};
    const userId = String(subscription.metadata?.userId || '').trim();
    const customerId = String(subscription.customer || '').trim();
    let targetUserId = userId;

    if (!targetUserId && customerId) {
      const foundUser = findUserByStripeCustomerId(customerId);
      targetUserId = foundUser ? foundUser.id : '';
    }

    if (!targetUserId && customerId && stripeClient) {
      try {
        const customer = await stripeClient.customers.retrieve(customerId);
        const customerEmail = String(customer?.email || '').trim().toLowerCase();
        const foundUserByEmail = customerEmail ? findUserByEmail(customerEmail) : null;
        targetUserId = foundUserByEmail ? foundUserByEmail.id : '';
      } catch (error) {
        console.warn('Stripe webhook: could not resolve customer email', error.message);
      }
    }

    if (!targetUserId) {
      console.warn('Stripe webhook: no matching user for subscription.deleted', subscription.id || '(no subscription id)');
      return res.json({ received: true });
    }

    updateUserRecord(targetUserId, (record) => {
      record.plan = 'free';
      record.is_premium = false;
      if (customerId) record.stripeCustomerId = customerId;
      record.stripeSubscriptionId = '';
      return record;
    });
  }

  return res.json({ received: true });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const hiddenPublicPages = new Set([
  '/blog',
  '/blog.html',
  '/what-is-korean-composition',
  '/what-is-korean-composition.html',
  '/learning-tips',
  '/learning-tips.html',
]);

app.use((req, res, next) => {
  const normalizedPath = String(req.path || '').replace(/\/+$/, '') || '/';
  if (hiddenPublicPages.has(normalizedPath)) {
    return res.redirect('/');
  }
  return next();
});

app.use(express.static(path.join(__dirname)));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
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

app.get('/api/auth/me', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.json(null);
  }
  const premiumEnabled = isPremiumUser(user);
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl || '',
    authProvider: user.authProvider || 'password',
    plan: premiumEnabled ? 'premium' : (user.plan || 'free'),
    is_premium: premiumEnabled,
    premiumEnabled,
    premiumMemoryCount: Array.isArray(user.premiumMemories) ? user.premiumMemories.length : 0,
  });
});

app.get('/api/auth/google/config', (_req, res) => {
  const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  res.json({
    enabled: Boolean(clientId),
    clientId,
  });
});

app.get('/api/grammar/list', (_req, res) => {
  res.json(grammarMasterList);
});

app.post('/api/stripe/create-checkout-session', async (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }
  if (isPremiumUser(user)) {
    return res.status(400).json({ error: 'すでにプレミアムプランです' });
  }

  // If a hosted Payment Link is configured, use it first.
  if (STRIPE_PAYMENT_LINK_URL) {
    const separator = STRIPE_PAYMENT_LINK_URL.includes('?') ? '&' : '?';
    const prefilled = `${separator}prefilled_email=${encodeURIComponent(user.email)}&client_reference_id=${encodeURIComponent(user.id)}`;
    return res.json({
      url: `${STRIPE_PAYMENT_LINK_URL}${prefilled}`,
      via: 'payment_link',
    });
  }

  if (!stripeClient || !STRIPE_PRICE_ID) {
    return res.status(503).json({ error: 'Stripe課金設定が未完了です' });
  }

  const baseUrl = getBaseUrl(req);
  const successUrl = STRIPE_SUCCESS_URL || `${baseUrl}/?checkout=success`;
  const cancelUrl = STRIPE_CANCEL_URL || `${baseUrl}/?checkout=cancel`;

  try {
    const session = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: {
        userId: user.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    });

    return res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Failed to create Stripe checkout session:', error.message);
    return res.status(500).json({ error: '決済ページの作成に失敗しました' });
  }
});

app.post('/api/auth/register', (req, res) => {
  return res.status(403).json({ error: 'ユーザー登録はGoogleログインをご利用ください' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const users = normalizePasswordStorage(readJson(USERS_FILE, []));
  const user = users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase() && verifyPassword(password, candidate.password));
  if (!user) {
    appendUserAuditLog({
      action: 'auth_login',
      status: 'failed',
      actor: { email: maskEmail(email), authProvider: 'password' },
      details: { reason: 'invalid_credentials' },
      request: getRequestAuditMeta(req),
    });
    return res.status(401).json({ error: 'メールアドレスまたはパスワードが違います' });
  }

  // Keep password login for admin route only; regular users should use Google login.
  if (user.role !== 'admin') {
    appendUserAuditLog({
      action: 'auth_login',
      status: 'blocked',
      actor: { userId: user.id, email: maskEmail(user.email), role: user.role, authProvider: 'password' },
      details: { reason: 'non_admin_password_login' },
      request: getRequestAuditMeta(req),
    });
    return res.status(403).json({ error: '通常ユーザーはGoogleログインをご利用ください' });
  }

  const sessionId = setSession(res, user);
  appendUserAuditLog({
    action: 'auth_login',
    status: 'success',
    actor: { userId: user.id, email: maskEmail(user.email), role: user.role, authProvider: 'password' },
    details: { sessionIdSuffix: sessionId.slice(-8) },
    request: getRequestAuditMeta(req),
  });
  const premiumEnabled = isPremiumUser(user);
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl || '',
    authProvider: user.authProvider || 'password',
    plan: premiumEnabled ? 'premium' : (user.plan || 'free'),
    is_premium: premiumEnabled,
    premiumEnabled,
  });
});

app.post('/api/auth/google', async (req, res) => {
  const credential = String(req.body?.credential || '').trim();
  if (!credential) {
    return res.status(400).json({ error: 'Google認証情報がありません' });
  }

  const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim();
  if (!clientId) {
    appendUserAuditLog({
      action: 'auth_google',
      status: 'blocked',
      details: { reason: 'google_client_id_not_configured' },
      request: getRequestAuditMeta(req),
    });
    return res.status(503).json({ error: 'Googleログインは未設定です' });
  }

  const verification = await verifyGoogleIdToken(credential);
  if (!verification.ok) {
    appendUserAuditLog({
      action: 'auth_google',
      status: 'failed',
      details: { reason: verification.error || 'google_verification_failed' },
      request: getRequestAuditMeta(req),
    });
    return res.status(401).json({ error: verification.error || 'Googleログインに失敗しました' });
  }

  const { sub, email, name, picture } = verification.profile;
  const users = normalizePasswordStorage(readJson(USERS_FILE, []));
  const normalizedEmail = String(email).trim().toLowerCase();

  let user = users.find((candidate) => String(candidate.googleSub || '') === sub)
    || users.find((candidate) => String(candidate.email || '').toLowerCase() === normalizedEmail)
    || null;

  if (user && user.role === 'admin' && String(user.googleSub || '') !== sub) {
    return res.status(403).json({ error: '管理者アカウントへのGoogle連携は許可されていません' });
  }

  const isNewUser = !user;
  if (!user) {
    user = {
      id: buildUniqueUserId(users, name || normalizedEmail.split('@')[0], `user-${Date.now()}`),
      name,
      email: normalizedEmail,
      password: hashPassword(crypto.randomBytes(16).toString('hex')),
      role: 'user',
      plan: PREMIUM_ACCESS_EMAILS.has(normalizedEmail) ? 'premium' : 'free',
      progress: { attempted: 0, correct: 0, streak: 0, reviewQueue: [] },
      authProvider: 'google',
      googleSub: sub,
      avatarUrl: picture || '',
      premiumMemories: [],
    };
    users.push(user);
  } else {
    user.name = name || user.name;
    user.email = normalizedEmail;
    user.googleSub = sub;
    user.avatarUrl = picture || user.avatarUrl || '';
    user.authProvider = 'google';
    if (!user.progress) {
      user.progress = { attempted: 0, correct: 0, streak: 0, reviewQueue: [] };
    }
    if (!user.plan) {
      user.plan = PREMIUM_ACCESS_EMAILS.has(normalizedEmail) ? 'premium' : 'free';
    }
    if (!Array.isArray(user.premiumMemories)) {
      user.premiumMemories = [];
    }
  }

  saveUsers(users.map(normalizeUserRecord));
  const sessionId = setSession(res, user);
  appendUserAuditLog({
    action: 'auth_google',
    status: 'success',
    actor: { userId: user.id, email: maskEmail(user.email), role: user.role, authProvider: 'google' },
    details: { isNewUser, sessionIdSuffix: sessionId.slice(-8) },
    request: getRequestAuditMeta(req),
  });
  const premiumEnabled = isPremiumUser(user);
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl || '',
    authProvider: 'google',
    plan: premiumEnabled ? 'premium' : (user.plan || 'free'),
    is_premium: premiumEnabled,
    premiumEnabled,
  });
});

app.post('/api/auth/logout', (req, res) => {
  const user = getSessionUser(req);
  clearSession(req, res);
  appendUserAuditLog({
    action: 'auth_logout',
    status: 'success',
    actor: {
      userId: String(user?.id || '').trim(),
      email: maskEmail(user?.email || ''),
      role: String(user?.role || '').trim(),
      authProvider: String(user?.authProvider || '').trim(),
    },
    request: getRequestAuditMeta(req),
  });
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
  const currentUser = updateUserRecord(user.id, (record) => {
    record.progress = normalizeProgress(req.body || { attempted: 0, correct: 0, streak: 0, reviewQueue: [] });
    return record;
  });
  if (!currentUser) {
    return res.status(404).json({ error: 'ユーザーが見つかりません' });
  }
  appendUserAuditLog({
    action: 'progress_update',
    status: 'success',
    actor: {
      userId: currentUser.id,
      email: maskEmail(currentUser.email || ''),
      role: currentUser.role,
      authProvider: currentUser.authProvider || 'password',
    },
    details: {
      attempted: Number(currentUser.progress?.attempted) || 0,
      correct: Number(currentUser.progress?.correct) || 0,
      streak: Number(currentUser.progress?.streak) || 0,
      reviewQueueSize: Array.isArray(currentUser.progress?.reviewQueue) ? currentUser.progress.reviewQueue.length : 0,
    },
    request: getRequestAuditMeta(req),
  });
  res.json(currentUser.progress);
});

app.post('/api/generate-question', async (req, res) => {
  const {
    level = 'beginner',
    style = 'short',
    mode = 'grammar',
    previousFollowUp = '',
    grammarId = '',
  } = req.body;
  const practiceMode = getPracticeMode(mode);
  const selectedGrammar = getGrammarById(grammarId) || grammarMasterList[0].items[0];
  const provider = getProvider();
  const hasRequiredKey = Boolean(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY);

  if (!hasRequiredKey) {
    console.warn('No AI API key found. Returning random built-in fallback question.');
    if (practiceMode === 'grammar') {
      return res.json({ mode: 'grammar', ...getFallbackGrammarQuestion(selectedGrammar.id) });
    }
    if (practiceMode === 'reply') {
      return res.json(sanitizeReplyGenerationResult(null, getFallbackReplyPrompt(level, previousFollowUp)));
    }
    if (practiceMode === 'image') {
      const fallback = getFallbackImageQuestion(level);
      return res.json({
        ...sanitizeImageGenerationResult(null, fallback),
        imageUrl: buildSceneSvgDataUri(fallback.scene || 'realistic daily scene'),
      });
    }
    return res.json(sanitizeQuestionGenerationResult(null, getFallbackQuestion(level)));
  }

  try {
    const prompts = practiceMode === 'grammar'
      ? buildGrammarGenerationPrompts(selectedGrammar, level)
      : practiceMode === 'reply'
      ? buildReplyGenerationPrompts(level, previousFollowUp)
      : practiceMode === 'image'
        ? buildImageGenerationPrompts(level)
        : buildQuestionGenerationPrompts(level, style);
    const result = await askAi({
      provider,
      systemPrompt: prompts.systemPrompt,
      userPrompt: prompts.userPrompt,
      temperature: 0.2,
    });

    if (result) {
      if (practiceMode === 'grammar') {
        const fallback = getFallbackGrammarQuestion(selectedGrammar.id);
        return res.json({
          mode: 'grammar',
          japanese_question: String(result?.japanese_question || fallback.japanese_question).trim(),
          target_grammar: String(result?.target_grammar || selectedGrammar.grammar || fallback.target_grammar).trim(),
          model_answer: String(result?.model_answer || fallback.model_answer).trim(),
          hint: String(result?.hint || fallback.hint).trim(),
          grammar_id: selectedGrammar.id,
        });
      }
      if (practiceMode === 'reply') {
        return res.json(sanitizeReplyGenerationResult(result, getFallbackReplyPrompt(level, previousFollowUp)));
      }

      if (practiceMode === 'image') {
        const fallback = getFallbackImageQuestion(level);
        const sanitized = sanitizeImageGenerationResult(result, fallback);
        const preferredImagePrompt = sanitized.imagePrompt || `A clean illustration of: ${sanitized.scene || fallback.scene}`;
        const generatedImageUrl = await generateOpenAiImageDataUri(preferredImagePrompt);
        return res.json({
          ...sanitized,
          imageUrl: generatedImageUrl || sanitized.imageUrl || fallback.imageUrl || buildSceneSvgDataUri(sanitized.scene || fallback.scene),
        });
      }

      return res.json(sanitizeQuestionGenerationResult(result, getFallbackQuestion(level)));
    }

    if (practiceMode === 'grammar') {
      return res.json({ mode: 'grammar', ...getFallbackGrammarQuestion(selectedGrammar.id) });
    }
    if (practiceMode === 'reply') {
      return res.json(sanitizeReplyGenerationResult(null, getFallbackReplyPrompt(level, previousFollowUp)));
    }
    if (practiceMode === 'image') {
      const fallback = getFallbackImageQuestion(level);
      return res.json({
        ...sanitizeImageGenerationResult(null, fallback),
        imageUrl: buildSceneSvgDataUri(fallback.scene || 'realistic daily scene'),
      });
    }
    return res.json(sanitizeQuestionGenerationResult(null, getFallbackQuestion(level)));
  } catch (error) {
    console.error(`${provider} generation failed:`, error.message);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

app.post('/api/score-answer', async (req, res) => {
  const {
    prompt,
    situation = '',
    modelAnswer,
    userAnswer,
    level = 'beginner',
    mode = 'grammar',
    targetGrammar = '',
    grammarId = '',
  } = req.body;
  const practiceMode = getPracticeMode(mode);
  const selectedGrammar = getGrammarById(grammarId);
  const provider = getProvider();
  const hasRequiredKey = Boolean(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY);

  if (!hasRequiredKey) {
    console.warn('No AI API key found. Returning built-in fallback scoring.');
    if (practiceMode === 'grammar') {
      const grammarSource = selectedGrammar?.grammar || String(targetGrammar || '').trim();
      const grammarUsed = selectedGrammar
        ? detectGrammarUsage(selectedGrammar, userAnswer)
        : Boolean(String(userAnswer || '').trim());
      return res.json({
        status: grammarUsed ? '惜しい' : '不正解',
        score: grammarUsed ? 76 : 52,
        feedback: grammarUsed ? '文法は使えています。意味の自然さをもう一段整えましょう。' : '指定文法の使用が確認できませんでした。',
        explanation: '語順・助詞・語尾を調整すると、より自然な作文になります。',
        correctedText: modelAnswer,
        alternatives: [modelAnswer],
        grammarUsed,
        grammarFeedback: grammarUsed
          ? `指定文法(${grammarSource})は確認できました。`
          : `指定文法(${grammarSource})を明示的に使ってみましょう。`,
      });
    }
    const fallbackFollowUp = practiceMode === 'reply' ? '친구: 고마워! 조금 있다가 다시 이야기하자.' : '';
    return res.json({
      status: '惜しい',
      score: 74,
      feedback: '自然な表現に近づいています。分かち書きと助詞を確認してください。',
      explanation: 'この文では、助詞や語尾の選び方がポイントです。',
      correctedText: modelAnswer,
      alternatives: ['自然な韓国語ならこの形が近いです', '別解: もう少し柔らかい表現も可能です'],
      followUp: fallbackFollowUp,
    });
  }

  try {
    const prompts = practiceMode === 'grammar'
      ? buildGrammarScoringPrompts({ prompt, modelAnswer, userAnswer, level, targetGrammar })
      : practiceMode === 'reply'
      ? buildReplyScoringPrompts({ prompt, situation, modelAnswer, userAnswer, level })
      : practiceMode === 'image'
        ? buildImageScoringPrompts({ prompt, situation, modelAnswer, userAnswer, level })
        : buildScoringPrompts({ prompt, modelAnswer, userAnswer, level });
    const result = await askAi({
      provider,
      systemPrompt: prompts.systemPrompt,
      userPrompt: prompts.userPrompt,
      temperature: 0.2,
    });

    if (result) {
      if (practiceMode === 'grammar') {
        const base = sanitizeScoringResult(result, modelAnswer);
        const grammarUsed = typeof result?.grammarUsed === 'boolean'
          ? result.grammarUsed
          : (selectedGrammar ? detectGrammarUsage(selectedGrammar, userAnswer) : false);
        const grammarFeedback = String(result?.grammarFeedback || '').trim()
          || (grammarUsed
            ? '指定文法の使用は確認できました。'
            : '指定文法の使用が確認できませんでした。');
        if (!grammarUsed && base.status === '正解') {
          base.status = '惜しい';
          base.score = Math.min(base.score, 84);
        }
        return res.json({ ...base, grammarUsed, grammarFeedback });
      }
      if (practiceMode === 'reply') {
        const fallback = getFallbackReplyPrompt(level);
        return res.json({
          ...sanitizeScoringResult(result, modelAnswer),
          followUp: sanitizeFollowUp(result, fallback.followUp),
        });
      }
      return res.json(sanitizeScoringResult(result, modelAnswer));
    }

    const fallbackReply = practiceMode === 'reply' ? getFallbackReplyPrompt(level) : null;
    if (practiceMode === 'grammar') {
      const grammarUsed = selectedGrammar ? detectGrammarUsage(selectedGrammar, userAnswer) : false;
      return res.json({
        status: grammarUsed ? '惜しい' : '不正解',
        score: grammarUsed ? 74 : 50,
        feedback: grammarUsed ? '文法は使えています。意味の自然さを調整しましょう。' : '指定文法を使う形に修正しましょう。',
        explanation: '語彙よりも、まず指定文法の型を安定させると伸びます。',
        correctedText: modelAnswer,
        alternatives: [modelAnswer],
        grammarUsed,
        grammarFeedback: grammarUsed ? '指定文法の使用は確認できました。' : '指定文法の使用が確認できませんでした。',
      });
    }
    return res.json({
      status: '惜しい',
      score: 74,
      feedback: '自然な表現に近づいています。分かち書きと助詞を確認してください。',
      explanation: 'この文では、助詞や語尾の選び方がポイントです。',
      correctedText: modelAnswer,
      alternatives: ['自然な韓国語ならこの形が近いです', '別解: もう少し柔らかい表現も可能です'],
      followUp: fallbackReply ? fallbackReply.followUp : '',
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
  const user = getSessionUser(req);
  const inputName = String(req.body?.name || '').trim().slice(0, 24);
  const comment = String(req.body?.comment || '').trim();

  if (!comment) {
    return res.status(400).json({ error: 'コメントを入力してください' });
  }

  if (comment.length > 280) {
    return res.status(400).json({ error: 'コメントは280文字以内で入力してください' });
  }

  const accountName = String(user?.name || '').trim().slice(0, 24);
  const displayName = inputName || accountName || '匿名';
  const feedback = readJson(FEEDBACK_FILE, []);
  const safeFeedback = Array.isArray(feedback) ? feedback : [];
  const newItem = {
    id: `feedback-${Date.now()}`,
    name: displayName,
    userId: user ? user.id : '',
    userEmail: user ? user.email : '',
    authProvider: user ? (user.authProvider || 'password') : 'guest',
    comment,
    createdAt: new Date().toISOString(),
  };

  safeFeedback.unshift(newItem);
  const savedFeedback = FEEDBACK_MAX_ITEMS > 0
    ? safeFeedback.slice(0, FEEDBACK_MAX_ITEMS)
    : safeFeedback;
  writeJson(FEEDBACK_FILE, savedFeedback);
  appendUserAuditLog({
    action: 'feedback_create',
    status: 'success',
    actor: {
      userId: String(newItem.userId || '').trim(),
      email: maskEmail(newItem.userEmail || ''),
      role: String(user?.role || '').trim(),
      authProvider: String(newItem.authProvider || 'guest').trim(),
    },
    target: { feedbackId: newItem.id },
    details: { commentLength: comment.length },
    request: getRequestAuditMeta(req),
  });
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
  const user = getSessionUser(req);
  const inputAuthor = String(req.body?.author || '').trim().slice(0, 24);
  const accountName = String(user?.name || '').trim().slice(0, 24);
  const displayAuthor = inputAuthor || accountName || '匿名';
  const posts = readJson(POSTS_FILE, []);
  const post = posts.find((item) => item.id === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }
  const newComment = {
    id: `comment-${Date.now()}`,
    author: displayAuthor,
    userId: user ? user.id : '',
    userEmail: user ? user.email : '',
    authProvider: user ? (user.authProvider || 'password') : 'guest',
    comment: req.body.comment || '',
    createdAt: new Date().toISOString(),
  };
  post.comments.push(newComment);
  savePosts(posts);
  appendUserAuditLog({
    action: 'blog_comment_create',
    status: 'success',
    actor: {
      userId: String(newComment.userId || '').trim(),
      email: maskEmail(newComment.userEmail || ''),
      role: String(user?.role || '').trim(),
      authProvider: String(newComment.authProvider || 'guest').trim(),
    },
    target: { postId: post.id, commentId: newComment.id },
    details: { commentLength: String(newComment.comment || '').length },
    request: getRequestAuditMeta(req),
  });
  res.json(post);
});

app.get('/api/premium/memories', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }
  if (!isPremiumUser(user)) {
    return res.status(403).json({ error: 'プレミアム機能をご利用いただけません' });
  }
  res.json(Array.isArray(user.premiumMemories) ? user.premiumMemories : []);
});

app.get('/api/premium/memories/review-queue', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }
  if (!isPremiumUser(user)) {
    return res.status(403).json({ error: 'プレミアム機能をご利用いただけません' });
  }

  const limit = Math.max(1, Math.min(50, Number(req.query?.limit) || 10));
  const source = Array.isArray(user.premiumMemories) ? user.premiumMemories : [];
  const nowMs = Date.now();
  const queue = source
    .map((item) => {
      const card = normalizePremiumMemory(item);
      if (!card) return null;
      const priority = buildPremiumReviewPriority(card, nowMs);
      return {
        ...card,
        reviewPriority: priority.priority,
        overdueDays: priority.overdueDays,
        remainingRepeats: priority.remainingRepeats,
        isDue: priority.isDue,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (Number(b.isDue) !== Number(a.isDue)) return Number(b.isDue) - Number(a.isDue);
      if (b.reviewPriority !== a.reviewPriority) return b.reviewPriority - a.reviewPriority;
      const aDue = new Date(a.nextReviewAt || 0).getTime() || Number.MAX_SAFE_INTEGER;
      const bDue = new Date(b.nextReviewAt || 0).getTime() || Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    })
    .slice(0, limit);

  return res.json(queue);
});

app.post('/api/premium/memories', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }
  if (!isPremiumUser(user)) {
    return res.status(403).json({ error: 'プレミアム機能をご利用いただけません' });
  }

  const text = String(req.body?.text || '').trim();
  const title = String(req.body?.title || '').trim();
  const note = String(req.body?.note || '').trim();
  const tone = String(req.body?.tone || 'free').trim();
  const tags = Array.isArray(req.body?.tags) ? req.body.tags : String(req.body?.tags || '').split(',');
  const targetRepeats = Math.max(1, Math.min(20, Number(req.body?.targetRepeats) || 3));
  const sourceType = String(req.body?.sourceType || '').trim();
  const sourceKey = String(req.body?.sourceKey || '').trim();
  const sourceDateKey = String(req.body?.sourceDateKey || '').trim();
  if (!text) {
    return res.status(400).json({ error: '保存する文章を入力してください' });
  }

  const savedMemory = updateUserRecord(user.id, (record) => {
    const memories = Array.isArray(record.premiumMemories) ? record.premiumMemories : [];
    const nowIso = new Date().toISOString();

    if (sourceType === 'grammar-mistake' && sourceKey && sourceDateKey) {
      const duplicate = memories.find((item) => (
        String(item.sourceType || '').trim() === 'grammar-mistake'
        && String(item.sourceKey || '').trim() === sourceKey
        && String(item.sourceDateKey || '').trim() === sourceDateKey
      ));

      if (duplicate) {
        duplicate.title = title ? title.slice(0, 80) : duplicate.title;
        duplicate.text = text.slice(0, 280);
        duplicate.note = note ? note.slice(0, 220) : duplicate.note;
        duplicate.tone = ['daily', 'business', 'exam', 'free'].includes(tone) ? tone : duplicate.tone;
        duplicate.targetRepeats = targetRepeats;
        const mergedTags = [...(Array.isArray(duplicate.tags) ? duplicate.tags : []), ...tags]
          .map((tag) => String(tag).trim().slice(0, 24))
          .filter(Boolean);
        duplicate.tags = Array.from(new Set(mergedTags)).slice(0, 8);
        duplicate.updatedAt = nowIso;
        record.premiumMemories = memories.slice(0, 100);
        return record;
      }
    }

    const newItem = normalizePremiumMemory({
      id: `memory-${Date.now()}`,
      title,
      text,
      note,
      tags,
      tone,
      isFavorite: false,
      targetRepeats,
      reviewCount: 0,
      reviewHistory: [],
      achievedAt: '',
      sourceType,
      sourceKey,
      sourceDateKey,
      nextReviewAt: computeNextPremiumReviewAt(0),
      lastReviewedAt: '',
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    if (!newItem) {
      return record;
    }
    memories.unshift(newItem);
    record.premiumMemories = memories.slice(0, 100);
    return record;
  });

  if (!savedMemory) {
    return res.status(404).json({ error: 'ユーザーが見つかりません' });
  }

  appendUserAuditLog({
    action: 'premium_memory_upsert',
    status: 'success',
    actor: {
      userId: savedMemory.id,
      email: maskEmail(savedMemory.email || ''),
      role: savedMemory.role,
      authProvider: savedMemory.authProvider || 'password',
    },
    details: {
      sourceType: sourceType.slice(0, 32),
      memoryCount: Array.isArray(savedMemory.premiumMemories) ? savedMemory.premiumMemories.length : 0,
      textLength: text.length,
    },
    request: getRequestAuditMeta(req),
  });

  res.status(201).json(savedMemory.premiumMemories || []);
});

app.patch('/api/premium/memories/:id', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }
  if (!isPremiumUser(user)) {
    return res.status(403).json({ error: 'プレミアム機能をご利用いただけません' });
  }

  const memoryId = String(req.params.id || '').trim();
  if (typeof req.body?.text === 'string' && !String(req.body.text || '').trim()) {
    return res.status(400).json({ error: '文章を入力してください' });
  }
  const updatedUser = updateUserRecord(user.id, (record) => {
    const memories = Array.isArray(record.premiumMemories) ? record.premiumMemories : [];
    const target = memories.find((item) => item.id === memoryId);
    if (!target) {
      return record;
    }

    if (typeof req.body?.title === 'string') {
      target.title = String(req.body.title || '').trim().slice(0, 80);
    }
    if (typeof req.body?.text === 'string') {
      const text = String(req.body.text || '').trim();
      target.text = text.slice(0, 280);
    }
    if (typeof req.body?.note === 'string') {
      target.note = String(req.body.note || '').trim().slice(0, 220);
    }
    if (typeof req.body?.tone === 'string') {
      const tone = String(req.body.tone || '').trim();
      target.tone = ['daily', 'business', 'exam', 'free'].includes(tone) ? tone : 'free';
    }
    if (typeof req.body?.targetRepeats !== 'undefined') {
      target.targetRepeats = Math.max(1, Math.min(20, Number(req.body.targetRepeats) || target.targetRepeats || 3));
      if ((Number(target.reviewCount) || 0) < target.targetRepeats) {
        target.achievedAt = '';
      } else if (!target.achievedAt) {
        target.achievedAt = new Date().toISOString();
      }
    }
    if (typeof req.body?.isFavorite === 'boolean') {
      target.isFavorite = req.body.isFavorite;
    }
    if (typeof req.body?.tags !== 'undefined') {
      const tags = Array.isArray(req.body.tags) ? req.body.tags : String(req.body.tags || '').split(',');
      target.tags = tags
        .map((tag) => String(tag).trim().slice(0, 24))
        .filter(Boolean)
        .slice(0, 8);
    }

    target.updatedAt = new Date().toISOString();
    return record;
  });

  if (!updatedUser) {
    return res.status(404).json({ error: 'メモが見つかりません' });
  }

  appendUserAuditLog({
    action: 'premium_memory_update',
    status: 'success',
    actor: {
      userId: updatedUser.id,
      email: maskEmail(updatedUser.email || ''),
      role: updatedUser.role,
      authProvider: updatedUser.authProvider || 'password',
    },
    target: { memoryId },
    details: { memoryCount: Array.isArray(updatedUser.premiumMemories) ? updatedUser.premiumMemories.length : 0 },
    request: getRequestAuditMeta(req),
  });

  res.json(updatedUser.premiumMemories || []);
});

app.post('/api/premium/memories/:id/review', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }
  if (!isPremiumUser(user)) {
    return res.status(403).json({ error: 'プレミアム機能をご利用いただけません' });
  }

  const memoryId = String(req.params.id || '').trim();
  const updatedUser = updateUserRecord(user.id, (record) => {
    const memories = Array.isArray(record.premiumMemories) ? record.premiumMemories : [];
    const target = memories.find((item) => item.id === memoryId);
    if (!target) {
      return record;
    }
    target.reviewCount = Math.max(0, Number(target.reviewCount) || 0) + 1;
    const nowIso = new Date().toISOString();
    const history = Array.isArray(target.reviewHistory) ? target.reviewHistory : [];
    history.push(nowIso);
    target.reviewHistory = history.slice(-120);
    target.lastReviewedAt = nowIso;
    if (target.reviewCount >= (Number(target.targetRepeats) || 3) && !target.achievedAt) {
      target.achievedAt = nowIso;
    }
    target.nextReviewAt = computeNextPremiumReviewAt(target.reviewCount);
    target.updatedAt = nowIso;
    return record;
  });

  if (!updatedUser) {
    return res.status(404).json({ error: 'メモが見つかりません' });
  }

  appendUserAuditLog({
    action: 'premium_memory_review',
    status: 'success',
    actor: {
      userId: updatedUser.id,
      email: maskEmail(updatedUser.email || ''),
      role: updatedUser.role,
      authProvider: updatedUser.authProvider || 'password',
    },
    target: { memoryId },
    details: { memoryCount: Array.isArray(updatedUser.premiumMemories) ? updatedUser.premiumMemories.length : 0 },
    request: getRequestAuditMeta(req),
  });

  res.json(updatedUser.premiumMemories || []);
});

app.delete('/api/premium/memories/:id', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'ログインが必要です' });
  }
  if (!isPremiumUser(user)) {
    return res.status(403).json({ error: 'プレミアム機能をご利用いただけません' });
  }

  const memoryId = String(req.params.id || '').trim();
  const updatedUser = updateUserRecord(user.id, (record) => {
    const memories = Array.isArray(record.premiumMemories) ? record.premiumMemories : [];
    record.premiumMemories = memories.filter((item) => item.id !== memoryId);
    return record;
  });

  if (!updatedUser) {
    return res.status(404).json({ error: 'メモが見つかりません' });
  }

  appendUserAuditLog({
    action: 'premium_memory_delete',
    status: 'success',
    actor: {
      userId: updatedUser.id,
      email: maskEmail(updatedUser.email || ''),
      role: updatedUser.role,
      authProvider: updatedUser.authProvider || 'password',
    },
    target: { memoryId },
    details: { memoryCount: Array.isArray(updatedUser.premiumMemories) ? updatedUser.premiumMemories.length : 0 },
    request: getRequestAuditMeta(req),
  });

  res.json(updatedUser.premiumMemories || []);
});

app.get('/api/admin/users', (req, res) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: '管理者のみ閲覧できます' });
  }
  const users = normalizePasswordStorage(readJson(USERS_FILE, [])).map(normalizeUserRecord);
  res.json(users.map((item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    role: item.role,
    plan: item.plan || 'free',
    premiumEnabled: isPremiumUser(item),
    progress: item.progress || { attempted: 0, correct: 0, streak: 0, reviewQueue: [] },
    premiumMemoryCount: Array.isArray(item.premiumMemories) ? item.premiumMemories.length : 0,
  })));
});

app.patch('/api/admin/users/:id/plan', (req, res) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: '管理者のみ変更できます' });
  }

  const targetPlan = String(req.body?.plan || '').trim().toLowerCase();
  if (!['free', 'premium'].includes(targetPlan)) {
    return res.status(400).json({ error: 'plan は free または premium を指定してください' });
  }

  const targetId = String(req.params.id || '').trim();
  const updatedUser = updateUserRecord(targetId, (record) => {
    record.plan = targetPlan;
    record.is_premium = targetPlan === 'premium';
    if (!Array.isArray(record.premiumMemories)) {
      record.premiumMemories = [];
    }
    return record;
  });

  if (!updatedUser) {
    return res.status(404).json({ error: 'ユーザーが見つかりません' });
  }

  appendUserAuditLog({
    action: 'admin_plan_update',
    status: 'success',
    actor: {
      userId: user.id,
      email: maskEmail(user.email || ''),
      role: user.role,
      authProvider: user.authProvider || 'password',
    },
    target: { userId: updatedUser.id },
    details: { plan: updatedUser.plan || 'free' },
    request: getRequestAuditMeta(req),
  });

  res.json({
    id: updatedUser.id,
    plan: updatedUser.plan || 'free',
    premiumEnabled: isPremiumUser(updatedUser),
  });
});

app.get('/api/admin/config-status', (req, res) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: '管理者のみ閲覧できます' });
  }

  const status = getDeploymentConfigStatus();
  const dataDirWritable = (() => {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const probePath = path.join(DATA_DIR, `.probe-${Date.now()}-${process.pid}.tmp`);
      fs.writeFileSync(probePath, 'ok', 'utf8');
      fs.unlinkSync(probePath);
      return true;
    } catch (_error) {
      return false;
    }
  })();

  return res.json({
    ...status,
    dataDir: DATA_DIR,
    dataDirWritable,
    auditLogFile: USER_AUDIT_LOG_FILE,
    auditLogConfigured: true,
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Korean-Sakubun server running on http://localhost:${PORT}`);
    console.log(`Ready to receive requests on port ${PORT}`);
  });
}

module.exports = {
  app,
  buildReplyGenerationPrompts,
  buildReplyScoringPrompts,
  getFallbackReplyPrompt,
  buildQuestionGenerationPrompts,
  buildScoringPrompts,
  validateRegistrationInput,
};

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error.message);
  console.error(error.stack || 'No stack trace');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
