'use strict';

/* =========================================================
   Einstellungen
   ========================================================= */
const STORAGE_KEY = 'petit-a-petit-v1';
const INTERVALS = [1, 2, 4, 8, 16]; // Tage bis zur nächsten Abfrage je Fach (Fach 1–5)
const SESSION_SIZE = 20;            // max. Karten pro Lernsitzung
const PRACTICE_SIZE = 10;           // Karten beim freien Üben
const NEW_CARDS_PER_DAY = 20;       // importierte Karten werden auf mehrere Tage verteilt
const ANIMATION_MS = 300;           // muss zur CSS-Animation .leave-* passen

/* =========================================================
   Hilfsfunktionen
   ========================================================= */
function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayStr(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return toDateStr(date);
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Für Suche und Dublettenprüfung: Groß-/Kleinschreibung und Akzente ignorieren ("cafe" findet "café")
const simplify = (text) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// "le petit-déjeuner" und "Le petit déjeuner" gelten als dieselbe Karte
const cardKey = (text) => simplify(text).replace(/[-\s]+/g, ' ').trim();

const deckById = (id) => DECKS.find((d) => d.id === id) || DECKS[0];

/* =========================================================
   Daten: Laden, Speichern, Prüfen
   Eine Karte: { id, deck, front (Fremdsprache), back (Deutsch), category, box, due }
   ========================================================= */
function newCard(deckId, front, back, category) {
  return { id: makeId(), deck: deckId, front, back, category, box: 1, due: todayStr() };
}

function starterCards(deck) {
  return deck.cards.map((c) => newCard(deck.id, c.front, c.back, c.category));
}

function createInitialState() {
  return {
    version: 2,
    cards: DECKS.flatMap(starterCards),
    initializedDecks: DECKS.map((d) => d.id),
    settings: { deck: DECKS[0].id, direction: 'foreign-de', autoSpeak: false, categories: {} },
    streak: { count: 0, lastDate: null },
  };
}

// Prüft gespeicherte oder importierte Daten, ergänzt fehlende Werte und
// übernimmt das alte Format (nur Französisch, Felder fr/de) automatisch.
// Gibt null zurück, wenn die Daten unbrauchbar sind.
function normalizeState(data) {
  if (!data || !Array.isArray(data.cards)) return null;
  const deckIds = DECKS.map((d) => d.id);
  const isOldFormat = data.version !== 2;

  const cards = [];
  for (const c of data.cards) {
    if (!c) return null;
    const front = typeof c.front === 'string' ? c.front : c.fr;
    const back = typeof c.back === 'string' ? c.back : c.de;
    if (typeof front !== 'string' || typeof back !== 'string') return null;
    cards.push({
      id: typeof c.id === 'string' && c.id ? c.id : makeId(),
      deck: deckIds.includes(c.deck) ? c.deck : DECKS[0].id,
      front: front.trim(),
      back: back.trim(),
      category: typeof c.category === 'string' && c.category.trim() ? c.category.trim() : 'Eigene',
      box: Number.isInteger(c.box) && c.box >= 1 && c.box <= INTERVALS.length ? c.box : 1,
      due: typeof c.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(c.due) ? c.due : todayStr(),
    });
  }

  const s = data.settings || {};
  const categories = s.categories && typeof s.categories === 'object' ? { ...s.categories } : {};
  if (isOldFormat && typeof s.category === 'string') categories[DECKS[0].id] = s.category;

  const streak = data.streak || {};
  const state = {
    version: 2,
    cards,
    initializedDecks: Array.isArray(data.initializedDecks)
      ? data.initializedDecks.filter((id) => deckIds.includes(id))
      : [DECKS[0].id], // altes Format: nur der Französisch-Stapel existierte
    settings: {
      deck: deckIds.includes(s.deck) ? s.deck : DECKS[0].id,
      direction: s.direction === 'de-foreign' || s.direction === 'de-fr' ? 'de-foreign' : 'foreign-de',
      autoSpeak: s.autoSpeak === true,
      categories,
    },
    streak: {
      count: Number.isInteger(streak.count) ? streak.count : 0,
      lastDate: typeof streak.lastDate === 'string' ? streak.lastDate : null,
    },
  };
  addMissingDecks(state);
  return state;
}

// Neue Stapel (z. B. nach einem Update) bekommen einmalig ihr Startpaket
function addMissingDecks(s) {
  DECKS.forEach((deck) => {
    if (s.initializedDecks.includes(deck.id)) return;
    s.cards.push(...starterCards(deck));
    s.initializedDecks.push(deck.id);
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = normalizeState(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch (err) {
    console.warn('Gespeicherte Daten konnten nicht gelesen werden:', err);
  }
  return createInitialState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    showToast('⚠️ Speichern nicht möglich (privater Modus?)');
  }
}

let state = loadState();
saveState(); // Startpaket bzw. umgestellte Daten sofort sichern

/* =========================================================
   Abfragen (immer bezogen auf den aktiven Stapel)
   ========================================================= */
const activeDeck = () => deckById(state.settings.deck);
const deckCards = () => state.cards.filter((c) => c.deck === state.settings.deck);
const isDue = (card) => card.due <= todayStr();
const findCard = (id) => state.cards.find((c) => c.id === id);
const foreignFirst = () => state.settings.direction === 'foreign-de';

function selectedCategory() {
  return state.settings.categories[state.settings.deck] || 'all';
}

function getCategories() {
  // Reihenfolge des ersten Auftretens beibehalten
  return [...new Set(deckCards().map((c) => c.category))];
}

function cardsInSelectedCategory() {
  const cat = selectedCategory();
  const cards = deckCards();
  return cat === 'all' ? cards : cards.filter((c) => c.category === cat);
}

/* =========================================================
   Leitner-System & Serie
   ========================================================= */
function applyLeitner(card, known) {
  card.box = known ? Math.min(card.box + 1, INTERVALS.length) : 1;
  card.due = todayStr(INTERVALS[card.box - 1]);
}

// Eine gemeinsame Serie für alle Stapel – gelernt ist gelernt
function updateStreak() {
  const today = todayStr();
  const { lastDate } = state.streak;
  if (lastDate === today) return;
  state.streak.count = lastDate === todayStr(-1) ? state.streak.count + 1 : 1;
  state.streak.lastDate = today;
}

function currentStreak() {
  const { count, lastDate } = state.streak;
  return lastDate === todayStr() || lastDate === todayStr(-1) ? count : 0;
}

/* =========================================================
   Elemente & Navigation
   ========================================================= */
const $ = (id) => document.getElementById(id);

const views = {
  home: $('view-home'),
  study: $('view-study'),
  result: $('view-result'),
  manage: $('view-manage'),
};

function showView(name) {
  Object.entries(views).forEach(([key, el]) => { el.hidden = key !== name; });
  window.scrollTo(0, 0);
}

function goHome() {
  renderHome();
  showView('home');
}

/* =========================================================
   Startseite
   ========================================================= */
function renderHome() {
  const deck = activeDeck();

  // Gewählte Kategorie existiert nicht mehr (z. B. gelöscht)?
  if (selectedCategory() !== 'all' && !getCategories().includes(selectedCategory())) {
    state.settings.categories[deck.id] = 'all';
    saveState();
  }

  const pool = cardsInSelectedCategory();
  const due = pool.filter(isDue);

  $('due-count').textContent = due.length;
  if (pool.length === 0) {
    $('due-hint').textContent = 'Noch keine Karten – leg unter „Karten verwalten“ welche an.';
  } else if (due.length > SESSION_SIZE) {
    $('due-hint').textContent = `Eine Runde hat bis zu ${SESSION_SIZE} Karten.`;
  } else if (due.length > 0) {
    $('due-hint').textContent = 'Auf geht’s – das schaffst du!';
  } else {
    const next = pool.map((c) => c.due).sort()[0];
    $('due-hint').textContent = `Alles erledigt 🎉 Nächste Karten: ${formatDate(next)}`;
  }

  const startBtn = $('btn-start');
  startBtn.disabled = pool.length === 0;
  startBtn.textContent = due.length > 0 ? `Lernen (${Math.min(due.length, SESSION_SIZE)})` : 'Freies Üben';

  const streak = currentStreak();
  $('streak-count').textContent = streak;
  document.querySelector('.streak').classList.toggle('is-active', streak > 0);

  // Richtungs-Knöpfe mit der Flagge des Stapels beschriften
  $('dir-foreign-de').textContent = `${deck.flag} → 🇩🇪`;
  $('dir-de-foreign').textContent = `🇩🇪 → ${deck.flag}`;
  document.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.direction === state.settings.direction);
  });

  renderDeckSwitch();
  renderBoxes(pool);
  renderChips();
  updateSpeechUI();
}

