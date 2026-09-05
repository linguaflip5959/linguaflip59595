/* ===== ИНИЦИАЛИЗАЦИЯ ЯЗЫКА ===== */
const LANGUAGES = {
  en: LANG_EN,
  es: LANG_ES
  // ja: LANG_JA, ko: LANG_KO, zh: LANG_ZH
};

let CURRENT_LANG = LANGUAGES.en; // По умолчанию английский
let allCards = CURRENT_LANG.cards;
let verbs = CURRENT_LANG.verbs;
let pronouns = CURRENT_LANG.pronouns;
let tenses = CURRENT_LANG.tenses;

let filteredCards = [];
let currentTopic = "all";
let cardIdx = 0;
let isAnimating = false;
let isPracticeMode = false;
let isConstructorMode = false;
let currentLevel = "A1";

// Тактильный отклик (если поддерживается)
function vibrate(ms) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

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

const _0x4f2a = [
  //Card Flip
  ["NDIwMi1FTEJNVVQtRkw=", "ZWxibXV0LWQzLW1pbmE="],
  ["NDIwMi1LT09CLUZM", "cGlsZi1lZ2FwLW1pbmE="],
  ["NDIwMi1NT09aLUZM", "cGlsZi1tb296LW1pbmE="],
  ["NDIwMi1UUkVWLUZM", "cGlsZi1sYWNpdHJldi1taW5h"],
  ["NDIwMi1UU0lXVC1GTA==", "cGlsZi10c2l3dC1taW5h"],
  ["NDIwMi1SRUJZQy1GTA==", "bGFldmVyLXJlYnljLW1pbmE="],
  // Theme
  ["NDIwMi1OQUVDTy1GTA==", "bmFlY28tZW1laHQ="],
  ["NDIwMi1UU0VST0YtRkw=", "dHNlcm9mLWVtZWh0"],
  ["NDIwMi1TT01TT0MtRkw=", "c29tc29jLWVtZWh0"],
];

