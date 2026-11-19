// Sentence templates.
// `{article} {noun}` marks the gap. `{singular|plural}` picks a verb form to match the noun.
// `en` is the English translation: `{noun}` becomes e.g. "the man", `{noun's}` becomes "the man's".
// `pl` is the Polish translation: `{nom}`, `{gen}`, `{dat}`, `{acc}` or `{inst}` is the noun in that Polish case
//   (see nouns-pl.js); Polish has no articles. A slot at the start of a sentence gets a capital letter.
// `why` explains the case: a rule name (worded in the i18n dictionaries) and the word that triggers it.
// `clue` is the word that decides the case, which players can tap to see its meaning:
//   `text` as it appears in the sentence ("helfe", or "ist|sind" when it follows the noun's number),
//   `lemma` its dictionary form, and its meaning in English and Polish.
// `tags` lists which kinds of nouns fit (see nouns.js).

const LIVING = ['person', 'animal'];
const THINGS = ['object', 'place'];
const ANY = [...LIVING, ...THINGS, 'building'];

const SEIN = { text: 'ist|sind', lemma: 'sein', en: 'to be', pl: 'być' };
const MIT = { text: 'mit', lemma: 'mit', en: 'with', pl: 'z' };

export const SENTENCES = [
  // Nominativ
  { id: 'nom-beautiful', case: 'nom', text: '{article} {noun} {ist|sind} sehr schön.', en: '{noun} {is|are} very beautiful.', pl: '{nom} {wygląda|wyglądają} pięknie.', tags: ANY, why: { rule: 'subject' }, clue: SEIN },
  { id: 'nom-where', case: 'nom', text: 'Wo {ist|sind} {article} {noun}?', en: 'Where {is|are} {noun}?', pl: 'Gdzie {jest|są} {nom}?', tags: ANY, why: { rule: 'subject' }, clue: SEIN },
  { id: 'nom-here', case: 'nom', text: 'Hier {ist|sind} {article} {noun}.', en: 'Here {is|are} {noun}.', pl: 'Tutaj {jest|są} {nom}.', tags: ANY, why: { rule: 'subjectAfterVerb' }, clue: SEIN },
  { id: 'nom-this-is', case: 'nom', text: 'Das {ist|sind} {article} {noun}.', en: '{This is|These are} {noun}.', pl: 'To {jest|są} {nom}.', tags: ANY, why: { rule: 'afterSein', word: 'sein' }, clue: SEIN },
  { id: 'nom-asleep', case: 'nom', text: '{article} {noun} {schläft|schlafen} schon.', en: '{noun} {is|are} already asleep.', pl: '{nom} już {śpi|śpią}.', tags: LIVING, why: { rule: 'subject' }, clue: { text: 'schläft|schlafen', lemma: 'schlafen', en: 'to sleep', pl: 'spać' } },
  { id: 'nom-coming', case: 'nom', text: '{article} {noun} {kommt|kommen} gleich.', en: '{noun} {is|are} coming soon.', pl: '{nom} zaraz {przyjdzie|przyjdą}.', tags: LIVING, why: { rule: 'subject' }, clue: { text: 'kommt|kommen', lemma: 'kommen', en: 'to come', pl: 'przychodzić' } },
  { id: 'nom-laughs', case: 'nom', text: '{article} {noun} {lacht|lachen} laut.', en: '{noun} {is|are} laughing loudly.', pl: '{nom} głośno się {śmieje|śmieją}.', tags: ['person'], why: { rule: 'subject' }, clue: { text: 'lacht|lachen', lemma: 'lachen', en: 'to laugh', pl: 'śmiać się' } },
  { id: 'nom-eats', case: 'nom', text: '{article} {noun} {frisst|fressen} gern.', en: '{noun} {likes|like} eating.', pl: '{nom} {lubi|lubią} jeść.', tags: ['animal'], why: { rule: 'subject' }, clue: { text: 'frisst|fressen', lemma: 'fressen', en: 'to eat (animals)', pl: 'jeść (o zwierzętach)' } },
  { id: 'nom-lying', case: 'nom', text: 'Hier {liegt|liegen} {article} {noun}.', en: '{noun} {is|are} lying here.', pl: 'Tutaj {leży|leżą} {nom}.', tags: ['object'], why: { rule: 'subjectAfterVerb' }, clue: { text: 'liegt|liegen', lemma: 'liegen', en: 'to lie (be lying)', pl: 'leżeć' } },
  { id: 'nom-stands', case: 'nom', text: 'Dort {steht|stehen} {article} {noun}.', en: '{noun} {is|are} over there.', pl: 'Tam {stoi|stoją} {nom}.', tags: ['place'], why: { rule: 'subjectAfterVerb' }, clue: { text: 'steht|stehen', lemma: 'stehen', en: 'to stand', pl: 'stać' } },

  // Akkusativ
  { id: 'akk-see', case: 'akk', text: 'Ich sehe {article} {noun}.', en: 'I see {noun}.', pl: 'Widzę {acc}.', tags: ANY, why: { rule: 'verbAkk', word: 'sehen' }, clue: { text: 'sehe', lemma: 'sehen', en: 'to see', pl: 'widzieć' } },
  { id: 'akk-look-for', case: 'akk', text: 'Ich suche {article} {noun}.', en: 'I am looking for {noun}.', pl: 'Szukam {gen}.', tags: ANY, why: { rule: 'verbAkk', word: 'suchen' }, clue: { text: 'suche', lemma: 'suchen', en: 'to look for', pl: 'szukać' } },
  { id: 'akk-buy', case: 'akk', text: 'Wir kaufen {article} {noun}.', en: 'We are buying {noun}.', pl: 'Kupujemy {acc}.', tags: THINGS, why: { rule: 'verbAkk', word: 'kaufen' }, clue: { text: 'kaufen', lemma: 'kaufen', en: 'to buy', pl: 'kupować' } },
  { id: 'akk-need', case: 'akk', text: 'Ich brauche {article} {noun}.', en: 'I need {noun}.', pl: 'Potrzebuję {gen}.', tags: THINGS, why: { rule: 'verbAkk', word: 'brauchen' }, clue: { text: 'brauche', lemma: 'brauchen', en: 'to need', pl: 'potrzebować' } },
  { id: 'akk-take', case: 'akk', text: 'Ich nehme {article} {noun}.', en: 'I am taking {noun}.', pl: 'Biorę {acc}.', tags: ['object'], why: { rule: 'verbAkk', word: 'nehmen' }, clue: { text: 'nehme', lemma: 'nehmen', en: 'to take', pl: 'brać' } },
  { id: 'akk-cant-find', case: 'akk', text: 'Ich finde {article} {noun} nicht.', en: "I can't find {noun}.", pl: 'Nie mogę znaleźć {gen}.', tags: ['object'], why: { rule: 'verbAkk', word: 'finden' }, clue: { text: 'finde', lemma: 'finden', en: 'to find', pl: 'znaleźć' } },
  { id: 'akk-have', case: 'akk', text: 'Ich habe {article} {noun}.', en: 'I have {noun}.', pl: 'Mam {acc}.', tags: [...LIVING, 'object'], why: { rule: 'verbAkk', word: 'haben' }, clue: { text: 'habe', lemma: 'haben', en: 'to have', pl: 'mieć' } },
  { id: 'akk-ask', case: 'akk', text: 'Ich frage {article} {noun}.', en: 'I am asking {noun}.', pl: 'Pytam {acc}.', tags: ['person'], why: { rule: 'verbAkk', word: 'fragen' }, clue: { text: 'frage', lemma: 'fragen', en: 'to ask', pl: 'pytać' } },
  { id: 'akk-visit', case: 'akk', text: 'Wir besuchen {article} {noun}.', en: 'We are visiting {noun}.', pl: 'Odwiedzamy {acc}.', tags: ['person'], why: { rule: 'verbAkk', word: 'besuchen' }, clue: { text: 'besuchen', lemma: 'besuchen', en: 'to visit', pl: 'odwiedzać' } },
  { id: 'akk-love', case: 'akk', text: 'Wir lieben {article} {noun}.', en: 'We love {noun}.', pl: 'Kochamy {acc}.', tags: LIVING, why: { rule: 'verbAkk', word: 'lieben' }, clue: { text: 'lieben', lemma: 'lieben', en: 'to love', pl: 'kochać' } },
  { id: 'akk-call', case: 'akk', text: 'Ich rufe {article} {noun} an.', en: 'I am calling {noun}.', pl: 'Dzwonię do {gen}.', tags: ['person'], why: { rule: 'verbAkk', word: 'anrufen' }, clue: { text: 'rufe', lemma: 'anrufen', en: 'to call (on the phone)', pl: 'dzwonić do' } },
  { id: 'akk-for', case: 'akk', text: 'Das Geschenk ist für {article} {noun}.', en: 'The present is for {noun}.', pl: 'Prezent jest dla {gen}.', tags: LIVING, why: { rule: 'prepAkk', word: 'für' }, clue: { text: 'für', lemma: 'für', en: 'for', pl: 'dla' } },
  { id: 'akk-without', case: 'akk', text: 'Er geht ohne {article} {noun} nach Hause.', en: 'He goes home without {noun}.', pl: 'Idzie do domu bez {gen}.', tags: [...LIVING, 'object'], why: { rule: 'prepAkk', word: 'ohne' }, clue: { text: 'ohne', lemma: 'ohne', en: 'without', pl: 'bez' } },
  { id: 'akk-against', case: 'akk', text: 'Wir spielen gegen {article} {noun}.', en: 'We are playing against {noun}.', pl: 'Gramy przeciwko {dat}.', tags: ['person'], why: { rule: 'prepAkk', word: 'gegen' }, clue: { text: 'gegen', lemma: 'gegen', en: 'against', pl: 'przeciwko' } },
  { id: 'akk-wait-for', case: 'akk', text: 'Ich warte auf {article} {noun}.', en: 'I am waiting for {noun}.', pl: 'Czekam na {acc}.', tags: ['person'], why: { rule: 'prepAkk', word: 'warten auf' }, clue: { text: 'warte', lemma: 'warten auf', en: 'to wait for', pl: 'czekać na' } },
  { id: 'akk-through', case: 'akk', text: 'Wir gehen durch {article} {noun}.', en: 'We are walking through {noun}.', pl: 'Idziemy przez {acc}.', tags: ['building'], why: { rule: 'prepAkk', word: 'durch' }, clue: { text: 'durch', lemma: 'durch', en: 'through', pl: 'przez' } },
  { id: 'akk-into', case: 'akk', text: 'Wir gehen in {article} {noun}.', en: 'We are going into {noun}.', pl: 'Idziemy do {gen}.', tags: ['building'], why: { rule: 'twoWayAkk', word: 'in' }, clue: { text: 'in', lemma: 'in', en: 'into, in', pl: 'do, w' } },

  // Dativ
  { id: 'dat-help', case: 'dat', text: 'Ich helfe {article} {noun}.', en: 'I am helping {noun}.', pl: 'Pomagam {dat}.', tags: ['person'], why: { rule: 'verbDat', word: 'helfen' }, clue: { text: 'helfe', lemma: 'helfen', en: 'to help', pl: 'pomagać' } },
  { id: 'dat-thank', case: 'dat', text: 'Ich danke {article} {noun}.', en: 'I thank {noun}.', pl: 'Dziękuję {dat}.', tags: ['person'], why: { rule: 'verbDat', word: 'danken' }, clue: { text: 'danke', lemma: 'danken', en: 'to thank', pl: 'dziękować' } },
  { id: 'dat-answer', case: 'dat', text: 'Ich antworte {article} {noun}.', en: 'I am answering {noun}.', pl: 'Odpowiadam {dat}.', tags: ['person'], why: { rule: 'verbDat', word: 'antworten' }, clue: { text: 'antworte', lemma: 'antworten', en: 'to answer', pl: 'odpowiadać' } },
  { id: 'dat-belongs', case: 'dat', text: 'Das Buch gehört {article} {noun}.', en: 'The book belongs to {noun}.', pl: 'Książka należy do {gen}.', tags: ['person'], why: { rule: 'verbDat', word: 'gehören' }, clue: { text: 'gehört', lemma: 'gehören', en: 'to belong to', pl: 'należeć do' } },
  { id: 'dat-likes', case: 'dat', text: 'Das Haus gefällt {article} {noun}.', en: '{noun} {likes|like} the house.', pl: '{dat} podoba się dom.', tags: ['person'], why: { rule: 'verbDat', word: 'gefallen' }, clue: { text: 'gefällt', lemma: 'gefallen', en: 'to please (to be liked)', pl: 'podobać się' } },
  { id: 'dat-give', case: 'dat', text: 'Ich gebe {article} {noun} das Buch.', en: 'I am giving {noun} the book.', pl: 'Daję {dat} książkę.', tags: ['person'], why: { rule: 'receiverDat', word: 'geben' }, clue: { text: 'gebe', lemma: 'geben', en: 'to give', pl: 'dawać' } },
  { id: 'dat-show', case: 'dat', text: 'Ich zeige {article} {noun} die Stadt.', en: 'I am showing {noun} the town.', pl: 'Pokazuję {dat} miasto.', tags: ['person'], why: { rule: 'receiverDat', word: 'zeigen' }, clue: { text: 'zeige', lemma: 'zeigen', en: 'to show', pl: 'pokazywać' } },
  { id: 'dat-talk-with', case: 'dat', text: 'Ich spreche mit {article} {noun}.', en: 'I am talking to {noun}.', pl: 'Rozmawiam z {inst}.', tags: ['person'], why: { rule: 'prepDat', word: 'mit' }, clue: MIT },
  { id: 'dat-home-with', case: 'dat', text: 'Er kommt mit {article} {noun} nach Hause.', en: 'He comes home with {noun}.', pl: 'Wraca do domu z {inst}.', tags: [...LIVING, 'object'], why: { rule: 'prepDat', word: 'mit' }, clue: MIT },
  { id: 'dat-live-at', case: 'dat', text: 'Ich wohne bei {article} {noun}.', en: 'I live with {noun}.', pl: 'Mieszkam u {gen}.', tags: ['person'], why: { rule: 'prepDat', word: 'bei' }, clue: { text: 'bei', lemma: 'bei', en: "at (someone's place)", pl: 'u' } },
  { id: 'dat-letter-from', case: 'dat', text: 'Das ist ein Brief von {article} {noun}.', en: 'This is a letter from {noun}.', pl: 'To jest list od {gen}.', tags: ['person'], why: { rule: 'prepDat', word: 'von' }, clue: { text: 'von', lemma: 'von', en: 'from', pl: 'od' } },
  { id: 'dat-out-of', case: 'dat', text: 'Ich komme aus {article} {noun}.', en: 'I am coming out of {noun}.', pl: 'Wychodzę z {gen}.', tags: ['building'], why: { rule: 'prepDat', word: 'aus' }, clue: { text: 'aus', lemma: 'aus', en: 'out of, from', pl: 'z' } },
  { id: 'dat-next-to', case: 'dat', text: 'Die Katze sitzt neben {article} {noun}.', en: 'The cat is sitting next to {noun}.', pl: 'Kot siedzi obok {gen}.', tags: ['place', 'building'], why: { rule: 'twoWayDat', word: 'neben' }, clue: { text: 'neben', lemma: 'neben', en: 'next to', pl: 'obok' } },
  { id: 'dat-in-front-of', case: 'dat', text: 'Ich warte vor {article} {noun}.', en: 'I am waiting in front of {noun}.', pl: 'Czekam przed {inst}.', tags: ['place', 'building'], why: { rule: 'twoWayDat', word: 'vor' }, clue: { text: 'vor', lemma: 'vor', en: 'in front of', pl: 'przed' } },
  { id: 'dat-behind', case: 'dat', text: 'Das Fahrrad steht hinter {article} {noun}.', en: 'The bike is behind {noun}.', pl: 'Rower stoi za {inst}.', tags: ['place', 'building'], why: { rule: 'twoWayDat', word: 'hinter' }, clue: { text: 'hinter', lemma: 'hinter', en: 'behind', pl: 'za' } },
  { id: 'dat-under', case: 'dat', text: 'Die Katze schläft unter {article} {noun}.', en: 'The cat is sleeping under {noun}.', pl: 'Kot śpi pod {inst}.', tags: ['place'], why: { rule: 'twoWayDat', word: 'unter' }, clue: { text: 'unter', lemma: 'unter', en: 'under', pl: 'pod' } },

  // Genitiv
  { id: 'gen-room', case: 'gen', text: 'Das ist das Zimmer {article} {noun}.', en: "This is {noun's} room.", pl: 'To jest pokój {gen}.', tags: ['person'], why: { rule: 'possession' }, clue: { text: 'Zimmer', lemma: 'das Zimmer', en: 'room', pl: 'pokój' } },
  { id: 'gen-house', case: 'gen', text: 'Das ist das Haus {article} {noun}.', en: "This is {noun's} house.", pl: 'To jest dom {gen}.', tags: ['person'], why: { rule: 'possession' }, clue: { text: 'Haus', lemma: 'das Haus', en: 'house', pl: 'dom' } },
  { id: 'gen-bag', case: 'gen', text: 'Wo ist die Tasche {article} {noun}?', en: "Where is {noun's} bag?", pl: 'Gdzie jest torba {gen}?', tags: ['person'], why: { rule: 'possession' }, clue: { text: 'Tasche', lemma: 'die Tasche', en: 'bag', pl: 'torba' } },
  { id: 'gen-name', case: 'gen', text: 'Der Name {article} {noun} ist schön.', en: "{noun's} name is beautiful.", pl: 'Imię {gen} jest ładne.', tags: LIVING, why: { rule: 'possession' }, clue: { text: 'Name', lemma: 'der Name', en: 'name', pl: 'imię' } },
  { id: 'gen-owner', case: 'gen', text: 'Der Besitzer {article} {noun} ist nett.', en: 'The owner of {noun} is nice.', pl: 'Właściciel {gen} jest miły.', tags: ['animal', 'object', 'place'], why: { rule: 'possession' }, clue: { text: 'Besitzer', lemma: 'der Besitzer', en: 'owner', pl: 'właściciel' } },
  { id: 'gen-colour', case: 'gen', text: 'Die Farbe {article} {noun} gefällt mir.', en: 'I like the colour of {noun}.', pl: 'Podoba mi się kolor {gen}.', tags: [...THINGS, 'building'], why: { rule: 'possession' }, clue: { text: 'Farbe', lemma: 'die Farbe', en: 'colour', pl: 'kolor' } },
  { id: 'gen-place-name', case: 'gen', text: 'Der Name {article} {noun} ist lang.', en: 'The name of {noun} is long.', pl: 'Nazwa {gen} jest długa.', tags: ['building'], why: { rule: 'possession' }, clue: { text: 'Name', lemma: 'der Name', en: 'name', pl: 'nazwa' } },
  { id: 'gen-because-of', case: 'gen', text: 'Wegen {article} {noun} bleiben wir zu Hause.', en: 'Because of {noun}, we are staying at home.', pl: 'Z powodu {gen} zostajemy w domu.', tags: LIVING, why: { rule: 'prepGen', word: 'wegen' }, clue: { text: 'Wegen', lemma: 'wegen', en: 'because of', pl: 'z powodu' } },
];

export const SENTENCES_BY_ID = Object.fromEntries(SENTENCES.map((sentence) => [sentence.id, sentence]));
