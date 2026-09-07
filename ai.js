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