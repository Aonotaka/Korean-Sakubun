const blogPosts = document.getElementById('blogPosts');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function loadPosts() {
  const response = await fetch('/api/blog/posts');
  const posts = await response.json();
  if (!posts.length) {
    blogPosts.innerHTML = '<article class="card empty-state"><h3>まだ投稿がありません</h3><p>管理者が最初の記事を公開するまでお待ちください。</p></article>';
    return;
  }

  blogPosts.innerHTML = '';
  posts.forEach((post) => {
    const card = document.createElement('article');
    card.className = 'card blog-post';
    card.innerHTML = `
      <div class="blog-post__head">
        <h3>${escapeHtml(post.title)}</h3>
        <p class="blog-post__meta">${new Date(post.publishedAt).toLocaleDateString('ja-JP')} / ${escapeHtml(post.author)}</p>
      </div>
      <p class="blog-post__excerpt">${escapeHtml(post.excerpt || '...' )}</p>
      <div class="blog-post__content">
        <p>${escapeHtml(post.content)}</p>
      </div>
    `;
    blogPosts.appendChild(card);
  });
}

loadPosts();
