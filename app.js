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

const AVAILABLE_ANIMATIONS = ["anim-3d-tumble"];
const GIFT_CODES = {
  "LF-TUMBLE-2024": "anim-3d-tumble",
};

let progress = {
  topic: "all",
  idx: 0,
  stats: { correct: 0, incorrect: 0 },
  marks: {},
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

  document
    .getElementById("reverse-toggle")
    .classList.toggle("active", isPracticeMode);
  document
    .getElementById("constructor-toggle")
    .classList.toggle("active", isConstructorMode);
  document.getElementById("level-btn").textContent = currentLevel;
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
  document.getElementById("topic-progress-fill").style.width = percent + "%";
}

const topicChipsContainer = document.getElementById("topic-chips");
function renderTopicChips() {
  topicChipsContainer.innerHTML = "";
  topics.forEach((t) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (t.key === currentTopic ? " active" : "");
    chip.dataset.topic = t.key;
    chip.textContent = t.label;
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

function handleMark(status) {
  if (isAnimating) return;
  const c = filteredCards[cardIdx];
  let mark = progress.marks[c.word] || { box: 1, dueDate: Date.now() };
  if (typeof mark === "string") mark = { box: 1, dueDate: Date.now() };

  if (status === "known") {
    progress.stats.correct++;
    mark.box = Math.min(6, (mark.box || 1) + 1);
    mark.dueDate = Date.now() + getSrsInterval(mark.box);
  } else {
    progress.stats.incorrect++;
    mark.box = 1;
    mark.dueDate = Date.now() + 10 * MIN;
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
    cardEl.classList.remove("flipped");
    setTimeout(() => {
      isAnimating = false;
    }, 350);
  }
}

function handleSrs(grade) {
  if (isAnimating) return;
  const c = filteredCards[cardIdx];
  let mark = progress.marks[c.word] || { box: 1, dueDate: Date.now() };
  let newBox = mark.box || 1;

  if (grade === 1) {
    newBox = 1;
    mark.dueDate = Date.now() + 1 * MIN;
    progress.stats.incorrect++;
  } else if (grade === 2) {
    newBox = Math.max(1, newBox);
    mark.dueDate = Date.now() + 10 * MIN;
    progress.stats.correct++;
  } else if (grade === 3) {
    newBox = Math.min(6, newBox + 1);
    mark.dueDate = Date.now() + getSrsInterval(newBox);
    progress.stats.correct++;
  } else if (grade === 4) {
    newBox = Math.min(6, newBox + 2);
    mark.dueDate = Date.now() + getSrsInterval(newBox);
    progress.stats.correct++;
  }

  mark.box = newBox;
  progress.marks[c.word] = mark;
  updateStatsUI();
  saveProgress();

  isAnimating = true;
  cardEl.classList.remove("flipped");
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
  answerBox.innerHTML = "";
  answerBox.className = "constructor-answer";
  chipsBox.innerHTML = "";

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = card.example;
  const cleanText = tempDiv.textContent.replace(/[.,!?]/g, "");
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);

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
  AVAILABLE_ANIMATIONS.forEach((anim) => cardEl.classList.remove(anim));
  if (progress.unlockedAnimations && progress.unlockedAnimations.length > 0) {
    cardEl.classList.add(progress.unlockedAnimations[0]);
  }
}

document.getElementById("gift-btn").addEventListener("click", () => {
  const input = prompt("Введите код поддержки, полученный на почту:");
  if (!input) return;
  const code = input.trim().toUpperCase();

  if (GIFT_CODES[code]) {
    const animName = GIFT_CODES[code];
    if (!progress.unlockedAnimations.includes(animName)) {
      progress.unlockedAnimations.push(animName);
      saveProgress();
      applyCardAnimation();
      toast("Ура! Новая анимация разблокирована.");
    } else {
      toast("Эта анимация уже активирована.");
    }
  } else {
    toast("Неверный код. Проверьте правильность ввода.");
  }
});

document.getElementById("save-btn").addEventListener("click", () => {
  const dataStr = JSON.stringify(progress, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `linguaflip_backup_${CURRENT_LANG.code}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast("Прогресс сохранен в файл");
});

document.getElementById("load-btn").addEventListener("click", () => {
  document.getElementById("file-input").click();
});

document.getElementById("file-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (
        confirm(
          "Восстановить прогресс из файла? Текущие данные будут заменены.",
        )
      ) {
        progress = data;
        if (!progress.stats) progress.stats = { correct: 0, incorrect: 0 };
        if (!progress.marks) progress.marks = {};
        saveProgress();
        loadProgress();
        renderTopicChips();
        renderCard();
        toast("Прогресс восстановлен");
      }
    } catch (err) {
      toast("Ошибка: неверный файл");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

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
updateTopicProgressBar();

const themeToggle = document.getElementById("theme-toggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
}

document.getElementById("donate-btn").addEventListener("click", () => {
  const donateUrl = "https://pay.cloudtips.ru/p/5e4d197a";
  const unlockedCount = progress.unlockedAnimations
    ? progress.unlockedAnimations.length
    : 0;
  const hasAllAnimations = unlockedCount >= AVAILABLE_ANIMATIONS.length;

  let message = "Поддержите разработчика рублём!\n\n";

  if (!hasAllAnimations) {
    message +=
      "Сделайте перевод по ссылке (она откроется в браузере).\n" +
      "В комментариях к переводу укажите почту и слово 'LinguaFlip'.\n\n" +
      "В ответ я пришлю вам на почту код, который разблокирует эксклюзивную 3D-анимацию переворота карточки в знак благодарности! \n PS. Нет почты, нет анимации";
  } else {
    message +=
      "Вы уже открыли все доступные анимации! ❤️\n" +
      "Любой перевод будет просто приятным бонусом и поддержкой проекта.";
  }

  if (confirm(message)) {
    window.open(donateUrl, "_blank");
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((err) => console.log("SW registration failed:", err));
  });
}
