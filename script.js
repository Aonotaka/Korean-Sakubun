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

function fillTemplate(template, replacements) {
  return template.replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? '');
}

function buildBeginnerBank(count) {
  const templates = [
    '明日、{place}に行きます。',
    '今、{drink}を飲んでいます。',
    '私は{place}で{activity}します。',
    '今日は{weather}です。',
    '弟は{place}へ行きます。',
    '私は{food}を食べます。',
    '彼は{place}で{activity2}します。',
    'この{item}は{quality}です。',
  ];

  const places = ['学校', '駅', 'スーパー', '公園', '図書館', '病院', 'カフェ', 'コンビニ', '映画館', '海'];
  const placeKorean = ['학교', '역', '슈퍼마켓', '공원', '도서관', '병원', '카페', '편의점', '영화관', '바다'];
  const drinks = ['コーヒー', 'お茶', 'ジュース', '水', 'ミルク'];
  const drinkKorean = ['커피', '차', '주스', '물', '우유'];
  const activities = ['勉強', '買い物', '散歩', '昼ごはんを食べ', '読書'];
  const activityKorean = ['공부해', '장봐', '산책해', '점심을 먹어', '독서해'];
  const activityVariants = ['勉強', '会話', '料理', '運動', '宿題'];
  const activityVariantKorean = ['공부해', '대화해', '요리해', '운동해', '숙제해'];
  const weathers = ['雨', '晴れ', '曇り', '雪', '風が強い'];
  const weatherKorean = ['비가 와요', '맑아요', '흐려요', '눈이 와요', '바람이 세요'];
  const foods = ['パン', 'ラーメン', '寿司', 'カレー', 'アイス'];
  const foodKorean = ['빵', '라면', '초밥', '카레', '아이스크림'];
  const items = ['ケーキ', '本', '椅子', 'シャツ', '傘'];
  const itemKorean = ['케이크', '책', '의자', '셔츠', '우산'];
  const qualities = ['おいしい', '新しい', '大きい', '小さい', '便利です'];
  const qualityKorean = ['맛있어요', '새로워요', '커요', '작아요', '편리해요'];

  const bank = [];
  for (let i = 0; i < count; i += 1) {
    const template = templates[i % templates.length];
    const replacements = {
      place: places[(i + 1) % places.length],
      placeKo: placeKorean[(i + 1) % placeKorean.length],
      drink: drinks[(i + 2) % drinks.length],
      drinkKo: drinkKorean[(i + 2) % drinkKorean.length],
      activity: activities[(i + 3) % activities.length],
      activityKo: activityKorean[(i + 3) % activityKorean.length],
      activity2: activityVariants[(i + 4) % activityVariants.length],
      activity2Ko: activityVariantKorean[(i + 4) % activityVariantKorean.length],
      weather: weathers[(i + 5) % weathers.length],
      weatherKo: weatherKorean[(i + 5) % weatherKorean.length],
      food: foods[(i + 6) % foods.length],
      foodKo: foodKorean[(i + 6) % foodKorean.length],
      item: items[(i + 7) % items.length],
      itemKo: itemKorean[(i + 7) % itemKorean.length],
      quality: qualities[(i + 8) % qualities.length],
      qualityKo: qualityKorean[(i + 8) % qualityKorean.length],
    };

    const prompt = fillTemplate(template, replacements);
    const answer = fillTemplate(template.replace(/に|で|へ|は|を|です|します|行きます|飲んでいます|食べます/g, ''), replacements);
    const hint = '基本文型を意識して、助詞や語尾を確認しましょう。';
    bank.push({ prompt, answer: template.includes('今日は') ? `오늘은 ${replacements.weatherKo}.` : template.includes('今、') ? `지금 ${replacements.drinkKo}를 마시고 있어요.` : template.includes('明日、') ? `내일 ${replacements.placeKo}에 가요.` : template.includes('私は') && template.includes('食べ') ? `저는 ${replacements.foodKo}를 먹어요.` : template.includes('この') ? `이 ${replacements.itemKo}는 ${replacements.qualityKo}.` : `저는 ${replacements.placeKo}에서 ${replacements.activityKo}요.`, hint });
  }

  return bank;
}

