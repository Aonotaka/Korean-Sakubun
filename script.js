const levelSelect = document.getElementById('levelSelect');
const practiceModeSelect = document.getElementById('practiceModeSelect');
const questionCountSelect = document.getElementById('questionCountSelect');
const startBtn = document.getElementById('startBtn');
const scenarioText = document.getElementById('scenarioText');
const imagePromptBox = document.getElementById('imagePromptBox');
const imagePromptImage = document.getElementById('imagePromptImage');
const imagePromptCaption = document.getElementById('imagePromptCaption');
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
const followUpBox = document.getElementById('followUpBox');
const chatTranscript = document.getElementById('chatTranscript');
const nextBtn = document.getElementById('nextBtn');
const speakBtn = document.getElementById('speakBtn');
const progressBadge = document.getElementById('progressBadge');
const levelBadge = document.getElementById('levelBadge');
const promptLabel = document.querySelector('.prompt-label');
const sessionStatus = document.getElementById('sessionStatus');
const practiceHints = Array.from(document.querySelectorAll('.panel--control .panel__hint'));
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
const topLoginLink = document.getElementById('topLoginLink');
const topLogoutBtn = document.getElementById('topLogoutBtn');
const topProfile = document.getElementById('topProfile');
const topProfileAvatar = document.getElementById('topProfileAvatar');
const topProfileName = document.getElementById('topProfileName');
const topProfileState = document.getElementById('topProfileState');
const googleSignInButton = document.getElementById('googleSignInButton');
const googleAuthStatus = document.getElementById('googleAuthStatus');
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
const premiumMemoryForm = document.getElementById('premiumMemoryForm');
const premiumMemoryTitle = document.getElementById('premiumMemoryTitle');
const premiumMemoryText = document.getElementById('premiumMemoryText');
const premiumMemoryNote = document.getElementById('premiumMemoryNote');
const premiumMemoryTags = document.getElementById('premiumMemoryTags');
const premiumMemoryTone = document.getElementById('premiumMemoryTone');
const premiumMemoryTarget = document.getElementById('premiumMemoryTarget');
const premiumMemorySubmitBtn = document.getElementById('premiumMemorySubmitBtn');
const premiumMemoryCancelEditBtn = document.getElementById('premiumMemoryCancelEditBtn');
const premiumMemoryList = document.getElementById('premiumMemoryList');
const premiumStatus = document.getElementById('premiumStatus');
const premiumCheckoutBtn = document.getElementById('premiumCheckoutBtn');
const premiumSearchInput = document.getElementById('premiumSearchInput');
const premiumFilterSelect = document.getElementById('premiumFilterSelect');
const premiumSortSelect = document.getElementById('premiumSortSelect');
const premiumStats = document.getElementById('premiumStats');
const premiumWeeklySaved = document.getElementById('premiumWeeklySaved');
const premiumWeeklyReviews = document.getElementById('premiumWeeklyReviews');
const premiumWeeklyAchievement = document.getElementById('premiumWeeklyAchievement');
const levelSetting = document.getElementById('levelSetting');
const grammarSetting = document.getElementById('grammarSetting');
const grammarCatalog = document.getElementById('grammarCatalog');
const grammarSelectionStatus = document.getElementById('grammarSelectionStatus');
const targetGrammarBanner = document.getElementById('targetGrammarBanner');
const targetGrammarLabel = document.getElementById('targetGrammarLabel');

let koreanVoice = null;
let koreanVoices = [];
let cloudTtsAvailable = false;
let ttsMode = 'browser';
let currentCloudAudio = null;
let externalTtsProvider = 'auto';
let currentSessionUser = null;
let premiumMemoriesCache = [];
let premiumEditingId = '';
let grammarMasterList = [];
let selectedGrammarId = '';
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

const fallbackGrammarMasterList = [
  {
    categoryId: 'beginner',
    categoryName: '初級文法',
    items: [
      { id: 'beg-copula-polite', grammar: '~이에요/예요, ~입니다/입니까?', meaning: '〜です / ですか', level: 'beginner' },
      { id: 'beg-negative', grammar: '안 ~ / ~지 않다, 못 ~ / ~지 못하다', meaning: '〜しない / 〜できない', level: 'beginner' },
      { id: 'beg-past-future', grammar: '~았/었어요, ~을/ㄹ 거예요', meaning: '〜しました / 〜するつもりです', level: 'beginner' },
      { id: 'beg-progress-state', grammar: '~고 있다, ~아/어 있다', meaning: '〜している / 〜してある', level: 'beginner' },
      { id: 'beg-desire-intent', grammar: '~고 싶다, ~을/ㄹ게요', meaning: '〜したい / 〜しますね', level: 'beginner' },
      { id: 'beg-suggestion-connector', grammar: '~을/ㄹ까요?, ~아/어서', meaning: '〜しましょうか / 〜して・〜だから', level: 'beginner' },
    ],
  },
  {
    categoryId: 'intermediate',
    categoryName: '中級文法',
    items: [
      { id: 'int-reason-cause', grammar: '~기 때문에, ~느라고', meaning: '〜だから / 〜するせいで', level: 'intermediate' },
      { id: 'int-condition', grammar: '~으면/면, ~아/어야', meaning: '〜なら / 〜しなければ', level: 'intermediate' },
      { id: 'int-contrast', grammar: '~지만, ~ㄴ/는데', meaning: '〜だけど / 〜のに・〜ですが', level: 'intermediate' },
      { id: 'int-purpose', grammar: '~으러/러, ~기 위해(서)', meaning: '〜しに / 〜するために', level: 'intermediate' },
      { id: 'int-experience-ability', grammar: '~ㄴ/은 적이 있다/없다, ~을/ㄹ 수 있다/없다', meaning: '〜したことがある/ない, 〜できる/できない', level: 'intermediate' },
      { id: 'int-guess-quote', grammar: '~것 같다, ~다고 하다', meaning: '〜のようだ / 〜だそうだ', level: 'intermediate' },
    ],
  },
  {
    categoryId: 'upper-intermediate',
    categoryName: '中上級文法',
    items: [
      { id: 'up-change-result', grammar: '~게 되다', meaning: '〜するようになる', level: 'advanced' },
      { id: 'up-obligation-emphasis', grammar: '~아/어야 하다', meaning: '〜しなければならない', level: 'advanced' },
      { id: 'up-contrast-formal', grammar: '~는 반면(에)', meaning: '〜である一方で', level: 'advanced' },
      { id: 'up-addition', grammar: '~(으)ㄹ 뿐만 아니라', meaning: '〜だけでなく', level: 'advanced' },
      { id: 'up-proportional', grammar: '~(으)ㄹ수록', meaning: '〜すればするほど', level: 'advanced' },
      { id: 'up-pretend', grammar: '~(으)ㄴ/는 척하다', meaning: '〜するふりをする', level: 'advanced' },
    ],
  },
];

