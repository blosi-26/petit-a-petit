'use strict';

/* =========================================================
   Einstellungen
   ========================================================= */
const STORAGE_KEY = 'petit-a-petit-v1';
const INTERVALS = [1, 2, 4, 8, 16]; // Tage bis zur nächsten Abfrage je Fach (Fach 1–5)
const SESSION_SIZE = 20;            // max. Karten pro Lernsitzung
const PRACTICE_SIZE = 10;           // Karten beim freien Üben
const ANIMATION_MS = 300;           // muss zur CSS-Animation .leave-* passen

/* =========================================================
   Datums-Hilfen (lokales Datum als "JJJJ-MM-TT")
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

/* =========================================================
   Daten: Laden, Speichern, Prüfen
   ========================================================= */
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function newCard(fr, de, category) {
  return { id: makeId(), fr, de, category, box: 1, due: todayStr() };
}

function createInitialState() {
  return {
    cards: STARTER_CARDS.map((c) => newCard(c.fr, c.de, c.category)),
    settings: { direction: 'fr-de', category: 'all', autoSpeak: false },
    streak: { count: 0, lastDate: null },
  };
}

// Prüft gespeicherte oder importierte Daten und ergänzt fehlende Werte.
// Gibt null zurück, wenn die Daten unbrauchbar sind.
function normalizeState(data) {
  if (!data || !Array.isArray(data.cards)) return null;

  const cards = [];
  for (const c of data.cards) {
    if (!c || typeof c.fr !== 'string' || typeof c.de !== 'string') return null;
    const box = Number.isInteger(c.box) && c.box >= 1 && c.box <= INTERVALS.length ? c.box : 1;
    const due = typeof c.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(c.due) ? c.due : todayStr();
    cards.push({
      id: typeof c.id === 'string' && c.id ? c.id : makeId(),
      fr: c.fr.trim(),
      de: c.de.trim(),
      category: typeof c.category === 'string' && c.category.trim() ? c.category.trim() : 'Eigene',
      box,
      due,
    });
  }

  const settings = data.settings || {};
  const streak = data.streak || {};
  return {
    cards,
    settings: {
      direction: settings.direction === 'de-fr' ? 'de-fr' : 'fr-de',
      category: typeof settings.category === 'string' ? settings.category : 'all',
      autoSpeak: settings.autoSpeak === true,
    },
    streak: {
      count: Number.isInteger(streak.count) ? streak.count : 0,
      lastDate: typeof streak.lastDate === 'string' ? streak.lastDate : null,
    },
  };
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
saveState(); // beim ersten Start das Startpaket sofort sichern

/* =========================================================
   Abfragen auf die Karten
   ========================================================= */
const isDue = (card) => card.due <= todayStr();
const findCard = (id) => state.cards.find((c) => c.id === id);

function getCategories() {
  // Reihenfolge des ersten Auftretens beibehalten
  return [...new Set(state.cards.map((c) => c.category))];
}

function cardsInSelectedCategory() {
  const cat = state.settings.category;
  return cat === 'all' ? state.cards : state.cards.filter((c) => c.category === cat);
}

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* =========================================================
   Leitner-System & Serie
   ========================================================= */
function applyLeitner(card, known) {
  card.box = known ? Math.min(card.box + 1, INTERVALS.length) : 1;
  card.due = todayStr(INTERVALS[card.box - 1]);
}

function updateStreak() {
  const today = todayStr();
  const { lastDate } = state.streak;
  if (lastDate === today) return;
  state.streak.count = lastDate === todayStr(-1) ? state.streak.count + 1 : 1;
  state.streak.lastDate = today;
}

// Die Serie zählt nur, wenn heute oder gestern gelernt wurde
function currentStreak() {
  const { count, lastDate } = state.streak;
  return lastDate === todayStr() || lastDate === todayStr(-1) ? count : 0;
}

/* =========================================================
   Elemente
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

/* =========================================================
   Startseite
   ========================================================= */
function renderHome() {
  // Gewählte Kategorie existiert nicht mehr (z. B. alle Karten gelöscht)?
  if (state.settings.category !== 'all' && !getCategories().includes(state.settings.category)) {
    state.settings.category = 'all';
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

  // Serie
  const streak = currentStreak();
  $('streak-count').textContent = streak;
  document.querySelector('.streak').classList.toggle('is-active', streak > 0);

  renderBoxes(pool);
  renderChips();
  document.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.direction === state.settings.direction);
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
    chip.textContent = cat === 'all' ? 'Alle' : cat;
    chip.classList.toggle('is-active', state.settings.category === cat);
    chip.addEventListener('click', () => {
      state.settings.category = cat;
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

function renderCard() {
  const item = session.queue[session.index];
  const card = findCard(item.id);
  const frFirst = state.settings.direction === 'fr-de';

  const flashcard = $('flashcard');
  // Ohne Animation zurück auf die Vorderseite, damit die Lösung nicht aufblitzt
  flashcard.classList.add('no-transition');
  flashcard.classList.remove('is-flipped', 'leave-left', 'leave-right');
  void flashcard.offsetWidth; // Browser zwingen, den Zustand sofort zu übernehmen
  flashcard.classList.remove('no-transition');

  $('front-lang').textContent = frFirst ? '🇫🇷' : '🇩🇪';
  $('front-word').textContent = frFirst ? card.fr : card.de;
  $('back-lang').textContent = frFirst ? '🇩🇪' : '🇫🇷';
  $('back-word').textContent = frFirst ? card.de : card.fr;

  $('card-meta').textContent = item.retry
    ? '🔁 Wiederholung'
    : `${card.category} · Fach ${card.box}`;

  session.flipped = false;
  $('answer-buttons').classList.remove('is-visible');
  updateProgress();
  updateSpeakButton();
  if (frFirst && state.settings.autoSpeak) speak(card.fr);

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
    // Bei DE → FR steht das Französische auf der Rückseite
    if (state.settings.direction === 'de-fr' && state.settings.autoSpeak) speak(currentCard().fr);
    updateSpeakButton();
  }
}

function currentCard() {
  return findCard(session.queue[session.index].id);
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
  if (session) speak(currentCard().fr);
});

$('btn-quit').addEventListener('click', () => {
  stopSpeaking();
  session = null;
  renderHome();
  showView('home');
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
    speak(currentCard().fr);
  }
});

/* =========================================================
   Ergebnis
   ========================================================= */
function showResult() {
  const { correct, firstTries, practice } = session;
  const ratio = firstTries ? correct / firstTries : 0;

  let emoji = '💪';
  let title = 'Dranbleiben!';
  if (ratio === 1) { emoji = '🏆'; title = 'Parfait !'; }
  else if (ratio >= 0.8) { emoji = '🎉'; title = 'Très bien !'; }
  else if (ratio >= 0.5) { emoji = '👍'; title = 'Pas mal !'; }

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
$('btn-home').addEventListener('click', () => {
  renderHome();
  showView('home');
});

/* =========================================================
   Karten verwalten
   ========================================================= */
// Für die Suche: Groß-/Kleinschreibung und Akzente ignorieren ("cafe" findet "café")
const simplify = (text) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function renderManage() {
  const query = simplify($('search').value.trim());
  const list = $('card-list');
  list.innerHTML = '';

  const matches = state.cards.filter((c) =>
    !query || simplify(`${c.fr} ${c.de} ${c.category}`).includes(query));

  $('card-total').textContent = `(${state.cards.length})`;
  $('empty-list').hidden = matches.length > 0;

  matches.forEach((card) => {
    const li = document.createElement('li');
    li.className = 'card-item';

    const text = document.createElement('div');
    text.className = 'card-item-text';
    const fr = document.createElement('div');
    fr.className = 'card-item-fr';
    fr.textContent = card.fr;
    const de = document.createElement('div');
    de.className = 'card-item-de';
    de.textContent = card.de;
    const meta = document.createElement('div');
    meta.className = 'card-item-meta';
    meta.textContent = `${card.category} · Fach ${card.box}`;
    text.append(fr, de, meta);

    const actions = document.createElement('div');
    actions.className = 'card-item-actions';
    if (canSpeak()) {
      const speakBtn = document.createElement('button');
      speakBtn.type = 'button';
      speakBtn.textContent = '🔊';
      speakBtn.setAttribute('aria-label', `„${card.fr}“ vorlesen`);
      speakBtn.addEventListener('click', () => speak(card.fr));
      actions.append(speakBtn);
    }
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', `„${card.fr}“ bearbeiten`);
    editBtn.addEventListener('click', () => openDialog(card));
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = '🗑️';
    delBtn.setAttribute('aria-label', `„${card.fr}“ löschen`);
    delBtn.addEventListener('click', () => deleteCard(card));
    actions.append(editBtn, delBtn);

    li.append(text, actions);
    list.append(li);
  });
}

function deleteCard(card) {
  if (!confirm(`Karte „${card.fr}“ wirklich löschen?`)) return;
  state.cards = state.cards.filter((c) => c.id !== card.id);
  saveState();
  renderManage();
  showToast('Karte gelöscht');
}

$('search').addEventListener('input', renderManage);
$('btn-back').addEventListener('click', () => {
  renderHome();
  showView('home');
});

/* ----- Dialog: anlegen / bearbeiten ----- */
const dialog = $('card-dialog');
let editingId = null;

function openDialog(card = null) {
  editingId = card ? card.id : null;
  $('dialog-title').textContent = card ? 'Karte bearbeiten' : 'Neue Karte';
  $('input-fr').value = card ? card.fr : '';
  $('input-de').value = card ? card.de : '';
  $('input-category').value = card ? card.category : (state.settings.category !== 'all' ? state.settings.category : 'Eigene');

  const datalist = $('category-list');
  datalist.innerHTML = '';
  getCategories().forEach((cat) => {
    const option = document.createElement('option');
    option.value = cat;
    datalist.append(option);
  });

  dialog.showModal();
  $('input-fr').focus();
}

$('btn-add').addEventListener('click', () => openDialog());
$('btn-cancel').addEventListener('click', () => dialog.close());

$('card-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const fr = $('input-fr').value.trim();
  const de = $('input-de').value.trim();
  const category = $('input-category').value.trim();
  if (!fr || !de || !category) return;

  if (editingId) {
    const card = findCard(editingId);
    Object.assign(card, { fr, de, category }); // Fach und Fälligkeit bleiben erhalten
    showToast('Karte gespeichert');
  } else {
    state.cards.unshift(newCard(fr, de, category));
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
    if (!confirm(`${imported.cards.length} Karten importieren? Deine aktuellen Daten werden ersetzt.`)) return;
    state = imported;
    saveState();
    renderManage();
    showToast('Backup importiert ✅');
  } catch (err) {
    showToast('⚠️ Diese Datei ist kein gültiges Backup');
  }
});

$('btn-reset').addEventListener('click', () => {
  if (!confirm('Alle eigenen Karten und den gesamten Lernfortschritt löschen und mit dem Startpaket neu beginnen?')) return;
  state = createInitialState();
  saveState();
  renderManage();
  showToast('Zurückgesetzt');
});

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
let frenchVoice = null;

// Stimmen laden je nach Browser verzögert – deshalb auch auf "voiceschanged" hören
function pickFrenchVoice() {
  const voices = window.speechSynthesis.getVoices();
  const lang = (v) => v.lang.replace('_', '-').toLowerCase();
  frenchVoice = voices.find((v) => lang(v) === 'fr-fr')
    || voices.find((v) => lang(v).startsWith('fr'))
    || null;
  updateSpeechUI();
}

// Nur vorlesen, wenn eine französische Stimme da ist – sonst würde z. B. eine deutsche Stimme "bonjour" sprechen
function canSpeak() {
  return frenchVoice !== null;
}

// Hinweise wie "(f)" oder "qn" sollen nicht mitgesprochen werden
function toSpeechText(text) {
  return text
    .replace(/\([^)]*\)/g, '')
    .replace(/\bqn\b/g, "quelqu'un")
    .replace(/\s*\/\s*/g, ', ')
    .trim();
}

function speak(text) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel(); // laufende Ausgabe abbrechen
  const utterance = new SpeechSynthesisUtterance(toSpeechText(text));
  utterance.voice = frenchVoice;
  utterance.lang = frenchVoice.lang;
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

// Lautsprecher nur zeigen, wenn das Französische gerade sichtbar ist
function updateSpeakButton() {
  const btn = $('btn-speak');
  if (!session || !canSpeak()) {
    btn.hidden = true;
    return;
  }
  btn.hidden = !(state.settings.direction === 'fr-de' || session.flipped);
}

function updateSpeechUI() {
  $('autospeak-row').hidden = !canSpeak();
  $('autospeak').checked = state.settings.autoSpeak;
  updateSpeakButton();
  if (!views.manage.hidden) renderManage();
}

$('autospeak').addEventListener('change', (e) => {
  state.settings.autoSpeak = e.target.checked;
  saveState();
  if (e.target.checked) speak('Bonjour !'); // kurze Hörprobe
});

if (speechSupported) {
  window.speechSynthesis.onvoiceschanged = pickFrenchVoice;
  pickFrenchVoice();
}

/* =========================================================
   Start
   ========================================================= */
renderHome();
