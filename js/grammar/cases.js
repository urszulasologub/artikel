// Short tutorial content for each grammatical case. Question words live in articles.js (CASE_QUESTIONS).

export const CASE_GUIDE = {
  nom: {
    questionEn: 'who? what?',
    use: 'The subject: the person or thing doing the action. Also after "sein" (to be).',
    triggers: ['Subject of the sentence', 'after sein, werden, bleiben'],
    examples: ['Der Mann liest.', 'Das ist ein Hund.'],
    tip: 'This is the form you learn in the dictionary.',
  },
  akk: {
    questionEn: 'whom? what?',
    use: 'The direct object: the person or thing that receives the action.',
    triggers: [
      'Verbs: haben, sehen, kaufen, brauchen, suchen, lieben, fragen, besuchen',
      'Prepositions: durch, für, gegen, ohne, um',
      'Two-way prepositions (in, an, auf…) when there is movement: wohin?',
    ],
    examples: ['Ich sehe den Mann.', 'Das Geschenk ist für einen Freund.'],
    tip: 'Only masculine changes: der → den, ein → einen.',
  },
  dat: {
    questionEn: 'to whom? for whom?',
    use: 'The indirect object: who gets or receives something. Also after some verbs and prepositions.',
    triggers: [
      'Verbs: helfen, danken, gehören, gefallen, antworten',
      'Prepositions: aus, bei, mit, nach, seit, von, zu',
      'Two-way prepositions (in, an, auf, neben, vor, unter…) for a location: wo?',
    ],
    examples: ['Ich helfe dem Kind.', 'Ich spreche mit einer Frau.'],
    tip: 'Plural nouns get -n: den Kindern (unless they already end in -n or -s).',
  },
  gen: {
    questionEn: 'whose?',
    use: 'Possession: whose something is. Also after some prepositions.',
    triggers: ['Possession: das Auto des Mannes', 'Prepositions: wegen, trotz, während, statt'],
    examples: ['Das ist das Auto des Mannes.', 'Wegen des Wetters bleiben wir zu Hause.'],
    tip: 'Masculine and neuter nouns get -s or -es: des Mannes, des Kindes.',
  },
};