function renderDeckSwitch() {
  const container = $('deck-switch');
  container.innerHTML = '';
  DECKS.forEach((deck) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'deck-btn';
    btn.classList.toggle('is-active', deck.id === state.settings.deck);
    btn.setAttribute('aria-pressed', deck.id === state.settings.deck);

    const dueCount = state.cards.filter((c) => c.deck === deck.id && isDue(c)).length;
    btn.textContent = `${deck.flag} ${deck.name}`;
    if (dueCount > 0) {
      const badge = document.createElement('span');
      badge.className = 'deck-badge';
      badge.textContent = dueCount;
      btn.append(badge);
    }

    btn.addEventListener('click', () => {
      if (deck.id === state.settings.deck) return;
      state.settings.deck = deck.id;
      saveState();
      renderHome();
      checkImportFile();
    });
    container.append(btn);
  });
}

function renderBoxes(pool) {
  const counts = INTERVALS.map((_, i) => pool.filter((c) => c.box === i + 1).length);
  const max = Math.max(1, ...counts);
  const container = $('boxes');
  container.innerHTML = '';

  counts.forEach((count, i) => {
    const box = document.createElement('div');
    box.className = 'box';
    box.title = `Fach ${i + 1}: alle ${INTERVALS[i]} Tag(e)`;

    const num = document.createElement('span');
    num.className = 'box-count';
    num.textContent = count;

    const bar = document.createElement('span');
    bar.className = 'box-bar';
    bar.style.height = `${(count / max) * 60}px`;

    const label = document.createElement('span');
    label.className = 'box-label';
    label.textContent = `Fach ${i + 1}`;

    box.append(num, bar, label);
    container.append(box);
  });
}

