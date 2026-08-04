const topLoginLink = document.getElementById('topLoginLink');
const topLogoutBtn = document.getElementById('topLogoutBtn');
const topProfile = document.getElementById('topProfile');
const topProfileAvatar = document.getElementById('topProfileAvatar');
const topProfileName = document.getElementById('topProfileName');
const topProfileState = document.getElementById('topProfileState');

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
const premiumReviewQueue = document.getElementById('premiumReviewQueue');
const premiumReviewQueueStatus = document.getElementById('premiumReviewQueueStatus');
const premiumRefreshQueueBtn = document.getElementById('premiumRefreshQueueBtn');
const premiumBulkReviewBtn = document.getElementById('premiumBulkReviewBtn');

let currentSessionUser = null;
let premiumMemoriesCache = [];
let premiumEditingId = '';
let premiumReviewQueueCache = [];

function isPremiumEnabledForUser(user) {
  if (!user || typeof user !== 'object') return false;
  return Boolean(user.role === 'admin' || user.premiumEnabled || user.plan === 'premium');
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
  }
  if (topProfileAvatar) {
    topProfileAvatar.src = loggedIn && user.avatarUrl ? user.avatarUrl : buildDefaultAvatarDataUrl(loggedIn ? user.name : 'G');
  }
}

async function refreshAuthState() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) {
      currentSessionUser = null;
      renderAuthProfile(null);
      return null;
    }

    const user = await response.json();
    currentSessionUser = user;
    renderAuthProfile(user);
    return user;
  } catch (error) {
    currentSessionUser = null;
    renderAuthProfile(null);
    return null;
  }
}

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('ja-JP');
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

