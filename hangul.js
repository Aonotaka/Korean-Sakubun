const hangulMatrix = document.getElementById('hangulMatrix');
const hangulMatrixStatus = document.getElementById('hangulMatrixStatus');
const hangulBatchimCards = document.getElementById('hangulBatchimCards');
const hangulAnalyzerExamples = document.getElementById('hangulAnalyzerExamples');
const hangulAnalyzerInput = document.getElementById('hangulAnalyzerInput');
const hangulAnalyzeBtn = document.getElementById('hangulAnalyzeBtn');
const hangulAnalyzerResult = document.getElementById('hangulAnalyzerResult');
const hangulQuestionCountSelect = document.getElementById('hangulQuestionCountSelect');
const hangulStartBtn = document.getElementById('hangulStartBtn');
const hangulSessionStatus = document.getElementById('hangulSessionStatus');
const hangulProgressBadge = document.getElementById('hangulProgressBadge');
const hangulScenarioText = document.getElementById('hangulScenarioText');
const hangulPromptText = document.getElementById('hangulPromptText');
const hangulPromptAudioBtn = document.getElementById('hangulPromptAudioBtn');
const hangulAnswerInput = document.getElementById('hangulAnswerInput');
const virtualKeyboardToggle = document.getElementById('virtualKeyboardToggle');
const virtualKeyboardStatus = document.getElementById('virtualKeyboardStatus');
const virtualKeyboard = document.getElementById('virtualKeyboard');
const hangulHintBtn = document.getElementById('hangulHintBtn');
const hangulSubmitBtn = document.getElementById('hangulSubmitBtn');
const hangulHintBox = document.getElementById('hangulHintBox');
const hangulFeedbackBox = document.getElementById('hangulFeedbackBox');
const hangulFeedbackStatus = document.getElementById('hangulFeedbackStatus');
const hangulFeedbackText = document.getElementById('hangulFeedbackText');
const hangulModelAnswerBox = document.getElementById('hangulModelAnswerBox');
const hangulFeedbackExplanation = document.getElementById('hangulFeedbackExplanation');
const hangulAlternatives = document.getElementById('hangulAlternatives');
const hangulSpeakBtn = document.getElementById('hangulSpeakBtn');
const hangulNextBtn = document.getElementById('hangulNextBtn');

