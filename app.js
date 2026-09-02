/* ===== ИНИЦИАЛИЗАЦИЯ ЯЗЫКА ===== */
const CURRENT_LANG = LANG_EN;
const allCards = CURRENT_LANG.cards;
const verbs = CURRENT_LANG.verbs;

let filteredCards = [];
let currentTopic = "all";
let cardIdx = 0;
let isAnimating = false;
let isPracticeMode = false;
let isConstructorMode = false;
let currentLevel = "A1";

const AVAILABLE_ANIMATIONS = [
  "anim-3d-tumble",
  "anim-page-flip",
  "anim-zoom-flip",
  "anim-vertical-flip",
  "anim-twist-flip",
  "anim-cyber-reveal"
];

const AVAILABLE_THEMES = [
  "theme-ocean",
  "theme-forest",
  "theme-cosmos"
];

const GIFT_CODES = {
  "LF-TUMBLE-2024": "anim-3d-tumble",
  "LF-BOOK-2024": "anim-page-flip",
  "LF-ZOOM-2024": "anim-zoom-flip", 
  "LF-VERT-2024": "anim-vertical-flip",
  "LF-TWIST-2024": "anim-twist-flip",
  "LF-CYBER-2024": "anim-cyber-reveal",

  // Темы
  "LF-OCEAN-2024": "theme-ocean",
  "LF-FOREST-2024": "theme-forest",
  "LF-COSMOS-2024": "theme-cosmos"
};

let progress = {
  topic: "all",
  idx: 0,
  stats: { correct: 0, incorrect: 0 },
  marks: {},
  unlockedAnimations: [],
  unlockedThemes: [],
  activeAnimation: "none",
  activeTheme: "none"
};

const topics = [
  { key: "all", label: "Все темы" },
  { key: "difficult", label: "Сложные" },
  { key: "food", label: "Food" },
  { key: "home", label: "Home" },
  { key: "street", label: "Street" },
  { key: "work", label: "Work" },
  { key: "travel", label: "Travel" },
  { key: "feelings", label: "Feelings" },
  { key: "animals", label: "Animals" },
  { key: "body", label: "Body" },
  { key: "clothes", label: "Clothes" },
  { key: "time", label: "Time" },
];

const pronouns = [
  { key: "I", label: "I" },
  { key: "you", label: "you" },
  { key: "he/she", label: "he / she" },
  { key: "we", label: "we" },
  { key: "they", label: "they" },
];

const tenses = [
  { key: "ps", label: "Present Simple" },
  { key: "pas", label: "Past Simple" },
  { key: "fs", label: "Future Simple" },
  { key: "pc", label: "Present Continuous" },
  { key: "pp", label: "Present Perfect" },
];

function buildForm(verb, pronKey, tenseKey) {
  const v = verbs[verb];
  const isThird = pronKey === "he/she";
  switch (tenseKey) {
    case "ps":
      return isThird ? v.thirdSingular : v.base;
    case "pas":
      return v.past;
    case "fs":
      return "will " + v.base;
    case "pc": {
      const aux = pronKey === "I" ? "am" : isThird ? "is" : "are";
      return aux + " " + v.ing;
    }
    case "pp": {
      const aux = isThird ? "has" : "have";
      return aux + " " + v.participle;
    }
  }
  return "";
}

let voices = [];
function loadVoices() {
  voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
}
if (window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = text;
  const cleanText = tempDiv.textContent || tempDiv.innerText || "";

  const u = new SpeechSynthesisUtterance(cleanText);
  u.lang = "en-US";
  u.rate = 0.92;
  u.pitch = 1;
  const enVoice =
    voices.find((v) => /en[-_]US/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang));
  if (enVoice) u.voice = enVoice;
  window.speechSynthesis.speak(u);
}

const toastEl = document.getElementById("toast");
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

function scrollToActiveChip(container) {
  setTimeout(() => {
    const activeChip = container.querySelector(".chip.active");
    if (activeChip) {
      activeChip.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, 50);
}

const DAY = 86400000;
const MIN = 60000;

function getSrsInterval(box) {
  switch (box) {
    case 1:
      return 10 * MIN;
    case 2:
      return 1 * DAY;
    case 3:
      return 3 * DAY;
    case 4:
      return 7 * DAY;
    case 5:
      return 14 * DAY;
    default:
      return 30 * DAY;
  }
}

function loadProgress() {
  const saved = localStorage.getItem("progress_" + CURRENT_LANG.code);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      progress = { ...progress, ...data };
      if (!progress.stats) progress.stats = { correct: 0, incorrect: 0 };
      if (!progress.marks) progress.marks = {};
      if (!progress.unlockedAnimations) progress.unlockedAnimations = [];
      if (!progress.unlockedThemes) progress.unlockedThemes = [];
      if (!progress.activeAnimation) progress.activeAnimation = "none";
      if (!progress.activeTheme) progress.activeTheme = "none";
      if (!progress.celebratedTopics) progress.celebratedTopics = [];

      for (let word in progress.marks) {
        if (typeof progress.marks[word] === "string") {
          progress.marks[word] = { box: 1, dueDate: Date.now() };
        }
      }
    } catch (e) {
      console.error("Error loading progress", e);
    }
  }
  currentTopic = progress.topic || "all";
  cardIdx = progress.idx || 0;
  isPracticeMode = progress.isPracticeMode || false;
  isConstructorMode = progress.isConstructorMode || false;
  currentLevel = progress.level || "A1";

  updateFilteredCards();
  if (cardIdx < 0 || cardIdx >= filteredCards.length) cardIdx = 0;
  updateStatsUI();
  applyCardAnimation();
  applyTheme();

  document
    .getElementById("reverse-toggle")
    .classList.toggle("active", isPracticeMode);
  document
    .getElementById("constructor-toggle")
    .classList.toggle("active", isConstructorMode);
  document.getElementById("level-btn").textContent = currentLevel;

  updateStatsModal();
}