function getPremiumToneLabel(tone) {
  if (tone === 'daily') return '日常会話';
  if (tone === 'business') return 'ビジネス';
  if (tone === 'exam') return '試験対策';
  return '自由';
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
  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

  const weeklySaved = source.filter((item) => new Date(item.createdAt || 0).getTime() >= sevenDaysAgo).length;
  const weeklyReviewActions = source.reduce((total, item) => {
    const history = Array.isArray(item.reviewHistory) ? item.reviewHistory : [];
    const count = history.filter((iso) => new Date(iso || 0).getTime() >= sevenDaysAgo).length;
    return total + count;
  }, 0);

  const weeklyActiveCards = source.filter((item) => new Date(item.updatedAt || item.createdAt || 0).getTime() >= sevenDaysAgo);
  const weeklyAchievedCards = weeklyActiveCards.filter((item) => {
    const achievedAt = new Date(item.achievedAt || 0).getTime();
    return Number.isFinite(achievedAt) && achievedAt >= sevenDaysAgo;
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

  if (sort === 'curve_priority') {
    return source.sort((a, b) => {
      const aPriority = Number(a.reviewPriority) || 0;
      const bPriority = Number(b.reviewPriority) || 0;
      if (aPriority !== bPriority) return bPriority - aPriority;
      const aDue = new Date(a.nextReviewAt || 0).getTime() || Number.MAX_SAFE_INTEGER;
      const bDue = new Date(b.nextReviewAt || 0).getTime() || Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    });
  }

  return source.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function setReviewQueueStatus(message = '') {
  if (!premiumReviewQueueStatus) return;
  premiumReviewQueueStatus.textContent = message;
}

function renderPremiumReviewQueue(items) {
  if (!premiumReviewQueue) return;
  const queue = Array.isArray(items) ? items : [];
  if (!queue.length) {
    premiumReviewQueue.innerHTML = '<li>今日すぐ復習すべき作文はありません。新しい作文を追加して学習を続けましょう。</li>';
    return;
  }

  premiumReviewQueue.innerHTML = '';
  queue.forEach((item, index) => {
    const li = document.createElement('li');
    const heading = document.createElement('strong');
    heading.textContent = `${index + 1}. ${item.title || '無題の作文'}`;
    const detail = document.createElement('p');
    const dueLabel = item.nextReviewAt ? formatDateTime(item.nextReviewAt) : '未設定';
    const overdueDays = Math.max(0, Number(item.overdueDays) || 0);
    const priority = Number(item.reviewPriority) || 0;
    detail.textContent = `次回復習: ${dueLabel} / 遅延日数: ${overdueDays}日 / 優先度: ${priority}`;

    const action = document.createElement('button');
    action.className = 'btn btn--secondary';
    action.type = 'button';
    action.dataset.action = 'queue-review-premium-memory';
    action.dataset.id = item.id || '';
    action.textContent = 'この作文を復習した';

    li.appendChild(heading);
    li.appendChild(detail);
    li.appendChild(action);
    premiumReviewQueue.appendChild(li);
  });
}

async function loadPremiumReviewQueue() {
  if (!premiumReviewQueue) return;
  if (!currentSessionUser) {
    premiumReviewQueueCache = [];
    setReviewQueueStatus('ログインすると優先復習キューが表示されます。');
    renderPremiumReviewQueue([]);
    return;
  }
  if (!isPremiumEnabledForUser(currentSessionUser)) {
    premiumReviewQueueCache = [];
    setReviewQueueStatus('プレミアム会員向け機能です。');
    renderPremiumReviewQueue([]);
    return;
  }

  setReviewQueueStatus('忘却曲線に基づく優先キューを更新中...');
  try {
    const response = await fetch('/api/premium/memories/review-queue?limit=12');
    const queue = response.ok ? await response.json() : [];
    premiumReviewQueueCache = Array.isArray(queue) ? queue : [];
    renderPremiumReviewQueue(premiumReviewQueueCache);
    setReviewQueueStatus(`優先復習 ${premiumReviewQueueCache.length}件を表示中`);
  } catch (error) {
    premiumReviewQueueCache = [];
    setReviewQueueStatus('優先キューの取得に失敗しました。');
    renderPremiumReviewQueue([]);
  }
}

async function reviewTopPriorityMemories(limit = 5) {
  if (!isPremiumEnabledForUser(currentSessionUser)) {
    setReviewQueueStatus('プレミアム会員向け機能です。');
    return;
  }

  const targets = premiumReviewQueueCache.slice(0, Math.max(1, limit)).filter((item) => item?.id);
  if (!targets.length) {
    setReviewQueueStatus('復習対象がありません。');
    return;
  }

  if (premiumBulkReviewBtn) premiumBulkReviewBtn.disabled = true;
  setReviewQueueStatus(`上位${targets.length}件を復習済みに更新しています...`);

  let successCount = 0;
  for (const item of targets) {
    try {
      const response = await fetch(`/api/premium/memories/${encodeURIComponent(item.id)}/review`, { method: 'POST' });
      if (response.ok) {
        successCount += 1;
      }
    } catch (_error) {
      // Continue to next card even if one request fails.
    }
  }

  setReviewQueueStatus(`${successCount}/${targets.length}件を復習済みにしました。`);
  await loadPremiumMemories();
  await loadPremiumReviewQueue();
  if (premiumBulkReviewBtn) premiumBulkReviewBtn.disabled = false;
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
      premiumCheckoutBtn.textContent = '有料プランに登録する (月額 980円)';
    }
    return;
  }

  const premiumEnabled = isPremiumEnabledForUser(currentSessionUser);
  if (premiumMemoryForm) premiumMemoryForm.hidden = !premiumEnabled;
  if (premiumSearchInput) premiumSearchInput.disabled = !premiumEnabled;
  if (premiumFilterSelect) premiumFilterSelect.disabled = !premiumEnabled;
  if (premiumSortSelect) premiumSortSelect.disabled = !premiumEnabled;
  if (premiumCheckoutBtn) {
    premiumCheckoutBtn.hidden = premiumEnabled;
    premiumCheckoutBtn.disabled = false;
    premiumCheckoutBtn.textContent = '有料プランに登録する (月額 980円)';
  }

  if (!premiumEnabled) {
    resetPremiumEditorState();
    premiumStatus.textContent = '無料プランです。下のボタンから有料登録するとプレミアム保存を利用できます。';
    premiumMemoryList.innerHTML = '<li>プレミアムプランのユーザーだけが文章を保存できます。</li>';
    premiumMemoriesCache = [];
    updatePremiumStats([]);
    resetPremiumDashboard();
    premiumReviewQueueCache = [];
    setReviewQueueStatus('プレミアム会員向け機能です。');
    renderPremiumReviewQueue([]);
    return;
  }

  premiumStatus.textContent = 'プレミアム保存を読み込み中...';
  try {
    const response = await fetch('/api/premium/memories');
    const memories = response.ok ? await response.json() : [];
    premiumMemoriesCache = Array.isArray(memories) ? [...memories] : [];
    renderPremiumMemories(premiumMemoriesCache);
    premiumStatus.textContent = 'あなた専用の作文集です。追加・編集・復習で品質を高めましょう。';
    await loadPremiumReviewQueue();
  } catch (error) {
    premiumStatus.textContent = '保存データの読み込みに失敗しました。';
    premiumMemoryList.innerHTML = '<li>保存データを読み込めませんでした。</li>';
    premiumMemoriesCache = [];
    updatePremiumStats([]);
    resetPremiumDashboard();
    premiumReviewQueueCache = [];
    setReviewQueueStatus('優先キューの読み込みに失敗しました。');
    renderPremiumReviewQueue([]);
  }
}

async function startPremiumCheckout() {
  if (!premiumStatus) return;
  if (!currentSessionUser) {
    premiumStatus.textContent = '先にGoogleログインしてください。';
    return;
  }

  if (isPremiumEnabledForUser(currentSessionUser)) {
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
        premiumCheckoutBtn.textContent = '有料プランに登録する (月額 980円)';
      }
      return;
    }

    window.location.href = data.url;
  } catch (error) {
    premiumStatus.textContent = '決済ページへの移動中にエラーが発生しました。';
    if (premiumCheckoutBtn) {
      premiumCheckoutBtn.disabled = false;
      premiumCheckoutBtn.textContent = '有料プランに登録する (月額 980円)';
    }
  }
}