let currentQuestions = [];
let currentIndex = 0;
let currentLevel = 'beginner';
let currentPracticeMode = 'translation';
let sessionWrongQuestions = [];
let replyTranscriptLastTurn = -1;
let transcriptMessageCount = 0;
let progressState = {
  attempted: 0,
  correct: 0,
  streak: 0,
  reviewQueue: [],
  grammarProgress: {},
  selectedGrammarId: '',
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

function buildDefaultAvatarDataUrl(name = 'User') {
  const initial = String(name || 'U').trim().slice(0, 1).toUpperCase() || 'U';
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">',
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fda4af"/><stop offset="100%" stop-color="#93c5fd"/></linearGradient></defs>',
    '<circle cx="32" cy="32" r="32" fill="url(#g)"/>',
    `<text x="32" y="40" text-anchor="middle" font-size="30" font-family="Noto Sans JP, sans-serif" fill="#0f172a">${initial}</text>`,
    '</svg>',
  ].join('');
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function renderAuthProfile(user) {
  const loggedIn = Boolean(user && user.id);
  if (topLoginLink) topLoginLink.hidden = loggedIn;
  if (topLogoutBtn) topLogoutBtn.hidden = !loggedIn;
  if (topProfile) topProfile.hidden = false;

  if (topProfileName) {
    topProfileName.textContent = loggedIn ? (user.name || user.email || 'ユーザー') : 'ゲスト';
  }
  if (topProfileState) {
    topProfileState.textContent = loggedIn ? (user.premiumEnabled ? 'プレミアム' : 'ログイン中') : '未ログイン';
    topProfileState.classList.toggle('is-offline', !loggedIn);
    topProfileState.classList.toggle('is-premium', Boolean(loggedIn && user.premiumEnabled));
  }
  if (topProfileAvatar) {
    topProfileAvatar.src = loggedIn && user.avatarUrl ? user.avatarUrl : buildDefaultAvatarDataUrl(loggedIn ? user.name : 'G');
  }
}

async function fetchCurrentSessionUser() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function refreshAuthState() {
  const user = await fetchCurrentSessionUser();
  currentSessionUser = user || null;
  renderAuthProfile(currentSessionUser);

  if (authStatus) {
    authStatus.textContent = currentSessionUser
      ? `${currentSessionUser.name || 'ユーザー'}としてログイン中です。${currentSessionUser.premiumEnabled ? ' プレミアム保存が使えます。' : ' 無料プランです。'}`
      : '未ログインです。Googleログインで進捗を保存できます。';
  }

  await loadPremiumMemories();
}

async function applyServerProgressIfAvailable() {
  if (!currentSessionUser) return;
  try {
    const response = await fetch('/api/progress');
    if (!response.ok) return;
    const remote = await response.json();
    if (!remote || typeof remote !== 'object') return;
    progressState = { ...progressState, ...remote };
    normalizeProgressState();
    updateProgressUI();
    saveProgress();
  } catch (error) {
    console.warn('Could not load progress from server', error);
  }
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

    if (googleAuthStatus) googleAuthStatus.textContent = `${data.name || 'ユーザー'}さんでログインしました。`;
    await refreshAuthState();
    await applyServerProgressIfAvailable();
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

    if (googleAuthStatus) {
      googleAuthStatus.textContent = 'Googleアカウントでログインできます。';
    }
  } catch (error) {
    if (googleAuthStatus) googleAuthStatus.textContent = 'Googleログイン設定の読み込みに失敗しました。';
  }
}

function getPracticeModeLabel() {
  return getSelectedPracticeMode() === 'grammar' ? '文法別練習モード' : '日本語→韓国語モード';
}

function getSelectedPracticeMode() {
  const mode = String(practiceModeSelect?.value || '').trim();
  return mode === 'grammar' ? 'grammar' : 'translation';
}

function getSessionQuestionCount(requestedCount) {
  return Math.max(1, Number(requestedCount) || 5);
}

function flattenGrammarItems(list) {
  return (Array.isArray(list) ? list : []).flatMap((category) => (Array.isArray(category.items) ? category.items : []));
}

function findGrammarById(grammarId) {
  const allItems = flattenGrammarItems(grammarMasterList.length ? grammarMasterList : fallbackGrammarMasterList);
  return allItems.find((item) => item.id === grammarId) || null;
}

function getDefaultGrammar() {
  const categories = grammarMasterList.length ? grammarMasterList : fallbackGrammarMasterList;
  const firstCategory = categories[0];
  return firstCategory?.items?.[0] || null;
}

function getSelectedGrammar() {
  return findGrammarById(selectedGrammarId) || getDefaultGrammar();
}

function getGrammarProgressRecord(grammarId) {
  const current = progressState.grammarProgress?.[grammarId] || {};
  return {
    solved: Number(current.solved) || 0,
    correct: Number(current.correct) || 0,
    achievedAt: String(current.achievedAt || '').trim(),
  };
}

function getGrammarProgressLabel(grammarId) {
  const record = getGrammarProgressRecord(grammarId);
  const solved = Math.min(10, Math.max(0, record.solved));
  return `${solved}/10`;
}

function isGrammarProgressAchieved(grammarId) {
  const record = getGrammarProgressRecord(grammarId);
  return record.solved >= 10;
}

function getGrammarAchievementLabel(grammarId) {
  const record = getGrammarProgressRecord(grammarId);
  if (record.solved < 10) return '';
  const achievedAt = new Date(record.achievedAt || '');
  if (Number.isNaN(achievedAt.getTime())) {
    return '達成';
  }
  return `達成 ${achievedAt.getMonth() + 1}/${achievedAt.getDate()}`;
}

function getGrammarAchievementTitle(grammarId) {
  const record = getGrammarProgressRecord(grammarId);
  if (!record.achievedAt) return '';
  return formatDateTime(record.achievedAt);
}

