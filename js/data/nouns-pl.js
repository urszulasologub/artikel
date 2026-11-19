// Polish forms of the built-in nouns, used for Polish sentence translations and meanings.
// Keyed by the German word. Each list is: nominative, genitive, dative, accusative, instrumental.
// `sg` is missing for German plural-only words. `pluralOnly` marks Polish plural-only words (drzwi),
// which take a plural verb even when the German noun is singular.
// User-added words have no entry, so in Polish they get no sentence translation.

export const POLISH_CASES = ['nom', 'gen', 'dat', 'acc', 'inst'];

export const POLISH_NOUNS = {
  // People
  Mann: { sg: ['mężczyzna', 'mężczyzny', 'mężczyźnie', 'mężczyznę', 'mężczyzną'], pl: ['mężczyźni', 'mężczyzn', 'mężczyznom', 'mężczyzn', 'mężczyznami'] },
  Frau: { sg: ['kobieta', 'kobiety', 'kobiecie', 'kobietę', 'kobietą'], pl: ['kobiety', 'kobiet', 'kobietom', 'kobiety', 'kobietami'] },
  Kind: { sg: ['dziecko', 'dziecka', 'dziecku', 'dziecko', 'dzieckiem'], pl: ['dzieci', 'dzieci', 'dzieciom', 'dzieci', 'dziećmi'] },
  Lehrer: { sg: ['nauczyciel', 'nauczyciela', 'nauczycielowi', 'nauczyciela', 'nauczycielem'], pl: ['nauczyciele', 'nauczycieli', 'nauczycielom', 'nauczycieli', 'nauczycielami'] },
  Lehrerin: { sg: ['nauczycielka', 'nauczycielki', 'nauczycielce', 'nauczycielkę', 'nauczycielką'], pl: ['nauczycielki', 'nauczycielek', 'nauczycielkom', 'nauczycielki', 'nauczycielkami'] },
  Vater: { sg: ['ojciec', 'ojca', 'ojcu', 'ojca', 'ojcem'], pl: ['ojcowie', 'ojców', 'ojcom', 'ojców', 'ojcami'] },
  Mutter: { sg: ['matka', 'matki', 'matce', 'matkę', 'matką'], pl: ['matki', 'matek', 'matkom', 'matki', 'matkami'] },
  Bruder: { sg: ['brat', 'brata', 'bratu', 'brata', 'bratem'], pl: ['bracia', 'braci', 'braciom', 'braci', 'braćmi'] },
  Schwester: { sg: ['siostra', 'siostry', 'siostrze', 'siostrę', 'siostrą'], pl: ['siostry', 'sióstr', 'siostrom', 'siostry', 'siostrami'] },
  Freund: { sg: ['przyjaciel', 'przyjaciela', 'przyjacielowi', 'przyjaciela', 'przyjacielem'], pl: ['przyjaciele', 'przyjaciół', 'przyjaciołom', 'przyjaciół', 'przyjaciółmi'] },
  Freundin: { sg: ['przyjaciółka', 'przyjaciółki', 'przyjaciółce', 'przyjaciółkę', 'przyjaciółką'], pl: ['przyjaciółki', 'przyjaciółek', 'przyjaciółkom', 'przyjaciółki', 'przyjaciółkami'] },
  Mädchen: { sg: ['dziewczynka', 'dziewczynki', 'dziewczynce', 'dziewczynkę', 'dziewczynką'], pl: ['dziewczynki', 'dziewczynek', 'dziewczynkom', 'dziewczynki', 'dziewczynkami'] },
  Arzt: { sg: ['lekarz', 'lekarza', 'lekarzowi', 'lekarza', 'lekarzem'], pl: ['lekarze', 'lekarzy', 'lekarzom', 'lekarzy', 'lekarzami'] },
  Baby: { sg: ['niemowlę', 'niemowlęcia', 'niemowlęciu', 'niemowlę', 'niemowlęciem'], pl: ['niemowlęta', 'niemowląt', 'niemowlętom', 'niemowlęta', 'niemowlętami'] },
  Eltern: { pl: ['rodzice', 'rodziców', 'rodzicom', 'rodziców', 'rodzicami'] },
  Leute: { pl: ['ludzie', 'ludzi', 'ludziom', 'ludzi', 'ludźmi'] },
  // "Rodzeństwo" takes a singular verb in Polish, so "bracia i siostry" keeps the plural verb correct.
  Geschwister: { pl: ['bracia i siostry', 'braci i sióstr', 'braciom i siostrom', 'braci i siostry', 'braćmi i siostrami'] },

  // Animals
  Hund: { sg: ['pies', 'psa', 'psu', 'psa', 'psem'], pl: ['psy', 'psów', 'psom', 'psy', 'psami'] },
  Katze: { sg: ['kot', 'kota', 'kotu', 'kota', 'kotem'], pl: ['koty', 'kotów', 'kotom', 'koty', 'kotami'] },
  Pferd: { sg: ['koń', 'konia', 'koniowi', 'konia', 'koniem'], pl: ['konie', 'koni', 'koniom', 'konie', 'końmi'] },
  Vogel: { sg: ['ptak', 'ptaka', 'ptakowi', 'ptaka', 'ptakiem'], pl: ['ptaki', 'ptaków', 'ptakom', 'ptaki', 'ptakami'] },

  // Objects
  Buch: { sg: ['książka', 'książki', 'książce', 'książkę', 'książką'], pl: ['książki', 'książek', 'książkom', 'książki', 'książkami'] },
  Apfel: { sg: ['jabłko', 'jabłka', 'jabłku', 'jabłko', 'jabłkiem'], pl: ['jabłka', 'jabłek', 'jabłkom', 'jabłka', 'jabłkami'] },
  Tasche: { sg: ['torba', 'torby', 'torbie', 'torbę', 'torbą'], pl: ['torby', 'toreb', 'torbom', 'torby', 'torbami'] },
  Zeitung: { sg: ['gazeta', 'gazety', 'gazecie', 'gazetę', 'gazetą'], pl: ['gazety', 'gazet', 'gazetom', 'gazety', 'gazetami'] },
  Schlüssel: { sg: ['klucz', 'klucza', 'kluczowi', 'klucz', 'kluczem'], pl: ['klucze', 'kluczy', 'kluczom', 'klucze', 'kluczami'] },
  Handy: { sg: ['telefon', 'telefonu', 'telefonowi', 'telefon', 'telefonem'], pl: ['telefony', 'telefonów', 'telefonom', 'telefony', 'telefonami'] },
  Blume: { sg: ['kwiat', 'kwiatu', 'kwiatowi', 'kwiat', 'kwiatem'], pl: ['kwiaty', 'kwiatów', 'kwiatom', 'kwiaty', 'kwiatami'] },
  Brief: { sg: ['list', 'listu', 'listowi', 'list', 'listem'], pl: ['listy', 'listów', 'listom', 'listy', 'listami'] },
  Kuchen: { sg: ['ciasto', 'ciasta', 'ciastu', 'ciasto', 'ciastem'], pl: ['ciasta', 'ciast', 'ciastom', 'ciasta', 'ciastami'] },
  Flasche: { sg: ['butelka', 'butelki', 'butelce', 'butelkę', 'butelką'], pl: ['butelki', 'butelek', 'butelkom', 'butelki', 'butelkami'] },
  Uhr: { sg: ['zegarek', 'zegarka', 'zegarkowi', 'zegarek', 'zegarkiem'], pl: ['zegarki', 'zegarków', 'zegarkom', 'zegarki', 'zegarkami'] },
  Kleid: { sg: ['sukienka', 'sukienki', 'sukience', 'sukienkę', 'sukienką'], pl: ['sukienki', 'sukienek', 'sukienkom', 'sukienki', 'sukienkami'] },
  Computer: { sg: ['komputer', 'komputera', 'komputerowi', 'komputer', 'komputerem'], pl: ['komputery', 'komputerów', 'komputerom', 'komputery', 'komputerami'] },
  Lampe: { sg: ['lampa', 'lampy', 'lampie', 'lampę', 'lampą'], pl: ['lampy', 'lamp', 'lampom', 'lampy', 'lampami'] },

  // Places
  Tisch: { sg: ['stół', 'stołu', 'stołowi', 'stół', 'stołem'], pl: ['stoły', 'stołów', 'stołom', 'stoły', 'stołami'] },
  Stuhl: { sg: ['krzesło', 'krzesła', 'krzesłu', 'krzesło', 'krzesłem'], pl: ['krzesła', 'krzeseł', 'krzesłom', 'krzesła', 'krzesłami'] },
  Bett: { sg: ['łóżko', 'łóżka', 'łóżku', 'łóżko', 'łóżkiem'], pl: ['łóżka', 'łóżek', 'łóżkom', 'łóżka', 'łóżkami'] },
  Haus: { sg: ['dom', 'domu', 'domowi', 'dom', 'domem'], pl: ['domy', 'domów', 'domom', 'domy', 'domami'] },
  Auto: { sg: ['samochód', 'samochodu', 'samochodowi', 'samochód', 'samochodem'], pl: ['samochody', 'samochodów', 'samochodom', 'samochody', 'samochodami'] },
  Fenster: { sg: ['okno', 'okna', 'oknu', 'okno', 'oknem'], pl: ['okna', 'okien', 'oknom', 'okna', 'oknami'] },
  Tür: { pluralOnly: true, sg: ['drzwi', 'drzwi', 'drzwiom', 'drzwi', 'drzwiami'], pl: ['drzwi', 'drzwi', 'drzwiom', 'drzwi', 'drzwiami'] },
  Fahrrad: { sg: ['rower', 'roweru', 'rowerowi', 'rower', 'rowerem'], pl: ['rowery', 'rowerów', 'rowerom', 'rowery', 'rowerami'] },
};
