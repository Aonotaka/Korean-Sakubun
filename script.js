const levelSelect = document.getElementById('levelSelect');
const questionCountSelect = document.getElementById('questionCountSelect');
const startBtn = document.getElementById('startBtn');
const generateBtn = document.getElementById('generateBtn');
const promptText = document.getElementById('promptText');
const answerInput = document.getElementById('answerInput');
const submitBtn = document.getElementById('submitBtn');
const hintBtn = document.getElementById('hintBtn');
const hintBox = document.getElementById('hintBox');
const feedbackBox = document.getElementById('feedbackBox');
const feedbackStatus = document.getElementById('feedbackStatus');
const feedbackText = document.getElementById('feedbackText');
const feedbackExplanation = document.getElementById('feedbackExplanation');
const alternatives = document.getElementById('alternatives');
const nextBtn = document.getElementById('nextBtn');
const speakBtn = document.getElementById('speakBtn');
const progressBadge = document.getElementById('progressBadge');
const levelBadge = document.getElementById('levelBadge');
const sessionStatus = document.getElementById('sessionStatus');
const ttsModeSelect = document.getElementById('ttsModeSelect');
const ttsStatus = document.getElementById('ttsStatus');
const attemptCount = document.getElementById('attemptCount');
const statusPill = document.createElement('span');
const correctCount = document.getElementById('correctCount');
const streakCount = document.getElementById('streakCount');
const todaySolvedCount = document.getElementById('todaySolvedCount');
const todayCorrectCount = document.getElementById('todayCorrectCount');
const todayAccuracy = document.getElementById('todayAccuracy');
const learningStreakDays = document.getElementById('learningStreakDays');
const dailyChart = document.getElementById('dailyChart');
const weaknessTags = document.getElementById('weaknessTags');
const reviewBtn = document.getElementById('reviewBtn');
const reviewList = document.getElementById('reviewList');
const registerForm = document.getElementById('registerForm');
const authStatus = document.getElementById('authStatus');
const modelAnswerBox = document.getElementById('modelAnswerBox');
const shareBtn = document.getElementById('shareBtn');
const registerNameInput = document.getElementById('registerName');
const registerEmailInput = document.getElementById('registerEmail');
const registerUserIdInput = document.getElementById('registerUserId');
const registerPasswordInput = document.getElementById('registerPassword');
const firstQuestionGuide = document.getElementById('firstQuestionGuide');
const sessionResultBox = document.getElementById('sessionResultBox');
const sessionResultText = document.getElementById('sessionResultText');
const retryWrongBtn = document.getElementById('retryWrongBtn');
const restartSessionBtn = document.getElementById('restartSessionBtn');
const feedbackForm = document.getElementById('feedbackForm');
const feedbackNameInput = document.getElementById('feedbackName');
const feedbackCommentInput = document.getElementById('feedbackComment');
const feedbackSubmitStatus = document.getElementById('feedbackSubmitStatus');
const feedbackList = document.getElementById('feedbackList');

let koreanVoice = null;
let koreanVoices = [];
let cloudTtsAvailable = false;
let ttsMode = 'browser';
let currentCloudAudio = null;
let externalTtsProvider = 'auto';
const ttsModeStorageKey = 'korean-sakubun-tts-mode';

function buildBankFromSeed(seed, count) {
  const bank = [];
  for (let i = 0; i < count; i += 1) {
    bank.push({ ...seed[i % seed.length] });
  }
  return bank;
}

const beginnerSeed = [
  { prompt: '私は日本から来ました。', answer: '저는 일본에서 왔어요.', hint: '「〜から来ました」は 「〜에서 왔어요」 を使います。' },
  { prompt: '明日、友達と映画を見に行きます。', answer: '내일 친구랑 영화를 보러 가요.', hint: '「〜しに行く」は 「-러 가요」 が自然です。' },
  { prompt: '今、コーヒーを飲んでいます。', answer: '지금 커피를 마시고 있어요.', hint: '進行形は 「-고 있어요」 を使います。' },
  { prompt: '私は毎朝6時に起きます。', answer: '저는 매일 아침 여섯 시에 일어나요.', hint: '時刻には 「-에」 を使います。' },
  { prompt: 'この本はとても面白いです。', answer: '이 책은 아주 재미있어요.', hint: '主題には 「은/는」 を使います。' },
  { prompt: '今日は雨が降っています。', answer: '오늘은 비가 오고 있어요.', hint: '天気の進行表現は 「비가 오고 있어요」 の形です。' },
  { prompt: '私は韓国語を勉強しています。', answer: '저는 한국어를 공부하고 있어요.', hint: '目的語には 「을/를」 を使います。' },
  { prompt: '弟は学校へ行きます。', answer: '남동생은 학교에 가요.', hint: '移動先には 「에」 を使います。' },
  { prompt: '駅の前で待っています。', answer: '역 앞에서 기다리고 있어요.', hint: '場所での動作には 「에서」 を使います。' },
  { prompt: '私はパンを食べます。', answer: '저는 빵을 먹어요.', hint: '食べる対象には 「을/를」 を使います。' },
  { prompt: '今日は忙しいです。', answer: '오늘은 바빠요.', hint: '形容詞の丁寧体は 「-아요/어요」 を使います。' },
  { prompt: 'このケーキはおいしいです。', answer: '이 케이크는 맛있어요.', hint: '「おいしい」は 「맛있어요」 です。' },
];