function updateTargetGrammarBanner() {
  const selected = getSelectedGrammar();
  if (!targetGrammarBanner || !targetGrammarLabel || !selected) return;
  targetGrammarBanner.hidden = false;
  targetGrammarLabel.textContent = `${selected.grammar}（${selected.meaning || ''}）`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function renderGrammarCatalog() {
  if (!grammarCatalog) return;
  const categories = grammarMasterList.length ? grammarMasterList : fallbackGrammarMasterList;
  if (!categories.length) {
    grammarCatalog.innerHTML = '<p class="panel__hint">文法リストを読み込めませんでした。</p>';
    return;
  }

  grammarCatalog.innerHTML = '';
  categories.forEach((category, index) => {
    const details = document.createElement('details');
    details.className = 'grammar-category';
    details.open = index === 0;

    const summary = document.createElement('summary');
    summary.textContent = category.categoryName;
    details.appendChild(summary);

    const grid = document.createElement('div');
    grid.className = 'grammar-card-grid';

    (category.items || []).forEach((item) => {
      const achievementLabel = getGrammarAchievementLabel(item.id);
      const achievementTitle = getGrammarAchievementTitle(item.id);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `grammar-card${item.id === selectedGrammarId ? ' is-selected' : ''}`;
      button.dataset.grammarId = item.id;
      button.innerHTML = `
        <div class="grammar-card__title-row">
          <div class="grammar-card__title">${item.grammar}</div>
          ${achievementLabel ? `<span class="grammar-card__badge" title="${achievementTitle}">${achievementLabel}</span>` : ''}
        </div>
        <div class="grammar-card__meta"><span>${item.category || category.categoryName}</span><span>${item.meaning || ''}</span></div>
        <div class="grammar-card__progress">進捗: ${getGrammarProgressLabel(item.id)}</div>
      `;
      grid.appendChild(button);
    });

    details.appendChild(grid);
    grammarCatalog.appendChild(details);
  });
}

function selectGrammar(grammarId, { silent = false } = {}) {
  const target = findGrammarById(grammarId);
  if (!target) return;
  selectedGrammarId = target.id;
  progressState.selectedGrammarId = target.id;
  if (levelSelect) {
    levelSelect.value = ['beginner', 'intermediate', 'advanced'].includes(target.level)
      ? target.level
      : 'beginner';
  }
  saveProgress();
  renderGrammarCatalog();
  updateTargetGrammarBanner();
  if (!silent && grammarSelectionStatus) {
    grammarSelectionStatus.textContent = `${target.grammar} を選択中`;
  }
}

async function loadGrammarMasterList() {
  if (grammarSelectionStatus) {
    grammarSelectionStatus.textContent = '文法を読み込み中...';
  }

  try {
    const response = await fetchWithTimeout('/api/grammar/list', {}, 5000);
    const data = response.ok ? await response.json() : [];
    grammarMasterList = Array.isArray(data) && data.length ? data : fallbackGrammarMasterList;
  } catch (error) {
    grammarMasterList = fallbackGrammarMasterList;
    if (grammarSelectionStatus) {
      grammarSelectionStatus.textContent = '通信不安定のためローカル文法リストを使用中';
    }
  }

  const fallbackSelected = progressState.selectedGrammarId || selectedGrammarId;
  const selected = findGrammarById(fallbackSelected) || getDefaultGrammar();
  if (selected) {
    selectedGrammarId = selected.id;
    progressState.selectedGrammarId = selected.id;
  }

  renderGrammarCatalog();
  updateTargetGrammarBanner();
  if (grammarSelectionStatus && selected) {
    grammarSelectionStatus.textContent = `${selected.grammar} を選択中`;
  }
}

function buildLocalImageDataUrl(sceneText = '公園で人と犬が散歩しています。') {
  const raw = String(sceneText || '').toLowerCase();
  const isPark = /공원|公園|park/.test(raw);
  const isCafe = /카페|喫茶|cafe/.test(raw);
  const isRain = /비|雨|rain/.test(raw);
  const isMeeting = /회의|会議|meeting/.test(raw);
  const isMarket = /시장|市場|market/.test(raw);
  const skyColor = isRain ? '#dbeafe' : isCafe ? '#fff4e6' : '#dbeafe';
  const groundColor = isPark ? '#bbf7d0' : isMarket ? '#fde68a' : isMeeting ? '#e5e7eb' : '#d1fae5';
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768" viewBox="0 0 1024 768">',
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${skyColor}"/><stop offset="100%" stop-color="#f8fafc"/></linearGradient></defs>`,
    '<rect width="1024" height="768" fill="url(#bg)"/>',
    '<circle cx="180" cy="150" r="82" fill="#facc15" fill-opacity="0.28"/>',
    '<ellipse cx="264" cy="172" rx="78" ry="40" fill="#ffffff" fill-opacity="0.5"/>',
    '<ellipse cx="770" cy="148" rx="88" ry="42" fill="#ffffff" fill-opacity="0.46"/>',
    `<rect x="0" y="498" width="1024" height="270" fill="${groundColor}" fill-opacity="0.82"/>`,
    isPark ? '<g><path d="M118 562c18-58 50-92 94-96 42-2 82 26 114 88" fill="none" stroke="#2f855a" stroke-width="10" stroke-linecap="round"/><rect x="120" y="366" width="154" height="96" rx="18" fill="#f59e0b"/><rect x="136" y="380" width="120" height="12" rx="6" fill="#fde68a"/><circle cx="224" cy="430" r="28" fill="#22c55e"/><rect x="216" y="454" width="16" height="98" rx="8" fill="#8b5a2b"/><circle cx="224" cy="396" r="54" fill="#16a34a" fill-opacity="0.86"/><rect x="360" y="352" width="170" height="106" rx="18" fill="#fbbf24"/><path d="M392 454l52-88 52 88" fill="#fb923c"/><rect x="422" y="454" width="44" height="82" rx="10" fill="#eab308"/><circle cx="720" cy="430" r="24" fill="#fda4af"/><circle cx="794" cy="430" r="22" fill="#93c5fd"/><circle cx="754" cy="468" r="20" fill="#fcd34d"/><path d="M710 486c16-18 30-26 46-26s30 8 46 26" fill="none" stroke="#334155" stroke-width="5" stroke-linecap="round"/></g>' : '',
    isCafe ? '<g><rect x="114" y="340" width="284" height="188" rx="24" fill="#fff7ed" stroke="#fdba74"/><rect x="136" y="360" width="124" height="22" rx="11" fill="#fde68a"/><rect x="136" y="398" width="132" height="82" rx="16" fill="#dbeafe"/><rect x="284" y="384" width="86" height="96" rx="18" fill="#fee2e2"/><circle cx="172" cy="440" r="16" fill="#93c5fd"/><circle cx="214" cy="440" r="16" fill="#93c5fd"/><circle cx="316" cy="432" r="18" fill="#fda4af"/><rect x="430" y="386" width="146" height="76" rx="20" fill="#fde68a"/><circle cx="496" cy="424" r="18" fill="#22c55e"/><rect x="462" y="358" width="16" height="122" rx="8" fill="#92400e"/></g>' : '',
    isRain ? '<g opacity="0.72"><path d="M232 280l-16 30" stroke="#3b82f6" stroke-width="4"/><path d="M296 252l-16 30" stroke="#3b82f6" stroke-width="4"/><path d="M362 286l-16 30" stroke="#3b82f6" stroke-width="4"/></g><path d="M170 460c98-120 196-120 294 0" fill="#94a3b8" opacity="0.32"/><circle cx="680" cy="456" r="24" fill="#fda4af"/><circle cx="760" cy="470" r="24" fill="#93c5fd"/><path d="M656 478c16-18 32-26 48-26s30 8 46 26" fill="none" stroke="#334155" stroke-width="5" stroke-linecap="round"/></g>' : '',
    isMeeting ? '<rect x="152" y="304" width="720" height="246" rx="28" fill="#ffffff" stroke="#cbd5e1"/><rect x="206" y="356" width="612" height="26" rx="13" fill="#e2e8f0"/><rect x="206" y="398" width="498" height="26" rx="13" fill="#cbd5e1"/><circle cx="242" cy="480" r="26" fill="#93c5fd"/><circle cx="300" cy="478" r="22" fill="#fda4af"/><circle cx="726" cy="480" r="24" fill="#fde68a"/><rect x="452" y="428" width="120" height="78" rx="20" fill="#dbeafe"/><path d="M468 452h88" stroke="#475569" stroke-width="6" stroke-linecap="round"/><path d="M490 470h44" stroke="#475569" stroke-width="6" stroke-linecap="round"/></g>' : '',
    isMarket ? '<rect x="112" y="362" width="800" height="124" rx="20" fill="#fff7ed" stroke="#fdba74"/><rect x="112" y="332" width="800" height="52" rx="18" fill="#fb7185" opacity="0.8"/><rect x="176" y="406" width="90" height="82" rx="10" fill="#fde68a"/><rect x="288" y="398" width="92" height="90" rx="10" fill="#bfdbfe"/><rect x="400" y="410" width="80" height="78" rx="10" fill="#fecaca"/><rect x="514" y="404" width="86" height="84" rx="10" fill="#bbf7d0"/><circle cx="664" cy="448" r="28" fill="#fda4af"/><circle cx="736" cy="446" r="26" fill="#93c5fd"/><circle cx="694" cy="472" r="22" fill="#fcd34d"/><circle cx="784" cy="472" r="20" fill="#86efac"/></g>' : '',
    '</svg>',
  ].join('');
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function isSvgDataUrl(value) {
  return String(value || '').trim().toLowerCase().startsWith('data:image/svg+xml');
}

function clearChatTranscript() {
  if (!chatTranscript) return;
  chatTranscript.innerHTML = '';
  chatTranscript.hidden = true;
  chatTranscript.classList.remove('chat-transcript--reply');
  transcriptMessageCount = 0;
}

function getTranscriptTimeLabel() {
  const now = new Date();
  return now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function getTranscriptStatusLabel(role) {
  if (role === 'user') return '既読';
  if (role === 'assistant') return '採点済み';
  return '受信';
}

function appendChatBubble(role, title, text) {
  if (!chatTranscript || !text) return null;
  transcriptMessageCount += 1;
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble chat-bubble--${role}`;
  const meta = document.createElement('span');
  meta.className = 'chat-bubble__meta';
  meta.textContent = title;
  const content = document.createElement('div');
  content.className = 'chat-bubble__content';
  content.textContent = text;
  const footer = document.createElement('div');
  footer.className = 'chat-bubble__footer';
  const time = document.createElement('span');
  time.className = 'chat-bubble__time';
  time.textContent = getTranscriptTimeLabel();
  const status = document.createElement('span');
  status.className = 'chat-bubble__status';
  status.textContent = getTranscriptStatusLabel(role);
  bubble.appendChild(meta);
  bubble.appendChild(content);
  footer.appendChild(time);
  footer.appendChild(status);
  bubble.appendChild(footer);
  chatTranscript.appendChild(bubble);
  chatTranscript.hidden = false;
  return bubble;
}

function updateTtsStatus(message) {
  if (!ttsStatus) return;
  ttsStatus.textContent = `音声状態: ${message}`;
}

function syncPracticeModeUi() {
  const mode = getSelectedPracticeMode();

  if (levelSetting) {
    levelSetting.hidden = mode !== 'translation';
  }
  if (grammarSetting) {
    grammarSetting.hidden = mode !== 'grammar';
  }

  if (answerInput) {
    answerInput.placeholder = mode === 'grammar'
      ? '例: 한국에 가서 삼겹살을 먹고 싶어요.'
      : '例: 저는 오늘 친구를 만나요.';
  }

  if (promptLabel && currentQuestions.length === 0) {
    promptLabel.textContent = '日本語のお題';
  }

  if (practiceHints[0]) {
    practiceHints[0].textContent = mode === 'grammar'
      ? '文法の型を意識し、必ず指定文法を含めて作文してください。'
      : '日本語の意味を自然な韓国語に置き換えて作文してください。';
  }

  if (practiceHints[1]) {
    practiceHints[1].textContent = mode === 'grammar'
      ? '採点では「指定文法を正しく使えたか」が必ず評価されます。'
      : '採点では語順・助詞・語尾の自然さが評価されます。';
  }

  if (targetGrammarBanner) {
    targetGrammarBanner.hidden = mode !== 'grammar';
  }

  if (grammarSelectionStatus) {
    const selected = getSelectedGrammar();
    grammarSelectionStatus.textContent = mode === 'grammar'
      ? (selected ? `${selected.grammar} を選択中` : '文法を選択してください')
      : '日本語→韓国語モードでは文法選択は任意です';
  }

  if (currentQuestions.length === 0 && promptText) {
    promptText.textContent = mode === 'grammar'
      ? '文法を選んで「セッション開始」を押してください。'
      : '「セッション開始」を押して翻訳問題を始めてください。';
  }
}

async function applyPracticeQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const grammarId = params.get('grammar');
  const level = params.get('level');
  const autostart = params.get('autostart');

  if (practiceModeSelect) {
    practiceModeSelect.value = mode === 'grammar' ? 'grammar' : 'translation';
  }

  if (levelSelect && ['beginner', 'intermediate', 'advanced'].includes(level)) {
    levelSelect.value = level;
  }

  if (grammarId) {
    selectGrammar(grammarId, { silent: true });
  }

  syncPracticeModeUi();

  if (autostart === '1') {
    const practiceSection = document.getElementById('practice');
    if (practiceSection) {
      practiceSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    await startSession();
  }
}

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('ja-JP');
}

function normalizePromptKey(text) {
  return String(text || '').trim().replace(/\s+/g, ' ').slice(0, 140);
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

function getPremiumToneLabel(tone) {
  if (tone === 'daily') return '日常会話';
  if (tone === 'business') return 'ビジネス';
  if (tone === 'exam') return '試験対策';
  return '自由';
}

function isPremiumMemoryDue(item) {
  if (!item) return false;
  const reviewCount = Number(item.reviewCount) || 0;
  const targetRepeats = Number(item.targetRepeats) || 3;
  const nextReview = new Date(String(item.nextReviewAt || ''));
  const dueByCount = reviewCount < targetRepeats;
  if (Number.isNaN(nextReview.getTime())) {
    return dueByCount;
  }
  return nextReview.getTime() <= Date.now() || dueByCount;
}

function parsePremiumTagsInput(value) {
  return String(value || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function resetPremiumEditorState() {
  premiumEditingId = '';
  if (premiumMemoryForm) premiumMemoryForm.reset();
  if (premiumMemoryTarget) premiumMemoryTarget.value = '3';
  if (premiumMemoryTone) premiumMemoryTone.value = 'free';
  if (premiumMemorySubmitBtn) premiumMemorySubmitBtn.textContent = '作文を追加する';
  if (premiumMemoryCancelEditBtn) premiumMemoryCancelEditBtn.hidden = true;
}

function updatePremiumStats(items) {
  if (!premiumStats) return;
  const source = Array.isArray(items) ? items : [];
  const favorites = source.filter((item) => Boolean(item.isFavorite)).length;
  const dueCount = source.filter(isPremiumMemoryDue).length;
  premiumStats.innerHTML = `<span>合計 ${source.length}</span><span>お気に入り ${favorites}</span><span>復習候補 ${dueCount}</span>`;
}

function resetPremiumDashboard() {
  if (premiumWeeklySaved) premiumWeeklySaved.textContent = '0';
  if (premiumWeeklyReviews) premiumWeeklyReviews.textContent = '0';
  if (premiumWeeklyAchievement) premiumWeeklyAchievement.textContent = '0%';
}

function renderPremiumDashboard(items) {
  const source = Array.isArray(items) ? items : [];
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const since = Date.now() - weekMs;

  const weeklySaved = source.filter((item) => new Date(item.createdAt || 0).getTime() >= since).length;
  const weeklyReviewActions = source.reduce((sum, item) => {
    const history = Array.isArray(item.reviewHistory) ? item.reviewHistory : [];
    const count = history.filter((stamp) => new Date(stamp || 0).getTime() >= since).length;
    return sum + count;
  }, 0);

  const weeklyActiveCards = source.filter((item) => {
    const createdRecently = new Date(item.createdAt || 0).getTime() >= since;
    const reviewedRecently = Array.isArray(item.reviewHistory)
      ? item.reviewHistory.some((stamp) => new Date(stamp || 0).getTime() >= since)
      : false;
    return createdRecently || reviewedRecently;
  });
  const weeklyAchievedCards = weeklyActiveCards.filter((item) => {
    const achievedAt = new Date(item.achievedAt || 0).getTime();
    return Number.isFinite(achievedAt) && achievedAt >= since;
  }).length;

  const achievementRate = weeklyActiveCards.length
    ? Math.round((weeklyAchievedCards / weeklyActiveCards.length) * 100)
    : 0;

  if (premiumWeeklySaved) premiumWeeklySaved.textContent = String(weeklySaved);
  if (premiumWeeklyReviews) premiumWeeklyReviews.textContent = String(weeklyReviewActions);
  if (premiumWeeklyAchievement) premiumWeeklyAchievement.textContent = `${achievementRate}%`;
}

function getFilteredPremiumMemories(items) {
  const source = Array.isArray(items) ? items : [];
  const search = String(premiumSearchInput?.value || '').trim().toLowerCase();
  const filter = String(premiumFilterSelect?.value || 'all').trim();

  let filtered = source;
  if (search) {
    filtered = filtered.filter((item) => {
      const haystack = [item.title, item.text, item.note, ...(Array.isArray(item.tags) ? item.tags : [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  if (filter === 'favorites') {
    filtered = filtered.filter((item) => Boolean(item.isFavorite));
  } else if (filter === 'due') {
    filtered = filtered.filter(isPremiumMemoryDue);
  } else if (filter === 'mistakes') {
    filtered = filtered.filter((item) => {
      if (String(item.sourceType || '').trim() === 'grammar-mistake') return true;
      return Array.isArray(item.tags) && item.tags.some((tag) => String(tag).trim() === '誤答ログ');
    });
  }

  return filtered;
}

function getSortedPremiumMemories(items) {
  const source = Array.isArray(items) ? [...items] : [];
  const sort = String(premiumSortSelect?.value || 'created_desc').trim();

  if (sort === 'created_asc') {
    return source.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }

  if (sort === 'due_asc') {
    return source.sort((a, b) => {
      const aDue = new Date(a.nextReviewAt || 0).getTime() || Number.MAX_SAFE_INTEGER;
      const bDue = new Date(b.nextReviewAt || 0).getTime() || Number.MAX_SAFE_INTEGER;
      if (aDue !== bDue) return aDue - bDue;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
  }

  if (sort === 'favorite_priority') {
    return source.sort((a, b) => {
      const favDiff = Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite));
      if (favDiff !== 0) return favDiff;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
  }

  return source.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function renderPremiumMemories(items) {
  if (!premiumMemoryList) return;
  const source = Array.isArray(items) ? items : [];
  updatePremiumStats(source);
  renderPremiumDashboard(source);
  const filtered = getFilteredPremiumMemories(source);
  const sorted = getSortedPremiumMemories(filtered);

  if (!sorted.length) {
    premiumMemoryList.innerHTML = '<li>条件に合う作文がありません。検索条件を変更してください。</li>';
    return;
  }

  premiumMemoryList.innerHTML = '';
  sorted.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'premium-memory-item';

    const title = document.createElement('h4');
    title.className = 'premium-memory-item__title';
    title.textContent = item.title || '無題の作文';

    const text = document.createElement('p');
    text.className = 'premium-memory-item__text';
    text.textContent = item.text || '';

    const note = document.createElement('p');
    note.className = 'premium-memory-item__note';
    note.textContent = item.note ? `メモ: ${item.note}` : 'メモ: なし';

    const chips = document.createElement('div');
    chips.className = 'premium-memory-item__chips';

    const toneChip = document.createElement('span');
    toneChip.className = 'premium-chip';
    toneChip.textContent = getPremiumToneLabel(item.tone);
    chips.appendChild(toneChip);

    (Array.isArray(item.tags) ? item.tags : []).forEach((tag) => {
      const chip = document.createElement('span');
      chip.className = 'premium-chip premium-chip--tag';
      chip.textContent = `#${tag}`;
      chips.appendChild(chip);
    });

    const progressWrap = document.createElement('div');
    progressWrap.className = 'premium-progress';
    const reviewCount = Number(item.reviewCount) || 0;
    const targetRepeats = Number(item.targetRepeats) || 3;
    const progressPercent = Math.max(0, Math.min(100, Math.round((reviewCount / targetRepeats) * 100)));
    progressWrap.innerHTML = `<span>復習 ${reviewCount}/${targetRepeats}</span><div class="premium-progress__bar"><div style="width: ${progressPercent}%"></div></div>`;

    const meta = document.createElement('p');
    meta.className = 'premium-memory-item__meta';
    const dueLabel = item.nextReviewAt ? formatDateTime(item.nextReviewAt) : '未設定';
    meta.textContent = `次回復習: ${dueLabel} / 更新: ${formatDateTime(item.updatedAt)}`;

    const actions = document.createElement('div');
    actions.className = 'actions-row premium-memory-item__actions';

    const reviewBtn = document.createElement('button');
    reviewBtn.className = 'btn btn--secondary';
    reviewBtn.type = 'button';
    reviewBtn.dataset.action = 'review-premium-memory';
    reviewBtn.dataset.id = item.id || '';
    reviewBtn.textContent = '復習した';

    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = 'btn btn--secondary';
    favoriteBtn.type = 'button';
    favoriteBtn.dataset.action = 'favorite-premium-memory';
    favoriteBtn.dataset.id = item.id || '';
    favoriteBtn.textContent = item.isFavorite ? 'お気に入り解除' : 'お気に入り';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn--secondary';
    editBtn.type = 'button';
    editBtn.dataset.action = 'edit-premium-memory';
    editBtn.dataset.id = item.id || '';
    editBtn.textContent = '編集';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn--secondary';
    deleteBtn.type = 'button';
    deleteBtn.dataset.action = 'delete-premium-memory';
    deleteBtn.dataset.id = item.id || '';
    deleteBtn.textContent = '削除';

    const duplicateBtn = document.createElement('button');
    duplicateBtn.className = 'btn btn--secondary';
    duplicateBtn.type = 'button';
    duplicateBtn.dataset.action = 'duplicate-premium-memory';
    duplicateBtn.dataset.id = item.id || '';
    duplicateBtn.textContent = '複製';

    actions.append(reviewBtn, favoriteBtn, editBtn, duplicateBtn, deleteBtn);
    li.append(title, text, note, chips, progressWrap, meta, actions);
    premiumMemoryList.appendChild(li);
  });
}

