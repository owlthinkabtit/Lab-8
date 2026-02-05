// Minimal accessible modal + deck CRUD (in-memory)
(() => {
  const modal = document.getElementById('modal');
  const dialog = modal.querySelector('.modal');
  const form = document.getElementById('deck-form');
  const nameInput = document.getElementById('deck-name');
  const saveBtn = form.querySelector('.save');
  const cancelBtn = form.querySelector('.cancel');
  const deleteBtn = form.querySelector('.delete');
  const closeBtn = modal.querySelector('.close-modal');

  const deckListEl = document.querySelector('.deck-list');
  const newDeckBtn = document.querySelector('.new-deck');
  const cardEl = document.querySelector('.card');
  const cardFront = cardEl.querySelector('.front');
  const cardBack = cardEl.querySelector('.back');
  const flipBtn = document.querySelector('.flip');

  // initialize flip button ARIA state
  if (flipBtn) flipBtn.setAttribute('aria-pressed', 'false');

  // flip behavior: toggle class + aria-pressed
  if (flipBtn && cardEl) {
    const toggleFlip = () => {
      const flipped = cardEl.classList.toggle('is-flipped');
      flipBtn.setAttribute('aria-pressed', flipped ? 'true' : 'false');
      cardEl.setAttribute('aria-pressed', flipped ? 'true' : 'false');
    };

    flipBtn.addEventListener('click', toggleFlip);
    flipBtn.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleFlip();
      }
    });

    // make the card keyboard-accessible
    cardEl.setAttribute('tabindex', '0');
    cardEl.setAttribute('role', 'button');
    cardEl.setAttribute('aria-pressed', 'false');
    cardEl.setAttribute('aria-label', 'Flashcard. Press Space or Enter to flip.');

    cardEl.addEventListener('keydown', (e) => {
      // Space / Enter to flip
      if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter') {
        e.preventDefault();
        toggleFlip();
      }
      // Arrow keys can map to prev/next if available
      if (e.key === 'ArrowLeft') {
        const prevBtn = document.querySelector('.prev');
        if (prevBtn) prevBtn.click();
      } else if (e.key === 'ArrowRight') {
        const nextBtn = document.querySelector('.next');
        if (nextBtn) nextBtn.click();
      }
    });

    // clicking the card toggles flip (touch/pointing devices)
    cardEl.addEventListener('click', () => {
      toggleFlip();
    });
  }

  // decks now include cards and a current index per deck
  let decks = [
    { id: 1, name: 'Biology', cards: [{ id: 1, q: 'What is photosynthesis?', a: 'Process by which plants convert light energy to chemical energy.' }], current: 0 },
    { id: 2, name: 'Spanish', cards: [{ id: 2, q: 'How do you say hello?', a: '"Hola" means hello.' }], current: 0 },
    { id: 3, name: 'Math', cards: [{ id: 3, q: '2 + 2 = ?', a: '4' }], current: 0 }
  ];
  let nextId = 4; // deck id
  let nextCardId = 4; // card id
  let activeDeckId = decks[0] && decks[0].id;
  let lastFocus = null;

  // Load saved state (if available)
  try {
    const saved = window.storage && window.storage.loadState && window.storage.loadState();
    if (saved && saved.decks) {
      decks = saved.decks;
      nextId = saved.nextId || nextId;
      nextCardId = saved.nextCardId || nextCardId;
      activeDeckId = (saved.activeDeckId != null) ? saved.activeDeckId : activeDeckId;
    }
  } catch (err) {
    console.warn('Failed to read saved state', err);
  }

  // Persistence helper
  function persist() {
    if (window.storage && window.storage.saveState) {
      window.storage.saveState({ decks, nextId, nextCardId, activeDeckId });
    }
  }

  // Debounce utility
  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  // Search helpers
  const searchInput = document.querySelector('.search-input');
  const searchCountEl = document.querySelector('.search-count');

  function clearSearch() {
    if (searchInput) searchInput.value = '';
    if (searchCountEl) searchCountEl.textContent = '';
  }

  function performSearch(term) {
    const deck = decks.find(d => d.id === activeDeckId);
    if (!deck || !searchCountEl) return;
    const q = String(term || '').trim().toLowerCase();
    if (!q) {
      searchCountEl.textContent = '';
      return;
    }
    const matches = deck.cards.map((c, i) => ({ c, i })).filter(x => (x.c.q || '').toLowerCase().includes(q) || (x.c.a || '').toLowerCase().includes(q));
    searchCountEl.textContent = `${matches.length} match${matches.length !== 1 ? 'es' : ''}`;
    if (matches.length) {
      deck.current = matches[0].i;
      updateMainArea();
    }
  }

  const debouncedSearch = debounce(performSearch, 300);
  if (searchInput) searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));

  function escapeHTML(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function renderDecks() {
    deckListEl.innerHTML = '';
    if (decks.length === 0) {
      const li = document.createElement('li');
      li.className = 'deck';
      li.textContent = 'No decks yet';
      deckListEl.appendChild(li);
      showPlaceholder();
      return;
    }

    decks.forEach(deck => {
      const li = document.createElement('li');
      li.className = 'deck-item' + (deck.id === activeDeckId ? ' active' : '');
      li.dataset.id = deck.id;
      li.innerHTML = `
        <span class="name">${escapeHTML(deck.name)}</span>
        <div class="deck-actions">
          <button class="edit" aria-label="Edit ${escapeHTML(deck.name)}">Edit</button>
          <button class="delete" aria-label="Delete ${escapeHTML(deck.name)}">Delete</button>
        </div>
      `;
      deckListEl.appendChild(li);
    });

    updateMainArea();
  }

  function updateMainArea() {
    const deck = decks.find(d => d.id === activeDeckId);
    // show front when switching decks or updating content
    if (cardEl) {
      cardEl.classList.remove('is-flipped');
      if (flipBtn) flipBtn.setAttribute('aria-pressed', 'false');
    }
    const deckNameEl = document.querySelector('.deck-name');
    if (!deck) {
      if (deckNameEl) deckNameEl.textContent = '';
      return showPlaceholder();
    }

    if (deckNameEl) deckNameEl.textContent = deck.name;

    // handle card display
    const cards = deck.cards || [];
    if (!cards.length) {
      cardFront.textContent = 'No cards yet';
      cardBack.textContent = '';
      // disable prev/next/edit
      document.querySelector('.prev').disabled = true;
      document.querySelector('.next').disabled = true;
      document.querySelector('.edit-card').disabled = true;
      return;
    }

    // ensure current index exists
    deck.current = Math.max(0, Math.min(deck.current || 0, cards.length - 1));
    const card = cards[deck.current];
    cardFront.textContent = card.q;
    cardBack.textContent = card.a;

    // enable nav/edit
    document.querySelector('.prev').disabled = false;
    document.querySelector('.next').disabled = false;
    document.querySelector('.edit-card').disabled = false;
  }

  function showPlaceholder() {
    cardFront.textContent = 'No cards to show';
    cardBack.textContent = '';
  }

  function selectDeck(id) {
    activeDeckId = id;
    renderDecks();
  }

  function openModal(mode = 'create', id = null, opener = null) {
    lastFocus = opener || document.activeElement;
    modal.classList.remove('hidden');
    modal.setAttribute('data-mode', mode);
    if (id != null) modal.setAttribute('data-id', id);
    else modal.removeAttribute('data-id');

    const title = modal.querySelector('#modal-title');
    if (mode === 'create') {
      title.textContent = 'New Deck';
      deleteBtn.classList.add('hidden');
      nameInput.value = '';
    } else {
      title.textContent = 'Edit Deck';
      deleteBtn.classList.remove('hidden');
      const deck = decks.find(d => d.id === id);
      nameInput.value = deck ? deck.name : '';
    }

    // add listeners for trap & esc
    document.addEventListener('keydown', handleKeyDown);
    // focus the first focusable (input)
    setTimeout(() => nameInput.focus(), 10);
  }

  function closeModal() {
    modal.classList.add('hidden');
    modal.removeAttribute('data-mode');
    modal.removeAttribute('data-id');
    document.removeEventListener('keydown', handleKeyDown);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function handleKeyDown(e) {
    // ESC closes
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }
    // focus trap
    if (e.key === 'Tab') {
      const focusable = dialog.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // Form submit => create or update (with confirmation on edit)
  form.addEventListener('submit', e => {
    e.preventDefault();
    const mode = modal.getAttribute('data-mode');
    const id = modal.getAttribute('data-id');
    const name = nameInput.value.trim();
    if (!name) return nameInput.focus();

    if (mode === 'create') {
      const newDeck = { id: nextId++, name, cards: [], current: 0 };
      decks.push(newDeck);
      activeDeckId = newDeck.id;
    } else if (mode === 'edit' && id) {
      const deck = decks.find(d => d.id === Number(id));
      if (deck) {
        if (deck.name !== name) {
          const ok = window.confirm(`Save changes to deck name "${deck.name}" → "${name}"?`);
          if (!ok) return;
        }
        deck.name = name;
      }
    }

    renderDecks();
    closeModal();
  });

  // Cancel & close
  cancelBtn.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  // Delete deck (with confirmation)
  deleteBtn.addEventListener('click', () => {
    const id = modal.getAttribute('data-id');
    if (!id) return;
    const deck = decks.find(d => d.id === Number(id));
    if (!deck) return;
    const ok = window.confirm(`Delete deck "${deck.name}"? This action cannot be undone.`);
    if (!ok) return;
    const idx = decks.findIndex(d => d.id === Number(id));
    if (idx > -1) decks.splice(idx, 1);
    if (decks.length) activeDeckId = decks[0].id; else activeDeckId = null;
    renderDecks();
    closeModal();
  });

  // New deck button
  newDeckBtn.addEventListener('click', e => openModal('create', null, e.currentTarget));

  // New/Edit card buttons and controls
  const newCardBtn = document.querySelector('.new-card');
  const editCardBtn = document.querySelector('.edit-card');
  const cardModal = document.getElementById('card-modal');
  const cardDialog = cardModal.querySelector('.modal');
  const cardForm = document.getElementById('card-form');
  const cardQuestion = document.getElementById('card-question');
  const cardAnswer = document.getElementById('card-answer');
  const cardDeleteBtn = cardModal.querySelector('.delete');
  const closeCardBtn = cardModal.querySelector('.close-card-modal');

  function openCardModal(mode = 'create', cardId = null, opener = null) {
    lastFocus = opener || document.activeElement;
    cardModal.classList.remove('hidden');
    cardModal.setAttribute('data-mode', mode);
    if (cardId != null) cardModal.setAttribute('data-id', cardId);
    else cardModal.removeAttribute('data-id');

    const title = cardModal.querySelector('#card-modal-title');
    const deck = decks.find(d => d.id === activeDeckId);

    if (mode === 'create') {
      title.textContent = 'New Card';
      cardDeleteBtn.classList.add('hidden');
      cardQuestion.value = '';
      cardAnswer.value = '';
    } else {
      title.textContent = 'Edit Card';
      cardDeleteBtn.classList.remove('hidden');
      const card = deck && deck.cards && deck.cards.find(c => c.id === Number(cardId));
      cardQuestion.value = card ? card.q : '';
      cardAnswer.value = card ? card.a : '';
    }

    document.addEventListener('keydown', handleCardKeyDown);
    setTimeout(() => cardQuestion.focus(), 10);
  }

  function closeCardModal() {
    cardModal.classList.add('hidden');
    cardModal.removeAttribute('data-mode');
    cardModal.removeAttribute('data-id');
    document.removeEventListener('keydown', handleCardKeyDown);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function handleCardKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeCardModal();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = cardDialog.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  newCardBtn.addEventListener('click', e => openCardModal('create', null, e.currentTarget));
  editCardBtn.addEventListener('click', e => {
    const deck = decks.find(d => d.id === activeDeckId);
    if (!deck || !deck.cards || !deck.cards.length) return;
    const card = deck.cards[deck.current || 0];
    if (!card) return;
    openCardModal('edit', card.id, e.currentTarget);
  });

  cardForm.addEventListener('submit', e => {
    e.preventDefault();
    const mode = cardModal.getAttribute('data-mode');
    const id = cardModal.getAttribute('data-id');
    const q = cardQuestion.value.trim();
    const a = cardAnswer.value.trim();
    if (!q || !a) return;
    const deck = decks.find(d => d.id === activeDeckId);
    if (!deck) return;

    if (mode === 'create') {
      const newCard = { id: nextCardId++, q, a };
      deck.cards.push(newCard);
      deck.current = deck.cards.length - 1;
    } else if (mode === 'edit' && id) {
      const card = deck.cards.find(c => c.id === Number(id));
      if (card) {
        card.q = q;
        card.a = a;
      }
    }

    renderDecks();
    closeCardModal();
  });

  cardDeleteBtn.addEventListener('click', () => {
    const id = cardModal.getAttribute('data-id');
    if (!id) return;
    const deck = decks.find(d => d.id === activeDeckId);
    if (!deck) return;
    const cardIdx = deck.cards.findIndex(c => c.id === Number(id));
    if (cardIdx === -1) return;
    const ok = window.confirm('Delete this card?');
    if (!ok) return;
    deck.cards.splice(cardIdx, 1);
    deck.current = Math.max(0, (deck.current || 0) - 1);
    renderDecks();
    closeCardModal();
  });

  closeCardBtn.addEventListener('click', closeCardModal);

  // Delegated clicks in list (with confirm on quick delete)
  deckListEl.addEventListener('click', e => {
    const li = e.target.closest('.deck-item');
    if (!li) return;
    const id = Number(li.dataset.id);
    if (e.target.matches('.edit')) {
      openModal('edit', id, e.target);
      return;
    }
    if (e.target.matches('.delete')) {
      const deck = decks.find(d => d.id === id);
      if (!deck) return;
      const ok = window.confirm(`Delete deck "${deck.name}"? This cannot be undone.`);
      if (!ok) return;
      const idx = decks.findIndex(d => d.id === id);
      if (idx > -1) decks.splice(idx, 1);
      if (decks.length) activeDeckId = decks[0].id; else activeDeckId = null;
      renderDecks();
      return;
    }
    // selection
    selectDeck(id);
  });

  // prev/next handling for cards
  const prevBtn = document.querySelector('.prev');
  const nextBtn = document.querySelector('.next');

  function prevCard() {
    const deck = decks.find(d => d.id === activeDeckId);
    if (!deck || !deck.cards || !deck.cards.length) return;
    deck.current = (deck.current - 1 + deck.cards.length) % deck.cards.length;
    updateMainArea();
  }
  function nextCard() {
    const deck = decks.find(d => d.id === activeDeckId);
    if (!deck || !deck.cards || !deck.cards.length) return;
    deck.current = (deck.current + 1) % deck.cards.length;
    updateMainArea();
  }

  if (prevBtn) prevBtn.addEventListener('click', prevCard);
  if (nextBtn) nextBtn.addEventListener('click', nextCard);

  // deck navigation (keyboard shortcuts j/k and Ctrl/Cmd+Arrow)
  function selectPrevDeck() {
    if (!decks.length) return;
    const idx = decks.findIndex(d => d.id === activeDeckId);
    const newIdx = (idx - 1 + decks.length) % decks.length;
    selectDeck(decks[newIdx].id);
  }
  function selectNextDeck() {
    if (!decks.length) return;
    const idx = decks.findIndex(d => d.id === activeDeckId);
    const newIdx = (idx + 1) % decks.length;
    selectDeck(decks[newIdx].id);
  }

  document.addEventListener('keydown', (e) => {
    const active = document.activeElement;
    const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    const modalOpen = (!modal.classList.contains('hidden')) || (!cardModal.classList.contains('hidden'));
    if (isTyping || modalOpen) return;

    // Arrow keys (no modifier) control prev/next card
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevCard(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); nextCard(); return; }
    }

    const key = e.key.toLowerCase();
    if (key === 'j') { e.preventDefault(); selectNextDeck(); }
    else if (key === 'k') { e.preventDefault(); selectPrevDeck(); }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') { e.preventDefault(); selectNextDeck(); }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') { e.preventDefault(); selectPrevDeck(); }
  });

  // initial render
  renderDecks();
})();