/* ===== ЮНИТ-ТЕСТЫ ГЕНЕРАТОРА ===== */
function runEsConjugationTests() {
  if (CURRENT_LANG.code !== "es") {
    console.warn("Сначала выбери испанский язык");
    return;
  }
  const EXPECTED = {
    hablar: {
      presente:  ["hablo","hablas","habla","hablamos","habláis","hablan"],
      indefinido:["hablé","hablaste","habló","hablamos","hablasteis","hablaron"],
      futuro:    ["hablaré","hablarás","hablará","hablaremos","hablaréis","hablarán"],
      continuo:  ["estoy hablando","estás hablando","está hablando","estamos hablando","estáis hablando","están hablando"],
      perfecto:  ["he hablado","has hablado","ha hablado","hemos hablado","habéis hablado","han hablado"],
      ir_a:      ["voy a hablar","vas a hablar","va a hablar","vamos a hablar","vais a hablar","van a hablar"]
    },
    comer: {
      presente:  ["como","comes","come","comemos","coméis","comen"],
      indefinido:["comí","comiste","comió","comimos","comisteis","comieron"],
      futuro:    ["comeré","comerás","comerá","comeremos","comeréis","comerán"],
      continuo:  ["estoy comiendo","estás comiendo","está comiendo","estamos comiendo","estáis comiendo","están comiendo"],
      perfecto:  ["he comido","has comido","ha comido","hemos comido","habéis comido","han comido"],
      ir_a:      ["voy a comer","vas a comer","va a comer","vamos a comer","vais a comer","van a comer"]
    },
    vivir: {
      presente:  ["vivo","vives","vive","vivimos","vivís","viven"],
      indefinido:["viví","viviste","vivió","vivimos","vivisteis","vivieron"],
      futuro:    ["viviré","vivirás","vivirá","viviremos","viviréis","vivirán"],
      continuo:  ["estoy viviendo","estás viviendo","está viviendo","estamos viviendo","estáis viviendo","están viviendo"],
      perfecto:  ["he vivido","has vivido","ha vivido","hemos vivido","habéis vivido","han vivido"],
      ir_a:      ["voy a vivir","vas a vivir","va a vivir","vamos a vivir","vais a vivir","van a vivir"]
    },
    // бонус-проверка исключений
    ser: {
      presente:  ["soy","eres","es","somos","sois","son"],
      indefinido:["fui","fuiste","fue","fuimos","fuisteis","fueron"],
      futuro:    ["seré","serás","será","seremos","seréis","serán"],
      continuo:  ["estoy siendo","estás siendo","está siendo","estamos siendo","estáis siendo","están siendo"],
      perfecto:  ["he sido","has sido","ha sido","hemos sido","habéis sido","han sido"],
      ir_a:      ["voy a ser","vas a ser","va a ser","vamos a ser","vais a ser","van a ser"]
    },
    tener: {
      presente:  ["tengo","tienes","tiene","tenemos","tenéis","tienen"],
      indefinido:["tuve","tuviste","tuvo","tuvimos","tuvisteis","tuvieron"],
      futuro:    ["tendré","tendrás","tendrá","tendremos","tendréis","tendrán"],
      continuo:  ["estoy teniendo","estás teniendo","está teniendo","estamos teniendo","estáis teniendo","están teniendo"],
      perfecto:  ["he tenido","has tenido","ha tenido","hemos tenido","habéis tenido","han tenido"],
      ir_a:      ["voy a tener","vas a tener","va a tener","vamos a tener","vais a tener","van a tener"]
    },
    hacer: {
      presente:  ["hago","haces","hace","hacemos","hacéis","hacen"],
      indefinido:["hice","hiciste","hizo","hicimos","hicisteis","hicieron"],
      futuro:    ["haré","harás","hará","haremos","haréis","harán"],
      continuo:  ["estoy haciendo","estás haciendo","está haciendo","estamos haciendo","estáis haciendo","están haciendo"],
      perfecto:  ["he hecho","has hecho","ha hecho","hemos hecho","habéis hecho","han hecho"],
      ir_a:      ["voy a hacer","vas a hacer","va a hacer","vamos a hacer","vais a hacer","van a hacer"]
    }
  };

  let pass = 0, fail = 0;
  for (const [verbKey, table] of Object.entries(EXPECTED)) {
    for (const [tenseKey, forms] of Object.entries(table)) {
      forms.forEach((expected, i) => {
        const got = buildFormEs(verbKey, ES_PERSON_ORDER[i], tenseKey);
        if (got === expected) pass++;
        else { fail++; console.error(`✗ ${verbKey} / ${tenseKey} / ${ES_PERSON_ORDER[i]}: «${got}» ≠ «${expected}»`); }
      });
    }
  }
  console.log(`%cСпряжения: ${pass} OK, ${fail} FAIL`, "font-weight:bold;color:" + (fail ? "#9b2c2c" : "#3f6b3a"));
}
// runEsConjugationTests();

function activePronouns() {
  return CURRENT_LANG.hideVosotros
    ? pronouns.filter((p) => p.key !== "vosotros")
    : pronouns;
}

/* ===== ИСПАНСКИЙ ГЕНЕРАТОР СПРЯЖЕНИЙ ===== */
const ES_PERSON_ORDER = ["yo","tu","el","nosotros","vosotros","ellos"];

const ES_PRESENT_ENDINGS = {
  ar: ["o","as","a","amos","áis","an"],
  er: ["o","es","e","emos","éis","en"],
  ir: ["o","es","e","imos","ís","en"]
};
const ES_INDEF_ENDINGS = {
  ar: ["é","aste","ó","amos","asteis","aron"],
  er: ["í","iste","ió","imos","isteis","ieron"],
  ir: ["í","iste","ió","imos","isteis","ieron"]
};
// Приклеиваются к инфинитиву: hablar + é = hablaré
const ES_FUTURO_ENDINGS = ["é","ás","á","emos","éis","án"];

const esStem = (inf) => inf.slice(0, -2);
const esType  = (inf) => inf.slice(-2); // "ar" | "er" | "ir"

