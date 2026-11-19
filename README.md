# Artikel Trainer

A small website for practising German articles (der/den/dem/des, ein/einen/einem/eines) in all four cases.

Plain HTML, CSS and JavaScript modules. No framework, no build step, no dependencies.

## Run

```sh
npm install      # once, installs the browser test tool
npm start        # serves on http://localhost:8000 (never cached, so edits show on refresh)
npm test         # logic and data tests (fast, Node only)
npm run test:e2e # browser tests: clicks through the app on desktop and phone sizes
npm run test:all # both
```

Browser tests use the Google Chrome installed on your computer.
The page must be served over HTTP (not opened as a file), because it uses JavaScript modules.
Any static host works (GitHub Pages, Netlify…): just upload the folder.

## Structure

```
index.html              page shell and tabs
css/styles.css          all styles (colour tokens at the top, dark mode included)
js/
  main.js               mounts the tabs
  settings.js           difficulty presets, defaults, saving to localStorage
  data/nouns.js         word list
  data/sentences.js     sentence templates
  grammar/articles.js   article tables and noun ending rules
  grammar/cases.js      tutorial text for each case
  quiz/generator.js     builds and checks questions (pure logic, no DOM)
  quiz/round.js         rounds of 10 questions and the end-of-round summary
  ui/                   one file per tab, plus small shared helpers
  ui/sound.js           sound effects (Web Audio, no audio files) and the mute button
tests/                  Node tests for logic and data
e2e/                    Playwright browser tests
scripts/serve.js        development server (no caching)
```

## Adding content

- **A noun:** add a line to `js/data/nouns.js`. Tags decide which sentences it can appear in.
- **A sentence:** add a line to `js/data/sentences.js`. Use `{article} {noun}` for the gap and
  `{ist|sind}` for verbs that change with plural.
- **A new article type** (e.g. kein, mein): add it to `ARTICLE_TYPES` in `js/grammar/articles.js`.
  It shows up in settings and tables automatically.

Run `npm test` after changes. The data tests catch broken entries.