async function submitPremiumMemory(event) {
  event.preventDefault();
  if (!premiumMemoryForm || !premiumMemoryText || !premiumStatus) return;

  const premiumEnabled = isPremiumEnabledForUser(currentSessionUser);
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

  const premiumEnabled = isPremiumEnabledForUser(currentSessionUser);
  if (!premiumEnabled) return;

  try {
    if (action === 'review-premium-memory') {
      await fetch(`/api/premium/memories/${encodeURIComponent(memoryId)}/review`, { method: 'POST' });
      await loadPremiumMemories();
      return;
    }
    if (action === 'queue-review-premium-memory') {
      await fetch(`/api/premium/memories/${encodeURIComponent(memoryId)}/review`, { method: 'POST' });
      await loadPremiumMemories();
      await loadPremiumReviewQueue();
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
      const copyTitle = target.title ? `${target.title} (複製)` : '複製した作文';
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

if (premiumMemoryForm) {
  premiumMemoryForm.addEventListener('submit', submitPremiumMemory);
}

if (premiumMemoryList) {
  premiumMemoryList.addEventListener('click', handlePremiumMemoryAction);
}

if (premiumReviewQueue) {
  premiumReviewQueue.addEventListener('click', handlePremiumMemoryAction);
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

if (premiumCheckoutBtn) {
  premiumCheckoutBtn.addEventListener('click', startPremiumCheckout);
}

if (premiumRefreshQueueBtn) {
  premiumRefreshQueueBtn.addEventListener('click', loadPremiumReviewQueue);
}

if (premiumBulkReviewBtn) {
  premiumBulkReviewBtn.addEventListener('click', () => reviewTopPriorityMemories(5));
}

if (topLogoutBtn) {
  topLogoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    currentSessionUser = null;
    renderAuthProfile(null);
    await loadPremiumMemories();
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  await refreshAuthState();
  await loadPremiumMemories();
  await loadPremiumReviewQueue();
});