function saveProgress() {
  progress.topic = currentTopic;
  progress.idx = cardIdx;
  progress.isPracticeMode = isPracticeMode;
  progress.isConstructorMode = isConstructorMode;
  progress.level = currentLevel;
  localStorage.setItem(
    "progress_" + CURRENT_LANG.code,
    JSON.stringify(progress),
  );
  updateTopicProgressBar();
}

function updateStatsUI() {
  document.querySelector("#stats-badge .ok").textContent =
    progress.stats.correct;
  document.querySelector("#stats-badge .err").textContent =
    progress.stats.incorrect;
}

function updateStatsModal() {
  let knownWords = 0;
  for (let word in progress.marks) {
    if (progress.marks[word].box > 1) knownWords++;
  }
  document.getElementById('stat-known').textContent = knownWords;
  
  // Подсчет слов за сегодня
  const today = new Date().toDateString();
  let todayCount = 0;
  if (progress.lastStudyDate === today) {
    todayCount = progress.todayCount || 0;
  } else {
    progress.lastStudyDate = today;
    progress.todayCount = 0;
    saveProgress();
  }
  document.getElementById('stat-today').textContent = todayCount;
}

function updateFilteredCards() {
  let baseCards;
  if (currentTopic === "all") {
    baseCards = allCards;
  } else if (currentTopic === "difficult") {
    baseCards = allCards.filter(
      (c) => progress.marks[c.word] && progress.marks[c.word].box === 1,
    );
  } else {
    baseCards = allCards.filter((c) => c.topic === currentTopic);
  }
  filteredCards = baseCards;
}

function updateTopicProgressBar() {
  const totalCardsInTopic = filteredCards.length;
  let markedCards = 0;
  filteredCards.forEach((card) => {
    if (progress.marks[card.word] && progress.marks[card.word].box > 1)
      markedCards++;
  });
  const percent =
    totalCardsInTopic > 0 ? (markedCards / totalCardsInTopic) * 100 : 0;
  const progressBar = document.getElementById("topic-progress-fill");
  if (progressBar) progressBar.style.width = percent + "%";

  // Проверка на 100% завершение темы
  if (totalCardsInTopic > 0 && markedCards === totalCardsInTopic) {
    if (!progress.celebratedTopics) progress.celebratedTopics = [];
    if (!progress.celebratedTopics.includes(currentTopic)) {
      progress.celebratedTopics.push(currentTopic);
      triggerCelebration();
    }
  }
}

function triggerCelebration() {
  const overlay = document.getElementById("celebration-overlay");
  const confettiContainer = document.getElementById("confetti-container");

  if (!overlay || !confettiContainer) return;

  overlay.classList.add("show");

  // Обновляем чипы, чтобы появилась зеленая галочка
  renderTopicChips();

  confettiContainer.innerHTML = "";
  const colors = ["#c2410c", "#e57238", "#3f6b3a", "#d9cdb6", "#f4ede2"];
  for (let i = 0; i < 50; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = Math.random() * 3 + 2 + "s";
    piece.style.animationDelay = Math.random() * 2 + "s";
    if (Math.random() > 0.5) piece.style.borderRadius = "50%";
    confettiContainer.appendChild(piece);
  }
}

// Обработчик закрытия окна победы
const celebrationCloseBtn = document.getElementById("celebration-close");
if (celebrationCloseBtn) {
  celebrationCloseBtn.addEventListener("click", () => {
    const overlay = document.getElementById("celebration-overlay");
    if (overlay) overlay.classList.remove("show");

    // Автоматически переключаемся на "Все темы"
    currentTopic = "all";
    cardIdx = 0;
    updateFilteredCards();
    renderTopicChips();
    renderCard();
    saveProgress();

    // Показываем подсказку, что мы переключились
    setTimeout(() => toast("Переключились на «Все темы»"), 300);
  });
}

const topicChipsContainer = document.getElementById("topic-chips");
function renderTopicChips() {
  topicChipsContainer.innerHTML = "";
  topics.forEach((t) => {
    const chip = document.createElement("button");
    let classes = "chip";
    if (t.key === currentTopic) classes += " active";

    // Проверяем, пройдена ли тема (не считаем "all" и "difficult")
    if (
      progress.celebratedTopics &&
      progress.celebratedTopics.includes(t.key) &&
      t.key !== "all" &&
      t.key !== "difficult"
    ) {
      classes += " completed";
    }

    chip.className = classes;
    chip.dataset.topic = t.key;

    // Добавляем галочку, если тема пройдена
    if (classes.includes("completed")) {
      chip.innerHTML = `${t.label} <small>✓</small>`;
    } else {
      chip.textContent = t.label;
    }

    topicChipsContainer.appendChild(chip);
  });
  scrollToActiveChip(topicChipsContainer);
}

topicChipsContainer.addEventListener("click", (e) => {
  if (isAnimating) return;
  const chip = e.target.closest(".chip");
  if (!chip || !chip.dataset.topic) return;
  const newTopic = chip.dataset.topic;
  if (newTopic === currentTopic) return;

  currentTopic = newTopic;
  cardIdx = 0;
  updateFilteredCards();
  renderTopicChips();
  renderCard();
  saveProgress();
});

const cardEl = document.getElementById("card");