const intermediateSeed = [
  { prompt: 'もし時間があれば、一緒に勉強しませんか。', answer: '시간이 있으면 같이 공부하지 않을래요?', hint: '仮定は 「-으면」 を使います。' },
  { prompt: '昨日は忙しくて連絡できませんでした。', answer: '어제는 바빠서 연락하지 못했어요.', hint: '理由は 「-아서/어서」 でつなげます。' },
  { prompt: '最近、韓国ドラマを見るのが好きです。', answer: '요즘 한국 드라마 보는 것을 좋아해요.', hint: '「〜するのが好き」は 「-는 것을 좋아해요」 が自然です。' },
  { prompt: 'この道をまっすぐ行くと駅があります。', answer: '이 길을 곧장 가면 역이 있어요.', hint: '条件は 「-면」 を使います。' },
  { prompt: '会議は午後三時から始まります。', answer: '회의는 오후 세 시부터 시작해요.', hint: '開始時刻は 「부터」 を使います。' },
  { prompt: '試験の前にもう一度復習しました。', answer: '시험 전에 한 번 더 복습했어요.', hint: '「〜の前に」は 「전에」 です。' },
  { prompt: '風が強いので、早めに帰ります。', answer: '바람이 세서 일찍 돌아가요.', hint: '理由表現は 「-아서/어서」 を使います。' },
  { prompt: 'この店ではコーヒーが人気です。', answer: '이 가게에서는 커피가 인기가 있어요.', hint: '主語には 「이/가」 を使うと自然です。' },
  { prompt: '週末は家でゆっくり休みたいです。', answer: '주말에는 집에서 푹 쉬고 싶어요.', hint: '希望は 「-고 싶어요」 です。' },
  { prompt: '先週、友達と釜山へ旅行しました。', answer: '지난주에 친구와 부산으로 여행했어요.', hint: '移動方向は 「으로」 でも表現できます。' },
];

const advancedSeed = [
  { prompt: 'この結果は予想以上に良かった。', answer: '이 결과는 예상 이상으로 좋았다.', hint: '「以上に」は 「이상으로」 が自然です。' },
  { prompt: '会議の前に資料を整理しておいた。', answer: '회의 전에 자료를 정리해 두었다.', hint: '事前準備は 「-아/어 두다」 を使います。' },
  { prompt: '彼は自分の意見を冷静に説明することができた。', answer: '그는 자신의 의견을 냉정하게 설명할 수 있었다.', hint: '可能表現は 「-ㄹ 수 있다」 です。' },
  { prompt: 'その提案は社会全体に大きな影響を与える可能性がある。', answer: '그 제안은 사회 전체에 큰 영향을 줄 가능성이 있다.', hint: '「可能性がある」は 「가능성이 있다」 です。' },
  { prompt: '彼らは同じ目標に向かって努力してきた。', answer: '그들은 같은 목표를 향해 노력해 왔다.', hint: '継続は 「-아/어 오다」 で表現できます。' },
  { prompt: '彼女は自分の立場をはっきりと伝えた。', answer: '그녀는 자신의 입장을 분명하게 전달했다.', hint: '副詞 「はっきりと」 は 「분명하게」 です。' },
  { prompt: '問題が複雑だったため、結論を出すのに時間がかかった。', answer: '문제가 복잡해서 결론을 내는 데 시간이 걸렸다.', hint: '理由は 「-아서/어서」 を使います。' },
  { prompt: 'その制度は地域社会に前向きな変化をもたらした。', answer: '그 제도는 지역 사회에 긍정적인 변화를 가져왔다.', hint: '「もたらす」は 「가져오다」 が自然です。' },
];

const questionBank = {
  beginner: buildBankFromSeed(beginnerSeed, 200),
  intermediate: buildBankFromSeed(intermediateSeed, 200),
  advanced: buildBankFromSeed(advancedSeed, 200),
};

let currentQuestions = [];
let currentIndex = 0;
let currentLevel = 'beginner';
let sessionWrongQuestions = [];
let progressState = {
  attempted: 0,
  correct: 0,
  streak: 0,
  reviewQueue: [],
  todaySolved: 0,
  todayCorrect: 0,
  todayKey: '',
  dailyHistory: {},
  practiceDayKeys: [],
  weakTagCounts: {},
};
const progressKey = 'korean-sakubun-progress';