function renderChips() {
  const container = $('category-chips');
  container.innerHTML = '';
  ['all', ...getCategories()].forEach((cat) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = cat === 'all' ? '🔀 Alle gemischt' : cat;
    chip.classList.toggle('is-active', selectedCategory() === cat);
    chip.addEventListener('click', () => {
      state.settings.categories[state.settings.deck] = cat;
      saveState();
      renderHome();
    });
    container.append(chip);
  });
}

document.querySelectorAll('.toggle-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.settings.direction = btn.dataset.direction;
    saveState();
    renderHome();
  });
});

$('btn-start').addEventListener('click', () => {
  const hasDue = cardsInSelectedCategory().some(isDue);
  startSession(!hasDue);
});

$('btn-manage').addEventListener('click', () => {
  $('search').value = '';
  renderManage();
  showView('manage');
});

/* =========================================================
   Lernsitzung
   ========================================================= */
let session = null;
let isAnimating = false;

function startSession(practice) {
  const pool = cardsInSelectedCategory();
  const candidates = practice ? pool.filter((c) => !isDue(c)) : pool.filter(isDue);
  if (candidates.length === 0) return;

  // Zufällig mischen, dann Karten aus niedrigen Fächern zuerst
  const picked = shuffle(candidates)
    .sort((a, b) => a.box - b.box)
    .slice(0, practice ? PRACTICE_SIZE : SESSION_SIZE);

  session = {
    practice,
    queue: picked.map((c) => ({ id: c.id, retry: false })),
    index: 0,
    firstTries: 0,
    correct: 0,
    flipped: false,
  };

  $('practice-badge').hidden = !practice;
  showView('study');
  renderCard();
}

