document.documentElement.classList.add('is-ready');

const root = document.documentElement;
const themeToggle = document.querySelector('[data-theme-toggle]');
const savedTheme = localStorage.getItem('yuyuan-theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

function applyTheme(theme) {
  root.dataset.theme = theme;
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? '☼' : '☾';
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
  }
}

applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('yuyuan-theme', nextTheme);
    applyTheme(nextTheme);
  });
}

const aura = document.querySelector('.cursor-aura');

if (aura && window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('pointermove', (event) => {
    aura.style.transform = `translate(${event.clientX - 110}px, ${event.clientY - 110}px)`;
    aura.classList.add('is-visible');
  });

  window.addEventListener('pointerleave', () => {
    aura.classList.remove('is-visible');
  });
}

const searchPanel = document.querySelector('[data-search-panel]');
const searchOpen = document.querySelector('[data-search-open]');
const searchClosers = document.querySelectorAll('[data-search-close]');
const searchInput = document.querySelector('[data-search-input]');
const searchResults = document.querySelector('[data-search-results]');
const searchDataNode = document.getElementById('site-search-data');
const searchData = searchDataNode ? JSON.parse(searchDataNode.textContent || '[]') : [];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderResults(query) {
  if (!searchResults) return;

  const keyword = query.trim().toLowerCase();
  if (!keyword) {
    searchResults.innerHTML = '<div class="empty-state">输入关键词后，会在文章和页面里帮你找。</div>';
    return;
  }

  const results = searchData
    .map((item) => {
      const haystack = `${item.title} ${item.type} ${item.text}`.toLowerCase();
      return { item, hit: haystack.includes(keyword) };
    })
    .filter((entry) => entry.hit)
    .slice(0, 8);

  if (!results.length) {
    searchResults.innerHTML = '<div class="empty-state">暂时没有找到相关内容。</div>';
    return;
  }

  searchResults.innerHTML = results.map(({ item }) => {
    const excerpt = item.text ? `${item.text.slice(0, 96)}${item.text.length > 96 ? '...' : ''}` : '点击进入这个页面继续查看。';
    return `
      <a class="search-result" href="${escapeHtml(item.url)}">
        <span>${escapeHtml(item.type)}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(excerpt)}</p>
      </a>
    `;
  }).join('');
}

function openSearch() {
  if (!searchPanel || !searchInput) return;
  searchPanel.hidden = false;
  renderResults(searchInput.value);
  requestAnimationFrame(() => searchInput.focus());
}

function closeSearch() {
  if (!searchPanel) return;
  searchPanel.hidden = true;
}

if (searchOpen) {
  searchOpen.addEventListener('click', openSearch);
}

searchClosers.forEach((closer) => {
  closer.addEventListener('click', closeSearch);
});

if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    renderResults(event.target.value);
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeSearch();
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openSearch();
  }
});

const totalVisitorDisplay = document.querySelector('[data-total-visitor-display]');
const todayVisitorDisplay = document.querySelector('[data-today-visitor-display]');
const totalVisitorSource = document.getElementById('busuanzi_value_site_uv');
const todayVisitorSource = document.getElementById('busuanzi_value_today_site_uv');
const visitorSeed = 5000;

function readVisitorCount(source) {
  const value = (source?.textContent || '').trim().replace(/,/g, '');
  return /^[0-9]+$/.test(value) ? Number(value) : null;
}

function syncVisitorCounts() {
  const total = readVisitorCount(totalVisitorSource);
  const today = readVisitorCount(todayVisitorSource);

  if (totalVisitorDisplay) {
    totalVisitorDisplay.textContent = String(visitorSeed + (total ?? 0));
  }
  if (todayVisitorDisplay) {
    todayVisitorDisplay.textContent = String(today ?? 0);
  }
}

// Busuanzi writes to hidden source nodes. Visible values always remain under this page's control.
[totalVisitorSource, todayVisitorSource].filter(Boolean).forEach((source) => {
  new MutationObserver(syncVisitorCounts).observe(source, {
    childList: true,
    characterData: true,
    subtree: true
  });
});

syncVisitorCounts();
window.setTimeout(syncVisitorCounts, 2500);