statusPill.className = 'status-pill';
statusPill.textContent = 'AI接続状態: 取得中...';
if (sessionStatus) {
  sessionStatus.insertAdjacentElement('afterend', statusPill);
}

function updateAiStatus(message, ready = false) {
  if (!sessionStatus || !statusPill) return;
  sessionStatus.textContent = message;
  statusPill.textContent = ready ? 'AI接続: 利用可能' : 'AI接続: フォールバック';
  statusPill.className = `status-pill${ready ? ' is-ready' : ' is-offline'}`;
}

function updateTtsStatus(message) {
  if (!ttsStatus) return;
  ttsStatus.textContent = `音声状態: ${message}`;
}

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('ja-JP');
}

function renderFeedbackList(items) {
  if (!feedbackList) return;
  if (!items.length) {
    feedbackList.innerHTML = '<li>まだコメントはありません。</li>';
    return;
  }

  feedbackList.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    const author = document.createElement('strong');
    author.textContent = item.name || '匿名';
    const comment = document.createElement('p');
    comment.textContent = item.comment || '';
    const time = document.createElement('time');
    time.textContent = formatDateTime(item.createdAt);
    li.appendChild(author);
    li.appendChild(comment);
    li.appendChild(time);
    feedbackList.appendChild(li);
  });
}

async function loadFeedbackComments() {
  if (!feedbackList) return;
  try {
    const response = await fetch('/api/feedback');
    const data = response.ok ? await response.json() : [];
    renderFeedbackList(Array.isArray(data) ? data : []);
  } catch (error) {
    feedbackList.innerHTML = '<li>コメントの読み込みに失敗しました。</li>';
  }
}

async function submitFeedbackComment(event) {
  event.preventDefault();
  if (!feedbackForm || !feedbackCommentInput || !feedbackSubmitStatus) return;

  const name = String(feedbackNameInput?.value || '').trim();
  const comment = String(feedbackCommentInput.value || '').trim();
  if (!comment) {
    feedbackSubmitStatus.textContent = 'コメントを入力してください。';
    return;
  }

  feedbackSubmitStatus.textContent = '投稿中...';
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, comment }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      feedbackSubmitStatus.textContent = data.error || '投稿に失敗しました。';
      return;
    }

    feedbackSubmitStatus.textContent = 'コメントを投稿しました。ありがとうございます。';
    feedbackForm.reset();
    await loadFeedbackComments();
  } catch (error) {
    feedbackSubmitStatus.textContent = '投稿中にエラーが発生しました。';
  }
}

function loadTtsModePreference() {
  try {
    const stored = localStorage.getItem(ttsModeStorageKey);
    if (stored === 'browser' || stored === 'cloud') {
      ttsMode = stored;
    }
  } catch (error) {
    console.warn('Could not load TTS mode preference', error);
  }
}

function saveTtsModePreference(mode) {
  try {
    localStorage.setItem(ttsModeStorageKey, mode);
  } catch (error) {
    console.warn('Could not save TTS mode preference', error);
  }
}

async function fetchCloudTtsStatus() {
  try {
    const response = await fetch('/api/tts/status');
    if (!response.ok) {
      cloudTtsAvailable = false;
      return;
    }
    const data = await response.json();
    cloudTtsAvailable = Boolean(data.available);
    externalTtsProvider = data.provider || 'auto';
  } catch (error) {
    cloudTtsAvailable = false;
    externalTtsProvider = 'auto';
  }
}

function syncTtsModeUi() {
  if (ttsModeSelect) {
    const cloudOption = ttsModeSelect.querySelector('option[value="cloud"]');
    if (cloudOption) {
      cloudOption.disabled = !cloudTtsAvailable;
      cloudOption.textContent = cloudTtsAvailable ? 'Cloud TTS (外部)' : 'Cloud TTS (未設定)';
    }

    if (ttsMode === 'cloud' && !cloudTtsAvailable) {
      ttsMode = 'browser';
      saveTtsModePreference(ttsMode);
    }

    ttsModeSelect.value = ttsMode;
  } else {
    ttsMode = 'browser';
  }

  updateTtsStatus(ttsMode === 'cloud' ? 'Cloud TTS を使用' : 'ブラウザ韓国語音声 (無料) を使用');
}

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function formatDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function parseDayKey(dayKey) {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getRecentDayKeys(days = 7) {
  const result = [];
  const base = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    result.push(formatDayKey(d));
  }
  return result;
}

function ensureProgressShape() {
  progressState.dailyHistory = progressState.dailyHistory || {};
  progressState.practiceDayKeys = Array.isArray(progressState.practiceDayKeys) ? progressState.practiceDayKeys : [];
  progressState.weakTagCounts = progressState.weakTagCounts || {};
}

