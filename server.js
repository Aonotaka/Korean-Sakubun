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

function getPracticeMode(value) {
  return String(value || 'translation') === 'reply' ? 'reply' : 'translation';
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
  const { level = 'beginner', style = 'short', mode = 'translation', previousFollowUp = '' } = req.body;
  const practiceMode = getPracticeMode(mode);
  const provider = getProvider();
  const hasRequiredKey = Boolean(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY);

  if (!hasRequiredKey) {
    console.warn('No AI API key found. Returning random built-in fallback question.');
    return res.json(practiceMode === 'reply' ? sanitizeReplyGenerationResult(null, getFallbackReplyPrompt(level, previousFollowUp)) : sanitizeQuestionGenerationResult(null, getFallbackQuestion(level)));
  }

  try {
    const prompts = practiceMode === 'reply'
      ? buildReplyGenerationPrompts(level, previousFollowUp)
      : buildQuestionGenerationPrompts(level, style);
    const result = await askAi({
      provider,
      systemPrompt: prompts.systemPrompt,
      userPrompt: prompts.userPrompt,
      temperature: 0.2,
    });

    if (result) {
      return res.json(practiceMode === 'reply'
        ? sanitizeReplyGenerationResult(result, getFallbackReplyPrompt(level, previousFollowUp))
        : sanitizeQuestionGenerationResult(result, getFallbackQuestion(level)));
    }

    return res.json(practiceMode === 'reply' ? sanitizeReplyGenerationResult(null, getFallbackReplyPrompt(level, previousFollowUp)) : sanitizeQuestionGenerationResult(null, getFallbackQuestion(level)));
  } catch (error) {
    console.error(`${provider} generation failed:`, error.message);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

app.post('/api/score-answer', async (req, res) => {
  const { prompt, situation = '', modelAnswer, userAnswer, level = 'beginner', mode = 'translation' } = req.body;
  const practiceMode = getPracticeMode(mode);
  const provider = getProvider();
  const hasRequiredKey = Boolean(process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY);

  if (!hasRequiredKey) {
    console.warn('No AI API key found. Returning built-in fallback scoring.');
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
    const prompts = practiceMode === 'reply'
      ? buildReplyScoringPrompts({ prompt, situation, modelAnswer, userAnswer, level })
      : buildScoringPrompts({ prompt, modelAnswer, userAnswer, level });
    const result = await askAi({
      provider,
      systemPrompt: prompts.systemPrompt,
      userPrompt: prompts.userPrompt,
      temperature: 0.2,
    });

    if (result) {
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