function currentCard() {
  return findCard(session.queue[session.index].id);
}

function renderCard() {
  const item = session.queue[session.index];
  const card = findCard(item.id);
  const deck = activeDeck();
  const ff = foreignFirst();

  const flashcard = $('flashcard');
  // Ohne Animation zurück auf die Vorderseite, damit die Lösung nicht aufblitzt
  flashcard.classList.add('no-transition');
  flashcard.classList.remove('is-flipped', 'leave-left', 'leave-right');
  void flashcard.offsetWidth; // Browser zwingen, den Zustand sofort zu übernehmen
  flashcard.classList.remove('no-transition');

  $('front-lang').textContent = ff ? deck.flag : '🇩🇪';
  $('front-word').textContent = ff ? card.front : card.back;
  $('front-word').lang = ff ? deck.lang : 'de';
  $('back-lang').textContent = ff ? '🇩🇪' : deck.flag;
  $('back-word').textContent = ff ? card.back : card.front;
  $('back-word').lang = ff ? 'de' : deck.lang;

  $('card-meta').textContent = item.retry ? '🔁 Wiederholung' : `${card.category} · Fach ${card.box}`;

  session.flipped = false;
  $('answer-buttons').classList.remove('is-visible');
  updateProgress();
  updateSpeakButton();
  if (ff && state.settings.autoSpeak) speak(card.front);

  flashcard.classList.remove('enter');
  void flashcard.offsetWidth;
  flashcard.classList.add('enter');
}

function updateProgress() {
  const total = session.queue.length;
  $('progress-text').textContent = `${session.index + 1}/${total}`;
  $('progress-bar').style.width = `${(session.index / total) * 100}%`;
}

function flipCard() {
  if (!session || isAnimating) return;
  const flashcard = $('flashcard');
  flashcard.classList.remove('enter');
  flashcard.classList.toggle('is-flipped');
  if (!session.flipped) {
    session.flipped = true;
    $('answer-buttons').classList.add('is-visible');
    // Bei Deutsch → Fremdsprache steht die Fremdsprache auf der Rückseite
    if (!foreignFirst() && state.settings.autoSpeak) speak(currentCard().front);
    updateSpeakButton();
  }
}

function answer(known) {
  if (!session || !session.flipped || isAnimating) return;
  const item = session.queue[session.index];
  const card = findCard(item.id);

  // Nur der erste Versuch zählt für Fach und Ergebnis
  if (!item.retry) {
    session.firstTries++;
    if (known) session.correct++;
    if (!session.practice) applyLeitner(card, known);
    // Nicht gewusst? Am Ende der Runde noch einmal zeigen
    if (!known) session.queue.push({ id: item.id, retry: true });
  }
  updateStreak();
  saveState();

  isAnimating = true;
  stopSpeaking();
  $('btn-speak').hidden = true;
  $('answer-buttons').classList.remove('is-visible');
  $('flashcard').classList.add(known ? 'leave-right' : 'leave-left');

  setTimeout(() => {
    isAnimating = false;
    session.index++;
    if (session.index < session.queue.length) {
      renderCard();
    } else {
      showResult();
    }
  }, ANIMATION_MS);
}

$('flashcard').addEventListener('click', flipCard);
$('btn-right').addEventListener('click', () => answer(true));
$('btn-wrong').addEventListener('click', () => answer(false));
$('btn-speak').addEventListener('click', () => {
  if (session) speak(currentCard().front);
});