function getLearningStreakDays() {
  const practiced = new Set(progressState.practiceDayKeys || []);
  let streak = 0;
  const cursor = new Date();

  while (practiced.has(formatDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function registerPracticeDay(dayKey) {
  if (!progressState.practiceDayKeys.includes(dayKey)) {
    progressState.practiceDayKeys.push(dayKey);
    progressState.practiceDayKeys.sort((a, b) => parseDayKey(a) - parseDayKey(b));
  }
}

function bumpWeakTag(tag) {
  progressState.weakTagCounts[tag] = (progressState.weakTagCounts[tag] || 0) + 1;
}

function analyzeWeaknessTags(userAnswer, correctedText, status) {
  if (status === '正解') return;

  const compactUser = userAnswer.replace(/\s+/g, '');
  const compactCorrected = correctedText.replace(/\s+/g, '');

  if (!/(은|는|이|가|을|를|에|에서|와|과|도)/.test(compactUser) && /(은|는|이|가|을|를|에|에서|와|과|도)/.test(compactCorrected)) {
    bumpWeakTag('助詞');
  }

  if (!/\s/.test(userAnswer) && /\s/.test(correctedText)) {
    bumpWeakTag('分かち書き');
  }

  if (/(다\.?$|니다\.?$)/.test(compactUser) && /(요\.?$)/.test(compactCorrected)) {
    bumpWeakTag('語尾レベル');
  }

  if (compactUser && compactCorrected && compactUser !== compactCorrected) {
    bumpWeakTag('語順');
  }
}

function buildStructureAdvice(userAnswer, correctedText, baseHint) {
  const tips = [];
  if (!/(은|는|이|가|을|를|에|에서|와|과|도)/.test(userAnswer) && /(은|는|이|가|을|를|에|에서|와|과|도)/.test(correctedText)) {
    tips.push('助詞(은/는, 이/가, 을/를)の位置を見直すと自然になります。');
  }
  if (!/\s/.test(userAnswer) && /\s/.test(correctedText)) {
    tips.push('分かち書きを入れると読みやすく、意味の切れ目が伝わります。');
  }
  if (/(다\.?$|니다\.?$)/.test(userAnswer) && /(요\.?$)/.test(correctedText)) {
    tips.push('語尾の丁寧さを1文の中で統一しましょう。');
  }
  if (!tips.length) {
    tips.push(baseHint || '語順と語尾を整えると、よりネイティブらしく聞こえます。');
  }
  return `構文アドバイス: ${tips.join(' ')}`;
}

function renderDailyChart() {
  if (!dailyChart) return;
  const keys = getRecentDayKeys(7);
  const values = keys.map((key) => progressState.dailyHistory[key] || 0);
  const max = Math.max(...values, 1);

  dailyChart.innerHTML = '';
  keys.forEach((key, index) => {
    const item = document.createElement('div');
    item.className = 'daily-chart__item';

    const barWrap = document.createElement('div');
    barWrap.className = 'daily-chart__bar-wrap';

    const bar = document.createElement('div');
    bar.className = 'daily-chart__bar';
    bar.style.height = `${Math.max((values[index] / max) * 100, values[index] ? 8 : 0)}%`;

    const label = document.createElement('span');
    label.className = 'daily-chart__label';
    const [, month, day] = key.split('-');
    label.textContent = `${month}/${day}`;

    const value = document.createElement('span');
    value.className = 'daily-chart__value';
    value.textContent = `${values[index]}問`;

    barWrap.appendChild(bar);
    item.appendChild(barWrap);
    item.appendChild(label);
    item.appendChild(value);
    dailyChart.appendChild(item);
  });
}

function renderWeaknessTags() {
  if (!weaknessTags) return;
  const entries = Object.entries(progressState.weakTagCounts || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (!entries.length) {
    weaknessTags.innerHTML = '<span class="weakness-tag">まだデータがありません</span>';
    return;
  }

  weaknessTags.innerHTML = '';
  entries.forEach(([tag, count]) => {
    const chip = document.createElement('span');
    chip.className = 'weakness-tag';
    chip.textContent = `${tag} ${count}`;
    weaknessTags.appendChild(chip);
  });
}

function refreshKoreanVoices() {
  if (!('speechSynthesis' in window)) return;
  const allVoices = window.speechSynthesis.getVoices();
  koreanVoices = allVoices.filter((voice) => (voice.lang || '').toLowerCase().startsWith('ko'));

  if (!koreanVoices.length) {
    koreanVoice = null;
    return;
  }

  const ranked = [...koreanVoices].sort((a, b) => {
    const score = (voice) => {
      const name = (voice.name || '').toLowerCase();
      let s = 0;
      if ((voice.lang || '').toLowerCase() === 'ko-kr') s += 40;
      if (voice.localService) s += 12;
      if (name.includes('google')) s += 18;
      if (name.includes('microsoft')) s += 16;
      if (name.includes('korean') || name.includes('한국')) s += 10;
      return s;
    };
    return score(b) - score(a);
  });

  koreanVoice = ranked[0] || null;
}

function splitKoreanSentences(text) {
  const matches = text.replace(/\n+/g, ' ').match(/[^.!?。！？]+[.!?。！？]?/g);
  return (matches || []).map((line) => line.trim()).filter(Boolean);
}

function extractKoreanText(text) {
  const allowed = text.match(/[가-힣ㄱ-ㅎㅏ-ㅣ0-9\s.,!?\-~]+/g);
  return (allowed || []).join(' ').replace(/\s+/g, ' ').trim();
}

function normalizeProgressState() {
  ensureProgressShape();
  const todayKey = getTodayKey();
  if (progressState.todayKey !== todayKey) {
    progressState.todaySolved = 0;
    progressState.todayCorrect = 0;
    progressState.todayKey = todayKey;
  }
}

function loadProgress() {
  try {
    const stored = localStorage.getItem(progressKey);
    if (stored) {
      progressState = { ...progressState, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Progress storage unavailable', error);
  }
  normalizeProgressState();
  updateProgressUI();
}

function saveProgress() {
  localStorage.setItem(progressKey, JSON.stringify(progressState));
  syncProgressToServer();
}

function updateProgressUI() {
  normalizeProgressState();
  attemptCount.textContent = progressState.attempted;
  correctCount.textContent = progressState.correct;
  streakCount.textContent = progressState.streak;
  if (learningStreakDays) {
    learningStreakDays.textContent = `${getLearningStreakDays()}日`;
  }
  todaySolvedCount.textContent = progressState.todaySolved;
  todayCorrectCount.textContent = progressState.todayCorrect;
  const todayAccuracyValue = progressState.todaySolved ? Math.round((progressState.todayCorrect / progressState.todaySolved) * 100) : 0;
  todayAccuracy.textContent = `${todayAccuracyValue}%`;
  renderReviewList();
  renderDailyChart();
  renderWeaknessTags();
}

async function syncProgressToServer() {
  try {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progressState),
    });
  } catch (error) {
    console.warn('Progress sync failed', error);
  }
}

async function speakWithCloudTts(text) {
  const response = await fetch('/api/tts/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, provider: externalTtsProvider }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Cloud TTS failed');
  }

  const data = await response.json();
  if (!data.audioBase64) {
    throw new Error('Cloud TTS returned no audio');
  }

  const src = `data:audio/mp3;base64,${data.audioBase64}`;
  if (currentCloudAudio) {
    currentCloudAudio.pause();
  }
  currentCloudAudio = new Audio(src);
  await currentCloudAudio.play();
  updateTtsStatus(`外部TTS再生中 (${data.provider || externalTtsProvider}, ${data.voice || 'default'})`);
}

function speakWithBrowserTts(text) {
  refreshKoreanVoices();
  window.speechSynthesis.cancel();
  splitKoreanSentences(text).forEach((segment) => {
    const utterance = new SpeechSynthesisUtterance(segment);
    utterance.lang = koreanVoice?.lang || 'ko-KR';
    if (koreanVoice) utterance.voice = koreanVoice;
    utterance.rate = 1.01;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  });

  if (koreanVoice) {
    updateTtsStatus(`ブラウザ音声再生中 (${koreanVoice.name})`);
  } else {
    updateTtsStatus('ブラウザ標準音声で再生中');
  }
}

function renderReviewList() {
  if (!progressState.reviewQueue.length) {
    reviewList.innerHTML = '<li>まだ復習候補がありません。</li>';
    return;
  }

  reviewList.innerHTML = '';
  progressState.reviewQueue.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${item.prompt}</span>`;
    const button = document.createElement('button');
    button.textContent = '復習';
    button.addEventListener('click', () => startReviewItem(index));
    li.appendChild(button);
    reviewList.appendChild(li);
  });
}

function addReviewItem(question, status) {
  const exists = progressState.reviewQueue.some((item) => item.prompt === question.prompt);
  if (!exists && status !== '正解') {
    progressState.reviewQueue.unshift({ prompt: question.prompt, answer: question.answer, hint: question.hint, status });
    progressState.reviewQueue = progressState.reviewQueue.slice(0, 6);
    saveProgress();
    updateProgressUI();
  }
}

async function startSession() {
  currentLevel = levelSelect.value;
  const count = Number(questionCountSelect.value);
  sessionWrongQuestions = [];
  startBtn.disabled = true;
  startBtn.textContent = '生成中...';
  updateAiStatus('AIで問題を生成しています...', false);
  currentQuestions = [];
  currentIndex = 0;
  feedbackBox.hidden = true;
  if (sessionResultBox) sessionResultBox.hidden = true;
  hintBox.hidden = true;
  answerInput.value = '';

  try {
    const generated = [];
    for (let i = 0; i < count; i += 1) {
      generated.push(await generateQuestion());
    }
    currentQuestions = generated;
    updateAiStatus('AI生成の問題でトレーニングを始めます。', true);
  } catch (error) {
    currentQuestions = [...questionBank[currentLevel]].slice(0, count);
    updateAiStatus('AI生成に失敗したため、サンプル問題で進めます。', false);
  }

  showQuestion();
  startBtn.disabled = false;
  startBtn.textContent = 'セッション開始';
}

function hasMismatchByKeyword(prompt, answer) {
  const jp = String(prompt || '');
  const ko = String(answer || '');

  if (jp.includes('日本') && ko.includes('한국')) return true;
  if (jp.includes('韓国') && ko.includes('일본')) return true;
  if (jp.includes('来ました') && ko.includes('갔')) return true;
  if (jp.includes('行きます') && ko.includes('왔')) return true;

  return false;
}

async function generateQuestion() {
  try {
    const response = await fetch('/api/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: currentLevel, style: 'short' }),
    });
    const data = await response.json();
    if (data && data.prompt && data.answer && !hasMismatchByKeyword(data.prompt, data.answer)) {
      return { prompt: data.prompt, answer: data.answer, hint: data.hint, source: 'ai' };
    }
    console.warn('AI generated low-quality question pair. Falling back to built-in bank.');
  } catch (error) {
    console.warn('AI generation failed', error);
  }

  const fallback = questionBank[currentLevel][Math.floor(Math.random() * questionBank[currentLevel].length)];
  return { ...fallback, source: 'fallback' };
}

async function generateSingleQuestion() {
  const question = await generateQuestion();
  currentQuestions = [question];
  currentIndex = 0;
  sessionWrongQuestions = [];
  if (sessionResultBox) sessionResultBox.hidden = true;
  showQuestion();
  updateAiStatus(question.source === 'ai' ? 'AI生成の問題を表示しました。' : 'サンプル問題を表示しました。', question.source === 'ai');
}

function showQuestion() {
  const question = currentQuestions[currentIndex];
  if (!question) {
    promptText.textContent = 'お疲れさまでした。もう一度挑戦できます。';
    answerInput.value = '';
    feedbackBox.hidden = true;
    if (firstQuestionGuide) firstQuestionGuide.hidden = true;
    return;
  }

  promptText.textContent = question.prompt;
  progressBadge.textContent = `${currentIndex + 1} / ${currentQuestions.length}`;
  levelBadge.textContent = getLevelLabel(currentLevel);
  hintBox.hidden = true;
  feedbackBox.hidden = true;
  if (sessionResultBox) sessionResultBox.hidden = true;
  if (firstQuestionGuide) {
    firstQuestionGuide.hidden = currentIndex !== 0;
  }
  answerInput.value = '';
  answerInput.focus();
}

function getLevelLabel(level) {
  return level === 'beginner' ? '初級' : level === 'intermediate' ? '中級' : '上級';
}

function normalizeForJudgement(text) {
  return String(text || '')
    .trim()
    .replace(/[\s.,!?"'`~:;()\[\]{}\-]/g, '')
    .replace(/입니다$/g, '이다POL')
    .replace(/이에요$/g, '이다POL')
    .replace(/예요$/g, '이다POL')
    .replace(/합니다$/g, '하다POL')
    .replace(/해요$/g, '하다POL')
    .replace(/어요$/g, '어POL')
    .replace(/아요$/g, '아POL')
    .replace(/여요$/g, '여POL');
}