function showSessionComplete() {
  document.getElementById("front-tag").textContent = "Готово!";
  document.getElementById("card-word").textContent = "Сессия завершена";
  document.getElementById("card-trans").textContent = "";
  document.getElementById("card-translation").textContent =
    "Все карточки в этой теме повторены. Возвращайтесь позже!";
  document.getElementById("card-example").innerHTML = "";
  document.getElementById("card-example-ru").textContent = "";
  document.getElementById("counter").textContent = "0 / 0";
  document.getElementById("progress-label").textContent =
    "Нет просроченных карточек";
  document.getElementById("progress-bar").style.width = "100%";
  document.getElementById("binary-actions").style.display = "none";
  document.getElementById("srs-actions").style.display = "none";
  document.getElementById("practice-input").style.display = "none";
  document.getElementById("practice-btn").style.display = "none";
  document.getElementById("constructor-ui").style.display = "none";
  document.getElementById("constructor-check-btn").style.display = "none";
  document.getElementById("card-hint").style.display = "none";
}

function updateCardContent() {
  if (filteredCards.length === 0) {
    showSessionComplete();
    return;
  }

  if (isPracticeMode || isConstructorMode) {
    let attempts = 0;
    const maxAttempts = filteredCards.length;
    while (attempts < maxAttempts) {
      if (cardIdx >= filteredCards.length) cardIdx = 0;
      const c = filteredCards[cardIdx];
      if (!c) break;
      const mark = progress.marks[c.word];
      if (!mark || mark.dueDate <= Date.now()) break;
      cardIdx++;
      attempts++;
    }
    if (attempts >= maxAttempts) {
      showSessionComplete();
      return;
    }
  } else {
    if (cardIdx >= filteredCards.length) cardIdx = 0;
  }

  const c = filteredCards[cardIdx];
  if (!c) {
    showSessionComplete();
    return;
  }

  document.getElementById("card-hint").style.display = "flex";
  document.getElementById("counter").textContent =
    cardIdx + 1 + " / " + filteredCards.length;
  document.getElementById("progress-label").textContent =
    "Карточка " + (cardIdx + 1) + " из " + filteredCards.length;
  const pct = ((cardIdx + 1) / filteredCards.length) * 100;
  document.getElementById("progress-bar").style.width = pct + "%";
  document.getElementById("prev-btn").disabled = cardIdx === 0;
  document.getElementById("next-btn").disabled =
    cardIdx === filteredCards.length - 1;

  const pInput = document.getElementById("practice-input");
  const pBtn = document.getElementById("practice-btn");
  const cUi = document.getElementById("constructor-ui");
  const cBtn = document.getElementById("constructor-check-btn");
  const bActions = document.getElementById("binary-actions");
  const sActions = document.getElementById("srs-actions");
  const frontTag = document.getElementById("front-tag");
  const backTag = document.getElementById("back-tag");
  const transBack = document.getElementById("card-trans-back");
  const hint = document.getElementById("card-hint");

  if (isConstructorMode) {
    frontTag.textContent = "Собери фразу";
    document.getElementById("card-word").textContent = c.translation;
    document.getElementById("card-trans").style.display = "none";
    pInput.style.display = "none";
    pBtn.style.display = "none";
    cUi.style.display = "block";
    cBtn.style.display = "block";
    cBtn.textContent = "Проверить фразу";
    hint.style.display = "none";
    setupConstructor(c);

    backTag.textContent = "Фраза";
    document.getElementById("card-translation").textContent = c.word;
    document.getElementById("card-trans").textContent = c.transcription;
    transBack.style.display = "block";
    transBack.textContent = c.transcription;

    bActions.style.display = "none";
    sActions.style.display = "flex";
  } else if (isPracticeMode) {
    frontTag.textContent = "Перевод";
    document.getElementById("card-word").textContent = c.translation;
    document.getElementById("card-trans").style.display = "none";
    pInput.style.display = "block";
    pInput.value = "";
    pInput.classList.remove("correct", "incorrect");
    pBtn.style.display = "block";
    pBtn.textContent = "Подсмотреть";
    cUi.style.display = "none";
    cBtn.style.display = "none";
    hint.style.display = "none";

    backTag.textContent = "Слово";
    document.getElementById("card-translation").textContent = c.word;
    document.getElementById("card-trans").textContent = c.transcription;
    transBack.style.display = "block";
    transBack.textContent = c.transcription;

    bActions.style.display = "none";
    sActions.style.display = "flex";
  } else {
    frontTag.textContent = "Слово";
    document.getElementById("card-word").textContent = c.word;
    document.getElementById("card-trans").style.display = "block";
    document.getElementById("card-trans").textContent = c.transcription;
    pInput.style.display = "none";
    pBtn.style.display = "none";
    cUi.style.display = "none";
    cBtn.style.display = "none";
    hint.style.display = "flex";

    backTag.textContent = "Перевод";
    document.getElementById("card-translation").textContent = c.translation;
    transBack.style.display = "none";

    bActions.style.display = "flex";
    sActions.style.display = "none";
  }

  document.getElementById("card-example").innerHTML = c.example;
  document.getElementById("card-example-ru").textContent = c.exampleTranslation;
}

function renderCard() {
  if (isAnimating) return;
  const wasFlipped = cardEl.classList.contains("flipped");

  if (wasFlipped) {
    isAnimating = true;
    cardEl.classList.remove("flipped");
    setTimeout(() => {
      updateCardContent();
      isAnimating = false;
    }, 350);
  } else {
    updateCardContent();
  }
}