// Функция-дешифратор
function _0x5b3c(encoded) {
  if (!encoded) return null;
  try {
    return atob(encoded).split('').reverse().join('');
  } catch (e) {
    return null;
  }
}

// Собираем словарь на лету, чтобы не светить ключи в памяти подолгу
function _0x6c1d() {
  const dict = {};
  _0x4f2a.forEach(item => {
    const code = _0x5b3c(item[0]);
    const reward = _0x5b3c(item[1]);
    if (code && reward) dict[code] = reward;
  });
  return dict;
}

// Заглушка для GIFT_CODES (чтобы старый код работал)
const GIFT_CODES = new Proxy({}, {
  get: function(target, prop) {
    const dict = _0x6c1d();
    return dict[prop];
  },
  ownKeys: function() {
    return Object.keys(_0x6c1d());
  }
});

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

function esPersonIndex(pronKey) {
  const i = ES_PERSON_ORDER.indexOf(pronKey);
  return i === -1 ? 0 : i;
}

function esGerund(vKey, v) {
  return v.gerund || esStem(vKey) + (esType(vKey) === "ar" ? "ando" : "iendo");
}
function esParticiple(vKey, v) {
  return v.participle || esStem(vKey) + (esType(vKey) === "ar" ? "ado" : "ido");
}

// Спряжение вспомогательного берём из тех же данных
function esAux(auxKey, i) {
  const aux = verbs[auxKey];
  return aux && aux.presente ? aux.presente[i] : "???";
}

function buildFormEs(verbKey, pronKey, tenseKey) {
  const v = verbs[verbKey];
  const i = esPersonIndex(pronKey);
  if (!v) return "";

  // 1. Исключение лежит в данных — оно главнее правил
  if (Array.isArray(v[tenseKey])) return v[tenseKey][i];

  switch (tenseKey) {
    case "presente":
      return esStem(verbKey) + ES_PRESENT_ENDINGS[esType(verbKey)][i];
    case "indefinido":
      return esStem(verbKey) + ES_INDEF_ENDINGS[esType(verbKey)][i];
    case "futuro":
      return verbKey + ES_FUTURO_ENDINGS[i];
    case "continuo":
      return esAux("estar", i) + " " + esGerund(verbKey, v);
    case "perfecto":
      return esAux("haber", i) + " " + esParticiple(verbKey, v);
    case "ir_a":
      return esAux("ir", i) + " a " + verbKey;
  }
  return "";
}