function levenshteinDistance(a, b) {
  const s = String(a || '');
  const t = String(b || '');
  const dp = Array.from({ length: s.length + 1 }, () => new Array(t.length + 1).fill(0));

  for (let i = 0; i <= s.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= t.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= s.length; i += 1) {
    for (let j = 1; j <= t.length; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[s.length][t.length];
}

function similarityRatio(a, b) {
  const x = String(a || '');
  const y = String(b || '');
  if (!x && !y) return 1;
  const distance = levenshteinDistance(x, y);
  return 1 - distance / Math.max(x.length, y.length, 1);
}

function mapAiStatusToJa(status) {
  const raw = String(status || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw.includes('正解') || raw === 'correct' || raw === 'right') return '正解';
  if (raw.includes('惜') || raw === 'almost' || raw === 'close' || raw === 'partial') return '惜しい';
  if (raw.includes('不正解') || raw === 'incorrect' || raw === 'wrong') return '不正解';
  return '';
}

function statusClassFromStatus(status) {
  if (status === '正解') return 'good';
  return 'bad';
}

function containsLongEnglish(text) {
  return /[A-Za-z]{4,}/.test(String(text || ''));
}

function showHint() {
  const question = currentQuestions[currentIndex];
  if (!question) return;
  hintBox.hidden = false;
  hintBox.textContent = `ヒント: ${question.hint}`;
}

async function evaluateAnswer() {
  const question = currentQuestions[currentIndex];
  if (!question) return;

  const userAnswer = answerInput.value.trim();
  const normalizedUser = normalizeForJudgement(userAnswer);
  const normalizedExpected = normalizeForJudgement(question.answer);

  let status = '不正解';
  let statusClass = 'bad';
  let score = 40;
  let feedback = '分かち書きや助詞に気を付けると、かなり自然になります。';
  let explanation = `解説: ${question.hint}`;
  let correctedText = question.answer;
  let alternativesList = [question.answer, '別解: もっと柔らかい表現も可能です'];
  let modelAnswerText = question.answer;

  try {
    const response = await fetch('/api/score-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: question.prompt, modelAnswer: question.answer, userAnswer, level: currentLevel }),
    });

    if (response.ok) {
      const data = await response.json();
      status = mapAiStatusToJa(data.status) || status;
      const aiScoreRaw = Number(data.score);
      if (Number.isFinite(aiScoreRaw)) {
        score = aiScoreRaw <= 1 ? Math.round(aiScoreRaw * 100) : Math.round(aiScoreRaw);
      }
      feedback = data.feedback || feedback;
      explanation = data.explanation || explanation;
      correctedText = data.correctedText || correctedText;
      alternativesList = data.alternatives || alternativesList;
      modelAnswerText = correctedText;
    }
  } catch (error) {
    console.warn('AI scoring failed', error);
  }

  const similarity = similarityRatio(normalizedUser, normalizedExpected);

  if (normalizedUser === normalizedExpected || similarity >= 0.84) {
    status = '正解';
    score = Math.max(score, normalizedUser === normalizedExpected ? 100 : 90);
    feedback = '自然な韓国語です。文法の選び方も良いです。';
  } else if (similarity >= 0.7 || (
    normalizedUser.includes('가') ||
    normalizedUser.includes('어요') ||
    normalizedUser.includes('니다') ||
    normalizedUser.includes('해요') ||
    normalizedUser.includes('합니다') ||
    normalizedUser.includes('어요')
  )) {
    status = '惜しい';
    score = Math.max(score, 72);
    feedback = '意味は近いですが、語尾・分かち書き・助詞の選び方でさらに自然になります。';
  }

  statusClass = statusClassFromStatus(status);

  if (containsLongEnglish(feedback)) {
    feedback = status === '正解'
      ? '自然で正しい韓国語です。'
      : status === '惜しい'
        ? '意味は伝わっています。助詞や語尾を整えるとさらに自然です。'
        : '文法と語順を見直してもう一度挑戦してみましょう。';
  }

  if (containsLongEnglish(explanation)) {
    explanation = `解説: ${question.hint}`;
  }

  alternativesList = (Array.isArray(alternativesList) ? alternativesList : [])
    .filter((item) => !containsLongEnglish(item))
    .slice(0, 3);
  if (!alternativesList.length) {
    alternativesList = ['別解: 似た意味の丁寧表現でも正解になります'];
  }

  const structureAdvice = buildStructureAdvice(userAnswer, correctedText, question.hint);
  analyzeWeaknessTags(userAnswer, correctedText, status);

  normalizeProgressState();
  const todayKey = getTodayKey();
  progressState.attempted += 1;
  progressState.todaySolved += 1;
  progressState.dailyHistory[todayKey] = (progressState.dailyHistory[todayKey] || 0) + 1;
  registerPracticeDay(todayKey);
  if (status === '正解') {
    progressState.correct += 1;
    progressState.todayCorrect += 1;
    progressState.streak += 1;
  } else {
    progressState.streak = 0;
    if (!sessionWrongQuestions.some((item) => item.prompt === question.prompt)) {
      sessionWrongQuestions.push(question);
    }
  }
  addReviewItem(question, status);
  saveProgress();
  updateProgressUI();

  feedbackStatus.textContent = status;
  feedbackStatus.className = `feedback-status ${statusClass}`;
  feedbackText.textContent = `採点: ${score}点`;
  modelAnswerBox.innerHTML = `<strong>模範解答</strong><div>${modelAnswerText}</div>`;
  feedbackExplanation.textContent = `${feedback}\n\n${structureAdvice}\n\n${explanation}\n\n修正案: ${correctedText}`;
  alternatives.innerHTML = '';
  alternativesList.forEach((item) => {
    const chip = document.createElement('span');
    chip.textContent = item;
    alternatives.appendChild(chip);
  });
  feedbackBox.hidden = false;
}

function shareToX() {
  const shareText = 'ひたすら韓国語作文で、韓国語作文の練習とAI添削を楽しみながら学びました。';
  const shareUrl = window.location.href;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  if (navigator.share) {
    navigator.share({ title: 'ひたすら韓国語作文', text: shareText, url: shareUrl }).catch(() => {
      window.open(xUrl, '_blank', 'noopener,noreferrer');
    });
    return;
  }

  window.open(xUrl, '_blank', 'noopener,noreferrer');
}

async function speakFeedbackText() {
  if (!('speechSynthesis' in window)) {
    sessionStatus.textContent = 'このブラウザでは音声再生に対応していません。';
    return;
  }

  const modelAnswerText = modelAnswerBox?.querySelector('div')?.textContent || '';
  const fallbackText = feedbackExplanation?.textContent || '';
  const text = extractKoreanText(modelAnswerText || fallbackText);

  if (!text) {
    sessionStatus.textContent = '読み上げる韓国語の内容がまだありません。';
    return;
  }

  try {
    if (ttsMode === 'cloud' && cloudTtsAvailable) {
      window.speechSynthesis.cancel();
      await speakWithCloudTts(text);
      return;
    }
  } catch (error) {
    console.warn('Cloud TTS failed, falling back to browser voice', error);
    updateTtsStatus('Cloud TTS失敗。ブラウザ音声に切り替えます。');
  }

  speakWithBrowserTts(text);
}

function goToNextQuestion() {
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex += 1;
    showQuestion();
  } else {
    const total = currentQuestions.length;
    const wrong = sessionWrongQuestions.length;
    const correct = total - wrong;
    promptText.textContent = 'お疲れさまでした。セットが完了しました。';
    progressBadge.textContent = `${currentQuestions.length} / ${currentQuestions.length}`;
    feedbackBox.hidden = true;
    if (sessionResultText) {
      sessionResultText.textContent = `${total}問中${correct}問正解でした。${wrong ? ` 間違えた${wrong}問を再挑戦できます。` : ' 全問正解です。'}`;
    }
    if (retryWrongBtn) {
      retryWrongBtn.disabled = wrong === 0;
    }
    if (sessionResultBox) {
      sessionResultBox.hidden = false;
    }
  }
}

