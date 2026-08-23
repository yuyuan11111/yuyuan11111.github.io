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

const counterCards = document.querySelectorAll('[data-counter-card]');

const totalVisitorValue = document.getElementById('busuanzi_value_site_uv');
const visitorSeed = 5000;

function addVisitorSeed() {
  if (!totalVisitorValue) return;

  const rawText = (totalVisitorValue.textContent || '').trim();
  const rawNumber = rawText.replace(/,/g, '');
  const displayedNumber = (totalVisitorValue.dataset.display || '').replace(/,/g, '');

  if (!/^\d+$/.test(rawNumber) || rawNumber === displayedNumber) return;

  const liveVisitors = Number(rawNumber);
  const totalVisitors = visitorSeed + liveVisitors;
  totalVisitorValue.textContent = totalVisitors.toLocaleString('en-US');
  totalVisitorValue.dataset.display = String(totalVisitors);
}

if (totalVisitorValue) {
  const visitorObserver = new MutationObserver(addVisitorSeed);
  visitorObserver.observe(totalVisitorValue, { childList: true, characterData: true, subtree: true });
  window.setTimeout(addVisitorSeed, 3000);
}

if (counterCards.length) {
  window.setTimeout(() => {
    counterCards.forEach((card) => {
      const value = card.querySelector('strong');
      if (value && (value.textContent || '').trim() === '--') {
        value.textContent = value.dataset.fallback || '持续记录中';
        card.classList.add('is-fallback');
      }
    });
  }, 2500);
}