cardEl.addEventListener("click", (e) => {
  if (isAnimating) return;

  if (e.target.closest("#card-example")) {
    e.stopPropagation();
    if (filteredCards[cardIdx]) speak(filteredCards[cardIdx].example);
    return;
  }

  if (isConstructorMode && !cardEl.classList.contains("flipped")) return;
  if (isPracticeMode && !cardEl.classList.contains("flipped")) return;

  if (
    e.target.closest(".action-btn") ||
    e.target.closest(".srs-btn") ||
    e.target.closest("#practice-btn") ||
    e.target.closest("#constructor-check-btn") ||
    e.target.closest(".c-chip")
  )
    return;

  cardEl.classList.toggle("flipped");
  if (
    cardEl.classList.contains("flipped") &&
    !isPracticeMode &&
    !isConstructorMode
  ) {
    if (filteredCards[cardIdx]) speak(filteredCards[cardIdx].word);
  }
});

document.getElementById("prev-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  if (isAnimating) return;
  if (cardIdx > 0) {
    cardIdx--;
    renderCard();
    saveProgress();
  }
});
document.getElementById("next-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  if (isAnimating) return;
  if (cardIdx < filteredCards.length - 1) {
    cardIdx++;
    renderCard();
    saveProgress();
  }
});

document.getElementById("practice-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  if (isAnimating) return;
  const c = filteredCards[cardIdx];
  const input = document.getElementById("practice-input");
  const val = input.value.trim().toLowerCase();
  const correct = c.word.toLowerCase();

  if (val === "") {
    cardEl.classList.add("flipped");
    speak(c.word);
    return;
  }

  if (val === correct) {
    input.classList.add("correct");
    input.classList.remove("incorrect");
  } else {
    input.classList.add("incorrect");
    input.classList.remove("correct");
  }

  setTimeout(() => {
    cardEl.classList.add("flipped");
    speak(c.word);
  }, 400);
});

document.getElementById("practice-input").addEventListener("input", (e) => {
  const pBtn = document.getElementById("practice-btn");
  if (e.target.value.trim() !== "") {
    pBtn.textContent = "Проверить";
  } else {
    pBtn.textContent = "Подсмотреть";
  }
});

// Обработка кнопок "Знаю / Не знаю" (режим Чтения)
function handleMark(status) {
  if (isAnimating) return;
  const c = filteredCards[cardIdx];
  let mark = progress.marks[c.word] || { box: 1, dueDate: Date.now() };
  if (typeof mark === 'string') mark = { box: 1, dueDate: Date.now() };
  
  if (status === 'known') {
    progress.stats.correct++;
    mark.box = Math.min(6, (mark.box || 1) + 1); // Повышаем коробку
    mark.dueDate = Date.now() + getSrsInterval(mark.box);
    
    // Увеличиваем счетчик за сегодня
    const today = new Date().toDateString();
    if (progress.lastStudyDate === today) {
      progress.todayCount = (progress.todayCount || 0) + 1;
    } else {
      progress.lastStudyDate = today;
      progress.todayCount = 1;
    }
  } else {
    progress.stats.incorrect++;
    mark.box = 1; // Сброс в 1-ю коробку
    mark.dueDate = Date.now() + (10 * MIN); // Показать через 10 минут
  }
  
  progress.marks[c.word] = mark;
  updateStatsUI();
  
  if (cardIdx < filteredCards.length - 1) {
    cardIdx++;
    renderCard();
    saveProgress();
  } else {
    toast("Вы прошли все карточки в этой теме!");
    saveProgress();
    isAnimating = true;
    cardEl.classList.remove('flipped');
    setTimeout(() => { isAnimating = false; }, 350);
  }
}

// Обработка кнопок SRS (режим Практики)
function handleSrs(grade) {
  if (isAnimating) return;
  const c = filteredCards[cardIdx];
  let mark = progress.marks[c.word] || { box: 1, dueDate: Date.now() };
  let newBox = mark.box || 1;
  let isCorrect = false; // Флаг для подсчета статистики

  if (grade === 1) { // Снова
    newBox = 1;
    mark.dueDate = Date.now() + (1 * MIN); // Показать в этой сессии
    progress.stats.incorrect++;
  } else if (grade === 2) { // Трудно
    newBox = Math.max(1, newBox);
    mark.dueDate = Date.now() + (10 * MIN); // 10 минут
    progress.stats.correct++;
    isCorrect = true;
  } else if (grade === 3) { // Хорошо
    newBox = Math.min(6, newBox + 1);
    mark.dueDate = Date.now() + getSrsInterval(newBox);
    progress.stats.correct++;
    isCorrect = true;
  } else if (grade === 4) { // Легко
    newBox = Math.min(6, newBox + 2);
    mark.dueDate = Date.now() + getSrsInterval(newBox);
    progress.stats.correct++;
    isCorrect = true;
  }

  // Если ответ был правильным (Трудно, Хорошо, Легко), увеличиваем счетчик за сегодня
  if (isCorrect) {
    const todaySrs = new Date().toDateString();
    if (progress.lastStudyDate === todaySrs) {
      progress.todayCount = (progress.todayCount || 0) + 1;
    } else {
      progress.lastStudyDate = todaySrs;
      progress.todayCount = 1;
    }
  }

  mark.box = newBox;
  progress.marks[c.word] = mark;
  updateStatsUI();
  saveProgress();

  // Переход к следующей карточке
  isAnimating = true;
  cardEl.classList.remove('flipped');
  setTimeout(() => {
    cardIdx++;
    updateCardContent();
    isAnimating = false;
  }, 350);
}

document.getElementById("know-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  handleMark("known");
});
document.getElementById("dont-know-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  handleMark("unknown");
});

