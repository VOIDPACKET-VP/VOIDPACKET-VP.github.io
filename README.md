# Voidpacket

Personal site for CTF writeups, cheatsheets/methodology notes, and projects — built with [Eleventy](https://www.11ty.dev/) and deployed to GitHub Pages automatically on every push.

## How it works

- `src/content/writeups/*.md` → pages under `/writeups/`
- `src/content/notes/*.md` → pages under `/notes/`
- `src/content/projects/*.md` → pages under `/projects/`
- Push a new `.md` file to any of those folders → GitHub Action rebuilds the site → it's live. No manual steps.

## One-time repo setup

1. Push this repo to GitHub.
2. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main` — the `deploy.yml` workflow builds and publishes the site.

## Local development

```bash
npm install
npm run serve   # http://localhost:8080, live-reloads
npm run build   # outputs static site to ./_site
```

## Adding a new writeup

Create a file in `src/content/writeups/`, e.g. `htb-blurry.md`:

```markdown
---
layout: layouts/entry-detail.njk
title: "HTB — Blurry"
date: 2026-08-01
category: Web        # shows as the colored tag + used for filtering
platform: HackTheBox  # optional
difficulty: Medium     # optional: Easy / Medium / Hard / Insane
tags: [rce, ml, upload]
summary: "One-line summary shown in the listing."
backLink: /writeups/
backLabel: Writeups
---

## Enumeration

Your writeup content here, in normal markdown. Code blocks, images,
tables, and blockquotes are all styled automatically.

\`\`\`bash
nmap -sC -sV 10.10.11.111
\`\`\`
```

Push it — it appears at `/writeups/htb-blurry/` and in the `/writeups/` list, sorted newest-first automatically.

## Adding a new note (cheatsheet / methodology / tech deep-dive)

Same idea, in `src/content/notes/`:

```markdown
---
layout: layouts/entry-detail.njk
title: "Burp Suite Cheatsheet"
date: 2026-08-10
category: Cheatsheet   # or: Methodology, Tech
tags: [burp, proxy, web]
summary: "Match/replace rules and extensions I always set up first."
backLink: /notes/
backLabel: Notes
---

Your content...
```

## Adding a new project

In `src/content/projects/`:

```markdown
---
layout: layouts/entry-detail.njk
title: "My New Tool"
date: 2026-08-15
category: Project
tags: [Python, CLI]
summary: "One-line description shown on the project card."
order: 4                 # controls sort position on /projects/
link: https://github.com/you/repo   # optional — if set, card links out instead of to a detail page
backLink: /projects/
backLabel: Projects
---

Longer description of the project, shown on its own page if no `link` is set.
```

## Images in a writeup/note

Drop the image next to the markdown file (e.g. `src/content/writeups/screenshot.png`) and reference it as `![alt](screenshot.png)` — image files are copied alongside the built pages automatically.

## Project structure

```
src/
  _includes/layouts/     Nunjucks layout templates (shared header/footer/hero)
  assets/css/            style.css (landing), about.css + content.css (all other pages)
  assets/js/             script.js (landing), site.js (shared: lines, reveal, filters)
  content/writeups/      one .md file per writeup
  content/notes/         one .md file per note
  content/projects/      one .md file per project
  index.njk              landing page (hero + fullscreen menu)
  about.njk               about page
  writeups/index.njk     writeups listing
  notes/index.njk         notes listing
  projects/index.njk      projects listing
.github/workflows/deploy.yml   build + deploy on push to main
```