$('btn-quit').addEventListener('click', () => {
  stopSpeaking();
  session = null;
  goHome();
});

// Tastatur-Steuerung am Rechner
document.addEventListener('keydown', (e) => {
  if (views.study.hidden || !session) return;
  if (e.key === ' ' || e.key === 'Enter') {
    // Auf einem fokussierten Button löst der Browser den Klick schon selbst aus
    if (e.target.closest('button')) return;
    e.preventDefault();
    flipCard();
  } else if (e.key === 'ArrowRight') {
    answer(true);
  } else if (e.key === 'ArrowLeft') {
    answer(false);
  } else if (e.key.toLowerCase() === 's' && !$('btn-speak').hidden) {
    speak(currentCard().front);
  }
});

/* =========================================================
   Ergebnis
   ========================================================= */
function showResult() {
  const { correct, firstTries, practice } = session;
  const ratio = firstTries ? correct / firstTries : 0;
  const [perfect, great, ok] = activeDeck().praise;

  let emoji = '💪';
  let title = 'Dranbleiben!';
  if (ratio === 1) { emoji = '🏆'; title = perfect; }
  else if (ratio >= 0.8) { emoji = '🎉'; title = great; }
  else if (ratio >= 0.5) { emoji = '👍'; title = ok; }

  $('result-emoji').textContent = emoji;
  $('result-title').textContent = title;
  $('result-text').textContent = `${correct} von ${firstTries} beim ersten Versuch gewusst.`
    + (practice ? ' (Freies Üben)' : '');

  const remaining = practice ? 0 : cardsInSelectedCategory().filter(isDue).length;
  const continueBtn = $('btn-continue');
  continueBtn.hidden = remaining === 0;
  continueBtn.textContent = `Weiterlernen (${Math.min(remaining, SESSION_SIZE)})`;

  session = null;
  showView('result');
  if (ratio >= 0.8) launchConfetti();
}

function launchConfetti() {
  const colors = ['#4263EB', '#FF6B6B', '#FFC93C', '#20C997', '#6A5AE0'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDuration = `${1.6 + Math.random() * 1.6}s`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    document.body.append(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
}

$('btn-continue').addEventListener('click', () => startSession(false));
$('btn-home').addEventListener('click', goHome);

/* =========================================================
   Karten verwalten
   ========================================================= */
function renderManage() {
  const deck = activeDeck();
  const cards = deckCards();
  const query = simplify($('search').value.trim());
  const list = $('card-list');
  list.innerHTML = '';

  const matches = cards.filter((c) =>
    !query || simplify(`${c.front} ${c.back} ${c.category}`).includes(query));

  $('manage-flag').textContent = deck.flag;
  $('card-total').textContent = `(${cards.length})`;
  $('empty-list').hidden = matches.length > 0;
  $('csv-lang').textContent = deck.name;
  $('csv-deck').textContent = `${deck.flag} ${deck.name}`;

  matches.forEach((card) => {
    const li = document.createElement('li');
    li.className = 'card-item';

    const text = document.createElement('div');
    text.className = 'card-item-text';
    const front = document.createElement('div');
    front.className = 'card-item-front';
    front.lang = deck.lang;
    front.textContent = card.front;
    const back = document.createElement('div');
    back.className = 'card-item-back';
    back.textContent = card.back;
    const meta = document.createElement('div');
    meta.className = 'card-item-meta';
    meta.textContent = `${card.category} · Fach ${card.box}`;
    text.append(front, back, meta);

    const actions = document.createElement('div');
    actions.className = 'card-item-actions';
    if (canSpeak()) {
      actions.append(iconButton('🔊', `„${card.front}“ vorlesen`, () => speak(card.front)));
    }
    actions.append(
      iconButton('✏️', `„${card.front}“ bearbeiten`, () => openDialog(card)),
      iconButton('🗑️', `„${card.front}“ löschen`, () => deleteCard(card)),
    );

    li.append(text, actions);
    list.append(li);
  });

  renderDeleteCategory();
}

function iconButton(icon, label, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = icon;
  btn.setAttribute('aria-label', label);
  btn.addEventListener('click', onClick);
  return btn;
}

function deleteCard(card) {
  if (!confirm(`Karte „${card.front}“ wirklich löschen?`)) return;
  state.cards = state.cards.filter((c) => c.id !== card.id);
  saveState();
  renderManage();
  showToast('Karte gelöscht');
}

$('search').addEventListener('input', renderManage);
$('btn-back').addEventListener('click', goHome);

/* ----- Kategorie löschen (z. B. um einen Import rückgängig zu machen) ----- */
function renderDeleteCategory() {
  const select = $('delete-category');
  select.innerHTML = '';
  getCategories().forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = `${cat} (${deckCards().filter((c) => c.category === cat).length})`;
    select.append(option);
  });
  $('btn-delete-category').disabled = select.options.length === 0;
}