document.querySelectorAll(".srs-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const grade = parseInt(btn.dataset.grade);
    handleSrs(grade);
  });
});

let touchStartX = 0;
cardEl.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.touches[0].clientX;
  },
  { passive: true },
);
cardEl.addEventListener(
  "touchend",
  (e) => {
    if (isAnimating) return;
    if (
      e.target.closest(".action-btn") ||
      e.target.closest(".srs-btn") ||
      e.target.closest("#practice-btn") ||
      e.target.closest("#constructor-check-btn") ||
      e.target.closest(".c-chip") ||
      e.target.closest("#card-example")
    )
      return;

    if (
      (isPracticeMode || isConstructorMode) &&
      !cardEl.classList.contains("flipped")
    )
      return;

    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 60) {
      if (dx < 0 && cardIdx < filteredCards.length - 1) {
        cardIdx++;
        renderCard();
        saveProgress();
      } else if (dx > 0 && cardIdx > 0) {
        cardIdx--;
        renderCard();
        saveProgress();
      }
    }
  },
  { passive: true },
);

document.getElementById("reverse-toggle").addEventListener("click", () => {
  isPracticeMode = !isPracticeMode;
  if (isPracticeMode) isConstructorMode = false;
  document
    .getElementById("reverse-toggle")
    .classList.toggle("active", isPracticeMode);
  document.getElementById("constructor-toggle").classList.remove("active");
  cardIdx = 0;
  renderCard();
  saveProgress();
  toast(
    isPracticeMode ? "Режим практики (Ru -> En)" : "Режим чтения (En -> Ru)",
  );
});

/* ===== CONSTRUCTOR MODE ===== */
function getWordType(word) {
  const w = word.toLowerCase().replace(/[^a-z']/g, "");
  if (["i", "you", "he", "she", "it", "we", "they"].includes(w)) return "subj";
  if (verbs[w]) return "verb";
  const baseVerb = Object.keys(verbs).find((k) => verbs[k].thirdSingular === w);
  if (baseVerb) return "verb";
  return "obj";
}

function setupConstructor(card) {
  const answerBox = document.getElementById("constructor-answer");
  const chipsBox = document.getElementById("constructor-chips");
  const hintBox = document.getElementById("grammar-hint");

  answerBox.innerHTML = "";
  answerBox.className = "constructor-answer";
  chipsBox.innerHTML = "";

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = card.example;
  const cleanText = tempDiv.textContent.replace(/[.,!?]/g, "");
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);

  // Динамически генерируем правило для плашки
  if (hintBox) {
    const hintWords = words.map((w) => {
      const type = getWordType(w);
      if (type === "subj") return '<span class="gh-subj">Subject</span>';
      if (type === "verb") return '<span class="gh-verb">Verb</span>';
      return '<span class="gh-obj">Object</span>';
    });
    hintBox.innerHTML = hintWords.join(" + ");
  }

  let distractorCount = 0;
  if (currentLevel === "A2") distractorCount = 2;
  else if (currentLevel === "B1") distractorCount = 4;

  const distractors = [];
  const pool = allCards.filter((c) => c.word !== card.word);
  for (let i = 0; i < distractorCount; i++) {
    const randCard = pool[Math.floor(Math.random() * pool.length)];
    if (randCard) distractors.push(randCard.word);
  }

  const allWords = [...words, ...distractors];

  for (let i = allWords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
  }

  allWords.forEach((word) => {
    const chip = document.createElement("div");
    chip.className = "c-chip";
    chip.textContent = word;

    if (currentLevel === "A1" || currentLevel === "A2") {
      const type = getWordType(word);
      if (type !== "distractor") chip.classList.add(`pos-${type}`);
    }

    chip.addEventListener("click", () => {
      if (chip.classList.contains("used")) return;

      const ansChip = document.createElement("div");
      ansChip.className =
        "c-chip " +
        Array.from(chip.classList)
          .filter((c) => c.startsWith("pos-"))
          .join(" ");
      ansChip.textContent = word;
      ansChip.addEventListener("click", () => {
        ansChip.remove();
        chip.classList.remove("used");
      });

      answerBox.appendChild(ansChip);
      chip.classList.add("used");
    });
    chipsBox.appendChild(chip);
  });
}

document
  .getElementById("constructor-check-btn")
  .addEventListener("click", (e) => {
    e.stopPropagation();
    if (isAnimating) return;
    const c = filteredCards[cardIdx];
    const answerBox = document.getElementById("constructor-answer");
    const userWords = Array.from(answerBox.children).map(
      (el) => el.textContent,
    );
    const userSentence = userWords.join(" ").toLowerCase();

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = c.example;
    const correctText = tempDiv.textContent
      .replace(/[.,!?]/g, "")
      .toLowerCase();

    if (userSentence === correctText) {
      answerBox.classList.add("correct");
      answerBox.classList.remove("incorrect");

      // Подсветка слов по частям речи при правильном ответе
      Array.from(answerBox.children).forEach((ansChip) => {
        const wordType = getWordType(ansChip.textContent);
        ansChip.classList.add(`pos-${wordType}`);
      });
    } else {
      answerBox.classList.add("incorrect");
      answerBox.classList.remove("correct");
    }

    setTimeout(() => {
      cardEl.classList.add("flipped");
      speak(c.example);
    }, 600);
  });

document.getElementById("constructor-toggle").addEventListener("click", () => {
  isConstructorMode = !isConstructorMode;
  if (isConstructorMode) isPracticeMode = false;
  document
    .getElementById("constructor-toggle")
    .classList.toggle("active", isConstructorMode);
  document.getElementById("reverse-toggle").classList.remove("active");
  cardIdx = 0;
  renderCard();
  saveProgress();
  toast(isConstructorMode ? "Конструктор фраз включен" : "Обычный режим");
});

document.getElementById("level-btn").addEventListener("click", () => {
  const levels = ["A1", "A2", "B1"];
  const currentIdx = levels.indexOf(currentLevel);
  currentLevel = levels[(currentIdx + 1) % levels.length];
  document.getElementById("level-btn").textContent = currentLevel;
  toast("Уровень: " + currentLevel);
  if (isConstructorMode) renderCard();
  saveProgress();
});

function applyCardAnimation() {
  // Удаляем все классы анимаций
  AVAILABLE_ANIMATIONS.forEach((anim) => cardEl.classList.remove(anim));
  cardEl.classList.remove('anim-default');
  
  // Применяем активную анимацию (или дефолтную)
  const activeAnim = progress.activeAnimation || 'none';
  if (activeAnim !== 'none' && AVAILABLE_ANIMATIONS.includes(activeAnim)) {
    cardEl.classList.add(activeAnim);
  } else {
    cardEl.classList.add('anim-default');
  }
  
  // Обновляем выпадающий список в настройках
  updateAnimationSelect();
}

function applyTheme() {
  // Сначала удаляем все классы тем с <html>
  AVAILABLE_THEMES.forEach(t => document.documentElement.classList.remove(t));
  
  const activeTheme = progress.activeTheme || 'none';
  if (activeTheme !== 'none' && AVAILABLE_THEMES.includes(activeTheme)) {
    document.documentElement.classList.add(activeTheme);
    
    // Запрашиваем генерацию эффектов, если файл effects.js подключен
    if (window.LinguaEffects) {
      if (activeTheme === 'theme-cosmos') {
        window.LinguaEffects.initCosmosStars();
      } else if (activeTheme === 'theme-forest') {
        window.LinguaEffects.initForestLeaves();
      }
    }
  }

    if (window.LinguaEffects) {
      if (activeTheme === 'theme-cosmos') {
        window.LinguaEffects.initCosmosStars();
      } else if (activeTheme === 'theme-forest') {
        window.LinguaEffects.initForestLeaves();
      } else if (activeTheme === 'theme-ocean') {
        window.LinguaEffects.initOceanBubbles();
      }
    }
  
  updateThemeSelect();
}

function updateThemeSelect() {
  const select = document.getElementById('theme-select');
  if (!select) return;
  
  let html = '<option value="none">По умолчанию (Тёплая)</option>';
  
  if (!progress.unlockedThemes) progress.unlockedThemes = [];
  
  progress.unlockedThemes.forEach(theme => {
    let label = theme.replace('theme-', '');
    label = label.charAt(0).toUpperCase() + label.slice(1);
    html += `<option value="${theme}">${label}</option>`;
  });
  select.innerHTML = html;
  
  select.value = progress.activeTheme || 'none';
}

// Новая функция для заполнения списка анимаций
function updateAnimationSelect() {
  const select = document.getElementById('animation-select');
  if (!select) return;
  
  let html = '<option value="none">По умолчанию</option>';
  
  // Защита, если массива вдруг нет
  if (!progress.unlockedAnimations) progress.unlockedAnimations = [];
  
  progress.unlockedAnimations.forEach(anim => {
    let label = anim.replace('anim-', '').replace(/-/g, ' ');
    html += `<option value="${anim}">${label}</option>`;
  });
  select.innerHTML = html;
  
  select.value = progress.activeAnimation || 'none';
}

const tabs = document.querySelectorAll(".nav-tab");
const views = document.querySelectorAll(".view");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const v = tab.dataset.view;
    tabs.forEach((t) => t.classList.toggle("active", t === tab));
    views.forEach((view) =>
      view.classList.toggle("active", view.id === "view-" + v),
    );
  });
});