function buildForm(verb, pronKey, tenseKey) {

  if (CURRENT_LANG.code === "es") return buildFormEs(verb, pronKey, tenseKey);

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
  // Подбираем язык в зависимости от изучаемого
  const langMap = { en: "en-US", es: "es-ES", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN" };
  u.lang = langMap[CURRENT_LANG.code] || "en-US";
  u.rate = 0.92;
  u.pitch = 1;
  
  const enVoice = voices.find(v => v.lang === u.lang) || voices.find(v => v.lang.startsWith(CURRENT_LANG.code));
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
    // Глобальный прогресс (анимации и темы, не зависят от языка)
  const globalData = JSON.parse(localStorage.getItem('linguaflip_global') || '{}');
  if (!globalData.unlockedAnimations) globalData.unlockedAnimations = [];
  if (!globalData.unlockedThemes) globalData.unlockedThemes = [];
  if (!globalData.activeAnimation) globalData.activeAnimation = 'none';
  if (!globalData.activeTheme) globalData.activeTheme = 'none';
  window.GLOBAL_PROGRESS = globalData;

  // Восстанавливаем выбранный язык
  const savedLang = localStorage.getItem('linguaflip_lang') || 'en';
  if (LANGUAGES[savedLang]) {
    CURRENT_LANG = LANGUAGES[savedLang];
    allCards = CURRENT_LANG.cards;
    verbs = CURRENT_LANG.verbs;
    pronouns = CURRENT_LANG.pronouns;
    tenses = CURRENT_LANG.tenses;
    currentVerb = Object.keys(verbs)[0] || "work";
    
    const langSelect = document.getElementById('lang-select');
    if (langSelect) langSelect.value = savedLang;
  }

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
  vibrate([20, 40, 60]);
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
  vibrate(10);
  document.getElementById("front-tag").textContent = "Готово!";
  document.getElementById("card-trans").textContent = "";
  document.getElementById("card-example").innerHTML = "";
  document.getElementById("card-example-ru").textContent = "";
  document.getElementById("counter").textContent = "0 / 0";
  document.getElementById("progress-label").textContent = "Нет просроченных карточек";
  document.getElementById("progress-bar").style.width = "100%";
  document.getElementById("binary-actions").style.display = "none";
  document.getElementById("srs-actions").style.display = "none";
  document.getElementById("practice-input").style.display = "none";
  document.getElementById("practice-btn").style.display = "none";
  document.getElementById("constructor-ui").style.display = "none";
  document.getElementById("constructor-check-btn").style.display = "none";
  document.getElementById("card-hint").style.display = "none";

  // Кастомный текст для пустых сложных слов
  if (currentTopic === "difficult" && filteredCards.length === 0) {
    document.getElementById("card-word").textContent = "Сложных слов нет!";
    document.getElementById("card-translation").textContent = "Вы отметили все слова как изученные. Вы гений! 🧠";
  } else {
    document.getElementById("card-word").textContent = "Сессия завершена";
    document.getElementById("card-translation").textContent = "Все карточки в этой теме повторены. Возвращайтесь позже!";
  }
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
    pInput.classList.remove("correct", "incorrect", "almost");
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

/* ===== ТОЛЕРАНТНОСТЬ К ОПЕЧАТКАМ ===== */

// Нормализация: регистр, пробелы по краям, диакритика и пунктуация
// está → esta, ёж → еж, "apple," → "apple"
function normalizeAnswer(s) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,!?;:]/g, "");
}

// Расстояние Левенштейна, двухрядная версия
function levenshtein(a, b) {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,                                  // удаление буквы
        dp[j - 1] + 1,                              // вставка буквы
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),     // замена
      );
      prev = tmp;
    }
  }
  return dp[b.length];
}

// Сколько ошибок прощаем: короткие слова — никому (pan ≠ pen, это разные слова)
function typoTolerance(len) {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  return 2;
}

// Вердикт: "correct" | "almost" | "wrong" | "empty"
function compareAnswers(userInput, correctWord) {
  const val = normalizeAnswer(userInput);
  const target = normalizeAnswer(correctWord);
  if (!val) return "empty";
  if (val === target) return "correct";
  return levenshtein(val, target) <= typoTolerance(target.length)
    ? "almost"
    : "wrong";
}

document.getElementById("practice-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  if (isAnimating) return;
  const c = filteredCards[cardIdx];
  const input = document.getElementById("practice-input");
  const result = compareAnswers(input.value, c.word);
  if (e.key === "Enter" || e.keyCode === 13) {
    input.blur(); // прячем клавиатуру на телефоне, чтобы видеть переворот
  }

  if (result === "empty") {
    cardEl.classList.add("flipped");
    speak(c.word);
    return;
  }

  input.classList.remove("correct", "incorrect", "almost");
  if (result === "correct") {
    input.classList.add("correct");
  } else if (result === "almost") {
    input.classList.add("almost");
    toast("Почти! Правильно: " + c.word);
  } else {
    input.classList.add("incorrect");
  }

  setTimeout(() => {
    cardEl.classList.add("flipped");
    speak(c.word);
  }, result === "almost" ? 800 : 400); // жёлтую рамку показываем чуть дольше
});

document.getElementById("practice-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("practice-btn").click();
  }
});

