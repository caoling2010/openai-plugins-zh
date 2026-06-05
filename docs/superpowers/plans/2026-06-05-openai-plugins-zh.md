# OpenAI Plugins Chinese Directory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GitHub Pages site that lists Codex plugins with Chinese descriptions, keyword search, category filtering, and automatic updates from OpenAI's plugin repository.

**Architecture:** Use a static frontend that reads `data/plugins.json`. A Node.js sync script fetches plugin manifests from `openai/plugins`, preserves English technical terms during translation, and writes normalized page data. GitHub Actions runs the sync on a schedule and commits generated data directly.

**Tech Stack:** Static HTML/CSS/vanilla JavaScript, Node.js built-in test runner, GitHub Actions, OpenAI Responses API for new or changed translations when `OPENAI_API_KEY` is available.

---

### Task 1: Core Data Behavior

**Files:**
- Create: `scripts/plugin-data.mjs`
- Create: `tests/plugin-data.test.mjs`

- [ ] **Step 1: Write failing tests for manifest normalization and filtering**

Create tests that assert manifest fields become searchable plugin records, category labels are mapped to Chinese, and search/filter behavior matches name, description, keywords, and terms.

- [ ] **Step 2: Implement minimal data helpers**

Implement `normalizeManifest`, `filterPlugins`, `getCategoryLabel`, and term extraction helpers.

- [ ] **Step 3: Run tests**

Run `npm test` and confirm all core behavior passes.

### Task 2: Sync Pipeline

**Files:**
- Create: `scripts/sync-plugins.mjs`
- Create: `data/translations.zh.json`
- Generate: `data/plugins.json`

- [ ] **Step 1: Write sync around the data helpers**

Fetch manifests from GitHub's contents API, normalize records, reuse saved Chinese translations, call OpenAI for changed text when configured, and write stable sorted JSON.

- [ ] **Step 2: Seed current translations**

Generate the first `data/plugins.json` using the public `openai/plugins` manifests and a curated translation map for known plugins.

### Task 3: Static Site UI

**Files:**
- Create: `index.html`
- Create: `assets/styles.css`
- Create: `assets/app.js`

- [ ] **Step 1: Build the page shell**

Create an accessible developer-directory layout with search, category tabs, result count, cards, and empty state.

- [ ] **Step 2: Wire client-side behavior**

Load `data/plugins.json`, filter by search and category, render cards, and show update metadata.

### Task 4: Automation and Docs

**Files:**
- Create: `.github/workflows/sync-plugins.yml`
- Create: `package.json`
- Create: `README.md`

- [ ] **Step 1: Add scheduled direct commit workflow**

Run the sync daily and commit changes to `main` using `GITHUB_TOKEN`.

- [ ] **Step 2: Document setup**

Explain GitHub Pages setup, optional `OPENAI_API_KEY`, local commands, and how terms stay in English.

### Task 5: Verification

**Files:**
- Modify as needed from previous tasks.

- [ ] **Step 1: Run tests**

Run `npm test`.

- [ ] **Step 2: Run sync dry check**

Run `npm run sync:plugins` and confirm generated JSON is valid.

- [ ] **Step 3: Preview static page**

Start a local server and verify search, category filters, cards, and responsive layout in the browser.