const tableTypeSelect = document.getElementById("table-type");
const verbChipsContainer = document.getElementById("verb-chips");
let currentVerb = "work";
let currentMode = "view";

function renderVerbChips(type) {
  verbChipsContainer.innerHTML = "";
  if (type === "verbs") {
    Object.keys(verbs).forEach((v) => {
      const chip = document.createElement("button");
      chip.className = "chip" + (v === currentVerb ? " active" : "");
      chip.dataset.verb = v;
      chip.innerHTML = `${v} <small>${verbs[v].regular ? "прав." : "неправ."}</small>`;
      verbChipsContainer.appendChild(chip);
    });
  } else {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.style.opacity = "0.5";
    chip.style.cursor = "default";
    chip.textContent = "Скоро...";
    verbChipsContainer.appendChild(chip);
  }
  scrollToActiveChip(verbChipsContainer);
}

tableTypeSelect.addEventListener("change", (e) => {
  const newType = e.target.value;
  renderVerbChips(newType);
  if (newType === "verbs") {
    currentVerb = Object.keys(verbs)[0];
    renderTable();
  } else {
    document.getElementById("verbs-table").innerHTML = "";
    document.getElementById("input-panel").style.display = "none";
    document.getElementById("table-hint").textContent = "Раздел в разработке";
  }
});

verbChipsContainer.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip || !chip.dataset.verb) return;
  const newVerb = chip.dataset.verb;
  if (newVerb === currentVerb) return;
  verbChipsContainer
    .querySelectorAll(".chip")
    .forEach((c) => c.classList.remove("active"));
  chip.classList.add("active");
  currentVerb = newVerb;
  renderTable();
});

