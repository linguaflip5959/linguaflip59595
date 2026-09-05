const LANG_ES = {
  code: 'es',
  name: 'Español',
  cards: [
    {topic:"food",word:"manzana",transcription:"[maˈθana]",translation:"яблоко",example:"La manzana es roja.",exampleTranslation:"Яблоко красное."},
    {topic:"food",word:"pan",transcription:"[pan]",translation:"хлеб",example:"Compro pan fresco.",exampleTranslation:"Я покупаю свежий хлеб."},
    {topic:"home",word:"casa",transcription:"[ˈkasa]",translation:"дом",example:"La casa es grande.",exampleTranslation:"Дом большой."}
  ],
  hideVosotros: false, // true — скрыть строку Vosotros (латиноамериканский вариант)

  pronouns: [
    { key: "yo",       label: "Yo" },
    { key: "tu",       label: "Tú" },
    { key: "el",       label: "Él/Ella" },
    { key: "nosotros", label: "Nosotros" },
    { key: "vosotros", label: "Vosotros" },
    { key: "ellos",    label: "Ellos" }
  ],

  tenses: [
    { key: "presente",   label: "Presente" },
    { key: "indefinido", label: "Pretérito Indefinido" },   // ← переименовали
    { key: "futuro",     label: "Futuro Simple" },
    { key: "continuo",   label: "Presente Continuo" },
    { key: "perfecto",   label: "Pretérito Perfecto" },
    { key: "ir_a",       label: "Ir a + infinitivo" }
  ],

  verbs: {
    // === ПРАВИЛЬНЫЕ: достаточно флага (для чипа «прав./неправ.») ===
    // Порядок важен: первый глагол открывается по умолчанию
    hablar:   { regular: true },
    comer:    { regular: true },
    vivir:    { regular: true },
    trabajar: { regular: true },
    aprender: { regular: true },
    escribir: { regular: true },

    // === НЕПРАВИЛЬНЫЕ: храняем только отклонения от правил ===
    // Присутствует массив времени → берём его; нет → генерим окончаниями
    ser: {
      presente:  ["soy","eres","es","somos","sois","son"],
      indefinido:["fui","fuiste","fue","fuimos","fuisteis","fueron"],
      participle: "sido", gerund: "siendo"
      // futuro регулярный → seré, serás... — сгенерится
    },
    estar: {
      presente:  ["estoy","estás","está","estamos","estáis","están"],
      indefinido:["estuve","estuviste","estuvo","estuvimos","estuvisteis","estuvieron"],
      participle: "estado", gerund: "estando"
    },
    haber: {
      presente:  ["he","has","ha","hemos","habéis","han"],
      indefinido:["hube","hubiste","hubo","hubimos","hubisteis","hubieron"],
      participle: "habido"
    },
    ir: {
      presente:  ["voy","vas","va","vamos","vais","van"],
      indefinido:["fui","fuiste","fue","fuimos","fuisteis","fueron"],
      participle: "ido", gerund: "yendo"
    },
    tener: {
      presente:  ["tengo","tienes","tiene","tenemos","tenéis","tienen"],
      indefinido:["tuve","tuviste","tuvo","tuvimos","tuvisteis","tuvieron"],
      futuro:    ["tendré","tendrás","tendrá","tendremos","tendréis","tendrán"],
      participle: "tenido", gerund: "teniendo"
    },
    hacer: {
      presente:  ["hago","haces","hace","hacemos","hacéis","hacen"],
      indefinido:["hice","hiciste","hizo","hicimos","hicisteis","hicieron"],
      futuro:    ["haré","harás","hará","haremos","haréis","harán"],
      participle: "hecho", gerund: "haciendo"
    },
    venir: {
      presente:  ["vengo","vienes","viene","venimos","venís","vienen"],
      indefinido:["vine","viniste","vino","vinimos","vinisteis","vinieron"],
      futuro:    ["vendré","vendrás","vendrá","vendremos","vendréis","vendrán"],
      participle: "venido", gerund: "viniendo"
    }
    // новые неправильные добавляются по тому же шаблону;
    // для дифтонгов в герундии (dormir→durmiendo) просто
    // пишешь gerund: "durmiendo" вручную
  }
};