// Обработка кнопок "Знаю / Не знаю" (режим Чтения)
function handleMark(status) {
  if (isAnimating) return;
  vibrate(status === 'known' ? 10 : 20)
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
  vibrate(grade === 1 ? 30 : 10); 
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
      vibrate(15);
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

function saveGlobalProgress() {
  localStorage.setItem('linguaflip_global', JSON.stringify(window.GLOBAL_PROGRESS));
}

function applyCardAnimation() {
  AVAILABLE_ANIMATIONS.forEach((anim) => cardEl.classList.remove(anim));
  cardEl.classList.remove('anim-default');
  
  const gp = window.GLOBAL_PROGRESS;
  const activeAnim = gp.activeAnimation || 'none';
  if (activeAnim !== 'none' && AVAILABLE_ANIMATIONS.includes(activeAnim)) {
    cardEl.classList.add(activeAnim);
  } else {
    cardEl.classList.add('anim-default');
  }
  
  updateAnimationSelect();
}

function updateAnimationSelect() {
  const select = document.getElementById('animation-select');
  if (!select) return;
  
  let html = '<option value="none">По умолчанию</option>';
  const gp = window.GLOBAL_PROGRESS;
  if (!gp.unlockedAnimations) gp.unlockedAnimations = [];
  
  gp.unlockedAnimations.forEach(anim => {
    let label = anim.replace('anim-', '').replace(/-/g, ' ');
    html += `<option value="${anim}">${label}</option>`;
  });
  select.innerHTML = html;
  select.value = gp.activeAnimation || 'none';
}

function applyTheme() {
  AVAILABLE_THEMES.forEach(t => document.documentElement.classList.remove(t));
  
  const gp = window.GLOBAL_PROGRESS;
  const activeTheme = gp.activeTheme || 'none';
  if (activeTheme !== 'none' && AVAILABLE_THEMES.includes(activeTheme)) {
    document.documentElement.classList.add(activeTheme);
    
    if (window.LinguaEffects) {
      if (activeTheme === 'theme-cosmos') window.LinguaEffects.initCosmosStars();
      else if (activeTheme === 'theme-forest') window.LinguaEffects.initForestLeaves();
      else if (activeTheme === 'theme-ocean') window.LinguaEffects.initOceanBubbles();
    }
  }
  updateThemeSelect();
}

function updateThemeSelect() {
  const select = document.getElementById('theme-select');
  if (!select) return;
  
  let html = '<option value="none">По умолчанию (Тёплая)</option>';
  const gp = window.GLOBAL_PROGRESS;
  if (!gp.unlockedThemes) gp.unlockedThemes = [];
  
  gp.unlockedThemes.forEach(theme => {
    let label = theme.replace('theme-', '');
    label = label.charAt(0).toUpperCase() + label.slice(1);
    html += `<option value="${theme}">${label}</option>`;
  });
  select.innerHTML = html;
  select.value = gp.activeTheme || 'none';
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
let currentVerb = Object.keys(verbs)[0] || "work";
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
  activePronouns().forEach((p) => {
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
  const p = activePronouns()[Math.floor(Math.random() * activePronouns().length)];
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
    window.GLOBAL_PROGRESS.activeTheme = e.target.value;
    saveGlobalProgress();
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
      const gp = window.GLOBAL_PROGRESS;
      let alreadyUnlocked = false;
      
      if (reward.startsWith('anim-')) {
        if (!gp.unlockedAnimations.includes(reward)) {
          gp.unlockedAnimations.push(reward);
          gp.activeAnimation = reward;
          applyCardAnimation();
          toast('Ура! Анимация разблокирована.');
        } else alreadyUnlocked = true;
      } else if (reward.startsWith('theme-')) {
        if (!gp.unlockedThemes.includes(reward)) {
          gp.unlockedThemes.push(reward);
          gp.activeTheme = reward;
          applyTheme();
          toast('Ура! Тема разблокирована.');
        } else alreadyUnlocked = true;
      }
      
      if (alreadyUnlocked) toast('Этот код уже был активирован.');
      
      saveGlobalProgress();
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
    window.GLOBAL_PROGRESS.activeAnimation = e.target.value;
    saveGlobalProgress();
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

const langSelect = document.getElementById('lang-select');
if (langSelect) {
  langSelect.addEventListener('change', (e) => {
    const newLang = e.target.value;
    localStorage.setItem('linguaflip_lang', newLang);
    
    // Показываем сообщение и перезагружаем страницу
    toast("Меняем язык...");
    setTimeout(() => location.reload(), 300);
  });
}