const tableEl = document.getElementById("verbs-table");
const inputPanel = document.getElementById("input-panel");
const tableHint = document.getElementById("table-hint");
const coordText = document.getElementById("input-coord-text");
const answerInput = document.getElementById("answer-input");
const checkBtn = document.getElementById("check-btn");
const feedbackEl = document.getElementById("feedback");
const skipBtn = document.getElementById("skip-btn");
let inputTarget = null;

function renderTable() {
  let html = "<thead><tr><th></th>";
  tenses.forEach((t) => (html += `<th>${t.label}</th>`));
  html += "</tr></thead><tbody>";
  pronouns.forEach((p) => {
    html += `<tr><th>${p.label}</th>`;
    tenses.forEach((t) => {
      const form = buildForm(currentVerb, p.key, t.key);
      html += `<td><div class="cell" data-pron="${p.key}" data-tense="${t.key}" data-form="${form}"><span class="text">${form}</span></div></td>`;
    });
    html += "</tr>";
  });
  html += "</tbody>";
  tableEl.innerHTML = html;
  tableEl.className = "verbs mode-" + currentMode;
  applyMode();
}

function applyMode() {
  tableEl
    .querySelectorAll(".cell.revealed")
    .forEach((c) => c.classList.remove("revealed"));
  if (currentMode === "view") {
    inputPanel.style.display = "none";
    tableHint.textContent = "Нажми на ячейку, чтобы услышать произношение";
  } else if (currentMode === "self") {
    inputPanel.style.display = "none";
    tableHint.textContent = "Нажми на ячейку, чтобы открыть форму";
  } else if (currentMode === "input") {
    inputPanel.style.display = "flex";
    tableHint.textContent = "Введи форму глагола для указанной координаты";
    nextInputTarget();
  }
}

tableEl.addEventListener("click", (e) => {
  const cell = e.target.closest(".cell");
  if (!cell) return;
  if (currentMode === "view") {
    speak(cell.dataset.form);
  } else if (currentMode === "self") {
    cell.classList.toggle("revealed");
    if (cell.classList.contains("revealed")) speak(cell.dataset.form);
  }
});

document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".mode-btn")
      .forEach((b) => b.classList.toggle("active", b === btn));
    currentMode = btn.dataset.mode;
    tableEl.className = "verbs mode-" + currentMode;
    applyMode();
  });
});

function nextInputTarget() {
  const p = pronouns[Math.floor(Math.random() * pronouns.length)];
  const t = tenses[Math.floor(Math.random() * tenses.length)];
  inputTarget = {
    pronKey: p.key,
    tenseKey: t.key,
    pronLabel: p.label,
    tenseLabel: t.label,
  };
  coordText.textContent = p.label + "  /  " + t.label;
  answerInput.value = "";
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  answerInput.focus();
}

function checkAnswer() {
  if (!inputTarget) return;
  const correct = buildForm(
    currentVerb,
    inputTarget.pronKey,
    inputTarget.tenseKey,
  );
  const user = answerInput.value.trim().toLowerCase();
  if (!user) {
    toast("Введи ответ");
    return;
  }
  if (user === correct.toLowerCase()) {
    feedbackEl.textContent = "Верно! " + correct;
    feedbackEl.className = "feedback ok";
    speak(correct);
    highlightCell(inputTarget.pronKey, inputTarget.tenseKey, true);
    setTimeout(() => {
      highlightCell(inputTarget.pronKey, inputTarget.tenseKey, false);
      nextInputTarget();
    }, 1400);
  } else {
    feedbackEl.textContent = "Не совсем. Правильно: " + correct;
    feedbackEl.className = "feedback err";
    speak(correct);
    highlightCell(inputTarget.pronKey, inputTarget.tenseKey, true);
  }
}

function highlightCell(pronKey, tenseKey, on) {
  const cell = tableEl.querySelector(
    `.cell[data-pron="${pronKey}"][data-tense="${tenseKey}"]`,
  );
  if (!cell) return;
  if (on) {
    cell.classList.add("revealed");
    cell.style.background = "var(--accent-soft)";
  } else {
    cell.classList.remove("revealed");
    cell.style.background = "";
  }
}

checkBtn.addEventListener("click", checkAnswer);
answerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkAnswer();
});
skipBtn.addEventListener("click", () => {
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  nextInputTarget();
});

loadProgress();
renderTopicChips();
updateCardContent();
renderVerbChips("verbs");
renderTable();

/* ===== THEME TOGGLE (Safety Check) ===== */
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

const themeSelect = document.getElementById('theme-select');
if (themeSelect) {
  themeSelect.addEventListener('change', (e) => {
    progress.activeTheme = e.target.value;
    saveProgress();
    applyTheme();
    toast("Тема применена");
  });
}

/* ===== DONATE BUTTON (Safety Check) ===== */
const donateModal = document.getElementById('donate-modal');
const donateSubtext = document.getElementById('donate-subtext');
const donateBtn = document.getElementById('donate-btn');
const donateLinkBtn = document.getElementById('donate-link-btn');
const donateModalClose = document.getElementById('donate-modal-close');

if (donateBtn && donateModal) {
  donateBtn.addEventListener('click', () => {
    const unlockedCount = progress.unlockedAnimations ? progress.unlockedAnimations.length : 0;
    const hasAllAnimations = unlockedCount >= AVAILABLE_ANIMATIONS.length;
    
    if (!hasAllAnimations && donateSubtext) {
      donateSubtext.innerHTML = "P.S. Сделай перевод по ссылке.<br>В комментариях укажи почту и слово 'LinguaFlip'.<br>В ответ пришлю код на эксклюзивную 3D-анимацию!<br><small>(Нет почты — нет анимации)</small>";
    } else if (donateSubtext) {
      donateSubtext.innerHTML = "P.S. Ты уже открыл все доступные анимации! ❤️<br>Любой перевод будет просто приятным бонусом.";
    }
    
    donateModal.classList.add('show');
  });
}