function startPremiumMemoryEdit(memoryId) {
  const target = premiumMemoriesCache.find((item) => item.id === memoryId);
  if (!target || !premiumMemoryForm) return;

  premiumEditingId = memoryId;
  if (premiumMemoryTitle) premiumMemoryTitle.value = target.title || '';
  if (premiumMemoryText) premiumMemoryText.value = target.text || '';
  if (premiumMemoryNote) premiumMemoryNote.value = target.note || '';
  if (premiumMemoryTags) premiumMemoryTags.value = Array.isArray(target.tags) ? target.tags.join(', ') : '';
  if (premiumMemoryTone) premiumMemoryTone.value = target.tone || 'free';
  if (premiumMemoryTarget) premiumMemoryTarget.value = String(Number(target.targetRepeats) || 3);
  if (premiumMemorySubmitBtn) premiumMemorySubmitBtn.textContent = '編集内容を保存';
  if (premiumMemoryCancelEditBtn) premiumMemoryCancelEditBtn.hidden = false;
  premiumMemoryForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function loadPremiumMemories() {
  if (!premiumMemoryList || !premiumStatus) return;
  if (!currentSessionUser) {
    resetPremiumEditorState();
    premiumStatus.textContent = 'ログインするとプレミアム保存を使えます。';
    premiumMemoryList.innerHTML = '<li>ログインすると保存済みの文章が表示されます。</li>';
    premiumMemoriesCache = [];
    updatePremiumStats([]);
    resetPremiumDashboard();
    if (premiumMemoryForm) premiumMemoryForm.hidden = true;
    if (premiumSearchInput) premiumSearchInput.disabled = true;
    if (premiumFilterSelect) premiumFilterSelect.disabled = true;
    if (premiumSortSelect) premiumSortSelect.disabled = true;
    if (premiumCheckoutBtn) {
      premiumCheckoutBtn.hidden = false;
      premiumCheckoutBtn.disabled = false;
      premiumCheckoutBtn.textContent = '有料プランに登録する (月額 480円)';
    }
    return;
  }

  const premiumEnabled = Boolean(currentSessionUser.premiumEnabled || currentSessionUser.plan === 'premium');
  if (premiumMemoryForm) premiumMemoryForm.hidden = !premiumEnabled;
  if (premiumSearchInput) premiumSearchInput.disabled = !premiumEnabled;
  if (premiumFilterSelect) premiumFilterSelect.disabled = !premiumEnabled;
  if (premiumSortSelect) premiumSortSelect.disabled = !premiumEnabled;
  if (premiumCheckoutBtn) {
    premiumCheckoutBtn.hidden = premiumEnabled;
    premiumCheckoutBtn.disabled = false;
    premiumCheckoutBtn.textContent = '有料プランに登録する (月額 480円)';
  }
  if (!premiumEnabled) {
    resetPremiumEditorState();
    premiumStatus.textContent = '無料プランです。下のボタンから有料登録するとプレミアム保存を利用できます。';
    premiumMemoryList.innerHTML = '<li>プレミアムプランのユーザーだけが文章を保存できます。</li>';
    premiumMemoriesCache = [];
    updatePremiumStats([]);
    resetPremiumDashboard();
    return;
  }

  premiumStatus.textContent = 'プレミアム保存を読み込み中...';
  try {
    const response = await fetch('/api/premium/memories');
    const memories = response.ok ? await response.json() : [];
    premiumMemoriesCache = Array.isArray(memories)
      ? [...memories]
      : [];
    renderPremiumMemories(premiumMemoriesCache);
    premiumStatus.textContent = 'あなた専用の作文集です。追加・編集・復習で品質を高めましょう。';
  } catch (error) {
    premiumStatus.textContent = '保存データの読み込みに失敗しました。';
    premiumMemoryList.innerHTML = '<li>保存データを読み込めませんでした。</li>';
    premiumMemoriesCache = [];
    updatePremiumStats([]);
    resetPremiumDashboard();
  }
}

async function startPremiumCheckout() {
  if (!premiumStatus) return;
  if (!currentSessionUser) {
    premiumStatus.textContent = '先にGoogleログインしてください。';
    return;
  }
  if (currentSessionUser.premiumEnabled || currentSessionUser.plan === 'premium') {
    premiumStatus.textContent = 'すでにプレミアムプランです。';
    return;
  }

  if (premiumCheckoutBtn) {
    premiumCheckoutBtn.disabled = true;
    premiumCheckoutBtn.textContent = '決済ページを作成中...';
  }
  premiumStatus.textContent = '決済ページへ移動します...';

  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) {
      premiumStatus.textContent = data.error || '決済ページの作成に失敗しました。';
      if (premiumCheckoutBtn) {
        premiumCheckoutBtn.disabled = false;
        premiumCheckoutBtn.textContent = '有料プランに登録する (月額 480円)';
      }
      return;
    }

    window.location.href = data.url;
  } catch (error) {
    premiumStatus.textContent = '決済ページへの移動中にエラーが発生しました。';
    if (premiumCheckoutBtn) {
      premiumCheckoutBtn.disabled = false;
      premiumCheckoutBtn.textContent = '有料プランに登録する (月額 480円)';
    }
  }
}

