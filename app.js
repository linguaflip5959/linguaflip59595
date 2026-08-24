/* ===== ИНИЦИАЛИЗАЦИЯ ЯЗЫКА ===== */
const CURRENT_LANG = LANG_EN;
const allCards = CURRENT_LANG.cards;
const verbs = CURRENT_LANG.verbs;

let filteredCards = [];
let currentTopic = "all";
let cardIdx = 0;
let isAnimating = false; // Флаг блокировки во время анимации

let progress = {
  topic: 'all',
  idx: 0,
  stats: { correct: 0, incorrect: 0 },
  marks: {}
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
  { key: "time", label: "Time" }
];

const pronouns = [
  { key:"I",        label:"I" },
  { key:"you",      label:"you" },
  { key:"he/she",   label:"he / she" },
  { key:"we",       label:"we" },
  { key:"they",     label:"they" }
];

const tenses = [
  { key:"ps",  label:"Present Simple" },
  { key:"pas", label:"Past Simple" },
  { key:"fs",  label:"Future Simple" },
  { key:"pc",  label:"Present Continuous" },
  { key:"pp",  label:"Present Perfect" }
];

function buildForm(verb, pronKey, tenseKey){
  const v = verbs[verb];
  const isThird = (pronKey === "he/she");
  switch(tenseKey){
    case "ps": return isThird ? v.thirdSingular : v.base;
    case "pas": return v.past;
    case "fs": return "will " + v.base;
    case "pc": {
      const aux = (pronKey === "I") ? "am" : (isThird ? "is" : "are");
      return aux + " " + v.ing;
    }
    case "pp": {
      const aux = isThird ? "has" : "have";
      return aux + " " + v.participle;
    }
  }
  return "";
}

/* ===== Web Speech API ===== */
let voices = [];
function loadVoices(){
  voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
}
if(window.speechSynthesis){
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
function speak(text){
  if(!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;
  const cleanText = tempDiv.textContent || tempDiv.innerText || "";
  
  const u = new SpeechSynthesisUtterance(cleanText);
  u.lang = "en-US";
  u.rate = 0.92;
  u.pitch = 1;
  const enVoice = voices.find(v => /en[-_]US/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang));
  if(enVoice) u.voice = enVoice;
  window.speechSynthesis.speak(u);
}

/* ===== Toast ===== */
const toastEl = document.getElementById('toast');
let toastTimer;
function toast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> toastEl.classList.remove('show'), 1800);
}

/* ===== CAROUSEL AUTO-SCROLL ===== */
function scrollToActiveChip(container) {
  setTimeout(() => {
    const activeChip = container.querySelector('.chip.active');
    if (activeChip) {
      activeChip.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, 50);
}

/* ===== PROGRESS & STATS ===== */
function loadProgress() {
  const saved = localStorage.getItem('progress_' + CURRENT_LANG.code);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      progress = { ...progress, ...data };
      if (!progress.stats) progress.stats = { correct: 0, incorrect: 0 };
      if (!progress.marks) progress.marks = {};
    } catch(e) { console.error("Error loading progress", e); }
  }
  currentTopic = progress.topic || 'all';
  cardIdx = progress.idx || 0;
  updateFilteredCards();
  if (cardIdx < 0 || cardIdx >= filteredCards.length) cardIdx = 0;
  updateStatsUI();
}

function saveProgress() {
  progress.topic = currentTopic;
  progress.idx = cardIdx;
  localStorage.setItem('progress_' + CURRENT_LANG.code, JSON.stringify(progress));
  updateTopicProgressBar();
}

function updateStatsUI() {
  document.querySelector('#stats-badge .ok').textContent = progress.stats.correct;
  document.querySelector('#stats-badge .err').textContent = progress.stats.incorrect;
}

function updateFilteredCards() {
  if (currentTopic === 'all') {
    filteredCards = allCards;
  } else if (currentTopic === 'difficult') {
    filteredCards = allCards.filter(c => progress.marks[c.word] === 'unknown');
  } else {
    filteredCards = allCards.filter(c => c.topic === currentTopic);
  }
}

function updateTopicProgressBar() {
  const totalCardsInTopic = filteredCards.length;
  let markedCards = 0;
  filteredCards.forEach(card => {
    if (progress.marks[card.word]) markedCards++;
  });
  const percent = totalCardsInTopic > 0 ? (markedCards / totalCardsInTopic) * 100 : 0;
  document.getElementById('topic-progress-fill').style.width = percent + '%';
}