function buildIntermediateBank(count) {
  const templates = [
    '昨日、{place}で{activity}しました。',
    'もし{condition}なら、{action}します。',
    '最近、{topic}が好きです。',
    '風が{quality}ので、{result}。',
    'この店では、{item}が{quality2}です。',
    '会議は{time}から始まります。',
    'この道を{direction}に曲がると、{place2}があります。',
    '試験の前に、{activity2}しました。',
  ];

  const places = ['図書館', 'スーパー', '駅前', '病院', 'カフェ'];
  const placeKorean = ['도서관', '슈퍼마켓', '역 앞', '병원', '카페'];
  const activities = ['本を借り', '料理を作り', '友達と話し', '勉強し', '相談し'];
  const activityKorean = ['책을 빌려', '요리를 만들고', '친구와 이야기해', '공부해', '상담해'];
  const conditions = ['時間があれば', '雨が降れば', 'お金があれば'];
  const conditionKorean = ['시간이 있으면', '비가 오면', '돈이 있으면'];
  const actions = ['電話します', '散歩します', '映画を見ます'];
  const actionKorean = ['전화할게요', '산책할게요', '영화를 볼게요'];
  const topics = ['韓国ドラマ', '韓国料理', '旅行', '音楽'];
  const topicKorean = ['한국 드라마', '한국 음식', '여행', '음악'];
  const qualities = ['強い', '弱い', '長い'];
  const qualityKorean = ['세서', '약해서', '길어서'];
  const results = ['外に出られません', '早めに帰ります', '予定を変更します'];
  const resultKorean = ['밖에 나갈 수 없어요', '일찍 돌아가요', '일정을 바꿔요'];
  const items = ['料理', 'ケーキ', 'コーヒー'];
  const itemKorean = ['음식', '케이크', '커피'];
  const quality2 = ['おいしい', '高い', '人気です'];
  const quality2Korean = ['맛있어요', '비싸요', '인기 있어요'];
  const times = ['十時', '午後三時', '九時'];
  const timeKorean = ['열 시', '오후 세 시', '아홉 시'];
  const directions = ['右', '左', 'まっすぐ'];
  const directionKorean = ['오른쪽', '왼쪽', '곧장'];
  const place2 = ['駅', '郵便局', '交差点'];
  const place2Korean = ['역', '우체국', '교차로'];
  const activity2 = ['しっかり復習', '資料を整理', '予定を確認'];
  const activity2Korean = ['열심히 복습', '자료를 정리', '일정을 확인'];

  const bank = [];
  for (let i = 0; i < count; i += 1) {
    const template = templates[i % templates.length];
    const replacements = {
      place: places[(i + 1) % places.length],
      placeKo: placeKorean[(i + 1) % placeKorean.length],
      activity: activities[(i + 2) % activities.length],
      activityKo: activityKorean[(i + 2) % activityKorean.length],
      condition: conditions[(i + 3) % conditions.length],
      conditionKo: conditionKorean[(i + 3) % conditionKorean.length],
      action: actions[(i + 4) % actions.length],
      actionKo: actionKorean[(i + 4) % actionKorean.length],
      topic: topics[(i + 5) % topics.length],
      topicKo: topicKorean[(i + 5) % topicKorean.length],
      quality: qualities[(i + 6) % qualities.length],
      qualityKo: qualityKorean[(i + 6) % qualityKorean.length],
      result: results[(i + 7) % results.length],
      resultKo: resultKorean[(i + 7) % resultKorean.length],
      item: items[(i + 8) % items.length],
      itemKo: itemKorean[(i + 8) % itemKorean.length],
      quality2: quality2[(i + 9) % quality2.length],
      quality2Ko: quality2Korean[(i + 9) % quality2Korean.length],
      time: times[(i + 10) % times.length],
      timeKo: timeKorean[(i + 10) % timeKorean.length],
      direction: directions[(i + 11) % directions.length],
      directionKo: directionKorean[(i + 11) % directionKorean.length],
      place2: place2[(i + 12) % place2.length],
      place2Ko: place2Korean[(i + 12) % place2Korean.length],
      activity2: activity2[(i + 13) % activity2.length],
      activity2Ko: activity2Korean[(i + 13) % activity2Korean.length],
    };

    const prompt = fillTemplate(template, replacements);
    const answer = fillTemplate(template.includes('最近') ? `요즘 ${replacements.topicKo}를 좋아해요.` : template.includes('風が') ? `바람이 ${replacements.qualityKo} ${replacements.resultKo}.` : template.includes('会議は') ? `회의는 ${replacements.timeKo}부터 시작해요.` : template.includes('この道') ? `이 길을 ${replacements.directionKo}으로 가면 ${replacements.place2Ko}가 있어요.` : template.includes('試験の前') ? `${replacements.activity2Ko}했어요.` : `어제 ${replacements.placeKo}에서 ${replacements.activityKo}했어요.`, replacements);
    const hint = '接続詞や時制の違いに注目しましょう。';
    bank.push({ prompt, answer, hint });
  }

  return bank;
}

