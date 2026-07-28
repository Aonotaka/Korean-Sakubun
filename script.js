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
const progressBadge = document.getElementById('progressBadge');
const levelBadge = document.getElementById('levelBadge');
const sessionStatus = document.getElementById('sessionStatus');
const attemptCount = document.getElementById('attemptCount');
const statusPill = document.createElement('span');
const correctCount = document.getElementById('correctCount');
const streakCount = document.getElementById('streakCount');
const reviewBtn = document.getElementById('reviewBtn');
const reviewList = document.getElementById('reviewList');

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
let progressState = { attempted: 0, correct: 0, streak: 0, reviewQueue: [] };
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

function loadProgress() {
  try {
    const stored = localStorage.getItem(progressKey);
    if (stored) {
      progressState = JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Progress storage unavailable', error);
  }
  updateProgressUI();
}

function saveProgress() {
  localStorage.setItem(progressKey, JSON.stringify(progressState));
}

function updateProgressUI() {
  attemptCount.textContent = progressState.attempted;
  correctCount.textContent = progressState.correct;
  streakCount.textContent = progressState.streak;
  renderReviewList();
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
  startBtn.disabled = true;
  startBtn.textContent = '生成中...';
  updateAiStatus('AIで問題を生成しています...', false);
  currentQuestions = [];
  currentIndex = 0;
  feedbackBox.hidden = true;
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
  showQuestion();
  updateAiStatus(question.source === 'ai' ? 'AI生成の問題を表示しました。' : 'サンプル問題を表示しました。', question.source === 'ai');
}

function showQuestion() {
  const question = currentQuestions[currentIndex];
  if (!question) {
    promptText.textContent = 'お疲れさまでした。もう一度挑戦できます。';
    answerInput.value = '';
    feedbackBox.hidden = true;
    return;
  }

  promptText.textContent = question.prompt;
  progressBadge.textContent = `${currentIndex + 1} / ${currentQuestions.length}`;
  levelBadge.textContent = getLevelLabel(currentLevel);
  hintBox.hidden = true;
  feedbackBox.hidden = true;
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
    }
  } catch (error) {
    console.warn('AI scoring failed', error);
  }

  if (normalizedUser === normalizedExpected) {
    status = '正解';
    statusClass = 'good';
    score = Math.max(score, 100);
    feedback = '自然な韓国語です。文法の選び方も良いです。';
  } else if (normalizedUser.includes('가') || normalizedUser.includes('어요') || normalizedUser.includes('니다')) {
    status = '惜しい';
    statusClass = 'bad';
    score = Math.max(score, 72);
    feedback = '意味は近いですが、語尾や分かち書きの調整でさらに自然になります。';
  }

  progressState.attempted += 1;
  if (status === '正解') {
    progressState.correct += 1;
    progressState.streak += 1;
  } else {
    progressState.streak = 0;
  }
  addReviewItem(question, status);
  saveProgress();
  updateProgressUI();

  feedbackStatus.textContent = status;
  feedbackStatus.className = `feedback-status ${statusClass}`;
  feedbackText.textContent = `採点: ${score}点`;
  feedbackExplanation.textContent = `${feedback}\n\n${explanation}\n\n修正案: ${correctedText}`;
  alternatives.innerHTML = '';
  alternativesList.forEach((item) => {
    const chip = document.createElement('span');
    chip.textContent = item;
    alternatives.appendChild(chip);
  });
  feedbackBox.hidden = false;
}

function goToNextQuestion() {
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex += 1;
    showQuestion();
  } else {
    promptText.textContent = 'お疲れさまでした。もう一度始めることができます。';
    progressBadge.textContent = `${currentQuestions.length} / ${currentQuestions.length}`;
    feedbackBox.hidden = true;
  }
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
reviewBtn.addEventListener('click', () => {
  renderReviewList();
  updateAiStatus('復習候補を更新しました。', false);
});

window.addEventListener('DOMContentLoaded', () => {
  loadProgress();
  updateAiStatus('AI接続状態を確認しています...', false);
  startSession();
});
