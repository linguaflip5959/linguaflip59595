/* ===== ГЕНЕРАТОР КАРТОЧЕК (Gemini) =====
   Подключается ПОСЛЕ app.js в index.html.
   Зависит от app.js: LANGUAGES, CURRENT_LANG, addUserCard, toast */

const AI_MODEL = "gemini-3.6-flash";
const AI_KEY_STORAGE = "linguaflip_gemini_key"; // имя ячейки для ключа
const AI_BATCH = 20; // слов за один запрос

/* ---------- Транспорт ---------- */
async function geminiFetch(prompt, apiKey) {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    AI_MODEL + ":generateContent?key=" + encodeURIComponent(apiKey);

  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
        }),
      });

      if (resp.status === 429) { // лимит — подождать и повторить
        await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
        lastErr = new Error("Превышен лимит запросов, пробую ещё раз…");
        continue;
      }
      if (!resp.ok) {
        const err = await resp.json().catch(() => null);
        const hint = err && err.error ? err.error.message : "";
        throw new Error("HTTP " + resp.status + (hint ? " — " + hint : ""));
      }

      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Пустой ответ от Gemini");
      return text;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw lastErr || new Error("Не удалось связаться с Gemini");
}

/* ---------- Валидатор ---------- */
function aiNorm(s) {
  return (s || "").trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function validateCard(card, requestedWord) {
  if (!card || typeof card !== "object") return "битая структура";
  const word = (card.word || "").trim();
  const translation = (card.translation || "").trim();
  if (!word) return "нет слова";
  if (!translation) return "нет перевода";
  if (aiNorm(word) !== aiNorm(requestedWord))
    return "ИИ вернул «" + word + "» вместо «" + requestedWord + "»";
  const tr = (card.transcription || "").trim();
  const trOk =
    (tr.startsWith("[") && tr.endsWith("]")) ||
    (tr.startsWith("/") && tr.endsWith("/"));
  if (tr && !trOk) return "транскрипция без скобок";
  return null; // null = валидна
}

/* ---------- Промпт ---------- */
function buildPrompt(words, langName, translateTo) {
  return (
    "Ты — составитель словарных карточек для приложения-тренажёра. " +
    "Язык колоды: " + langName + ". Переводы на " + translateTo + ".\n" +
    "Для каждого слова из списка верни объект:\n" +
    '{"word":"слово как в списке","transcription":"[ IPA ]","translation":"перевод на ' + translateTo + '","example":"пример с <b>словом</b>","exampleTranslation":"перевод примера"}\n' +
    "Требования: только строгий JSON-массив, без markdown и пояснений; " +
    "в example целевое слово оборачивай в <b></b>; транскрипция в квадратных скобках; " +
    "пример — простое предложение из 4-7 слов, БЕЗ кавычек вокруг слов.\n" +
    "Слова:\n" + words.join("\n")
  );
}

/* ---------- Парсер ---------- */
function parseGeminiJson(text) {
  let t = text.trim();
  t = t.replace(/^```(json)?\s*/i, "").replace(/```\s*$/, "");
  return JSON.parse(t);
}

/* ---------- Пайплайн ---------- */
async function generateCards() {
  const keyInput = document.getElementById("ai-api-key");
  const wordsArea = document.getElementById("ai-words");
  const langSel = document.getElementById("ai-lang");
  const statusEl = document.getElementById("ai-status");
  const btn = document.getElementById("ai-generate-btn");

  const apiKey = (keyInput.value || "").trim();
  const words = wordsArea.value.split("\n").map((w) => w.trim()).filter(Boolean);

  if (!apiKey) { setStatus(statusEl, "Введи API-ключ", "err"); keyInput.focus(); return; }
  if (!words.length) { setStatus(statusEl, "Введи хотя бы одно слово", "err"); wordsArea.focus(); return; }

  const targetLang = langSel ? langSel.value : CURRENT_LANG.code;
  const langName = (LANGUAGES[targetLang] || {}).name || targetLang;

  localStorage.setItem(AI_KEY_STORAGE, apiKey);
  btn.disabled = true;

  const report = { added: 0, dup: 0, bad: [] };
  const batches = [];
  for (let i = 0; i < words.length; i += AI_BATCH)
    batches.push(words.slice(i, i + AI_BATCH));

  try {
    for (let b = 0; b < batches.length; b++) {
      setStatus(statusEl, "Батч " + (b + 1) + "/" + batches.length + ": спрашиваю Gemini…", "working");
      const raw = await geminiFetch(buildPrompt(batches[b], langName, "русский"), apiKey);
      const cards = parseGeminiJson(raw);

      cards.forEach((card) => {
        const err = validateCard(card, card.word);
        if (err) { report.bad.push((card.word || "???") + " — " + err); return; }
        const ok = addUserCard(
          {
            word: card.word,
            transcription: card.transcription || "",
            translation: card.translation,
            example: card.example || "",
            exampleTranslation: card.exampleTranslation || "",
          },
          targetLang,
        );
        if (ok) report.added++;
        else report.dup++;
      });
    }

    setStatus(statusEl,
      "✅ Добавлено: " + report.added + ". Дубли: " + report.dup + ". Отбраковано: " + report.bad.length,
      "ok");
    if (report.bad.length)
      console.warn("Отбракованные карточки:\n" + report.bad.join("\n"));
  } catch (e) {
    setStatus(statusEl, "❌ " + e.message, "err");
  } finally {
    btn.disabled = false;
  }
}

function setStatus(el, msg, cls) {
  el.textContent = msg;
  el.className = "ai-status " + (cls || "");
}

/* ---------- Проводка UI ---------- */
const aiBtnModal = document.getElementById("ai-btn-modal");
const aiModal = document.getElementById("ai-modal");
const aiCloseBtn = document.getElementById("ai-close");
const aiGenerateBtn = document.getElementById("ai-generate-btn");
const aiLangSelect = document.getElementById("ai-lang");
const statsModalForAi = document.getElementById("stats-modal");

if (aiLangSelect) {
  aiLangSelect.innerHTML = ""; // страховка от дублей
  Object.values(LANGUAGES).forEach((l) => {
    const opt = document.createElement("option");
    opt.value = l.code;
    opt.textContent = l.name;
    aiLangSelect.appendChild(opt);
  });
  aiLangSelect.value = CURRENT_LANG.code;
}

const aiKeyInput = document.getElementById("ai-api-key");
const savedKey = localStorage.getItem(AI_KEY_STORAGE);
if (aiKeyInput && savedKey) aiKeyInput.value = savedKey;

if (aiBtnModal && statsModalForAi && aiModal) {
  aiBtnModal.addEventListener("click", () => {
    statsModalForAi.classList.remove("show");
    if (aiLangSelect) aiLangSelect.value = CURRENT_LANG.code;
    setTimeout(() => aiModal.classList.add("show"), 300);
  });
}

if (aiCloseBtn) {
  aiCloseBtn.addEventListener("click", () => aiModal.classList.remove("show"));
}

if (aiGenerateBtn) {
  aiGenerateBtn.addEventListener("click", generateCards);
}

console.log("ai.js подключён: генератор карточек готов");

/* ===== ПЛАВАЮЩАЯ КНОПКА + БАНК ПРЕДЛОЖЕНИЙ ===== */

// --- Звёздочка на экране ---
const aiFab = document.getElementById("ai-fab");
if (aiFab && aiModal) {
  aiFab.addEventListener("click", () => {
    if (aiLangSelect) aiLangSelect.value = CURRENT_LANG.code;
    updateBankStatus();
    aiModal.classList.add("show");
  });
}

// --- Хранилище: linguaflip_sentences_<lang> = { "perro": [{sentence, translation}, ...] } ---
function loadSentenceBank() {
  try {
    return JSON.parse(
      localStorage.getItem("linguaflip_sentences_" + CURRENT_LANG.code) || "{}"
    );
  } catch (e) { return {}; }
}

function saveSentenceBank(bank) {
  localStorage.setItem(
    "linguaflip_sentences_" + CURRENT_LANG.code,
    JSON.stringify(bank)
  );
}

function aiStrip(html) {
  const d = document.createElement("div");
  d.innerHTML = html || "";
  return d.textContent || "";
}

// Топливо банка — выученные слова текущей колоды (SRS box >= 2)
function getLearnedWords() {
  loadUserCards();
  const deck = allCards.concat(userCards);
  return deck
    .filter((c) => progress.marks[c.word] && progress.marks[c.word].box > 1)
    .map((c) => c.word);
}

// Выбор фразы: банк → пример карточки → null
function getConstructorSentence(card) {
  const bank = loadSentenceBank();
  const arr = bank[aiNorm(card.word)];
  if (arr && arr.length) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  if (card.example && card.example.trim()) {
    return { sentence: card.example, translation: card.exampleTranslation };
  }
  return null;
}

function bankBuildPrompt(words, langName) {
  return (
    "Ты — преподаватель языка, составляешь упражнение на порядок слов. " +
    "Язык: " + langName + ". Для каждого слова придумай ТРИ разных простых " +
    "предложения уровня A1-A2 (4-7 слов), содержащих это слово. " +
    "Ответ — строго JSON-массив без markdown и пояснений:\n" +
    '[{"word":"слово","sentences":[{"sentence":"El <b>perro</b> ladra.","translation":"Собака лает."},{"sentence":"...","translation":"..."},{"sentence":"...","translation":"..."}]}]\n' +
    "Целевое слово оборачивай в <b></b>. Перевод предложения — на русском.\n" +
    "Слова:\n" + words.join("\n")
  );
}

// Антигаллюцинация: в предложении обязано быть целевое слово
function validSentence(word, s) {
  if (!s || !s.sentence || !s.translation) return false;
  const clean = aiStrip(s.sentence).toLowerCase().replace(/[.,!?;:]/g, "");
  return clean.split(/\s+/).some((w) => aiNorm(w) === aiNorm(word));
}

async function buildSentenceBank() {
  const statusEl = document.getElementById("ai-bank-status");
  const btn = document.getElementById("ai-bank-btn");
  const keyInput = document.getElementById("ai-api-key");

  const apiKey = ((keyInput && keyInput.value) ||
    localStorage.getItem(AI_KEY_STORAGE) || "").trim();
  if (!apiKey) {
    if (statusEl) { statusEl.textContent = "Введи API-ключ в поле выше"; statusEl.className = "ai-status err"; }
    return;
  }
  localStorage.setItem(AI_KEY_STORAGE, apiKey);

  const bank = loadSentenceBank();
  const learned = getLearnedWords();
  if (!learned.length) {
    if (statusEl) {
      statusEl.textContent = "Банк кормится выученными словами (SRS box ≥ 2) — сначала поучи";
      statusEl.className = "ai-status err";
    }
    return;
  }

  const todo = learned.filter((w) => !bank[aiNorm(w)]);
  if (!todo.length) {
    if (statusEl) {
      statusEl.textContent = "Всё выученное уже в банке: " + Object.keys(bank).length + " слов";
      statusEl.className = "ai-status ok";
    }
    return;
  }

  if (btn) btn.disabled = true;
  const langName = (LANGUAGES[CURRENT_LANG.code] || {}).name || CURRENT_LANG.code;
  const BATCH = 10;
  const batches = [];
  for (let i = 0; i < todo.length; i += BATCH)
    batches.push(todo.slice(i, i + BATCH));

  let addedWords = 0, skipped = 0;
  try {
    for (let b = 0; b < batches.length; b++) {
      if (statusEl) {
        statusEl.textContent = "Батч " + (b + 1) + "/" + batches.length + ": сочиняю фразы…";
        statusEl.className = "ai-status working";
      }
      const raw = await geminiFetch(bankBuildPrompt(batches[b], langName), apiKey);
      const items = parseGeminiJson(raw);

      (Array.isArray(items) ? items : []).forEach((item) => {
        const word = ((item && item.word) || "").trim();
        const sentences = item && Array.isArray(item.sentences) ? item.sentences : [];
        const good = sentences.filter((s) => validSentence(word, s)).slice(0, 3);
        if (!word || !good.length) { skipped++; return; }
        bank[aiNorm(word)] = good;
        addedWords++;
      });
      saveSentenceBank(bank); // после каждого батча — сбой не съест накопленное
    }
    if (statusEl) {
      statusEl.textContent = "✅ Банк: +" + addedWords + " слов" +
        (skipped ? ", отбраковано: " + skipped : "") +
        ". Всего: " + Object.keys(bank).length;
      statusEl.className = "ai-status ok";
    }
  } catch (e) {
    if (statusEl) { statusEl.textContent = "❌ " + e.message; statusEl.className = "ai-status err"; }
  } finally {
    if (btn) btn.disabled = false;
  }
}

function updateBankStatus() {
  const el = document.getElementById("ai-bank-status");
  if (!el) return;
  const bank = loadSentenceBank();
  const learned = getLearnedWords().length;
  el.textContent = "Банк: " + Object.keys(bank).length + " слов · Выучено: " + learned;
  el.className = "ai-status";
}

const aiBankBtn = document.getElementById("ai-bank-btn");
if (aiBankBtn) {
  aiBankBtn.addEventListener("click", buildSentenceBank);
}