function buildAdvancedBank(count) {
  const templates = [
    '彼は、自分の{noun}を{adverb}に{verb}ことができた。',
    'この問題は、{comparison}より{status}だった。',
    '会議の前に、{noun2}を{verb2}しておいた。',
    '彼女は自分の{noun3}を{adverb2}と伝えることができた。',
    'この結果は、{expectation}以上に{status2}だった。',
    '彼はその{noun4}を{verb3}ずに、すぐに{action}した。',
    '彼らは長い間、同じ{noun5}に向かって{verb4}してきた。',
    'その{noun6}は、{context}に大きな{impact}をもたらす可能性がある。',
  ];

  const nouns = ['失敗', '意見', '責任', '考え方', '判断'];
  const nounKorean = ['실수', '의견', '책임', '생각 방식', '판단'];
  const adverbs = ['素直', '冷静', '正直'];
  const adverbKorean = ['솔직하게', '냉정하게', '정직하게'];
  const verbs = ['認める', '受け止める', '整理する'];
  const verbKorean = ['인정할', '받아들일', '정리할'];
  const comparisons = ['予想', '思ったこと', '当初の見込み'];
  const comparisonKorean = ['예상', '생각했던 것', '당초 예상'];
  const statuses = ['難しかった', '簡単だった', '複雑だった'];
  const statusKorean = ['어려웠다', '쉽었다', '복잡했다'];
  const noun2 = ['重要な資料', '提出書類', '連絡事項'];
  const noun2Korean = ['중요한 자료', '제출 서류', '연락 사항'];
  const verb2 = ['確認', '整理', '印刷'];
  const verb2Korean = ['확인', '정리', '인쇄'];
  const noun3 = ['意見', '考え', '立場'];
  const noun3Korean = ['의견', '생각', '입장'];
  const adverb2 = ['はっきり', '丁寧に', '率直に'];
  const adverb2Korean = ['분명하게', '정중하게', '솔직하게'];
  const expectations = ['予想', '期待', '想定'];
  const expectationKorean = ['예상', '기대', '가정'];
  const status2 = ['良かった', '悪かった', '適切だった'];
  const status2Korean = ['좋았다', '나빴다', '적절했다'];
  const noun4 = ['機会', '約束', '責任'];
  const noun4Korean = ['기회', '약속', '책임'];
  const verb3 = ['逃す', '破る', '放棄する'];
  const verb3Korean = ['놓치지', '지키지', '포기하지'];
  const actions = ['行動に移した', '対応した', '判断した'];
  const actionKorean = ['행동에 옮겼다', '대응했다', '판단했다'];
  const noun5 = ['目標', '価値観', '理想'];
  const noun5Korean = ['목표', '가치관', '이상'];
  const verb4 = ['努力', '前進', '挑戦'];
  const verb4Korean = ['노력해', '전진해', '도전해'];
  const noun6 = ['制度', '政策', '提案'];
  const noun6Korean = ['제도', '정책', '제안'];
  const contexts = ['学問の分野', '社会全体', '地域社会'];
  const contextKorean = ['학문의 분야', '사회 전체', '지역 사회'];
  const impacts = ['影響', '変化', '変革'];
  const impactKorean = ['영향', '변화', '변혁'];

  const bank = [];
  for (let i = 0; i < count; i += 1) {
    const template = templates[i % templates.length];
    const replacements = {
      noun: nouns[(i + 1) % nouns.length],
      nounKo: nounKorean[(i + 1) % nounKorean.length],
      adverb: adverbs[(i + 2) % adverbs.length],
      adverbKo: adverbKorean[(i + 2) % adverbKorean.length],
      verb: verbs[(i + 3) % verbs.length],
      verbKo: verbKorean[(i + 3) % verbKorean.length],
      comparison: comparisons[(i + 4) % comparisons.length],
      comparisonKo: comparisonKorean[(i + 4) % comparisonKorean.length],
      status: statuses[(i + 5) % statuses.length],
      statusKo: statusKorean[(i + 5) % statusKorean.length],
      noun2: noun2[(i + 6) % noun2.length],
      noun2Ko: noun2Korean[(i + 6) % noun2Korean.length],
      verb2: verb2[(i + 7) % verb2.length],
      verb2Ko: verb2Korean[(i + 7) % verb2Korean.length],
      noun3: noun3[(i + 8) % noun3.length],
      noun3Ko: noun3Korean[(i + 8) % noun3Korean.length],
      adverb2: adverb2[(i + 9) % adverb2.length],
      adverb2Ko: adverb2Korean[(i + 9) % adverb2Korean.length],
      expectation: expectations[(i + 10) % expectations.length],
      expectationKo: expectationKorean[(i + 10) % expectationKorean.length],
      status2: status2[(i + 11) % status2.length],
      status2Ko: status2Korean[(i + 11) % status2Korean.length],
      noun4: noun4[(i + 12) % noun4.length],
      noun4Ko: noun4Korean[(i + 12) % noun4Korean.length],
      verb3: verb3[(i + 13) % verb3.length],
      verb3Ko: verb3Korean[(i + 13) % verb3Korean.length],
      action: actions[(i + 14) % actions.length],
      actionKo: actionKorean[(i + 14) % actionKorean.length],
      noun5: noun5[(i + 15) % noun5.length],
      noun5Ko: noun5Korean[(i + 15) % noun5Korean.length],
      verb4: verb4[(i + 16) % verb4.length],
      verb4Ko: verb4Korean[(i + 16) % verb4Korean.length],
      noun6: noun6[(i + 17) % noun6.length],
      noun6Ko: noun6Korean[(i + 17) % noun6Korean.length],
      context: contexts[(i + 18) % contexts.length],
      contextKo: contextKorean[(i + 18) % contextKorean.length],
      impact: impacts[(i + 19) % impacts.length],
      impactKo: impactKorean[(i + 19) % impactKorean.length],
    };

    const prompt = fillTemplate(template, replacements);
    const answer = fillTemplate(template.includes('会議の前') ? `${replacements.noun2Ko}를 ${replacements.verb2Ko}해 두었다.` : template.includes('この結果') ? `이 결과는 ${replacements.expectationKo} 이상으로 ${replacements.status2Ko}.` : template.includes('彼らは') ? `그들은 오랫동안 같은 ${replacements.noun5Ko}를 향해 ${replacements.verb4Ko}해 왔다.` : template.includes('その') && template.includes('可能性') ? `그 ${replacements.noun6Ko}는 ${replacements.contextKo}에 큰 ${replacements.impactKo}를 가져올 가능성이 있다.` : `그는 자신의 ${replacements.nounKo}를 ${replacements.adverbKo}하게 ${replacements.verbKo} 수 있었다.`, replacements);
    const hint = '複雑な語順と接続表現を意識して練習しましょう。';
    bank.push({ prompt, answer, hint });
  }

  return bank;
}