async function submitPremiumMemory(event) {
  event.preventDefault();
  if (!premiumMemoryForm || !premiumMemoryText || !premiumStatus) return;

  const premiumEnabled = Boolean(currentSessionUser?.premiumEnabled || currentSessionUser?.plan === 'premium');
  if (!currentSessionUser) {
    premiumStatus.textContent = 'ログインしてください。';
    return;
  }
  if (!premiumEnabled) {
    premiumStatus.textContent = '無料プランでは保存できません。';
    return;
  }

  const title = String(premiumMemoryTitle?.value || '').trim();
  const text = String(premiumMemoryText.value || '').trim();
  const note = String(premiumMemoryNote?.value || '').trim();
  const tags = parsePremiumTagsInput(premiumMemoryTags?.value || '');
  const tone = String(premiumMemoryTone?.value || 'free').trim();
  const targetRepeats = Number(premiumMemoryTarget?.value) || 3;
  if (!text) {
    premiumStatus.textContent = '文章を入力してください。';
    return;
  }

  if (premiumMemorySubmitBtn) premiumMemorySubmitBtn.disabled = true;
  premiumStatus.textContent = '保存中...';
  try {
    const isEditing = Boolean(premiumEditingId);
    const endpoint = isEditing
      ? `/api/premium/memories/${encodeURIComponent(premiumEditingId)}`
      : '/api/premium/memories';
    const response = await fetch(endpoint, {
      method: isEditing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, text, note, tags, tone, targetRepeats }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      premiumStatus.textContent = data.error || '保存に失敗しました。';
      return;
    }

    resetPremiumEditorState();
    premiumStatus.textContent = isEditing
      ? '作文を更新しました。'
      : '作文を保存しました。くり返し復習できます。';
    await loadPremiumMemories();
  } catch (error) {
    premiumStatus.textContent = '保存中にエラーが発生しました。';
  } finally {
    if (premiumMemorySubmitBtn) premiumMemorySubmitBtn.disabled = false;
  }
}

