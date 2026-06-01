#!/usr/bin/env node
// Zero-dependency static index generator for the Advanced SVM notes.
//
// Scans each topic folder for note HTML files, derives metadata from the
// note's own <head> (with optional <meta name="note-*"> overrides), and
// emits a self-contained index.html at the repo root.
//
// Adding a note: drop `partN-name.html` into a topic folder with a <title>
// and a <meta name="description">, then run `node site/build.mjs`. No manifest
// to edit. Thumbnails are optional (see site/shots.mjs); a missing thumbnail
// falls back to a generated poster so the build never breaks.

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const SITE_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SITE_DIR, '..');
const THUMB_DIR = join(SITE_DIR, 'thumbs');
const REPO_URL = 'https://github.com/Allen-Saji/adv-svm-q2';

// Topic order + display names + taglines. Folders not listed here are still
// discovered and appended automatically with a prettified name.
const TOPICS = [
  {
    dir: 'linux-networking-agave',
    name: 'Linux Networking for Agave',
    tagline: 'What happens to a packet before it ever reaches validator code.',
  },
  {
    dir: 'block-building',
    name: 'Block Building on Solana',
    tagline: 'How a block actually gets built, and where MEV infrastructure plugs in.',
  },
];

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const escapeHtml = (s = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const prettifyDir = (dir) =>
  dir.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// Pull the first head-level <title> (SVG <title> elements come later in body).
const firstTitle = (html) => {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : '';
};

const metaContent = (html, name) => {
  // Capture the opening quote and read until the matching one, so apostrophes
  // inside a double-quoted value (e.g. "Solana's") don't end the match early.
  const re = new RegExp(`<meta\\s+name=["']${name}["']\\s+content=(["'])([\\s\\S]*?)\\1`, 'i');
  const m = html.match(re);
  return m ? m[2].trim() : '';
};

// "Part 1: Why Solana Chose UDP Over TCP | Linux Networking..." -> "Why Solana Chose UDP Over TCP"
const deriveTitle = (rawTitle) =>
  rawTitle.split('|')[0].replace(/^Part\s+\d+\s*[:\-]\s*/i, '').trim();

// "Part 1 of 7: Understanding ... . From the Turbin3 ..." -> "Understanding ... ."
const deriveSummary = (desc) =>
  desc
    .replace(/^Part\s+\d+\s+of\s+\d+\s*:\s*/i, '')
    .replace(/\s*(From|Part of)\s+the\s+Turbin3[^.]*\.?\s*$/i, '')
    .trim();

const deriveOrder = (file) => {
  const m = file.match(/part(\d+)/i);
  return m ? parseInt(m[1], 10) : 999;
};

const pad = (n) => String(n).padStart(2, '0');

// ---------------------------------------------------------------------------
// scan
// ---------------------------------------------------------------------------

const isTopicDir = (name) => {
  const p = join(ROOT, name);
  if (!statSync(p).isDirectory()) return false;
  if (name.startsWith('.') || name === 'site' || name === 'node_modules') return false;
  return readdirSync(p).some((f) => f.endsWith('.html'));
};

const discovered = readdirSync(ROOT).filter((n) => {
  try { return isTopicDir(n); } catch { return false; }
});

const topicOrder = [
  ...TOPICS,
  ...discovered.filter((d) => !TOPICS.some((t) => t.dir === d)).map((d) => ({ dir: d, name: prettifyDir(d), tagline: '' })),
].filter((t) => discovered.includes(t.dir));

let totalNotes = 0;

const sections = topicOrder.map((topic) => {
  const files = readdirSync(join(ROOT, topic.dir)).filter((f) => f.endsWith('.html'));

  const notes = files.map((file) => {
    const html = readFileSync(join(ROOT, topic.dir, file), 'utf8');
    const order = parseInt(metaContent(html, 'note-order'), 10) || deriveOrder(file);
    const title = metaContent(html, 'note-title') || deriveTitle(firstTitle(html)) || prettifyDir(file.replace(/\.html$/, ''));
    const summary = metaContent(html, 'note-summary') || deriveSummary(metaContent(html, 'description'));
    const category = metaContent(html, 'note-category') || topic.name;
    const thumbName = `${topic.dir}__${basename(file, '.html')}.png`;
    const hasThumb = existsSync(join(THUMB_DIR, thumbName));
    return {
      href: `./${topic.dir}/${file}`,
      title,
      summary,
      order,
      category,
      eyebrow: `${shortCat(category)} / ${pad(order)}`,
      thumb: hasThumb ? `./site/thumbs/${thumbName}` : null,
    };
  }).sort((a, b) => a.order - b.order);

  totalNotes += notes.length;
  return { ...topic, notes };
});

// Short uppercase category label for the card eyebrow.
function shortCat(name) {
  return name
    .replace(/\bfor Agave\b/i, '')
    .replace(/\bon Solana\b/i, '')
    .trim()
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// render
// ---------------------------------------------------------------------------

const cardHtml = (n) => {
  const media = n.thumb
    ? `<div class="thumb"><img loading="lazy" src="${n.thumb}" alt="${escapeHtml(n.title)} preview"></div>`
    : `<div class="thumb poster"><span class="poster-num">${escapeHtml(n.eyebrow.split('/').pop().trim())}</span><span class="poster-title">${escapeHtml(n.title)}</span></div>`;
  return `      <a class="card" href="${n.href}">
        ${media}
        <div class="card-body">
          <div class="card-eyebrow">${escapeHtml(n.eyebrow)}</div>
          <h3 class="card-title">${escapeHtml(n.title)}</h3>
          <p class="card-summary">${escapeHtml(n.summary)}</p>
        </div>
      </a>`;
};

const sectionHtml = (s) => `    <section class="topic">
      <div class="topic-head">
        <h2>${escapeHtml(s.name)}</h2>
        <span class="count">${s.notes.length} ${s.notes.length === 1 ? 'note' : 'notes'}</span>
      </div>
      ${s.tagline ? `<p class="topic-tagline">${escapeHtml(s.tagline)}</p>` : ''}
      <div class="grid">
${s.notes.map(cardHtml).join('\n')}
      </div>
    </section>`;

const topicCount = sections.length;

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Advanced SVM // Field Notes</title>
<meta name="description" content="Deep dives into Solana internals: Linux networking for Agave validators, block building, MEV, and the protocol roadmap. Turbin3 Q2 2026 Advanced SVM cohort.">
<meta property="og:title" content="Advanced SVM // Field Notes">
<meta property="og:description" content="Deep dives into Solana internals from the Turbin3 Advanced SVM cohort.">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230a0c11'/%3E%3Ccircle cx='16' cy='16' r='6' fill='%2314f195'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
${css()}
</style>
</head>
<body>
  <div class="glow"></div>
  <main>
    <header class="hero">
      <div class="eyebrow"><span>&#9679;</span> Turbin3 Q2 2026 &#47;&#47; Advanced SVM cohort</div>
      <h1>Field Notes on<br><span class="grad">Solana Internals</span></h1>
      <p class="lede">Long-form, diagram-heavy deep dives into how Solana works below the API line: validator networking, block building, MEV, and the protocol roadmap. Each note is a self-contained page, no build step, written to be read in one sitting.</p>
      <div class="stats">
        <div class="stat"><span class="v">${totalNotes}</span><span class="k">notes</span></div>
        <div class="stat"><span class="v">${topicCount}</span><span class="k">topics</span></div>
        <div class="stat"><span class="v">open</span><span class="k">source</span></div>
      </div>
    </header>

${sections.map(sectionHtml).join('\n\n')}

    <footer>
      <span>Advanced SVM Q2 2026 &#183; Turbin3 cohort artifacts</span>
      <a href="${REPO_URL}">github.com/Allen-Saji/adv-svm-q2</a>
    </footer>
  </main>
</body>
</html>
`;

writeFileSync(join(ROOT, 'index.html'), page);
console.log(`Built index.html: ${totalNotes} notes across ${topicCount} topics.`);
for (const s of sections) {
  const missing = s.notes.filter((n) => !n.thumb).length;
  console.log(`  - ${s.name}: ${s.notes.length} notes${missing ? ` (${missing} using poster fallback)` : ''}`);
}

// ---------------------------------------------------------------------------
// styles
// ---------------------------------------------------------------------------

function css() {
  return `
:root{
  --bg:#0a0c11; --bg-elevated:#11141c; --bg-soft:#161a24;
  --border:rgba(255,255,255,.08); --border-soft:rgba(255,255,255,.05);
  --text:#e6e9f0; --text-dim:#aab1c2; --text-faint:#6b7385;
  --green:#14f195; --purple:#9945ff; --warm:#ffb454; --blue:#56b6ff;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{
  background:var(--bg); color:var(--text);
  font-family:'Inter',system-ui,-apple-system,sans-serif;
  line-height:1.6; -webkit-font-smoothing:antialiased;
  position:relative; min-height:100vh;
}
.glow{position:fixed;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(60% 50% at 50% -10%,rgba(153,69,255,.14),transparent 70%),
             radial-gradient(40% 40% at 90% 10%,rgba(20,241,149,.08),transparent 70%);}
main{position:relative;z-index:1;max-width:1180px;margin:0 auto;padding:0 28px 96px}

/* hero */
.hero{padding:96px 0 64px;border-bottom:1px solid var(--border-soft)}
.eyebrow{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.22em;
  text-transform:uppercase;color:var(--text-faint);margin-bottom:28px}
.eyebrow span{color:var(--green)}
.hero h1{font-size:clamp(38px,6vw,68px);font-weight:700;line-height:1.04;letter-spacing:-.02em}
.hero h1 .grad{background:linear-gradient(100deg,var(--green),var(--blue) 60%,var(--purple));
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.lede{margin-top:24px;max-width:660px;font-size:18px;color:var(--text-dim)}
.stats{display:flex;gap:40px;margin-top:40px}
.stat{display:flex;flex-direction:column}
.stat .v{font-family:'JetBrains Mono',monospace;font-size:26px;font-weight:600;color:var(--text)}
.stat .k{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--text-faint);margin-top:4px}

/* topic section */
.topic{padding:64px 0 8px}
.topic-head{display:flex;align-items:baseline;gap:16px}
.topic-head h2{font-size:24px;font-weight:650;letter-spacing:-.01em}
.topic-head .count{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-faint)}
.topic-tagline{color:var(--text-dim);margin-top:8px;font-size:15px}

/* grid */
.grid{display:grid;gap:22px;margin-top:32px;
  grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.card{display:flex;flex-direction:column;text-decoration:none;color:inherit;
  background:var(--bg-elevated);border:1px solid var(--border);border-radius:14px;
  overflow:hidden;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease}
.card:hover{transform:translateY(-4px);border-color:rgba(20,241,149,.4);
  box-shadow:0 18px 50px -20px rgba(0,0,0,.7),0 0 0 1px rgba(20,241,149,.15)}
.thumb{aspect-ratio:16/10;overflow:hidden;background:var(--bg-soft);
  border-bottom:1px solid var(--border-soft);position:relative}
.thumb img{width:100%;height:100%;object-fit:cover;object-position:top center;
  transition:transform .35s ease;display:block}
.card:hover .thumb img{transform:scale(1.04)}
.thumb.poster{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;
  gap:8px;padding:24px;
  background:linear-gradient(140deg,#11141c,#1a1030 60%,#0d2018)}
.poster-num{font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:.2em;color:var(--green)}
.poster-title{font-size:20px;font-weight:600;color:var(--text);line-height:1.2}
.card-body{padding:18px 20px 22px;display:flex;flex-direction:column;flex:1}
.card-eyebrow{font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--text-faint)}
.card-title{font-size:18px;font-weight:600;margin:8px 0 8px;letter-spacing:-.01em;line-height:1.25}
.card-summary{font-size:14px;color:var(--text-dim);
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}

/* footer */
footer{margin-top:80px;padding-top:28px;border-top:1px solid var(--border-soft);
  display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;
  font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--text-faint)}
footer a{color:var(--green);text-decoration:none}
footer a:hover{text-decoration:underline}

@media(max-width:640px){
  main{padding:0 18px 64px}
  .hero{padding:64px 0 48px}
  .stats{gap:28px}
}
`;
}