const questionBank = {
  beginner: buildBeginnerBank(200),
  intermediate: buildIntermediateBank(200),
  advanced: buildAdvancedBank(200),
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

async function generateQuestion() {
  try {
    const response = await fetch('/api/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: currentLevel, style: 'short' }),
    });
    const data = await response.json();
    if (data && data.prompt) {
      return { prompt: data.prompt, answer: data.answer, hint: data.hint, source: 'ai' };
    }
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
  const normalizedUser = userAnswer.replace(/\s+/g, '');
  const normalizedExpected = question.answer.replace(/\s+/g, '');

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
      status = data.status || status;
      score = data.score || score;
      feedback = data.feedback || feedback;
      explanation = data.explanation || explanation;
      correctedText = data.correctedText || correctedText;
      alternativesList = data.alternatives || alternativesList;
      modelAnswerText = correctedText;
    }
  } catch (error) {
    console.warn('AI scoring failed', error);
  }

  if (normalizedUser === normalizedExpected) {
    status = '正解';
    statusClass = 'good';
    score = Math.max(score, 100);
    feedback = '自然な韓国語です。文法の選び方も良いです。';
  } else if (
    normalizedUser.includes('가') ||
    normalizedUser.includes('어요') ||
    normalizedUser.includes('니다') ||
    normalizedUser.includes('해요') ||
    normalizedUser.includes('합니다') ||
    normalizedUser.includes('어요')
  ) {
    status = '惜しい';
    statusClass = 'bad';
    score = Math.max(score, 72);
    feedback = '意味は近いですが、語尾・分かち書き・助詞の選び方でさらに自然になります。';
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