if (donateLinkBtn) {
  donateLinkBtn.addEventListener('click', () => {
    const donateUrl = "https://pay.cloudtips.ru/p/5e4d197a";
    window.open(donateUrl, '_blank');
    if (donateModal) donateModal.classList.remove('show');
  });
}

if (donateModalClose) {
  donateModalClose.addEventListener('click', () => {
    if (donateModal) donateModal.classList.remove('show');
  });
}

/* ===== STATS MODAL (Safety Check) ===== */
const statsModal = document.getElementById('stats-modal');
const menuBtn = document.getElementById('menu-btn');
const statsModalClose = document.getElementById('stats-modal-close');

if (menuBtn && statsModal) {
  menuBtn.addEventListener('click', () => {
    updateStatsModal();
    statsModal.classList.add('show');
  });
}

if (statsModalClose && statsModal) {
  statsModalClose.addEventListener('click', () => {
    statsModal.classList.remove('show');
  });
}

// Настройки внутри модалки статистики
const themeToggleModal = document.getElementById('theme-toggle-modal');
if (themeToggleModal) {
  themeToggleModal.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    toast(isDark ? "Тёмная тема" : "Светлая тема");
  });
}

const giftBtnModal = document.getElementById('gift-btn-modal');
const giftModal = document.getElementById('gift-modal');
const giftModalClose = document.getElementById('gift-modal-close');
const giftApplyBtn = document.getElementById('gift-apply-btn');
const giftCodeInput = document.getElementById('gift-code-input');

if (giftBtnModal && statsModal && giftModal) {
  giftBtnModal.addEventListener('click', () => {
    statsModal.classList.remove('show');
    setTimeout(() => {
      giftCodeInput.value = '';
      giftModal.classList.add('show');
      giftCodeInput.focus();
    }, 300);
  });
}

if (giftModalClose) {
  giftModalClose.addEventListener('click', () => giftModal.classList.remove('show'));
}

if (giftApplyBtn) {
  giftApplyBtn.addEventListener('click', () => {
    const code = giftCodeInput.value.trim().toUpperCase();
    if (!code) { toast("Введите код"); return; }
    
    if (GIFT_CODES[code]) {
      const reward = GIFT_CODES[code];
      let alreadyUnlocked = false;
      
      // Проверяем, что это: анимация или тема
      if (reward.startsWith('anim-')) {
        if (!progress.unlockedAnimations.includes(reward)) {
          progress.unlockedAnimations.push(reward);
          progress.activeAnimation = reward;
          applyCardAnimation();
          toast('Ура! Анимация разблокирована.');
        } else alreadyUnlocked = true;
      } else if (reward.startsWith('theme-')) {
        if (!progress.unlockedThemes.includes(reward)) {
          progress.unlockedThemes.push(reward);
          progress.activeTheme = reward;
          applyTheme();
          toast('Ура! Тема разблокирована.');
        } else alreadyUnlocked = true;
      }
      
      if (alreadyUnlocked) toast('Этот код уже был активирован.');
      
      saveProgress();
      giftModal.classList.remove('show');
    } else {
      toast('Неверный код.');
      giftCodeInput.classList.add('incorrect');
      setTimeout(() => giftCodeInput.classList.remove('incorrect'), 1000);
    }
  });
}

const saveBtnModal = document.getElementById('save-btn-modal');
if (saveBtnModal) {
  saveBtnModal.addEventListener('click', () => {
    const dataStr = JSON.stringify(progress, null, 2);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linguaflip_backup_${CURRENT_LANG.code}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Прогресс сохранен в файл");
  });
}

const loadBtnModal = document.getElementById('load-btn-modal');
const fileInput = document.getElementById('file-input');

if (loadBtnModal && statsModal && fileInput) {
  loadBtnModal.addEventListener('click', () => {
    statsModal.classList.remove('show');
    setTimeout(() => fileInput.click(), 300);
  });
}

const animSelect = document.getElementById('animation-select');
if (animSelect) {
  animSelect.addEventListener('change', (e) => {
    progress.activeAnimation = e.target.value;
    saveProgress();
    applyCardAnimation();
    toast("Анимация применена");
  });
}

// Кастомное подтверждение для восстановления
const confirmModal = document.getElementById('confirm-modal');
const confirmOkBtn = document.getElementById('confirm-ok-btn');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
let fileToLoad = null;

if (fileInput) {
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    fileToLoad = file;
    
    // Показываем кастомное окно подтверждения
    if (confirmModal) {
      confirmModal.classList.add('show');
    }
    e.target.value = '';
  });
}

if (confirmOkBtn && confirmModal) {
  confirmOkBtn.addEventListener('click', () => {
    confirmModal.classList.remove('show');
    if (!fileToLoad) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        progress = data;
        if (!progress.stats) progress.stats = { correct: 0, incorrect: 0 };
        if (!progress.marks) progress.marks = {};
        saveProgress();
        loadProgress();
        renderTopicChips();
        renderCard();
        toast("Прогресс восстановлен");
      } catch(err) {
        toast("Ошибка: неверный файл");
      }
    };
    reader.readAsText(fileToLoad);
    fileToLoad = null;
  });
}

if (confirmCancelBtn && confirmModal) {
  confirmCancelBtn.addEventListener('click', () => {
    confirmModal.classList.remove('show');
    fileToLoad = null;
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed:', err));
  });
}