$('btn-delete-category').addEventListener('click', () => {
  const cat = $('delete-category').value;
  if (!cat) return;
  const deck = activeDeck();
  const count = deckCards().filter((c) => c.category === cat).length;
  if (!confirm(`Kategorie „${cat}“ mit ${count} Karten aus „${deck.name}“ löschen?\nDer Fortschritt dieser Karten geht verloren.`)) return;
  state.cards = state.cards.filter((c) => !(c.deck === deck.id && c.category === cat));
  saveState();
  renderManage();
  checkImportFile();
  showToast(`${count} Karten gelöscht`);
});

/* ----- Dialog: anlegen / bearbeiten ----- */
const dialog = $('card-dialog');
let editingId = null;

function openDialog(card = null) {
  const deck = activeDeck();
  editingId = card ? card.id : null;
  $('dialog-title').textContent = card ? 'Karte bearbeiten' : `Neue Karte ${deck.flag}`;
  $('label-front').textContent = deck.name;
  $('input-front').lang = deck.lang;
  $('input-front').value = card ? card.front : '';
  $('input-back').value = card ? card.back : '';
  $('input-category').value = card
    ? card.category
    : (selectedCategory() !== 'all' ? selectedCategory() : 'Eigene');

  const datalist = $('category-list');
  datalist.innerHTML = '';
  getCategories().forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat;
    datalist.append(option);
  });

  dialog.showModal();
  $('input-front').focus();
}

$('btn-add').addEventListener('click', () => openDialog());
$('btn-cancel').addEventListener('click', () => dialog.close());

$('card-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const front = $('input-front').value.trim();
  const back = $('input-back').value.trim();
  const category = $('input-category').value.trim();
  if (!front || !back || !category) return;

  if (editingId) {
    Object.assign(findCard(editingId), { front, back, category }); // Fach und Fälligkeit bleiben
    showToast('Karte gespeichert');
  } else {
    state.cards.unshift(newCard(state.settings.deck, front, back, category));
    showToast('Karte angelegt ✨');
  }
  saveState();
  dialog.close();
  renderManage();
});

/* ----- Backup: Export / Import / Zurücksetzen ----- */
$('btn-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `petit-a-petit-backup-${todayStr()}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Backup heruntergeladen');
});

$('import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = ''; // gleiche Datei später erneut wählbar
  if (!file) return;

  try {
    const imported = normalizeState(JSON.parse(await file.text()));
    if (!imported) throw new Error('Ungültiges Format');
    if (!confirm(`Backup mit ${imported.cards.length} Karten einspielen? Deine aktuellen Daten (alle Stapel) werden ersetzt.`)) return;
    state = imported;
    saveState();
    renderManage();
    checkImportFile();
    showToast('Backup importiert ✅');
  } catch (err) {
    showToast('⚠️ Diese Datei ist kein gültiges Backup');
  }
});

