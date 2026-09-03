const LANG_ES = {
  code: 'es',
  name: 'Español',
  cards: [
    {topic:"food",word:"manzana",transcription:"[maˈθana]",translation:"яблоко",example:"La manzana es roja.",exampleTranslation:"Яблоко красное."},
    {topic:"food",word:"pan",transcription:"[pan]",translation:"хлеб",example:"Compro pan fresco.",exampleTranslation:"Я покупаю свежий хлеб."},
    {topic:"home",word:"casa",transcription:"[ˈkasa]",translation:"дом",example:"La casa es grande.",exampleTranslation:"Дом большой."}
  ],
  verbs: {
    hablar: { base:"hablo", past:"hablé", participle:"hablado", ing:"hablando", regular:true, thirdSingular:"habla" },
    comer:  { base:"como", past:"comí", participle:"comido", ing:"comiendo", regular:true, thirdSingular:"come" },
    vivir:  { base:"vivo", past:"viví", participle:"vivido", ing:"viviendo", regular:true, thirdSingular:"vive" }
  },
  pronouns: [
    { key:"yo",         label:"Yo" },
    { key:"tu",         label:"Tú" },
    { key:"el-ella",    label:"Él / Ella" },
    { key:"nosotros",   label:"Nosotros" },
    { key:"ellos",      label:"Ellos" }
  ],
  tenses: [
    { key:"ps",  label:"Presente Simple" },
    { key:"pas", label:"Pasado Simple" },
    { key:"fs",  label:"Futuro Simple" },
    { key:"pc",  label:"Presente Continuo" },
    { key:"pp",  label:"Pretérito Perfecto" }
  ]
};