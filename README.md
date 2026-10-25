# Portfolio
https://dev-rksharma.github.io/Portfolio/


A static, dependency-free personal portfolio. Plain HTML + CSS + JS — no build step,
no npm install, no framework. Drops straight onto GitHub Pages.

```
site/
├── index.html          all content lives here (look for "EDIT:" comments)
├── css/style.css       design tokens at the top, then layout, then responsive
├── js/main.js          mobile menu, active nav, scroll reveal, copy-to-clipboard
└── assets/             images + favicon
```

---

## 1. Fill in your content

Everything you need to change is marked with an `EDIT:` comment.
Open `index.html` and search for `EDIT` — there are 14 spots. In order:

| Where | What |
|---|---|
| `<title>` + `<meta description>` | your name and one-line pitch (this is what Google shows) |
| `<link rel="canonical">` | your final Pages URL |
| `.rail` | social links (delete any you don't use) |
| `.logo__text` | your name / wordmark — appears in header and footer |
| `.hero__title` | headline. Words wrapped in `<em>` render purple |
| `.hero__text` | one-line pitch |
| `.status` | what you're working on right now |
| `.card` ×3 | one per project — duplicate or delete the whole `<article>` |
| `.skill-box` ×5 | your skill groups |
| `.about__copy` | your bio |
| `.contacts` | email + socials |
| `.footer` | email, tagline, socials |

Also swap the placeholder search-and-replace values globally:

- `your-username` → your GitHub / LinkedIn handle
- `you@example.com` → your email
- `Your Name` / `YourName` → your name

## 2. Add your images

Replace the placeholder SVGs in `assets/` with real files and update the `src` in
`index.html`:

| File | What | Notes |
|---|---|---|
| `profile.png` | your photo | **background-removed PNG** looks closest to the design |
| `project-1.png` … | project screenshots | 16:9, ~1200×675, compressed |
| `og-image.png` | social share card | 1200×630 |
| `logo.svg` | favicon | already themed — edit the colours if you like |

Compress before committing — [squoosh.app](https://squoosh.app) is the quickest way.
Aim for under 200 KB per image.

## 3. Preview locally

Just double-click `index.html`. Or, for a proper local server:

```bash
python -m http.server 8000
# → http://localhost:8000
```

## 4. Deploy to GitHub Pages

Two options.

### Option A — `username.github.io` (site lives at the root domain)

The repo **must** be named exactly `your-username.github.io`.

```bash
cd site
git init -b main
git add .
git commit -m "Initial portfolio"
git remote add origin https://github.com/your-username/your-username.github.io.git
git push -u origin main
```

Live at `https://your-username.github.io` within a minute or two.

### Option B — any repo name (site lives in a subpath)

```bash
cd site
git init -b main
git add .
git commit -m "Initial portfolio"
git remote add origin https://github.com/your-username/portfolio.git
git push -u origin main
```

Then: **repo → Settings → Pages → Source: `Deploy from a branch` → `main` / `/ (root)` → Save.**

Live at `https://your-username.github.io/portfolio/`.

> All asset paths are relative (`css/style.css`, not `/css/style.css`), so both
> options work with no changes.

### Custom domain

Add a file named `CNAME` next to `index.html` containing just your domain
(`example.com`), then point a `CNAME` DNS record at `your-username.github.io`.

---

## Notes

- **`.nojekyll`** is included so GitHub serves the files as-is instead of running
  them through Jekyll. Don't delete it.
- **Fonts** load from Google Fonts (Fira Code). To self-host, download the woff2,
  drop it in `assets/fonts/`, and replace the `<link>` with an `@font-face` rule.
- **Design tokens** are the CSS custom properties at the top of `style.css`.
  Change `--accent` and the whole site re-themes.
- **Reveal stagger**: `js/main.js` writes a `--i` index onto each child of
  `.cards`, `.skills__grid`, `.badge-groups` and `.timeline`; the CSS turns that
  into `transition-delay: calc(var(--i, 0) * 90ms)`. Add or remove children
  freely — the ladder re-numbers itself.
- **Project diagram line-draw**: the accent path in `assets/project-*.svg` is
  marked `class="data-path"`. On reveal, `js/main.js` inlines the SVG and
  animates `stroke-dashoffset` so the path draws itself in. To opt a new
  diagram in, put that class on its accent stroke (or the `<g>` wrapping them).
- **Accessibility**: skip link, focus-visible outlines, `aria-label`s on icon-only
  links, and `prefers-reduced-motion` respected throughout.

## Breakpoints

| Width | Behaviour |
|---|---|
| ≥ 900px | full desktop: left social rail, decorative shapes, 3-col grids |
| < 900px | rail hidden, hamburger → full-screen menu |
| < 820px | single-column hero / about / contacts, image moves above text |
| < 560px | stats strip stacks, buttons go full-width, footer stacks |


## Single-page portfolio
All portfolio content lives in `index.html`, including the complete projects, biography and contact details. Navigation uses section anchors. `projects.html`, `about.html` and `contacts.html` redirect old shared URLs to the corresponding homepage sections.
