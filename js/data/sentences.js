// Sentence templates.
// `{article} {noun}` marks the gap. `{singular|plural}` picks a verb form to match the noun.
// `en` is the English translation: `{noun}` becomes e.g. "the man", `{noun's}` becomes "the man's".
// `pl` is the Polish translation: `{nom}`, `{gen}`, `{dat}`, `{acc}` or `{inst}` is the noun in that Polish case
//   (see nouns-pl.js); Polish has no articles. A slot at the start of a sentence gets a capital letter.
// `why` explains the case: a rule name (worded in the i18n dictionaries) and the word that triggers it.
// `tags` lists which kinds of nouns fit (see nouns.js).

const LIVING = ['person', 'animal'];
const THINGS = ['object', 'place'];
const ANY = [...LIVING, ...THINGS];

export const SENTENCES = [
  // Nominativ
  { id: 'nom-beautiful', case: 'nom', text: '{article} {noun} {ist|sind} sehr schön.', en: '{noun} {is|are} very beautiful.', pl: '{nom} {wygląda|wyglądają} pięknie.', tags: ANY, why: { rule: 'subject' } },
  { id: 'nom-where', case: 'nom', text: 'Wo {ist|sind} {article} {noun}?', en: 'Where {is|are} {noun}?', pl: 'Gdzie {jest|są} {nom}?', tags: ANY, why: { rule: 'subject' } },
  { id: 'nom-asleep', case: 'nom', text: '{article} {noun} {schläft|schlafen} schon.', en: '{noun} {is|are} already asleep.', pl: '{nom} już {śpi|śpią}.', tags: LIVING, why: { rule: 'subject' } },
  { id: 'nom-coming', case: 'nom', text: '{article} {noun} {kommt|kommen} gleich.', en: '{noun} {is|are} coming soon.', pl: '{nom} zaraz {przyjdzie|przyjdą}.', tags: LIVING, why: { rule: 'subject' } },
  { id: 'nom-lying', case: 'nom', text: 'Hier {liegt|liegen} {article} {noun}.', en: '{noun} {is|are} lying here.', pl: 'Tutaj {leży|leżą} {nom}.', tags: ['object'], why: { rule: 'subjectAfterVerb' } },

  // Akkusativ
  { id: 'akk-see', case: 'akk', text: 'Ich sehe {article} {noun}.', en: 'I see {noun}.', pl: 'Widzę {acc}.', tags: ANY, why: { rule: 'verbAkk', word: 'sehen' } },
  { id: 'akk-look-for', case: 'akk', text: 'Ich suche {article} {noun}.', en: 'I am looking for {noun}.', pl: 'Szukam {gen}.', tags: ANY, why: { rule: 'verbAkk', word: 'suchen' } },
  { id: 'akk-buy', case: 'akk', text: 'Wir kaufen {article} {noun}.', en: 'We are buying {noun}.', pl: 'Kupujemy {acc}.', tags: THINGS, why: { rule: 'verbAkk', word: 'kaufen' } },
  { id: 'akk-need', case: 'akk', text: 'Ich brauche {article} {noun}.', en: 'I need {noun}.', pl: 'Potrzebuję {gen}.', tags: THINGS, why: { rule: 'verbAkk', word: 'brauchen' } },
  { id: 'akk-ask', case: 'akk', text: 'Ich frage {article} {noun}.', en: 'I am asking {noun}.', pl: 'Pytam {acc}.', tags: ['person'], why: { rule: 'verbAkk', word: 'fragen' } },
  { id: 'akk-visit', case: 'akk', text: 'Wir besuchen {article} {noun}.', en: 'We are visiting {noun}.', pl: 'Odwiedzamy {acc}.', tags: ['person'], why: { rule: 'verbAkk', word: 'besuchen' } },
  { id: 'akk-for', case: 'akk', text: 'Das Geschenk ist für {article} {noun}.', en: 'The present is for {noun}.', pl: 'Prezent jest dla {gen}.', tags: LIVING, why: { rule: 'prepAkk', word: 'für' } },
  { id: 'akk-without', case: 'akk', text: 'Er geht ohne {article} {noun} nach Hause.', en: 'He goes home without {noun}.', pl: 'Idzie do domu bez {gen}.', tags: [...LIVING, 'object'], why: { rule: 'prepAkk', word: 'ohne' } },

  // Dativ
  { id: 'dat-help', case: 'dat', text: 'Ich helfe {article} {noun}.', en: 'I am helping {noun}.', pl: 'Pomagam {dat}.', tags: ['person'], why: { rule: 'verbDat', word: 'helfen' } },
  { id: 'dat-thank', case: 'dat', text: 'Ich danke {article} {noun}.', en: 'I thank {noun}.', pl: 'Dziękuję {dat}.', tags: ['person'], why: { rule: 'verbDat', word: 'danken' } },
  { id: 'dat-belongs', case: 'dat', text: 'Das Buch gehört {article} {noun}.', en: 'The book belongs to {noun}.', pl: 'Książka należy do {gen}.', tags: ['person'], why: { rule: 'verbDat', word: 'gehören' } },
  { id: 'dat-talk-with', case: 'dat', text: 'Ich spreche mit {article} {noun}.', en: 'I am talking to {noun}.', pl: 'Rozmawiam z {inst}.', tags: ['person'], why: { rule: 'prepDat', word: 'mit' } },
  { id: 'dat-home-with', case: 'dat', text: 'Er kommt mit {article} {noun} nach Hause.', en: 'He comes home with {noun}.', pl: 'Wraca do domu z {inst}.', tags: [...LIVING, 'object'], why: { rule: 'prepDat', word: 'mit' } },
  { id: 'dat-live-at', case: 'dat', text: 'Ich wohne bei {article} {noun}.', en: 'I live with {noun}.', pl: 'Mieszkam u {gen}.', tags: ['person'], why: { rule: 'prepDat', word: 'bei' } },
  { id: 'dat-letter-from', case: 'dat', text: 'Das ist ein Brief von {article} {noun}.', en: 'This is a letter from {noun}.', pl: 'To jest list od {gen}.', tags: ['person'], why: { rule: 'prepDat', word: 'von' } },
  { id: 'dat-next-to', case: 'dat', text: 'Die Katze sitzt neben {article} {noun}.', en: 'The cat is sitting next to {noun}.', pl: 'Kot siedzi obok {gen}.', tags: ['place'], why: { rule: 'twoWayDat', word: 'neben' } },
  { id: 'dat-in-front-of', case: 'dat', text: 'Ich warte vor {article} {noun}.', en: 'I am waiting in front of {noun}.', pl: 'Czekam przed {inst}.', tags: ['place'], why: { rule: 'twoWayDat', word: 'vor' } },

  // Genitiv
  { id: 'gen-room', case: 'gen', text: 'Das ist das Zimmer {article} {noun}.', en: "This is {noun's} room.", pl: 'To jest pokój {gen}.', tags: ['person'], why: { rule: 'possession' } },
  { id: 'gen-bag', case: 'gen', text: 'Wo ist die Tasche {article} {noun}?', en: "Where is {noun's} bag?", pl: 'Gdzie jest torba {gen}?', tags: ['person'], why: { rule: 'possession' } },
  { id: 'gen-name', case: 'gen', text: 'Der Name {article} {noun} ist schön.', en: "{noun's} name is beautiful.", pl: 'Imię {gen} jest ładne.', tags: LIVING, why: { rule: 'possession' } },
  { id: 'gen-colour', case: 'gen', text: 'Die Farbe {article} {noun} gefällt mir.', en: 'I like the colour of {noun}.', pl: 'Podoba mi się kolor {gen}.', tags: THINGS, why: { rule: 'possession' } },
  { id: 'gen-because-of', case: 'gen', text: 'Wegen {article} {noun} bleiben wir zu Hause.', en: 'Because of {noun}, we are staying at home.', pl: 'Z powodu {gen} zostajemy w domu.', tags: LIVING, why: { rule: 'prepGen', word: 'wegen' } },
];

export const SENTENCES_BY_ID = Object.fromEntries(SENTENCES.map((sentence) => [sentence.id, sentence]));
