import assert from 'node:assert/strict';
import { test } from 'node:test';

import { SENTENCES_BY_ID } from '../js/data/sentences.js';
import { nounMeaning, nounPhrase, translateEnglish, translatePolish, withoutGenderNote } from '../js/quiz/translate.js';

const man = { word: 'Mann', en: 'man', enPlural: 'men' };
const apple = { en: 'apple', enPlural: 'apples' };
const teacher = { en: 'teacher (m)', enPlural: 'teachers' };

test('noun phrases', () => {
  assert.equal(nounPhrase(man, false, 'definite'), 'the man');
  assert.equal(nounPhrase(man, true, 'definite'), 'the men');
  assert.equal(nounPhrase(apple, false, 'indefinite'), 'an apple');
  assert.equal(nounPhrase(teacher, false, 'indefinite'), 'a teacher');
});

test('English: fills verbs, nouns and possessives', () => {
  assert.equal(translateEnglish('{noun} {is|are} here.', { noun: man, plural: true, articleType: 'definite' }), 'The men are here.');
  assert.equal(translateEnglish("This is {noun's} room.", { noun: man, plural: false, articleType: 'indefinite' }), "This is a man's room.");
  assert.equal(translateEnglish("This is {noun's} room.", { noun: teacher, plural: true, articleType: 'definite' }), "This is the teachers' room.");
});

test('Polish: puts the noun in the right Polish case and matches the verb', () => {
  assert.equal(translatePolish('Pomagam {dat}.', { noun: man, plural: false }), 'Pomagam mężczyźnie.');
  assert.equal(translatePolish('Rozmawiam z {inst}.', { noun: man, plural: true }), 'Rozmawiam z mężczyznami.');
  assert.equal(translatePolish('{nom} już {śpi|śpią}.', { noun: man, plural: false }), 'Mężczyzna już śpi.');
  assert.equal(translatePolish('{nom} już {śpi|śpią}.', { noun: man, plural: true }), 'Mężczyźni już śpią.');
});

test('Polish: "drzwi" takes a plural verb even for the singular "Tür"', () => {
  assert.equal(translatePolish('Gdzie {jest|są} {nom}?', { noun: { word: 'Tür' }, plural: false }), 'Gdzie są drzwi?');
});

test('Polish: no translation for user-added words', () => {
  assert.equal(translatePolish('Widzę {acc}.', { noun: { word: 'Kanne' }, plural: false }), null);
});

test('meanings follow the language for built-in words only', () => {
  assert.equal(nounMeaning(man, 'en'), 'man');
  assert.equal(nounMeaning(man, 'pl'), 'mężczyzna');
  assert.equal(nounMeaning({ word: 'Kanne', en: 'dzbanek' }, 'pl'), 'dzbanek');
});

test('English: "This is" becomes "These are" in the plural', () => {
  const template = SENTENCES_BY_ID['nom-this-is'].en;
  assert.equal(translateEnglish(template, { noun: man, plural: true, articleType: 'definite' }), 'These are the men.');
  assert.equal(translateEnglish(template, { noun: man, plural: false, articleType: 'indefinite' }), 'This is a man.');
});

test('gender notes can be removed from meanings', () => {
  assert.equal(withoutGenderNote('teacher (m)'), 'teacher');
  assert.equal(withoutGenderNote('friend (f)'), 'friend');
  assert.equal(withoutGenderNote('clock, watch'), 'clock, watch');
  assert.equal(withoutGenderNote('to lie (be lying)'), 'to lie (be lying)');
});
