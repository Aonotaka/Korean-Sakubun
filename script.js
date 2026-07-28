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

const questionBank = {
  beginner: [
    { prompt: '明日、友達と映画を見に行きます。', answer: '내일 친구랑 영화를 보러 가요.', hint: '「友達と」は 친구랑、「映画」は 영화、「行く」は 가요' },
    { prompt: '今、コーヒーを飲んでいます。', answer: '지금 커피를 마시고 있어요.', hint: '「今」は 지금、「飲んでいます」は 마시고 있어요' },
    { prompt: '私は日本語を勉強しています。', answer: '저는 일본어를 공부하고 있어요.', hint: '「私は」は 저는、「勉強する」は 공부하다' },
    { prompt: '私は毎日朝ごはんを食べます。', answer: '저는 매일 아침밥을 먹어요.', hint: '「毎日」は 매일、「朝ごはん」は 아침밥' },
    { prompt: '今日は雨です。', answer: '오늘은 비가 와요.', hint: '「今日は」は 오늘은、「雨」は 비' },
    { prompt: '弟は学校へ行きます。', answer: '동생은 학교에 가요.', hint: '「弟」は 동생、「学校」は 학교' },
    { prompt: '私はパンを買います。', answer: '저는 빵을 사요.', hint: '「買います」は 사요' },
    { prompt: '彼は韓国語が上手です。', answer: '그는 한국어를 잘해요.', hint: '「上手です」は 잘해요' },
    { prompt: '私はお茶を飲みます。', answer: '저는 차를 마셔요.', hint: '「お茶」は 차' },
    { prompt: '私は駅に行きます。', answer: '저는 역에 가요.', hint: '「駅」は 역' },
    { prompt: '今、何をしていますか。', answer: '지금 무엇을 하고 있나요?', hint: '「何を」は 무엇을' },
    { prompt: 'このケーキはおいしいです。', answer: '이 케이크는 맛있어요.', hint: '「おいしい」は 맛있어요' },
    { prompt: '私は友達に会います。', answer: '저는 친구를 만나요.', hint: '「会います」は 만나요' },
    { prompt: '彼女は図書館で勉強します。', answer: '그녀는 도서관에서 공부해요.', hint: '「図書館」は 도서관' },
    { prompt: '私は毎晩寝ます。', answer: '저는 매일 밤 자요.', hint: '「毎晩」は 매일 밤' },
    { prompt: '明日は休みです。', answer: '내일은 쉬어요.', hint: '「休み」は 쉬다' },
    { prompt: '私は新しい本を読みます。', answer: '저는 새 책을 읽어요.', hint: '「新しい」は 새' },
    { prompt: '今日、買い物に行きます。', answer: '오늘 장 보러 가요.', hint: '「買い物」は 장' },
    { prompt: '私はお腹が空きました。', answer: '저는 배가 고파요.', hint: '「お腹が空いた」は 배가 고프다' },
    { prompt: '彼は一人で帰ります。', answer: '그는 혼자 돌아가요.', hint: '「一人で」は 혼자' }
  ],
  intermediate: [
    { prompt: '昨日、図書館で本を借りました。', answer: '어제 도서관에서 책을 빌렸어요.', hint: '「借りました」は 빌렸어요、「図書館」は 도서관' },
    { prompt: 'もし時間があれば、電話します。', answer: '시간이 있으면 전화할게요.', hint: '「もし」は -면、「時間があれば」は 시간이 있으면' },
    { prompt: '最近、韓国ドラマが好きです。', answer: '요즘 한국 드라마를 좋아해요.', hint: '「最近」は 요즘、「好きです」は 좋아해요' },
    { prompt: '風が強くて、外に出られません。', answer: '바람이 세서 밖에 나갈 수 없어요.', hint: '「風が強い」は 바람이 세다' },
    { prompt: 'この店では、いつもおいしい料理が食べられます。', answer: '이 가게에서는 항상 맛있는 음식을 먹을 수 있어요.', hint: '「料理」は 음식' },
    { prompt: '彼は昨日、早めに寝ました。', answer: '그는 어제 일찍 잤어요.', hint: '「早めに」は 일찍' },
    { prompt: '私は部屋を少し整理しました。', answer: '저는 방을 조금 정리했어요.', hint: '「整理する」は 정리하다' },
    { prompt: 'もうすぐ雨が止みそうです。', answer: '곧 비가 그칠 것 같아요.', hint: '「止みそう」は 그칠 것 같다' },
    { prompt: '会議は十時から始まります。', answer: '회의는 열 시부터 시작해요.', hint: '「会議」は 회의' },
    { prompt: 'この道を右に曲がると、駅があります。', answer: '이 길을 오른쪽으로 가면 역이 있어요.', hint: '「曲がる」は 돌아가다' },
    { prompt: '娘はまだ小学生です。', answer: '딸은 아직 초등학생이에요.', hint: '「小学生」は 초등학생' },
    { prompt: '私は昨日、友達とランチをしました。', answer: '저는 어제 친구와 점심을 먹었어요.', hint: '「ランチ」は 점심' },
    { prompt: '試験の前に、しっかり復習しました。', answer: '시험 전에 열심히 복습했어요.', hint: '「復習する」は 복습하다' },
    { prompt: '彼女はよく早起きします。', answer: '그녀는 자주 일찍 일어나요.', hint: '「早起きする」は 일찍 일어나다' },
    { prompt: 'この問題は少し難しいです。', answer: '이 문제는 조금 어려워요.', hint: '「少し」は 조금' },
    { prompt: '私はこのレストランが好きです。', answer: '저는 이 식당이 좋아요.', hint: '「レストラン」は 식당' },
    { prompt: '来週、両親に会いに行きます。', answer: '다음 주에 부모님을 만나러 가요.', hint: '「両親」は 부모님' },
    { prompt: '病院に行く前に、薬を飲みました。', answer: '병원에 가기 전에 약을 먹었어요.', hint: '「病院」は 병원' },
    { prompt: '私は英語を勉強し始めました。', answer: '저는 영어를 공부하기 시작했어요.', hint: '「勉強し始める」は 공부하기 시작하다' },
    { prompt: '日本語の文法は少し難しいです。', answer: '일본어 문법은 조금 어려워요.', hint: '「文法」は 문법' }
  ],
  advanced: [
    { prompt: '彼は、自分の失敗を素直に認めることができた。', answer: '그는 자신의 실수를 솔직하게 인정할 수 있었다.', hint: '「素直に」は 솔직하게、「認める」は 인정하다' },
    { prompt: 'この問題は、思ったより難しかった。', answer: '이 문제는 생각보다 어려웠다.', hint: '「思ったより」は 생각보다、「難しかった」は 어려웠다' },
    { prompt: '会議の前に、重要な資料を確認しておいた。', answer: '회의 전에 중요한 자료를 확인해 두었다.', hint: '「確認しておいた」は 확인해 두었다' },
    { prompt: '彼女は自分の意見をはっきりと伝えることができた。', answer: '그녀는 자신의 의견을 분명하게 전달할 수 있었다.', hint: '「はっきりと」は 분명하게' },
    { prompt: 'この結果は、予想以上に良かった。', answer: '이 결과는 예상 이상으로 좋았다.', hint: '「以上に」は 이상으로' },
    { prompt: '彼はその機会を逃さずに、すぐ行動に移した。', answer: '그는 그 기회를 놓치지 않고 바로 행동에 옮겼다.', hint: '「行動に移す」は 행동에 옮기다' },
    { prompt: '彼らは長い間、同じ目標に向かって努力してきた。', answer: '그들은 오랫동안 같은 목표를 향해 노력해 왔다.', hint: '「向かって」は 향해' },
    { prompt: 'この制度は、将来的に大きな変化をもたらす可能性がある。', answer: '이 제도는 장래에 큰 변화를 가져올 가능성이 있다.', hint: '「制度」は 제도' },
    { prompt: '私たちはその知らせを聞いて、すぐに対応することにした。', answer: '우리는 그 소식을 듣고 바로 대응하기로 했다.', hint: '「対応する」は 대응하다' },
    { prompt: '彼はその責任を一人で引き受けることはできなかった。', answer: '그는 그 책임을 혼자서 떠맡을 수 없었다.', hint: '「引き受ける」は 떠맡다' },
    { prompt: '彼女は何度も失敗したにもかかわらず、諦めなかった。', answer: '그녀는 몇 번이나 실패했음에도 포기하지 않았다.', hint: '「にもかかわらず」は ~에도 불구하고' },
    { prompt: 'その提案は、実現可能性が高いと評価された。', answer: '그 제안은 실현 가능성이 높다고 평가되었다.', hint: '「評価された」は 평가되었다' },
    { prompt: 'この問題は、単なる知識ではなく、判断力も必要だ。', answer: '이 문제는 단순한 지식이 아니라 판단력도 필요하다.', hint: '「判断力」は 판단력' },
    { prompt: '彼はその場で冷静に対応し、事態を収拾した。', answer: '그는 그 자리에서 냉정하게 대응해 사태를 수습했다.', hint: '「収拾する」は 수습하다' },
    { prompt: '私たちはその計画を実行に移す前に、慎重に検討した。', answer: '우리는 그 계획을 실행에 옮기기 전에 신중하게 검토했다.', hint: '「実行に移す」は 실행에 옮기다' },
    { prompt: 'この発見は、学問の分野に大きな影響を与えた。', answer: '이 발견은 학문의 분야에 큰 영향을 주었다.', hint: '「発見」は 발견' },
    { prompt: '彼はその約束を守ることができず、後悔した。', answer: '그는 그 약속을 지키지 못해 후회했다.', hint: '「約束を守る」は 약속을 지키다' },
    { prompt: 'その判断は、当時の状況をよく考慮した結果だった。', answer: '그 판단은 당시 상황을 잘 고려한 결과였다.', hint: '「考慮する」は 고려하다' },
    { prompt: '私たちは長い議論の末、合意に達した。', answer: '우리는 긴 논의 끝에 합의에 도달했다.', hint: '「議論の末」は 논의 끝에' },
    { prompt: '彼はそのニュースを聞いて、驚きを隠せなかった。', answer: '그는 그 뉴스를 듣고 놀라움을 숨기지 못했다.', hint: '「驚きを隠せなかった」は 놀라움을 숨기지 못했다' }
  ]
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