const matrixConsonants = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ'];
const matrixVowels = ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ'];
const romanizationMap = {
  'ㄱ': 'g/k',
  'ㄲ': 'kk',
  'ㄴ': 'n',
  'ㄷ': 'd/t',
  'ㄸ': 'tt',
  'ㄹ': 'r/l',
  'ㅁ': 'm',
  'ㅂ': 'b/p',
  'ㅃ': 'pp',
  'ㅅ': 's',
  'ㅆ': 'ss',
  'ㅇ': 'silent/ng',
  'ㅈ': 'j',
  'ㅉ': 'jj',
  'ㅊ': 'ch',
  'ㅋ': 'k',
  'ㅌ': 't',
  'ㅍ': 'p',
  'ㅎ': 'h',
  'ㅏ': 'a',
  'ㅐ': 'ae',
  'ㅑ': 'ya',
  'ㅒ': 'yae',
  'ㅓ': 'eo',
  'ㅔ': 'e',
  'ㅕ': 'yeo',
  'ㅖ': 'ye',
  'ㅗ': 'o',
  'ㅛ': 'yo',
  'ㅜ': 'u',
  'ㅠ': 'yu',
  'ㅡ': 'eu',
  'ㅣ': 'i',
};
const batchimGuides = [
  {
    title: 'パッチムは「下につく子音」',
    body: '例: 간 は 가 + ㄴ。最後の子音が音節の下に入り、語尾の聞こえ方が締まります。',
  },
  {
    title: '音が弱くなることがある',
    body: '받침 の ㄱ・ㄷ・ㅂ は、語末でそれぞれ [k] [t] [p] のように短く止まって聞こえます。',
  },
  {
    title: '次の母音に移動する',
    body: '간이 は 가니 のように、パッチム ㄴ が次の音節の最初に移る感覚で読むと自然です。',
  },
  {
    title: 'まずは 3 パターンで十分',
    body: '子音 + 母音、子音 + 母音 + パッチム、パッチム移動。この3つを意識すると初級作文に入りやすくなります。',
  },
];
const analyzerExamples = ['사랑', '한글', '삼겹살', '지민', '사과예요'];
const drillSeeds = [
  { prompt: '가', hint: 'ㄱ + ㅏ の1音節です。', support: '基本の1音節を見て入力します。' },
  { prompt: '너', hint: 'ㄴ + ㅓ の1音節です。', support: '母音の向きを見分けます。' },
  { prompt: '무', hint: 'ㅁ + ㅜ の1音節です。', support: '丸い母音の位置を見ます。' },
  { prompt: '바', hint: 'ㅂ + ㅏ の1音節です。', support: '似た形の子音を区別します。' },
  { prompt: '사랑', hint: '사 + 랑 の2音節です。', support: '単語を見てそのまま入力します。' },
  { prompt: '한글', hint: '한 + 글 の2音節です。', support: 'パッチムありの単語です。' },
  { prompt: '삼겹살', hint: '삼 + 겹 + 살 の3音節です。', support: 'パッチムを含む3音節の定番単語です。' },
  { prompt: '우유', hint: '우 + 유。似た母音を見分けます。', support: '母音の違いを意識して入力します。' },
  { prompt: '사과', hint: '사 + 과。2音節の基本単語です。', support: '見慣れた単語を素早く入力します。' },
  { prompt: '사과예요', hint: '사과 + 예요。やさしい2語フレーズです。', support: '短いフレーズを入力します。' },
  { prompt: '학교예요', hint: '학교 + 예요。받침 を意識します。', support: 'パッチムありのフレーズです。' },
  { prompt: '우유예요', hint: '우유 + 예요。母音の流れを確認します。', support: '短い自己表現フレーズです。' },
];
const keyboardRows = [
  [
    { code: 'KeyQ', latin: 'Q', hangul: 'ㅂ', shifted: 'ㅃ' },
    { code: 'KeyW', latin: 'W', hangul: 'ㅈ', shifted: 'ㅉ' },
    { code: 'KeyE', latin: 'E', hangul: 'ㄷ', shifted: 'ㄸ' },
    { code: 'KeyR', latin: 'R', hangul: 'ㄱ', shifted: 'ㄲ' },
    { code: 'KeyT', latin: 'T', hangul: 'ㅅ', shifted: 'ㅆ' },
    { code: 'KeyY', latin: 'Y', hangul: 'ㅛ' },
    { code: 'KeyU', latin: 'U', hangul: 'ㅕ' },
    { code: 'KeyI', latin: 'I', hangul: 'ㅑ' },
    { code: 'KeyO', latin: 'O', hangul: 'ㅐ', shifted: 'ㅒ' },
    { code: 'KeyP', latin: 'P', hangul: 'ㅔ', shifted: 'ㅖ' },
  ],
  [
    { code: 'KeyA', latin: 'A', hangul: 'ㅁ' },
    { code: 'KeyS', latin: 'S', hangul: 'ㄴ' },
    { code: 'KeyD', latin: 'D', hangul: 'ㅇ' },
    { code: 'KeyF', latin: 'F', hangul: 'ㄹ' },
    { code: 'KeyG', latin: 'G', hangul: 'ㅎ' },
    { code: 'KeyH', latin: 'H', hangul: 'ㅗ' },
    { code: 'KeyJ', latin: 'J', hangul: 'ㅓ' },
    { code: 'KeyK', latin: 'K', hangul: 'ㅏ' },
    { code: 'KeyL', latin: 'L', hangul: 'ㅣ' },
  ],
  [
    { code: 'ShiftLeft', latin: 'Shift', hangul: 'Shift', action: 'shift' },
    { code: 'KeyZ', latin: 'Z', hangul: 'ㅋ' },
    { code: 'KeyX', latin: 'X', hangul: 'ㅌ' },
    { code: 'KeyC', latin: 'C', hangul: 'ㅊ' },
    { code: 'KeyV', latin: 'V', hangul: 'ㅍ' },
    { code: 'KeyB', latin: 'B', hangul: 'ㅠ' },
    { code: 'KeyN', latin: 'N', hangul: 'ㅜ' },
    { code: 'KeyM', latin: 'M', hangul: 'ㅡ' },
    { code: 'Backspace', latin: 'Backspace', hangul: '←', action: 'backspace' },
  ],
  [
    { code: 'Space', latin: 'Space', hangul: 'Space', action: 'space', wide: true },
  ],
];