async function handlePremiumMemoryAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button || !currentSessionUser) return;
  const action = button.dataset.action;
  const memoryId = button.dataset.id;
  if (!memoryId) return;

  const premiumEnabled = Boolean(currentSessionUser.premiumEnabled || currentSessionUser.plan === 'premium');
  if (!premiumEnabled) return;

  try {
    if (action === 'review-premium-memory') {
      await fetch(`/api/premium/memories/${encodeURIComponent(memoryId)}/review`, { method: 'POST' });
      await loadPremiumMemories();
      return;
    }
    if (action === 'favorite-premium-memory') {
      const target = premiumMemoriesCache.find((item) => item.id === memoryId);
      await fetch(`/api/premium/memories/${encodeURIComponent(memoryId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !Boolean(target?.isFavorite) }),
      });
      await loadPremiumMemories();
      return;
    }
    if (action === 'edit-premium-memory') {
      startPremiumMemoryEdit(memoryId);
      return;
    }
    if (action === 'duplicate-premium-memory') {
      const target = premiumMemoriesCache.find((item) => item.id === memoryId);
      if (!target) return;
      const copyTitle = target.title
        ? `${target.title} (複製)`
        : '複製した作文';
      const response = await fetch('/api/premium/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: copyTitle.slice(0, 80),
          text: target.text || '',
          note: target.note || '',
          tags: Array.isArray(target.tags) ? target.tags : [],
          tone: target.tone || 'free',
          targetRepeats: Number(target.targetRepeats) || 3,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (premiumStatus) premiumStatus.textContent = data.error || '複製に失敗しました。';
        return;
      }
      if (premiumStatus) premiumStatus.textContent = '作文を複製しました。テンプレートとして編集できます。';
      await loadPremiumMemories();
      return;
    }
    if (action === 'delete-premium-memory') {
      await fetch(`/api/premium/memories/${encodeURIComponent(memoryId)}`, { method: 'DELETE' });
      if (premiumEditingId === memoryId) {
        resetPremiumEditorState();
      }
      await loadPremiumMemories();
    }
  } catch (error) {
    if (premiumStatus) premiumStatus.textContent = '保存データの更新に失敗しました。';
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
  progressState.grammarProgress = progressState.grammarProgress || {};
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
  renderGrammarCatalog();
}

async function syncProgressToServer() {
  if (!currentSessionUser) {
    return;
  }
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
  if (!reviewList) return;
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

function isCurrentUserPremium() {
  return Boolean(currentSessionUser && (currentSessionUser.premiumEnabled || currentSessionUser.plan === 'premium'));
}

async function startSession() {
  currentPracticeMode = getSelectedPracticeMode();
  const selectedGrammar = currentPracticeMode === 'grammar' ? getSelectedGrammar() : null;
  currentLevel = currentPracticeMode === 'grammar'
    ? (selectedGrammar?.level || levelSelect.value)
    : levelSelect.value;
  if (currentPracticeMode === 'grammar' && !selectedGrammar) {
    updateAiStatus('文法リストの読み込み後に開始してください。', false);
    return;
  }
  const count = getSessionQuestionCount(questionCountSelect.value);
  sessionWrongQuestions = [];
  startBtn.disabled = true;
  startBtn.textContent = '生成中...';
  updateAiStatus(
    currentPracticeMode === 'grammar'
      ? `${selectedGrammar.grammar} の問題を生成しています...`
      : '翻訳問題を生成しています...',
    false,
  );
  currentQuestions = [];
  currentIndex = 0;
  feedbackBox.hidden = true;
  if (sessionResultBox) sessionResultBox.hidden = true;
  hintBox.hidden = true;
  if (followUpBox) followUpBox.hidden = true;
  clearChatTranscript();
  replyTranscriptLastTurn = -1;
  answerInput.value = '';

  try {
    const generated = [];
    for (let i = 0; i < count; i += 1) {
      generated.push(await generateQuestion());
    }
    currentQuestions = generated;
    updateAiStatus(
      currentPracticeMode === 'grammar'
        ? `${selectedGrammar.grammar} のトレーニングを始めます。`
        : '日本語→韓国語トレーニングを始めます。',
      true,
    );
  } catch (error) {
    if (currentPracticeMode === 'grammar') {
      const fallback = getSelectedGrammar();
      currentQuestions = Array.from({ length: count }, () => ({
        prompt: fallback?.sampleJapanese || '週末に友達と韓国語で話したいです。',
        answer: fallback?.sampleAnswer || '주말에 친구와 한국어로 이야기하고 싶어요.',
        hint: fallback?.hint || '指定文法の型を含めて作文しましょう。',
        mode: 'grammar',
        targetGrammar: fallback?.grammar || '',
        grammarId: fallback?.id || '',
        source: 'fallback',
      }));
    } else {
      currentQuestions = Array.from({ length: count }, () => {
        const fallback = questionBank[currentLevel][Math.floor(Math.random() * questionBank[currentLevel].length)];
        return { ...fallback, mode: 'translation', source: 'fallback' };
      });
    }
    updateAiStatus('AI生成に失敗したため、サンプル問題で進めます。', false);
  }

  showQuestion();
  startBtn.disabled = false;
  startBtn.textContent = 'セッション開始';
}

function hasMismatchByKeyword(prompt, answer) {
  const promptText = String(prompt || '').trim();
  const answerText = String(answer || '').trim();
  if (!promptText || !answerText) return false;
  const tokens = promptText.split(/\s+/).filter(Boolean).slice(0, 3);
  if (!tokens.length) return false;
  return tokens.every((token) => !answerText.includes(token));
}

async function generateQuestion() {
  const selectedGrammar = currentPracticeMode === 'grammar' ? getSelectedGrammar() : null;
  try {
    const response = await fetch('/api/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: currentLevel,
        mode: currentPracticeMode,
        grammarId: selectedGrammar?.id || '',
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (response.ok && data && data.japanese_question && data.model_answer) {
      return {
        prompt: data.japanese_question,
        answer: data.model_answer,
        hint: data.hint || selectedGrammar?.meaning || '',
        mode: currentPracticeMode,
        targetGrammar: currentPracticeMode === 'grammar' ? (data.target_grammar || selectedGrammar?.grammar || '') : '',
        grammarId: currentPracticeMode === 'grammar' ? (data.grammar_id || selectedGrammar?.id || '') : '',
        source: 'ai',
      };
    }
  } catch (error) {
    console.warn('AI generation failed', error);
  }

  if (currentPracticeMode === 'grammar') {
    return {
      prompt: selectedGrammar?.sampleJapanese || '韓国に行って韓国語をもっと上手に話したいです。',
      answer: selectedGrammar?.sampleAnswer || '한국에 가서 한국어를 더 잘 말하고 싶어요.',
      hint: selectedGrammar?.hint || '指定文法の型を使って作文してください。',
      mode: 'grammar',
      targetGrammar: selectedGrammar?.grammar || '',
      grammarId: selectedGrammar?.id || '',
      source: 'fallback',
    };
  }

  const fallback = questionBank[currentLevel][Math.floor(Math.random() * questionBank[currentLevel].length)];
  return { ...fallback, mode: 'translation', source: 'fallback' };
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

  if (scenarioText) {
    scenarioText.hidden = true;
    scenarioText.textContent = '';
  }
  promptText.textContent = question.prompt || '日本語のお題を表示できませんでした。';

  if (imagePromptBox) imagePromptBox.hidden = true;
  if (chatTranscript) {
    chatTranscript.hidden = true;
    chatTranscript.classList.remove('chat-transcript--reply');
  }

  if (promptLabel) {
    promptLabel.textContent = '日本語のお題';
  }
  if (nextBtn) {
    nextBtn.textContent = '次の問題へ';
  }

  if (targetGrammarBanner && targetGrammarLabel) {
    if (currentPracticeMode === 'grammar') {
      targetGrammarBanner.hidden = false;
      targetGrammarLabel.textContent = question.targetGrammar || getSelectedGrammar()?.grammar || '-';
    } else {
      targetGrammarBanner.hidden = true;
      targetGrammarLabel.textContent = '-';
    }
  }

  progressBadge.textContent = `${currentIndex + 1} / ${currentQuestions.length}`;
  levelBadge.textContent = getLevelLabel(currentLevel);
  hintBox.hidden = true;
  feedbackBox.hidden = true;
  if (sessionResultBox) sessionResultBox.hidden = true;
  if (followUpBox) followUpBox.hidden = true;
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
  const importantWords = String(question.answer || '')
    .split(/\s+/)
    .map((word) => word.trim().replace(/[.,!?]/g, ''))
    .filter((word) => /[가-힣]/.test(word))
    .filter((word, index, list) => word.length >= 2 && list.indexOf(word) === index)
    .slice(0, 4);

  hintBox.hidden = false;
  hintBox.textContent = importantWords.length
    ? `ヒント: ${question.hint}\n重要単語: ${importantWords.join(', ')}`
    : `ヒント: ${question.hint}`;
}

async function autoSaveGrammarMistakeLog(question, userAnswer, correctedText, status, grammarUsed, score) {
  if (!currentSessionUser || status === '正解') return;
  const premiumEnabled = Boolean(currentSessionUser.premiumEnabled || currentSessionUser.plan === 'premium');
  if (!premiumEnabled) return;

  const grammar = question.targetGrammar || getSelectedGrammar()?.grammar || '文法別作文';
  const grammarKey = question.grammarId || selectedGrammarId || 'unknown-grammar';
  const title = `[誤答ログ] ${grammar}`.slice(0, 80);
  const userText = String(userAnswer || '').trim().replace(/\s+/g, ' ');
  const modelText = String(correctedText || question.answer || '').trim().replace(/\s+/g, ' ');
  const sourceKey = `${grammarKey}::${normalizePromptKey(question.prompt)}`.slice(0, 160);
  const sourceDateKey = getTodayKey();
  const noteLines = [
    `お題: ${String(question.prompt || '').trim()}`,
    `あなたの回答: ${userText || '（未入力）'}`,
    `結果: ${status} / ${score}点`,
    `文法使用: ${grammarUsed === false ? '未使用' : '使用'}`,
  ];
  const note = noteLines.join(' / ').slice(0, 220);

  try {
    await fetch('/api/premium/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        text: modelText.slice(0, 280),
        note,
        tags: ['誤答ログ', '文法別作文', grammar],
        tone: 'exam',
        targetRepeats: 4,
        sourceType: 'grammar-mistake',
        sourceKey,
        sourceDateKey,
      }),
    });
  } catch (error) {
    console.warn('Failed to auto-save grammar mistake log', error);
  }
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
  let grammarUsed = null;
  let grammarFeedback = '';

  try {
    const response = await fetch('/api/score-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: question.prompt,
        situation: question.situation || '',
        modelAnswer: question.answer,
        userAnswer,
        level: currentLevel,
        mode: currentPracticeMode,
        targetGrammar: currentPracticeMode === 'grammar' ? (question.targetGrammar || '') : '',
        grammarId: currentPracticeMode === 'grammar' ? (question.grammarId || selectedGrammarId) : '',
      }),
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
      grammarUsed = typeof data.grammarUsed === 'boolean' ? data.grammarUsed : null;
      grammarFeedback = String(data.grammarFeedback || '').trim();
      modelAnswerText = correctedText;
    }
  } catch (error) {
    console.warn('AI scoring failed', error);
  }

  const similarity = similarityRatio(normalizedUser, normalizedExpected);
  if (normalizedUser === normalizedExpected) {
    status = '正解';
    score = Math.max(score, 100);
    feedback = '自然な韓国語です。';
  } else if (similarity >= 0.7) {
    status = status === '不正解' ? '惜しい' : status;
    score = Math.max(score, 72);
  }

  if (currentPracticeMode === 'grammar' && grammarUsed === false && score >= 90) {
    status = '惜しい';
    score = 84;
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
  if (currentPracticeMode === 'grammar') {
    const grammarProgress = progressState.grammarProgress || {};
    const grammarKey = question.grammarId || selectedGrammarId;
    if (grammarKey) {
      const current = grammarProgress[grammarKey] || { solved: 0, correct: 0, achievedAt: '' };
      current.solved += 1;
      if (status === '正解') current.correct += 1;
      if (current.solved >= 10 && !current.achievedAt) {
        current.achievedAt = new Date().toISOString();
      }
      grammarProgress[grammarKey] = current;
      progressState.grammarProgress = grammarProgress;
    }
    await autoSaveGrammarMistakeLog(question, userAnswer, correctedText, status, grammarUsed, score);
  }
  saveProgress();
  updateProgressUI();
  renderGrammarCatalog();

  feedbackStatus.textContent = status;
  feedbackStatus.className = `feedback-status ${statusClass}`;
  feedbackText.textContent = `採点: ${score}点`;
  modelAnswerBox.innerHTML = `<strong>模範解答</strong><div>${modelAnswerText}</div>`;
  const grammarLine = currentPracticeMode === 'grammar'
    ? `\n\n文法チェック: ${grammarFeedback || (grammarUsed === false ? '指定文法の使用が確認できませんでした。' : '指定文法の使用は概ね確認できました。')}`
    : '';
  feedbackExplanation.textContent = `${feedback}${grammarLine}\n\n${structureAdvice}\n\n${explanation}\n\n修正案: ${correctedText}`;
  alternatives.innerHTML = '';
  alternativesList.forEach((item) => {
    const chip = document.createElement('span');
    chip.textContent = item;
    alternatives.appendChild(chip);
  });
  if (followUpBox) {
    followUpBox.hidden = true;
  }
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
      const premiumEnabled = isCurrentUserPremium();
      retryWrongBtn.hidden = !premiumEnabled;
      retryWrongBtn.disabled = wrong === 0 || !premiumEnabled;
      if (!premiumEnabled && wrong > 0 && sessionResultText) {
        sessionResultText.textContent += ' 間違えた問題の再挑戦はプレミアム機能です。';
      }
    }
    if (sessionResultBox) {
      sessionResultBox.hidden = false;
    }
  }
}

function retryWrongQuestions() {
  if (!isCurrentUserPremium()) {
    updateAiStatus('間違えた問題の再挑戦はプレミアム機能です。', false);
    return;
  }
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
  currentPracticeMode = 'grammar';
  const selected = getSelectedGrammar();
  currentQuestions = [{
    prompt: item.prompt,
    answer: item.answer,
    hint: item.hint,
    source: 'review',
    mode: 'grammar',
    targetGrammar: selected?.grammar || '',
    grammarId: selected?.id || selectedGrammarId,
  }];
  currentIndex = 0;
  currentLevel = selected?.level || 'beginner';
  showQuestion();
  updateAiStatus('復習候補を表示しました。', false);
}

startBtn.addEventListener('click', startSession);
submitBtn.addEventListener('click', evaluateAnswer);
hintBtn.addEventListener('click', showHint);
nextBtn.addEventListener('click', goToNextQuestion);
if (speakBtn) {
  speakBtn.addEventListener('click', speakFeedbackText);
}
if (shareBtn) {
  shareBtn.addEventListener('click', shareToX);
}
if (reviewBtn) {
  reviewBtn.addEventListener('click', () => {
    renderReviewList();
    updateAiStatus('復習候補を更新しました。', false);
  });
}

if (registerForm) {
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
      await refreshAuthState();
      await applyServerProgressIfAvailable();
      await syncProgressToServer();
    } else {
      const data = await response.json();
      authStatus.textContent = data.error || '登録できませんでした';
    }
  });
}

if (feedbackForm) {
  feedbackForm.addEventListener('submit', submitFeedbackComment);
}

if (premiumMemoryForm) {
  premiumMemoryForm.addEventListener('submit', submitPremiumMemory);
}

if (premiumMemoryList) {
  premiumMemoryList.addEventListener('click', handlePremiumMemoryAction);
}

if (premiumMemoryCancelEditBtn) {
  premiumMemoryCancelEditBtn.addEventListener('click', () => {
    resetPremiumEditorState();
    if (premiumStatus) premiumStatus.textContent = '編集をキャンセルしました。';
  });
}

if (premiumSearchInput) {
  premiumSearchInput.addEventListener('input', () => {
    renderPremiumMemories(premiumMemoriesCache);
  });
}

if (premiumFilterSelect) {
  premiumFilterSelect.addEventListener('change', () => {
    renderPremiumMemories(premiumMemoriesCache);
  });
}

if (premiumSortSelect) {
  premiumSortSelect.addEventListener('change', () => {
    renderPremiumMemories(premiumMemoriesCache);
  });
}

if (grammarCatalog) {
  grammarCatalog.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-grammar-id]');
    if (!button) return;
    selectGrammar(button.dataset.grammarId || '');
  });
}

if (premiumCheckoutBtn) {
  premiumCheckoutBtn.addEventListener('click', startPremiumCheckout);
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

if (topLogoutBtn) {
  topLogoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    currentSessionUser = null;
    renderAuthProfile(null);
    if (googleAuthStatus) {
      googleAuthStatus.textContent = 'ログアウトしました。';
    }
    if (authStatus) {
      authStatus.textContent = '未ログインです。Googleログインで進捗を保存できます。';
    }
    await loadPremiumMemories();
  });
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

  if (practiceModeSelect) {
    practiceModeSelect.addEventListener('change', syncPracticeModeUi);
  }

  loadProgress();
  selectedGrammarId = progressState.selectedGrammarId || selectedGrammarId;
  loadGrammarMasterList();
  refreshAuthState().then(applyServerProgressIfAvailable);
  initGoogleSignIn();
  loadFeedbackComments();
  updateAiStatus('AI接続状態を確認しています...', false);
  applyPracticeQueryParams();
});
