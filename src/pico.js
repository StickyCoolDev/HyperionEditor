/**
 * Pico JS Helper for Hyperion Documentation & Forum
 * Provides Theme Switching, Native Dialog Modals, and Interactive Filtering.
 */

// 1. Theme Management (Auto, Dark, Light)
export function initPicoTheme() {
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('hyperion_pico_theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);

  const themeSelect = document.getElementById('pico-theme-switcher');
  if (themeSelect) {
    themeSelect.value = savedTheme;
    themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      html.setAttribute('data-theme', theme);
      localStorage.setItem('hyperion_pico_theme', theme);
    });
  }

  const themeToggleBtn = document.getElementById('pico-theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = html.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('hyperion_pico_theme', next);
    });
  }
}

// 2. Native Dialog Modal Controller
export function initPicoModals() {
  // Open modal buttons
  document.querySelectorAll('[data-target]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = trigger.getAttribute('data-target');
      const dialog = document.getElementById(targetId);
      if (dialog && typeof dialog.showModal === 'function') {
        dialog.showModal();
        dialog.setAttribute('open', '');
      }
    });
  });

  // Close modal buttons and backdrop clicks
  document.querySelectorAll('dialog').forEach((dialog) => {
    // Backdrop click
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.close();
        dialog.removeAttribute('open');
      }
    });

    // Close buttons inside dialog
    dialog.querySelectorAll('.close, [data-close]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        dialog.close();
        dialog.removeAttribute('open');
      });
    });
  });
}

// 3. Documentation Search & Table of Contents Active Spy
export function initDocNavigation() {
  const searchInput = document.getElementById('docs-search-input');
  const sections = document.querySelectorAll('.docs-content section');
  const navLinks = document.querySelectorAll('.docs-sidebar nav a');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      sections.forEach((sec) => {
        const text = sec.innerText.toLowerCase();
        if (!query || text.includes(query)) {
          sec.style.display = 'block';
        } else {
          sec.style.display = 'none';
        }
      });
    });
  }

  // Active section spy on scroll
  window.addEventListener('scroll', () => {
    let currentId = '';
    sections.forEach((sec) => {
      const top = sec.offsetTop - 120;
      if (window.scrollY >= top) {
        currentId = sec.getAttribute('id');
      }
    });

    if (currentId) {
      navLinks.forEach((link) => {
        if (link.getAttribute('href') === `#${currentId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  }, { passive: true });
}

// 4. Forum Interactive State (Filtering, Voting & New Thread Creation)
export function initForumEngine() {
  const threadsContainer = document.getElementById('forum-threads-list');
  const searchInput = document.getElementById('forum-search-input');
  const tagButtons = document.querySelectorAll('.forum-tag-filter');
  const newThreadForm = document.getElementById('new-thread-form');
  const threadDialog = document.getElementById('new-thread-modal');

  let activeTag = 'all';

  // Filter by tag
  tagButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tagButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeTag = btn.getAttribute('data-tag');
      filterThreads();
    });
  });

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', filterThreads);
  }

  function filterThreads() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const cards = document.querySelectorAll('.forum-card');
    let visibleCount = 0;

    cards.forEach((card) => {
      const title = card.querySelector('h4')?.innerText.toLowerCase() || '';
      const body = card.querySelector('p')?.innerText.toLowerCase() || '';
      const cardTag = card.getAttribute('data-tag');

      const matchesTag = activeTag === 'all' || cardTag === activeTag;
      const matchesSearch = !query || title.includes(query) || body.includes(query);

      if (matchesTag && matchesSearch) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    const emptyState = document.getElementById('forum-empty-state');
    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  // Voting buttons
  document.addEventListener('click', (e) => {
    const voteBtn = e.target.closest('.vote-btn');
    if (voteBtn) {
      e.preventDefault();
      const countSpan = voteBtn.querySelector('.vote-count');
      let currentVotes = parseInt(countSpan.textContent, 10) || 0;
      if (voteBtn.classList.contains('voted')) {
        voteBtn.classList.remove('voted');
        countSpan.textContent = currentVotes - 1;
      } else {
        voteBtn.classList.add('voted');
        countSpan.textContent = currentVotes + 1;
      }
    }
  });

  // Handle new thread creation
  if (newThreadForm && threadDialog) {
    newThreadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('thread-title');
      const categorySelect = document.getElementById('thread-category');
      const contentInput = document.getElementById('thread-content');

      if (!titleInput.value.trim() || !contentInput.value.trim()) return;

      const newCard = document.createElement('article');
      newCard.className = 'forum-card';
      newCard.setAttribute('data-tag', categorySelect.value);

      const categoryBadges = {
        help: '<span class="badge badge-tech">Help</span>',
        feature: '<span class="badge badge-feature">Feature</span>',
        showcase: '<span class="badge badge-showcase">Showcase</span>',
      };

      newCard.innerHTML = `
        <div class="thread-header">
          <h4 style="margin: 0; font-size: 1.1rem;">${escapeHtml(titleInput.value.trim())}</h4>
          ${categoryBadges[categorySelect.value] || '<span class="badge">General</span>'}
        </div>
        <p style="margin: 0.5rem 0; color: var(--pico-muted-color); font-size: 0.95rem;">
          ${escapeHtml(contentInput.value.trim())}
        </p>
        <div class="thread-footer">
          <span>Posted just now by You</span>
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <button class="vote-btn voted" title="Upvote">
              ▲ <span class="vote-count">1</span>
            </button>
            <span>0 replies</span>
          </div>
        </div>
      `;

      if (threadsContainer) {
        threadsContainer.prepend(newCard);
      }

      newThreadForm.reset();
      threadDialog.close();
      threadDialog.removeAttribute('open');
      filterThreads();
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
