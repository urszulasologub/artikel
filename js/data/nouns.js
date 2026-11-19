// Noun list. `genitive` is the singular Genitiv form (only used for m/n).
// `en` is shown as a hint; its first meaning (without notes in brackets) is used in translations.
// Tags decide which sentences a noun fits into:
//   person, animal, object (small things you can hold), place (furniture, buildings, vehicles).

export const NOUNS = [
  // People
  { word: 'Mann', gender: 'm', plural: 'Männer', genitive: 'Mannes', en: 'man', enPlural: 'men', tags: ['person'] },
  { word: 'Frau', gender: 'f', plural: 'Frauen', genitive: 'Frau', en: 'woman', enPlural: 'women', tags: ['person'] },
  { word: 'Kind', gender: 'n', plural: 'Kinder', genitive: 'Kindes', en: 'child', enPlural: 'children', tags: ['person'] },
  { word: 'Lehrer', gender: 'm', plural: 'Lehrer', genitive: 'Lehrers', en: 'teacher (m)', enPlural: 'teachers', tags: ['person'] },
  { word: 'Lehrerin', gender: 'f', plural: 'Lehrerinnen', genitive: 'Lehrerin', en: 'teacher (f)', enPlural: 'teachers', tags: ['person'] },
  { word: 'Vater', gender: 'm', plural: 'Väter', genitive: 'Vaters', en: 'father', enPlural: 'fathers', tags: ['person'] },
  { word: 'Mutter', gender: 'f', plural: 'Mütter', genitive: 'Mutter', en: 'mother', enPlural: 'mothers', tags: ['person'] },
  { word: 'Bruder', gender: 'm', plural: 'Brüder', genitive: 'Bruders', en: 'brother', enPlural: 'brothers', tags: ['person'] },
  { word: 'Schwester', gender: 'f', plural: 'Schwestern', genitive: 'Schwester', en: 'sister', enPlural: 'sisters', tags: ['person'] },
  { word: 'Freund', gender: 'm', plural: 'Freunde', genitive: 'Freundes', en: 'friend (m)', enPlural: 'friends', tags: ['person'] },
  { word: 'Freundin', gender: 'f', plural: 'Freundinnen', genitive: 'Freundin', en: 'friend (f)', enPlural: 'friends', tags: ['person'] },
  { word: 'Mädchen', gender: 'n', plural: 'Mädchen', genitive: 'Mädchens', en: 'girl', enPlural: 'girls', tags: ['person'] },
  { word: 'Arzt', gender: 'm', plural: 'Ärzte', genitive: 'Arztes', en: 'doctor', enPlural: 'doctors', tags: ['person'] },
  { word: 'Baby', gender: 'n', plural: 'Babys', genitive: 'Babys', en: 'baby', enPlural: 'babies', tags: ['person'] },

  // Animals
  { word: 'Hund', gender: 'm', plural: 'Hunde', genitive: 'Hundes', en: 'dog', enPlural: 'dogs', tags: ['animal'] },
  { word: 'Katze', gender: 'f', plural: 'Katzen', genitive: 'Katze', en: 'cat', enPlural: 'cats', tags: ['animal'] },
  { word: 'Pferd', gender: 'n', plural: 'Pferde', genitive: 'Pferdes', en: 'horse', enPlural: 'horses', tags: ['animal'] },
  { word: 'Vogel', gender: 'm', plural: 'Vögel', genitive: 'Vogels', en: 'bird', enPlural: 'birds', tags: ['animal'] },

  // Objects
  { word: 'Buch', gender: 'n', plural: 'Bücher', genitive: 'Buches', en: 'book', enPlural: 'books', tags: ['object'] },
  { word: 'Apfel', gender: 'm', plural: 'Äpfel', genitive: 'Apfels', en: 'apple', enPlural: 'apples', tags: ['object'] },
  { word: 'Tasche', gender: 'f', plural: 'Taschen', genitive: 'Tasche', en: 'bag', enPlural: 'bags', tags: ['object'] },
  { word: 'Zeitung', gender: 'f', plural: 'Zeitungen', genitive: 'Zeitung', en: 'newspaper', enPlural: 'newspapers', tags: ['object'] },
  { word: 'Schlüssel', gender: 'm', plural: 'Schlüssel', genitive: 'Schlüssels', en: 'key', enPlural: 'keys', tags: ['object'] },
  { word: 'Handy', gender: 'n', plural: 'Handys', genitive: 'Handys', en: 'mobile phone', enPlural: 'mobile phones', tags: ['object'] },
  { word: 'Blume', gender: 'f', plural: 'Blumen', genitive: 'Blume', en: 'flower', enPlural: 'flowers', tags: ['object'] },
  { word: 'Brief', gender: 'm', plural: 'Briefe', genitive: 'Briefes', en: 'letter', enPlural: 'letters', tags: ['object'] },
  { word: 'Kuchen', gender: 'm', plural: 'Kuchen', genitive: 'Kuchens', en: 'cake', enPlural: 'cakes', tags: ['object'] },
  { word: 'Flasche', gender: 'f', plural: 'Flaschen', genitive: 'Flasche', en: 'bottle', enPlural: 'bottles', tags: ['object'] },
  { word: 'Uhr', gender: 'f', plural: 'Uhren', genitive: 'Uhr', en: 'clock, watch', enPlural: 'clocks', tags: ['object'] },
  { word: 'Kleid', gender: 'n', plural: 'Kleider', genitive: 'Kleides', en: 'dress', enPlural: 'dresses', tags: ['object'] },
  { word: 'Computer', gender: 'm', plural: 'Computer', genitive: 'Computers', en: 'computer', enPlural: 'computers', tags: ['object'] },
  { word: 'Lampe', gender: 'f', plural: 'Lampen', genitive: 'Lampe', en: 'lamp', enPlural: 'lamps', tags: ['object'] },

  // Places
  { word: 'Tisch', gender: 'm', plural: 'Tische', genitive: 'Tisches', en: 'table', enPlural: 'tables', tags: ['place'] },
  { word: 'Stuhl', gender: 'm', plural: 'Stühle', genitive: 'Stuhls', en: 'chair', enPlural: 'chairs', tags: ['place'] },
  { word: 'Bett', gender: 'n', plural: 'Betten', genitive: 'Bettes', en: 'bed', enPlural: 'beds', tags: ['place'] },
  { word: 'Haus', gender: 'n', plural: 'Häuser', genitive: 'Hauses', en: 'house', enPlural: 'houses', tags: ['place'] },
  { word: 'Auto', gender: 'n', plural: 'Autos', genitive: 'Autos', en: 'car', enPlural: 'cars', tags: ['place'] },
  { word: 'Fenster', gender: 'n', plural: 'Fenster', genitive: 'Fensters', en: 'window', enPlural: 'windows', tags: ['place'] },
  { word: 'Tür', gender: 'f', plural: 'Türen', genitive: 'Tür', en: 'door', enPlural: 'doors', tags: ['place'] },
  { word: 'Fahrrad', gender: 'n', plural: 'Fahrräder', genitive: 'Fahrrads', en: 'bicycle', enPlural: 'bicycles', tags: ['place'] },
];
