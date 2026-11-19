// Sentence templates.
// `{article} {noun}` marks the gap. `{singular|plural}` picks a verb form to match the noun.
// `en` is the English translation: `{noun}` becomes e.g. "the man", `{noun's}` becomes "the man's".
// `tags` lists which kinds of nouns fit (see nouns.js). `reason` explains why this case is used.

const LIVING = ['person', 'animal'];
const THINGS = ['object', 'place'];
const ANY = [...LIVING, ...THINGS];

export const SENTENCES = [
  // Nominativ
  { case: 'nom', text: '{article} {noun} {ist|sind} sehr schön.', en: "{noun} {is|are} very beautiful.", tags: ANY, reason: 'The noun is the subject of the sentence.' },
  { case: 'nom', text: 'Wo {ist|sind} {article} {noun}?', en: "Where {is|are} {noun}?", tags: ANY, reason: 'The noun is the subject (wer/was ist wo?).' },
  { case: 'nom', text: '{article} {noun} {schläft|schlafen} schon.', en: "{noun} {is|are} already asleep.", tags: LIVING, reason: 'The noun is the subject: it does the sleeping.' },
  { case: 'nom', text: '{article} {noun} {kommt|kommen} gleich.', en: "{noun} {is|are} coming soon.", tags: LIVING, reason: 'The noun is the subject: it does the coming.' },
  { case: 'nom', text: 'Hier {liegt|liegen} {article} {noun}.', en: "{noun} {is|are} lying here.", tags: ['object'], reason: 'The noun is the subject, even though it comes after the verb.' },

  // Akkusativ
  { case: 'akk', text: 'Ich sehe {article} {noun}.', en: "I see {noun}.", tags: ANY, reason: '"sehen" takes a direct object.' },
  { case: 'akk', text: 'Ich suche {article} {noun}.', en: "I am looking for {noun}.", tags: ANY, reason: '"suchen" takes a direct object.' },
  { case: 'akk', text: 'Wir kaufen {article} {noun}.', en: "We are buying {noun}.", tags: THINGS, reason: '"kaufen" takes a direct object.' },
  { case: 'akk', text: 'Ich brauche {article} {noun}.', en: "I need {noun}.", tags: THINGS, reason: '"brauchen" takes a direct object.' },
  { case: 'akk', text: 'Ich frage {article} {noun}.', en: "I am asking {noun}.", tags: ['person'], reason: '"fragen" takes a direct object.' },
  { case: 'akk', text: 'Wir besuchen {article} {noun}.', en: "We are visiting {noun}.", tags: ['person'], reason: '"besuchen" takes a direct object.' },
  { case: 'akk', text: 'Das Geschenk ist für {article} {noun}.', en: "The present is for {noun}.", tags: LIVING, reason: '"für" is always followed by Akkusativ.' },
  { case: 'akk', text: 'Er geht ohne {article} {noun} nach Hause.', en: "He goes home without {noun}.", tags: [...LIVING, 'object'], reason: '"ohne" is always followed by Akkusativ.' },

  // Dativ
  { case: 'dat', text: 'Ich helfe {article} {noun}.', en: "I am helping {noun}.", tags: ['person'], reason: '"helfen" always takes Dativ.' },
  { case: 'dat', text: 'Ich danke {article} {noun}.', en: "I thank {noun}.", tags: ['person'], reason: '"danken" always takes Dativ.' },
  { case: 'dat', text: 'Das Buch gehört {article} {noun}.', en: "The book belongs to {noun}.", tags: ['person'], reason: '"gehören" always takes Dativ.' },
  { case: 'dat', text: 'Ich spreche mit {article} {noun}.', en: "I am talking to {noun}.", tags: ['person'], reason: '"mit" is always followed by Dativ.' },
  { case: 'dat', text: 'Er kommt mit {article} {noun} nach Hause.', en: "He comes home with {noun}.", tags: [...LIVING, 'object'], reason: '"mit" is always followed by Dativ.' },
  { case: 'dat', text: 'Ich wohne bei {article} {noun}.', en: "I live with {noun}.", tags: ['person'], reason: '"bei" is always followed by Dativ.' },
  { case: 'dat', text: 'Das ist ein Brief von {article} {noun}.', en: "This is a letter from {noun}.", tags: ['person'], reason: '"von" is always followed by Dativ.' },
  { case: 'dat', text: 'Die Katze sitzt neben {article} {noun}.', en: "The cat is sitting next to {noun}.", tags: ['place'], reason: '"neben" + location (wo?) takes Dativ.' },
  { case: 'dat', text: 'Ich warte vor {article} {noun}.', en: "I am waiting in front of {noun}.", tags: ['place'], reason: '"vor" + location (wo?) takes Dativ.' },

  // Genitiv
  { case: 'gen', text: 'Das ist das Zimmer {article} {noun}.', en: "This is {noun's} room.", tags: ['person'], reason: 'Possession: whose room?' },
  { case: 'gen', text: 'Wo ist die Tasche {article} {noun}?', en: "Where is {noun's} bag?", tags: ['person'], reason: 'Possession: whose bag?' },
  { case: 'gen', text: 'Der Name {article} {noun} ist schön.', en: "{noun's} name is beautiful.", tags: LIVING, reason: 'Possession: whose name?' },
  { case: 'gen', text: 'Die Farbe {article} {noun} gefällt mir.', en: "I like the colour of {noun}.", tags: THINGS, reason: 'Possession: the colour of what?' },
  { case: 'gen', text: 'Wegen {article} {noun} bleiben wir zu Hause.', en: "Because of {noun}, we are staying at home.", tags: LIVING, reason: '"wegen" is followed by Genitiv.' },
];