/* ===== TOPICS CHIPS ===== */
const topicChipsContainer = document.getElementById('topic-chips');
function renderTopicChips() {
  topicChipsContainer.innerHTML = '';
  topics.forEach(t => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (t.key === currentTopic ? ' active' : '');
    chip.dataset.topic = t.key;
    chip.textContent = t.label;
    topicChipsContainer.appendChild(chip);
  });
  scrollToActiveChip(topicChipsContainer);
}

topicChipsContainer.addEventListener('click', (e) => {
  if (isAnimating) return;
  const chip = e.target.closest('.chip');
  if(!chip || !chip.dataset.topic) return;
  const newTopic = chip.dataset.topic;
  if (newTopic === currentTopic) return;
  
  currentTopic = newTopic;
  cardIdx = 0;
  updateFilteredCards();
  renderTopicChips();
  renderCard();
  saveProgress();
});

/* ===== FLASHCARDS LOGIC ===== */
const cardEl = document.getElementById('card');

function updateCardContent() {
  if (filteredCards.length === 0) {
    document.getElementById('card-word').textContent = "Пусто";
    document.getElementById('card-trans').textContent = "";
    document.getElementById('card-translation').textContent = "Нет сложных слов. Отметьте слова кнопкой «Не знаю».";
    document.getElementById('card-example').innerHTML = "";
    document.getElementById('card-example-ru').textContent = "";
    document.getElementById('counter').textContent = "0 / 0";
    document.getElementById('progress-label').textContent = "";
    document.getElementById('progress-bar').style.width = "0%";
    document.getElementById('prev-btn').disabled = true;
    document.getElementById('next-btn').disabled = true;
    return;
  }
  const c = filteredCards[cardIdx];
  document.getElementById('card-word').textContent = c.word;
  document.getElementById('card-trans').textContent = c.transcription;
  document.getElementById('card-translation').textContent = c.translation;
  document.getElementById('card-example').innerHTML = c.example;
  document.getElementById('card-example-ru').textContent = c.exampleTranslation;
  document.getElementById('counter').textContent = (cardIdx+1) + " / " + filteredCards.length;
  document.getElementById('progress-label').textContent = "Карточка " + (cardIdx+1) + " из " + filteredCards.length;
  const pct = ((cardIdx+1)/filteredCards.length)*100;
  document.getElementById('progress-bar').style.width = pct + "%";
  document.getElementById('prev-btn').disabled = (cardIdx === 0);
  document.getElementById('next-btn').disabled = (cardIdx === filteredCards.length-1);
}

function renderCard() {
  if (isAnimating) return;
  const wasFlipped = cardEl.classList.contains('flipped');
  
  if (wasFlipped) {
    // Если карточка была перевернута, запускаем анимацию,
    // и меняем текст только когда оборотная сторона скрылась (через 350мс)
    isAnimating = true;
    cardEl.classList.remove('flipped');
    setTimeout(() => {
      updateCardContent();
      isAnimating = false;
    }, 350);
  } else {
    // Если не была перевернута, просто обновляем текст
    updateCardContent();
  }
}

cardEl.addEventListener('click', (e)=>{
  if (isAnimating) return;
  if(e.target.closest('#card-example')) {
    e.stopPropagation();
    speak(filteredCards[cardIdx].example);
    return;
  }
  if(e.target.closest('.action-btn')) return;
  
  cardEl.classList.toggle('flipped');
  if(cardEl.classList.contains('flipped')) speak(filteredCards[cardIdx].word);
});

document.getElementById('prev-btn').addEventListener('click', (e)=>{
  e.stopPropagation();
  if (isAnimating) return;
  if(cardIdx > 0){ cardIdx--; renderCard(); saveProgress(); }
});
document.getElementById('next-btn').addEventListener('click', (e)=>{
  e.stopPropagation();
  if (isAnimating) return;
  if(cardIdx < filteredCards.length-1){ cardIdx++; renderCard(); saveProgress(); }
});