function retryWrongQuestions() {
  if (!sessionWrongQuestions.length) {
    updateAiStatus('再挑戦する問題はありません。', false);
    return;
  }
  currentQuestions = sessionWrongQuestions.map((item) => ({ ...item, source: 'retry' }));
  currentIndex = 0;
  sessionWrongQuestions = [];
  showQuestion();
  updateAiStatus('間違えた問題のみ再挑戦を開始しました。', false);
}

function startReviewItem(index) {
  const item = progressState.reviewQueue[index];
  if (!item) return;
  currentQuestions = [{ prompt: item.prompt, answer: item.answer, hint: item.hint, source: 'review' }];
  currentIndex = 0;
  currentLevel = 'beginner';
  showQuestion();
  updateAiStatus('復習候補を表示しました。', false);
}

startBtn.addEventListener('click', startSession);
generateBtn.addEventListener('click', generateSingleQuestion);
submitBtn.addEventListener('click', evaluateAnswer);
hintBtn.addEventListener('click', showHint);
nextBtn.addEventListener('click', goToNextQuestion);
if (speakBtn) {
  speakBtn.addEventListener('click', speakFeedbackText);
}
if (shareBtn) {
  shareBtn.addEventListener('click', shareToX);
}
reviewBtn.addEventListener('click', () => {
  renderReviewList();
  updateAiStatus('復習候補を更新しました。', false);
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = registerNameInput.value;
  const email = registerEmailInput.value;
  const userId = registerUserIdInput.value;
  const password = registerPasswordInput.value;
  const validation = window.validateRegistrationInput ? window.validateRegistrationInput({ name, email, userId, password }) : null;

  if (validation && !validation.isValid) {
    authStatus.textContent = validation.errors[0] || '入力内容を確認してください';
    return;
  }

  authStatus.textContent = '登録中...';
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, userId, password }),
  });

  if (response.ok) {
    authStatus.textContent = 'アカウントを作成しました。学習進捗を保存できます。';
    registerForm.reset();
    await syncProgressToServer();
  } else {
    const data = await response.json();
    authStatus.textContent = data.error || '登録できませんでした';
  }
});

if (feedbackForm) {
  feedbackForm.addEventListener('submit', submitFeedbackComment);
}

if (answerInput) {
  answerInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      evaluateAnswer();
    }
  });
}

if (retryWrongBtn) {
  retryWrongBtn.addEventListener('click', retryWrongQuestions);
}

if (restartSessionBtn) {
  restartSessionBtn.addEventListener('click', startSession);
}

window.addEventListener('DOMContentLoaded', () => {
  refreshKoreanVoices();
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = refreshKoreanVoices;
  }

  loadTtsModePreference();
  fetchCloudTtsStatus().then(syncTtsModeUi);
  if (ttsModeSelect) {
    ttsModeSelect.addEventListener('change', (event) => {
      ttsMode = event.target.value === 'cloud' ? 'cloud' : 'browser';
      saveTtsModePreference(ttsMode);
      syncTtsModeUi();
    });
  }

  loadProgress();
  loadFeedbackComments();
  updateAiStatus('AI接続状態を確認しています...', false);
  promptText.textContent = 'レベルを選んで「セッション開始」を押してください。';
});