$('btn-reset').addEventListener('click', () => {
  const deck = activeDeck();
  if (!confirm(`Stapel „${deck.name}“ zurücksetzen?\nAlle Karten und der Fortschritt in diesem Stapel werden gelöscht und durch das Startpaket ersetzt. Andere Stapel bleiben unverändert.`)) return;
  state.cards = state.cards.filter((c) => c.deck !== deck.id).concat(starterCards(deck));
  state.settings.categories[deck.id] = 'all';
  saveState();
  renderManage();
  checkImportFile();
  showToast('Stapel zurückgesetzt');
});

/* =========================================================
   CSV-Import (Datei auswählen oder Wortliste im Repo)
   ========================================================= */
// Zerlegt CSV-Text in Zeilen und Spalten. Versteht ; oder , als Trenner und "Anführungszeichen".
function parseCSV(text) {
  text = text.replace(/^﻿/, ''); // Excel-BOM entfernen
  const firstLine = text.split(/\r?\n/, 1)[0];
  const count = (ch) => firstLine.split(ch).length - 1;
  const delimiter = count(';') >= count(',') ? ';' : ',';

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; } // "" = ein Anführungszeichen
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function csvToCards(text, defaultCategory) {
  const rows = parseCSV(text)
    .map((r) => r.map((cell) => cell.trim()))
    .filter((r) => r.length >= 2 && r[0] && r[1]);
  // Kopfzeile wie "Französisch;Deutsch" oder "English;Deutsch" überspringen
  if (rows.length && /^(deutsch|german|rückseite|back)$/i.test(rows[0][1])) rows.shift();
  return rows.map(([front, back, category]) => ({ front, back, category: category || defaultCategory }));
}

// Dubletten werden nur innerhalb des aktiven Stapels geprüft
function onlyNewCards(list) {
  const known = new Set(deckCards().map((c) => cardKey(c.front)));
  return list.filter((c) => {
    const key = cardKey(c.front);
    if (known.has(key)) return false;
    known.add(key);
    return true;
  });
}

function importCards(list) {
  const deck = activeDeck();
  const fresh = onlyNewCards(list);
  const skipped = list.length - fresh.length;
  if (fresh.length === 0) {
    showToast('Alle Karten sind schon vorhanden');
    return;
  }

  const days = Math.ceil(fresh.length / NEW_CARDS_PER_DAY);
  let message = `${deck.flag} ${fresh.length} neue Karten in den Stapel „${deck.name}“ importieren?`;
  if (skipped) message += `\n${skipped} sind schon vorhanden und werden übersprungen.`;
  if (days > 1) message += `\n\nDamit es nicht zu viel auf einmal wird, werden sie über ${days} Tage verteilt (${NEW_CARDS_PER_DAY} pro Tag).`;
  if (!confirm(message)) return;

  fresh.forEach((c, i) => {
    const card = newCard(deck.id, c.front, c.back, c.category);
    card.due = todayStr(Math.floor(i / NEW_CARDS_PER_DAY));
    state.cards.push(card);
  });
  saveState();
  renderHome();
  if (!views.manage.hidden) renderManage();
  checkImportFile();
  showToast(`${fresh.length} Karten importiert ✅`);
}

$('import-csv').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const cards = csvToCards(await file.text(), 'Importiert');
  if (cards.length === 0) {
    showToast('⚠️ Keine Karten in der Datei gefunden');
    return;
  }
  importCards(cards);
});

// Liegt für den aktiven Stapel eine Wortliste im Repo, bietet die Startseite den Import an
let fileCards = [];