// Обработка кнопок "Знаю/Не знаю"
function handleMark(status) {
  if (isAnimating) return;
  const c = filteredCards[cardIdx];
  const prevStatus = progress.marks[c.word];
  
  if (prevStatus !== status) {
    if (status === 'known') {
      progress.stats.correct++;
      if (prevStatus === 'unknown') progress.stats.incorrect = Math.max(0, progress.stats.incorrect - 1);
    } else {
      progress.stats.incorrect++;
      if (prevStatus === 'known') progress.stats.correct = Math.max(0, progress.stats.correct - 1);
    }
    progress.marks[c.word] = status;
  }
  
  updateStatsUI();
  
  if (cardIdx < filteredCards.length - 1) {
    cardIdx++;
    renderCard();
    saveProgress();
  } else {
    toast("Вы прошли все карточки в этой теме!");
    saveProgress();
    
    // Возврат на лицевую сторону
    isAnimating = true;
    cardEl.classList.remove('flipped');
    
    if (currentTopic === 'difficult' && status === 'known') {
      setTimeout(() => {
        updateFilteredCards();
        cardIdx = 0;
        updateCardContent();
        isAnimating = false;
      }, 350);
    } else {
      setTimeout(() => { isAnimating = false; }, 350);
    }
  }
}

document.getElementById('know-btn').addEventListener('click', (e) => { e.stopPropagation(); handleMark('known'); });
document.getElementById('dont-know-btn').addEventListener('click', (e) => { e.stopPropagation(); handleMark('unknown'); });

let touchStartX = 0;
cardEl.addEventListener('touchstart', (e)=>{ touchStartX = e.touches[0].clientX; }, {passive:true});
cardEl.addEventListener('touchend', (e)=>{
  if (isAnimating) return;
  if (e.target.closest('.action-btn') || e.target.closest('#card-example')) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if(Math.abs(dx) > 60){
    if(dx < 0 && cardIdx < filteredCards.length-1){ cardIdx++; renderCard(); saveProgress(); }
    else if(dx > 0 && cardIdx > 0){ cardIdx--; renderCard(); saveProgress(); }
  }
}, {passive:true});