let keyboardVisible = true;
let activeKeys = new Set();
let currentQuestions = [];
let currentIndex = 0;
let koreanVoice = null;

function getHangulRuntime() {
  return window.Hangul || null;
}

function refreshKoreanVoices() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  const koreanVoices = voices.filter((voice) => (voice.lang || '').toLowerCase().startsWith('ko'));
  koreanVoice = koreanVoices[0] || null;
}

function speakKorean(text, statusElement) {
  const content = String(text || '').trim();
  if (!content) return;
  if (!('speechSynthesis' in window)) {
    if (statusElement) statusElement.textContent = 'このブラウザでは音声再生に対応していません。';
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(content);
  utterance.lang = koreanVoice?.lang || 'ko-KR';
  if (koreanVoice) utterance.voice = koreanVoice;
  utterance.rate = 0.92;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  if (statusElement) {
    statusElement.textContent = `${content} を再生しました。`;
  }
}

function normalizeHangulInput(text) {
  const Hangul = getHangulRuntime();
  const value = String(text || '').trim().replace(/\s+/g, ' ');
  if (!Hangul) return value;
  return Hangul.assemble(Hangul.disassemble(value)).replace(/\s+/g, ' ').trim();
}

function getHangulKeySequence(text) {
  const Hangul = getHangulRuntime();
  if (!Hangul) return String(text || '').trim();
  return Hangul.disassemble(String(text || '').trim()).join(' ');
}

function buildHangulBreakdown(text) {
  const Hangul = getHangulRuntime();
  if (!Hangul) return [];
  return Array.from(String(text || '').trim()).map((syllable) => {
    const jamo = Hangul.disassemble(syllable).filter((unit) => /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(unit));
    return {
      syllable,
      parts: jamo.map((unit) => `${unit}(${romanizationMap[unit] || unit})`),
      structure: jamo.length >= 3 ? '子音 + 母音 + パッチム' : jamo.length === 2 ? '子音 + 母音' : '単独文字',
    };
  }).filter((item) => item.parts.length);
}

function renderHangulMatrix() {
  if (!hangulMatrix) return;
  hangulMatrix.innerHTML = '';
  const corner = document.createElement('div');
  corner.className = 'hangul-matrix__header';
  corner.textContent = '초성';
  hangulMatrix.appendChild(corner);
  matrixVowels.forEach((vowel) => {
    const header = document.createElement('div');
    header.className = 'hangul-matrix__header';
    header.textContent = `${vowel} ${romanizationMap[vowel]}`;
    hangulMatrix.appendChild(header);
  });
  matrixConsonants.forEach((consonant) => {
    const rowLabel = document.createElement('div');
    rowLabel.className = 'hangul-matrix__row-label';
    rowLabel.textContent = `${consonant} ${romanizationMap[consonant]}`;
    hangulMatrix.appendChild(rowLabel);
    matrixVowels.forEach((vowel) => {
      const Hangul = getHangulRuntime();
      const syllable = Hangul ? Hangul.assemble([consonant, vowel]) : `${consonant}${vowel}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hangul-matrix__cell';
      button.dataset.syllable = syllable;
      button.innerHTML = `<strong>${syllable}</strong><span>${consonant} + ${vowel}</span>`;
      hangulMatrix.appendChild(button);
    });
  });
}

function renderBatchimCards() {
  if (!hangulBatchimCards) return;
  hangulBatchimCards.innerHTML = '';
  batchimGuides.forEach((guide) => {
    const card = document.createElement('article');
    card.className = 'hangul-batchim-card';
    card.innerHTML = `<h4>${guide.title}</h4><p>${guide.body}</p>`;
    hangulBatchimCards.appendChild(card);
  });
}

function renderAnalyzerExamples() {
  if (!hangulAnalyzerExamples) return;
  hangulAnalyzerExamples.innerHTML = '';
  analyzerExamples.forEach((sample) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hangul-analyzer__chip';
    button.dataset.sample = sample;
    button.textContent = sample;
    hangulAnalyzerExamples.appendChild(button);
  });
}

function buildLocalAnalysis(text) {
  const convertedText = normalizeHangulInput(text);
  return {
    convertedText,
    meaning: '入力されたハングルを1文字ずつ分解して学べます。',
    pronunciationTip: '子音と母音のまとまりごとに、ゆっくり音読してから単語全体を続けて読んでみましょう。',
    writingTip: '左から右、上から下の順で、1音節ずつまとまりで書くと覚えやすくなります。',
    studyTip: 'この単語を仮想キーボードで3回入力し、パッチムの有無を意識してみましょう。',
    keySequence: getHangulKeySequence(convertedText),
    breakdown: buildHangulBreakdown(convertedText),
  };
}

function renderAnalysisResult(data) {
  if (!hangulAnalyzerResult) return;
  hangulAnalyzerResult.hidden = false;
  hangulAnalyzerResult.innerHTML = '';
  const normalized = buildLocalAnalysis(data.convertedText || '');
  const merged = { ...normalized, ...data };
  const hero = document.createElement('div');
  hero.className = 'hangul-analysis-result__hero';
  hero.innerHTML = `<strong>${merged.convertedText}</strong><p>${merged.meaning}</p>`;
  const playButton = document.createElement('button');
  playButton.type = 'button';
  playButton.className = 'btn btn--secondary btn--small';
  playButton.textContent = '이 단어 듣기';
  playButton.addEventListener('click', () => speakKorean(merged.convertedText, hangulMatrixStatus));
  hero.appendChild(playButton);
  hangulAnalyzerResult.appendChild(hero);

  const metaGrid = document.createElement('div');
  metaGrid.className = 'hangul-analysis-result__meta';
  [
    { title: '発音のコツ', text: merged.pronunciationTip },
    { title: '書くコツ', text: merged.writingTip },
    { title: '復習ヒント', text: merged.studyTip },
    { title: '打鍵イメージ', text: merged.keySequence },
  ].forEach((item) => {
    const card = document.createElement('div');
    card.className = 'hangul-analysis-result__card';
    card.innerHTML = `<strong>${item.title}</strong><p>${item.text}</p>`;
    metaGrid.appendChild(card);
  });
  hangulAnalyzerResult.appendChild(metaGrid);

  const breakdownGrid = document.createElement('div');
  breakdownGrid.className = 'hangul-breakdown-grid';
  merged.breakdown.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'hangul-breakdown-card';
    card.innerHTML = `<strong>${item.syllable}</strong><p>${item.parts.join(' + ')}</p><p>${item.structure}</p>`;
    breakdownGrid.appendChild(card);
  });
  hangulAnalyzerResult.appendChild(breakdownGrid);
}

async function analyzeHangulInput() {
  const value = String(hangulAnalyzerInput?.value || '').trim();
  if (!value) {
    renderAnalysisResult(buildLocalAnalysis('삼겹살'));
    return;
  }
  if (hangulAnalyzeBtn) {
    hangulAnalyzeBtn.disabled = true;
    hangulAnalyzeBtn.textContent = '解剖中...';
  }
  try {
    const response = await fetch('/api/hangul/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: value }),
    });
    const data = response.ok ? await response.json() : buildLocalAnalysis(value);
    renderAnalysisResult(data);
  } catch (error) {
    renderAnalysisResult(buildLocalAnalysis(value));
  } finally {
    if (hangulAnalyzeBtn) {
      hangulAnalyzeBtn.disabled = false;
      hangulAnalyzeBtn.textContent = '解剖する';
    }
  }
}

function getQuestionCount() {
  return Math.max(1, Number(hangulQuestionCountSelect?.value || 5));
}

function buildSessionQuestions() {
  const pool = [...drillSeeds];
  const count = Math.min(getQuestionCount(), pool.length);
  const selected = [];
  while (selected.length < count && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(index, 1)[0]);
  }
  return selected;
}

function setKeyboardStatus(message) {
  if (virtualKeyboardStatus) {
    virtualKeyboardStatus.textContent = message;
  }
}

function setSessionStatus(message) {
  if (hangulSessionStatus) {
    hangulSessionStatus.textContent = message;
  }
}

function renderCurrentQuestion() {
  const question = currentQuestions[currentIndex];
  if (!question) {
    hangulPromptText.textContent = 'ドリルが完了しました。もう一度始められます。';
    if (hangulProgressBadge) hangulProgressBadge.textContent = `${currentQuestions.length} / ${currentQuestions.length}`;
    if (hangulFeedbackBox) hangulFeedbackBox.hidden = true;
    return;
  }
  if (hangulPromptText) hangulPromptText.textContent = `このハングルをそのまま入力してください: ${question.prompt}`;
  if (hangulScenarioText) {
    hangulScenarioText.hidden = false;
    hangulScenarioText.textContent = question.support;
  }
  if (hangulProgressBadge) hangulProgressBadge.textContent = `${currentIndex + 1} / ${currentQuestions.length}`;
  if (hangulAnswerInput) {
    hangulAnswerInput.value = '';
    hangulAnswerInput.placeholder = `例: ${question.prompt}`;
    hangulAnswerInput.focus();
  }
  if (hangulHintBox) hangulHintBox.hidden = true;
  if (hangulFeedbackBox) hangulFeedbackBox.hidden = true;
}

function startDrill() {
  currentQuestions = buildSessionQuestions();
  currentIndex = 0;
  renderCurrentQuestion();
  setSessionStatus('ハングル入力ドリルを開始しました。');
}

function showHint() {
  const question = currentQuestions[currentIndex];
  if (!question || !hangulHintBox) return;
  hangulHintBox.hidden = false;
  hangulHintBox.textContent = `ヒント: ${question.hint}\nキー順: ${getHangulKeySequence(question.prompt)}`;
}

function renderFeedback(status, score, question) {
  if (!hangulFeedbackBox || !hangulFeedbackStatus || !hangulFeedbackText || !hangulModelAnswerBox || !hangulFeedbackExplanation || !hangulAlternatives) return;
  const breakdown = buildHangulBreakdown(question.prompt).map((item) => `${item.syllable} = ${item.parts.join(' + ')}`).join(' / ');
  hangulFeedbackStatus.textContent = status;
  hangulFeedbackStatus.className = `feedback-status ${status === '正解' ? 'good' : 'bad'}`;
  hangulFeedbackText.textContent = `採点: ${score}点`;
  hangulModelAnswerBox.innerHTML = `<strong>正解</strong><div>${question.prompt}</div>`;
  hangulFeedbackExplanation.textContent = `${question.hint}\n\n文字分解: ${breakdown}`;
  hangulAlternatives.innerHTML = '';
  [`見本: ${question.prompt}`, `キー順: ${getHangulKeySequence(question.prompt)}`].forEach((item) => {
    const chip = document.createElement('span');
    chip.textContent = item;
    hangulAlternatives.appendChild(chip);
  });
  hangulFeedbackBox.hidden = false;
}

function evaluateAnswer() {
  const question = currentQuestions[currentIndex];
  if (!question || !hangulAnswerInput) return;
  const userValue = normalizeHangulInput(hangulAnswerInput.value).replace(/\s+/g, '');
  const expected = normalizeHangulInput(question.prompt).replace(/\s+/g, '');
  const similarity = userValue ? 1 - (Math.abs(userValue.length - expected.length) / Math.max(userValue.length, expected.length, 1)) : 0;
  let status = '不正解';
  let score = 30;
  if (userValue === expected) {
    status = '正解';
    score = 100;
  } else if (similarity >= 0.75) {
    status = '惜しい';
    score = 76;
  }
  renderFeedback(status, score, question);
}

function goNext() {
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex += 1;
    renderCurrentQuestion();
    return;
  }
  hangulPromptText.textContent = 'ドリル完了です。もう一度始めるか、文法別作文へ進んでください。';
  if (hangulScenarioText) {
    hangulScenarioText.hidden = false;
    hangulScenarioText.textContent = '音と形の基礎ができたら、次は短い文法作文へ進みましょう。';
  }
  if (hangulFeedbackBox) hangulFeedbackBox.hidden = true;
}

function findKeyByCode(code, shiftPressed = false) {
  for (const row of keyboardRows) {
    for (const key of row) {
      if (key.code === code) {
        if (key.action) return key;
        return { ...key, output: shiftPressed && key.shifted ? key.shifted : key.hangul };
      }
    }
  }
  return null;
}

function setInputReadonlyState() {
  if (!hangulAnswerInput) return;
  hangulAnswerInput.readOnly = keyboardVisible && window.matchMedia('(max-width: 800px)').matches;
}

function renderVirtualKeyboard() {
  if (!virtualKeyboard) return;
  virtualKeyboard.innerHTML = '';
  keyboardRows.forEach((row) => {
    const rowElement = document.createElement('div');
    rowElement.className = 'virtual-keyboard__row';
    row.forEach((key) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `virtual-keyboard__key${key.wide ? ' virtual-keyboard__key--space' : ''}${activeKeys.has(key.code) ? ' is-active' : ''}`;
      button.dataset.code = key.code;
      button.dataset.action = key.action || 'input';
      button.dataset.value = key.hangul;
      const currentHangul = activeKeys.has('ShiftLeft') && key.shifted ? key.shifted : key.hangul;
      button.innerHTML = `<span class="virtual-keyboard__hangul">${currentHangul}</span><span class="virtual-keyboard__latin">${key.latin}</span>`;
      rowElement.appendChild(button);
    });
    virtualKeyboard.appendChild(rowElement);
  });
}

function syncKeyboardUi() {
  if (!virtualKeyboard || !virtualKeyboardToggle) return;
  virtualKeyboard.hidden = !keyboardVisible;
  virtualKeyboardToggle.setAttribute('aria-expanded', keyboardVisible ? 'true' : 'false');
  virtualKeyboardToggle.textContent = keyboardVisible ? '仮想キーボードを隠す' : '仮想キーボードを表示';
  setInputReadonlyState();
  renderVirtualKeyboard();
}

function flashKey(code) {
  activeKeys.add(code);
  renderVirtualKeyboard();
  window.setTimeout(() => {
    activeKeys.delete(code);
    renderVirtualKeyboard();
  }, 130);
}

function insertJamo(value) {
  if (!hangulAnswerInput) return;
  const Hangul = getHangulRuntime();
  const start = hangulAnswerInput.selectionStart ?? hangulAnswerInput.value.length;
  const end = hangulAnswerInput.selectionEnd ?? start;
  const prefix = hangulAnswerInput.value.slice(0, start);
  const suffix = hangulAnswerInput.value.slice(end);
  const nextPrefix = value === ' '
    ? `${prefix} `
    : Hangul
      ? Hangul.assemble([...Hangul.disassemble(prefix), value])
      : `${prefix}${value}`;
  hangulAnswerInput.value = `${nextPrefix}${suffix}`;
  hangulAnswerInput.setSelectionRange(nextPrefix.length, nextPrefix.length);
}

function backspaceInput() {
  if (!hangulAnswerInput) return;
  const Hangul = getHangulRuntime();
  const start = hangulAnswerInput.selectionStart ?? hangulAnswerInput.value.length;
  const prefix = hangulAnswerInput.value.slice(0, start);
  const suffix = hangulAnswerInput.value.slice(start);
  if (!prefix) return;
  const nextPrefix = Hangul
    ? Hangul.assemble(Hangul.disassemble(prefix).slice(0, -1))
    : prefix.slice(0, -1);
  hangulAnswerInput.value = `${nextPrefix}${suffix}`;
  hangulAnswerInput.setSelectionRange(nextPrefix.length, nextPrefix.length);
}

function handlePhysicalKeyboard(event) {
  if (!hangulAnswerInput) return;
  if (event.target === hangulAnalyzerInput) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const keyInfo = findKeyByCode(event.code, event.shiftKey);
  if (!keyInfo) return;
  event.preventDefault();
  flashKey(keyInfo.code);
  if (keyInfo.action === 'shift') {
    activeKeys.add('ShiftLeft');
    renderVirtualKeyboard();
    return;
  }
  if (keyInfo.action === 'backspace') {
    backspaceInput();
    return;
  }
  if (keyInfo.action === 'space') {
    insertJamo(' ');
    return;
  }
  insertJamo(keyInfo.output || keyInfo.hangul);
}

function handlePhysicalKeyboardUp(event) {
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
    activeKeys.delete('ShiftLeft');
    renderVirtualKeyboard();
  }
}

function handleVirtualKeyboardClick(event) {
  const button = event.target.closest('button[data-code]');
  if (!button) return;
  const keyInfo = findKeyByCode(button.dataset.code, activeKeys.has('ShiftLeft'));
  if (!keyInfo) return;
  flashKey(keyInfo.code);
  if (keyInfo.action === 'shift') {
    if (activeKeys.has('ShiftLeft')) {
      activeKeys.delete('ShiftLeft');
    } else {
      activeKeys.add('ShiftLeft');
    }
    renderVirtualKeyboard();
    return;
  }
  if (keyInfo.action === 'backspace') {
    backspaceInput();
    return;
  }
  if (keyInfo.action === 'space') {
    insertJamo(' ');
    return;
  }
  insertJamo(keyInfo.output || keyInfo.hangul);
  if (activeKeys.has('ShiftLeft')) {
    activeKeys.delete('ShiftLeft');
    renderVirtualKeyboard();
  }
}

function bindEvents() {
  hangulMatrix?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-syllable]');
    if (!button) return;
    speakKorean(button.dataset.syllable || '', hangulMatrixStatus);
  });
  hangulAnalyzerExamples?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-sample]');
    if (!button || !hangulAnalyzerInput) return;
    hangulAnalyzerInput.value = button.dataset.sample || '';
    analyzeHangulInput();
  });
  hangulAnalyzeBtn?.addEventListener('click', analyzeHangulInput);
  hangulAnalyzerInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      analyzeHangulInput();
    }
  });
  hangulStartBtn?.addEventListener('click', startDrill);
  hangulHintBtn?.addEventListener('click', showHint);
  hangulSubmitBtn?.addEventListener('click', evaluateAnswer);
  hangulNextBtn?.addEventListener('click', goNext);
  hangulSpeakBtn?.addEventListener('click', () => {
    const question = currentQuestions[currentIndex];
    if (question) speakKorean(question.prompt, hangulSessionStatus);
  });
  hangulPromptAudioBtn?.addEventListener('click', () => {
    const question = currentQuestions[currentIndex];
    if (question) speakKorean(question.prompt, hangulSessionStatus);
  });
  virtualKeyboardToggle?.addEventListener('click', () => {
    keyboardVisible = !keyboardVisible;
    syncKeyboardUi();
  });
  virtualKeyboard?.addEventListener('click', handleVirtualKeyboardClick);
  hangulAnswerInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      evaluateAnswer();
      return;
    }
    handlePhysicalKeyboard(event);
  });
  window.addEventListener('keyup', handlePhysicalKeyboardUp);
  window.addEventListener('resize', setInputReadonlyState);
}

window.addEventListener('DOMContentLoaded', () => {
  refreshKoreanVoices();
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = refreshKoreanVoices;
  }
  renderHangulMatrix();
  renderBatchimCards();
  renderAnalyzerExamples();
  renderAnalysisResult(buildLocalAnalysis('삼겹살'));
  syncKeyboardUi();
  bindEvents();
  setKeyboardStatus('英字キーを押すと、対応するハングルキーが反応します。');
  setSessionStatus('準備ができたら開始してください。');
});