async function checkImportFile() {
  const deck = activeDeck();
  const banner = $('file-import');
  banner.hidden = true;
  if (!deck.importFile) return;
  try {
    const res = await fetch(deck.importFile, { cache: 'no-store' });
    if (!res.ok) throw new Error('nicht gefunden');
    const cards = csvToCards(await res.text(), deck.importCategory);
    if (deck.importReversed) cards.reverse();
    if (state.settings.deck !== deck.id) return; // Stapel wurde inzwischen gewechselt
    fileCards = cards;
    const count = onlyNewCards(cards).length;
    $('file-import-title').textContent = `📥 Wortliste für ${deck.flag} ${deck.name} gefunden`;
    $('file-import-count').textContent = count;
    banner.hidden = count === 0;
  } catch (err) {
    // z. B. lokal per Doppelklick geöffnet oder Datei nicht vorhanden – dann kein Hinweis
  }
}

$('btn-file-import').addEventListener('click', () => importCards(fileCards));

/* =========================================================
   Toast-Hinweis
   ========================================================= */
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2500);
}

/* =========================================================
   Aussprache (Sprachausgabe des Browsers, keine externen Dienste)
   ========================================================= */
const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const voices = {}; // passende Stimme je Stapel, z. B. { fr: …, en: … }

// Stimmen laden je nach Browser verzögert – deshalb auch auf "voiceschanged" hören
function pickVoices() {
  const all = window.speechSynthesis.getVoices();
  const lang = (v) => v.lang.replace('_', '-').toLowerCase();
  DECKS.forEach((deck) => {
    const preferred = deck.voiceLangs
      .map((wanted) => all.find((v) => lang(v) === wanted))
      .find(Boolean);
    voices[deck.id] = preferred || all.find((v) => lang(v).startsWith(deck.lang)) || null;
  });
  updateSpeechUI();
}

// Nur vorlesen, wenn eine passende Stimme da ist – sonst würde z. B. eine deutsche Stimme "bonjour" sprechen
function canSpeak() {
  return Boolean(voices[state.settings.deck]);
}

// Hinweise wie "(f)" sowie Abkürzungen wie "qn" oder "sth" nicht wörtlich vorlesen
function toSpeechText(text) {
  let result = text.replace(/\([^)]*\)/g, '').replace(/\s*\/\s*/g, ', ');
  Object.entries(activeDeck().abbreviations || {}).forEach(([short, long]) => {
    result = result.replace(new RegExp(`\\b${short}\\b`, 'g'), long);
  });
  return result.trim();
}

function speak(text) {
  const voice = voices[state.settings.deck];
  if (!voice) return;
  window.speechSynthesis.cancel(); // laufende Ausgabe abbrechen
  const utterance = new SpeechSynthesisUtterance(toSpeechText(text));
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = 0.9; // etwas langsamer – besser zum Mitlernen
  const btn = $('btn-speak');
  utterance.onstart = () => btn.classList.add('is-speaking');
  utterance.onend = utterance.onerror = () => btn.classList.remove('is-speaking');
  window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  if (speechSupported) window.speechSynthesis.cancel();
  $('btn-speak').classList.remove('is-speaking');
}

// Lautsprecher nur zeigen, wenn die Fremdsprache gerade sichtbar ist
function updateSpeakButton() {
  const btn = $('btn-speak');
  if (!session || !canSpeak()) {
    btn.hidden = true;
    return;
  }
  btn.hidden = !(foreignFirst() || session.flipped);
}

function updateSpeechUI() {
  $('autospeak-row').hidden = !canSpeak();
  $('autospeak').checked = state.settings.autoSpeak;
  updateSpeakButton();
}

$('autospeak').addEventListener('change', (e) => {
  state.settings.autoSpeak = e.target.checked;
  saveState();
  if (e.target.checked) speak(activeDeck().sample); // kurze Hörprobe
});

if (speechSupported) {
  window.speechSynthesis.onvoiceschanged = () => {
    pickVoices();
    if (!views.manage.hidden) renderManage();
  };
  pickVoices();
}

/* =========================================================
   Start
   ========================================================= */
renderHome();
checkImportFile();