/* ===== BACKUP / RESTORE ===== */
document.getElementById('save-btn').addEventListener('click', () => {
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

document.getElementById('load-btn').addEventListener('click', () => {
  document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (confirm("Восстановить прогресс из файла? Текущие данные будут заменены.")) {
        progress = data;
        if (!progress.stats) progress.stats = { correct: 0, incorrect: 0 };
        if (!progress.marks) progress.marks = {};
        saveProgress();
        loadProgress();
        renderTopicChips();
        renderCard();
        toast("Прогресс восстановлен");
      }
    } catch(err) {
      toast("Ошибка: неверный файл");
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

/* ===== VIEW SWITCHING ===== */
const tabs = document.querySelectorAll('.nav-tab');
const views = document.querySelectorAll('.view');
tabs.forEach(tab=>{
  tab.addEventListener('click', ()=>{
    const v = tab.dataset.view;
    tabs.forEach(t=> t.classList.toggle('active', t===tab));
    views.forEach(view=> view.classList.toggle('active', view.id === 'view-'+v));
  });
});

/* ===== TABLE TYPE & CHIPS LOGIC ===== */
const tableTypeSelect = document.getElementById('table-type');
const verbChipsContainer = document.getElementById('verb-chips');
let currentVerb = "work";
let currentMode = "view";

function renderVerbChips(type) {
  verbChipsContainer.innerHTML = '';
  if (type === 'verbs') {
    Object.keys(verbs).forEach((v) => {
      const chip = document.createElement('button');
      chip.className = 'chip' + (v === currentVerb ? ' active' : '');
      chip.dataset.verb = v;
      chip.innerHTML = `${v} <small>${verbs[v].regular ? 'прав.' : 'неправ.'}</small>`;
      verbChipsContainer.appendChild(chip);
    });
  } else {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.style.opacity = '0.5';
    chip.style.cursor = 'default';
    chip.textContent = 'Скоро...';
    verbChipsContainer.appendChild(chip);
  }
  scrollToActiveChip(verbChipsContainer);
}

tableTypeSelect.addEventListener('change', (e) => {
  const newType = e.target.value;
  renderVerbChips(newType);
  if (newType === 'verbs') {
    currentVerb = Object.keys(verbs)[0];
    renderTable();
  } else {
    document.getElementById('verbs-table').innerHTML = '';
    document.getElementById('input-panel').style.display = 'none';
    document.getElementById('table-hint').textContent = 'Раздел в разработке';
  }
});

verbChipsContainer.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if(!chip || !chip.dataset.verb) return;
  const newVerb = chip.dataset.verb;
  if (newVerb === currentVerb) return;
  verbChipsContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  currentVerb = newVerb;
  renderTable();
});

/* ===== VERBS TABLE ===== */
const tableEl = document.getElementById('verbs-table');
const inputPanel = document.getElementById('input-panel');
const tableHint = document.getElementById('table-hint');
const coordText = document.getElementById('input-coord-text');
const answerInput = document.getElementById('answer-input');
const checkBtn = document.getElementById('check-btn');
const feedbackEl = document.getElementById('feedback');
const skipBtn = document.getElementById('skip-btn');
let inputTarget = null;

function renderTable(){
  let html = "<thead><tr><th></th>";
  tenses.forEach(t=> html += `<th>${t.label}</th>`);
  html += "</tr></thead><tbody>";
  pronouns.forEach(p=>{
    html += `<tr><th>${p.label}</th>`;
    tenses.forEach(t=>{
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

function applyMode(){
  tableEl.querySelectorAll('.cell.revealed').forEach(c=> c.classList.remove('revealed'));
  if(currentMode === "view"){
    inputPanel.style.display = "none";
    tableHint.textContent = "Нажми на ячейку, чтобы услышать произношение";
  } else if(currentMode === "self"){
    inputPanel.style.display = "none";
    tableHint.textContent = "Нажми на ячейку, чтобы открыть форму";
  } else if(currentMode === "input"){
    inputPanel.style.display = "flex";
    tableHint.textContent = "Введи форму глагола для указанной координаты";
    nextInputTarget();
  }
}

tableEl.addEventListener('click', (e)=>{
  const cell = e.target.closest('.cell');
  if(!cell) return;
  if(currentMode === "view"){
    speak(cell.dataset.form);
  } else if(currentMode === "self"){
    cell.classList.toggle('revealed');
    if(cell.classList.contains('revealed')) speak(cell.dataset.form);
  }
});

document.querySelectorAll('.mode-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.mode-btn').forEach(b=> b.classList.toggle('active', b===btn));
    currentMode = btn.dataset.mode;
    tableEl.className = "verbs mode-" + currentMode;
    applyMode();
  });
});

/* ===== INPUT MODE ===== */
function nextInputTarget(){
  const p = pronouns[Math.floor(Math.random()*pronouns.length)];
  const t = tenses[Math.floor(Math.random()*tenses.length)];
  inputTarget = { pronKey: p.key, tenseKey: t.key, pronLabel: p.label, tenseLabel: t.label };
  coordText.textContent = p.label + "  /  " + t.label;
  answerInput.value = "";
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  answerInput.focus();
}

function checkAnswer(){
  if(!inputTarget) return;
  const correct = buildForm(currentVerb, inputTarget.pronKey, inputTarget.tenseKey);
  const user = answerInput.value.trim().toLowerCase();
  if(!user){ toast("Введи ответ"); return; }
  if(user === correct.toLowerCase()){
    feedbackEl.textContent = "Верно! " + correct;
    feedbackEl.className = "feedback ok";
    speak(correct);
    highlightCell(inputTarget.pronKey, inputTarget.tenseKey, true);
    setTimeout(()=>{ highlightCell(inputTarget.pronKey, inputTarget.tenseKey, false); nextInputTarget(); }, 1400);
  } else {
    feedbackEl.textContent = "Не совсем. Правильно: " + correct;
    feedbackEl.className = "feedback err";
    speak(correct);
    highlightCell(inputTarget.pronKey, inputTarget.tenseKey, true);
  }
}

function highlightCell(pronKey, tenseKey, on){
  const cell = tableEl.querySelector(`.cell[data-pron="${pronKey}"][data-tense="${tenseKey}"]`);
  if(!cell) return;
  if(on){ cell.classList.add('revealed'); cell.style.background = "#fdf0e0"; } 
  else { cell.classList.remove('revealed'); cell.style.background = ""; }
}

checkBtn.addEventListener('click', checkAnswer);
answerInput.addEventListener('keydown', (e)=>{ if(e.key === "Enter") checkAnswer(); });
skipBtn.addEventListener('click', ()=>{ feedbackEl.textContent = ""; feedbackEl.className = "feedback"; nextInputTarget(); });

/* ===== INIT ===== */
loadProgress();
renderTopicChips();
updateCardContent(); // Первичная отрисовка без анимации
renderVerbChips('verbs');
renderTable();
updateTopicProgressBar();

/* ===== THEME TOGGLE ===== */
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed:', err));
  });
}