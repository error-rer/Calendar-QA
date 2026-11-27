#!/usr/bin/env node
// Builds the HTML documentation from the Markdown sources in docs/en and docs/th.
// Markdown is the single source of truth: edit the .md files, then run `npm run docs`.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');

const GUIDES = [
  { id: 'user-guide', tab: 'user', color: '#2e7d32', langs: ['th', 'en'] },
  { id: 'developer-guide', tab: 'dev', color: '#1e5fa8', langs: ['th', 'en'] },
  { id: 'it-handover', tab: 'it', color: '#123f73', langs: ['th', 'en'] },
];

const L = {
  en: {
    name: 'English', short: 'EN', contents: 'Contents', rev: 'Rev', print: 'Print', prev: 'Previous', next: 'Next',
    skip: 'Skip to content', home: 'All documentation', copy: 'Copy', copied: 'Copied', fig: 'Fig.', chapters: 'Chapters',
    guidesNav: 'Guides', langNav: 'Language', onlyEn: 'This guide is in English only',
    linkTo: 'Link to this section', openImage: 'Open full size in a new tab',
    search: 'Search the docs', noResults: 'No results for', results: 'results', clear: 'Clear search highlights',
    guide: { user: 'User Guide', dev: 'Developer Guide', it: 'IT Handover' },
    tab: { user: 'User Guide', dev: 'Developer', it: 'IT Handover' },
    alert: { NOTE: 'Note', TIP: 'Tip', IMPORTANT: 'Important', WARNING: 'Warning', CAUTION: 'Caution' },
  },
  th: {
    name: 'ไทย', short: 'ไทย', contents: 'สารบัญ', rev: 'ปรับปรุง', print: 'พิมพ์', prev: 'ก่อนหน้า', next: 'ถัดไป',
    skip: 'ข้ามไปยังเนื้อหา', home: 'เอกสารทั้งหมด', copy: 'คัดลอก', copied: 'คัดลอกแล้ว', fig: 'ภาพที่', chapters: 'บท',
    guidesNav: 'คู่มือ', langNav: 'ภาษา', onlyEn: 'คู่มือนี้มีเฉพาะภาษาอังกฤษ',
    linkTo: 'ลิงก์ไปยังหัวข้อนี้', openImage: 'เปิดภาพขนาดเต็มในแท็บใหม่',
    search: 'ค้นหาในเอกสาร', noResults: 'ไม่พบผลลัพธ์สำหรับ', results: 'รายการ', clear: 'ล้างไฮไลต์การค้นหา',
    guide: { user: 'คู่มือผู้ใช้', dev: 'คู่มือนักพัฒนา', it: 'คู่มือส่งมอบ IT' },
    tab: { user: 'คู่มือผู้ใช้', dev: 'นักพัฒนา', it: 'ส่งมอบ IT' },
    alert: { NOTE: 'หมายเหตุ', TIP: 'เคล็ดลับ', IMPORTANT: 'สำคัญ', WARNING: 'คำเตือน', CAUTION: 'ข้อควรระวัง' },
  },
};

const STATUS_SWATCH = { '🔴': '#dc2626', '🔵': '#0284c7', '🟣': '#7c3aed', '🟡': '#d97706', '🟢': '#059669' };
const SITE_COLORS = {
  UTL1: '#c0392b', UTL2: '#2e7d32', UTL2A: '#66bb6a', UTL2B: '#1b5e20', UTL3: '#1e5fa8', UTL3A: '#4a90d9', UTL3T: '#123f73',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (s) => String(s).replace(/<[^>]+>/g, '');
const decode = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

// GitHub-compatible heading anchors, so links work the same on GitHub and in the HTML.
function makeSlugger() {
  const seen = new Set();
  return (text) => {
    const base = decode(stripTags(text)).toLowerCase().trim()
      .replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
      .replace(/ /g, '-');
    let slug = base;
    for (let i = 1; seen.has(slug); i++) slug = `${base}-${i}`;
    seen.add(slug);
    return slug;
  };
}

// "3.1 Create a CS" -> ["3.1", "Create a CS"]; "4. Security" -> ["4", "Security"]
function splitNumber(html) {
  const m = html.match(/^(\d+(?:\.\d+)*)\.?\s+(.*)$/s);
  return m ? [m[1], m[2]] : [null, html];
}

function gitDate(file) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { cwd: ROOT, encoding: 'utf8' }).trim();
    if (out) return out;
  } catch { /* not a git checkout */ }
  return new Date().toISOString().slice(0, 10);
}

// Intrinsic image size, so figures reserve their space before the image loads.
function imageSize(file) {
  try {
    const buf = readFileSync(file);
    if (buf.slice(1, 4).toString() === 'PNG') return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
    const svg = buf.toString('utf8', 0, 600);
    const vb = svg.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/);
    if (vb) return [Math.round(+vb[1]), Math.round(+vb[2])];
  } catch { /* missing image: the link checker reports it */ }
  return null;
}

function createMarked(lang, slug, figCounter) {
  const t = L[lang];
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        const id = slug(inner);
        const [num, title] = splitNumber(inner);
        const numHtml = num ? `<span class="num">${num}</span>` : '';
        const anchor = depth === 2 || depth === 3
          ? `<a class="anchor" href="#${id}" aria-label="${t.linkTo}: ${esc(stripTags(title))}"><svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M6.5 9.5l3-3M7 4.5l1.2-1.2a2.6 2.6 0 0 1 3.7 3.7L10.7 8.2M9 11.5l-1.2 1.2a2.6 2.6 0 0 1-3.7-3.7L5.3 7.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></a>`
          : '';
        return `<h${depth} id="${id}">${numHtml}<span class="ht">${title}</span>${anchor}</h${depth}>\n`;
      },
      paragraph({ tokens }) {
        if (tokens.length === 1 && tokens[0].type === 'image') {
          const img = tokens[0];
          const n = ++figCounter.n;
          const caption = img.title ? `<figcaption><span class="fig">${t.fig} ${n}</span> ${esc(img.title)}</figcaption>` : '';
          const kind = /\.svg$/i.test(img.href) ? ' class="diagram"' : '';
          const size = imageSize(join(DOCS, lang, img.href));
          const dims = size ? ` width="${size[0]}" height="${size[1]}"` : '';
          return `<figure${kind}><a class="shot" href="${esc(img.href)}" target="_blank" rel="noopener" title="${t.openImage}"><img src="${esc(img.href)}" alt="${esc(img.text)}"${dims} loading="lazy" decoding="async"></a>${caption}</figure>\n`;
        }
        return `<p>${this.parser.parseInline(tokens)}</p>\n`;
      },
      blockquote({ tokens }) {
        const first = tokens[0];
        const m = first && first.type === 'paragraph' && first.raw.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n?/);
        if (!m) return `<blockquote>${this.parser.parse(tokens)}</blockquote>\n`;
        const kind = m[1];
        const rest = first.raw.slice(m[0].length);
        const body = this.parser.parse([...new Marked({ gfm: true }).lexer(rest), ...tokens.slice(1)]);
        return `<aside class="callout ${kind.toLowerCase()}" role="note"><span class="badge">${t.alert[kind]}</span>${body}</aside>\n`;
      },
      code({ text, lang: codeLang }) {
        return `<div class="code"><pre><code${codeLang ? ` data-lang="${esc(codeLang)}"` : ''}>${esc(decode(text))}</code></pre><button type="button" class="copy" data-copied="${t.copied}">${t.copy}</button></div>\n`;
      },
      codespan({ text }) {
        const raw = decode(text);
        const safe = esc(raw);
        if (SITE_COLORS[raw]) return `<span class="site" style="--c:${SITE_COLORS[raw]}">${safe}</span>`;
        if (/^#[0-9a-f]{6}$/i.test(raw)) return `<span class="hex"><span class="sw" style="--c:${raw}" aria-hidden="true"></span><code>${safe}</code></span>`;
        return `<code>${safe}</code>`;
      },
      link({ href, title, tokens }) {
        const inner = this.parser.parseInline(tokens);
        let h = href;
        if (!/^[a-z]+:/i.test(h)) h = h.replace(/\.md(#|$)/, '.html$1');
        const ext = /^https?:/i.test(h) ? ' rel="noopener"' : '';
        return `<a href="${esc(h)}"${title ? ` title="${esc(title)}"` : ''}${ext}>${inner}</a>`;
      },
      table(token) {
        const head = token.header.map((c) => `<th scope="col">${this.parser.parseInline(c.tokens)}</th>`).join('');
        const rows = token.rows.map((r) => `<tr>${r.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`).join('\n');
        return `<div class="table"><table><thead><tr>${head}</tr></thead><tbody>\n${rows}\n</tbody></table></div>\n`;
      },
    },
  });
  return marked;
}

function swatches(html) {
  return html.replace(/(🔴|🔵|🟣|🟡|🟢)\s*([^\s<]*)/gu, (_, e, word) => `<span class="swl"><span class="sw" style="--c:${STATUS_SWATCH[e]}" aria-hidden="true"></span>${word}</span>`);
}

function parseGuide(guide, lang) {
  const file = join(DOCS, lang, `${guide.id}.md`);
  const md = readFileSync(file, 'utf8');
  const slug = makeSlugger();
  const figCounter = { n: 0 };
  const marked = createMarked(lang, slug, figCounter);
  const tokens = marked.lexer(md);
  const render = (list) => swatches(marked.parser(Object.assign(list, { links: tokens.links })));

  const h1 = tokens.find((tk) => tk.type === 'heading' && tk.depth === 1);
  const title = marked.parseInline(h1.text);
  slug(title);
  const firstH2 = tokens.findIndex((tk) => tk.type === 'heading' && tk.depth === 2);
  const intro = tokens.slice(tokens.indexOf(h1) + 1, firstH2 === -1 ? tokens.length : firstH2).filter((tk) => tk.type !== 'space');
  const ledeTok = intro[0] && intro[0].type === 'paragraph' ? intro.shift() : null;

  const chapters = [];
  let current = null;
  for (const tk of tokens.slice(firstH2)) {
    if (tk.type === 'heading' && tk.depth === 2) {
      current = { tokens: [tk], subs: [] };
      chapters.push(current);
    } else if (current) {
      current.tokens.push(tk);
      if (tk.type === 'heading' && tk.depth === 3) current.subs.push(tk.text);
    }
  }
  const rendered = chapters.map((ch) => {
    const html = render(ch.tokens);
    const head = html.match(/<h2 id="([^"]+)"><span class="num">([^<]*)<\/span><span class="ht">(.*?)<\/span>/s)
      || html.match(/<h2 id="([^"]+)">()<span class="ht">(.*?)<\/span>/s);
    const subs = ch.subs.map((s) => splitNumber(marked.parseInline(s))[1]);
    return { html, id: head[1], num: head[2], title: head[3], subs };
  });
  return {
    file,
    title,
    lede: ledeTok ? marked.parseInline(ledeTok.text) : '',
    intro: render(intro),
    chapters: rendered,
    introText: htmlText(`${ledeTok ? marked.parseInline(ledeTok.text) : ''} ${render(intro)}`),
    rev: gitDate(relative(ROOT, file)),
  };
}

// ---------- full-text search index ----------
function htmlText(html) {
  return decode(String(html)
    .replace(/<button[^>]*>[\s\S]*?<\/button>/g, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<\/?(p|li|ul|ol|td|th|tr|table|thead|tbody|h[1-6]|div|figure|figcaption|pre|br|aside|blockquote)\b[^>]*>/g, ' ')
    .replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Splits a rendered chapter into one search entry per h2/h3 section. */
function sectionsFromHtml(html) {
  const re = /<h([23]) id="([^"]+)">(?:<span class="num">([^<]*)<\/span>)?<span class="ht">([\s\S]*?)<\/span>[\s\S]*?<\/h\1>/g;
  const heads = [...html.matchAll(re)];
  return heads.map((m, i) => ({
    level: Number(m[1]),
    id: m[2],
    num: m[3] || '',
    title: htmlText(m[4]),
    text: htmlText(html.slice(m.index + m[0].length, i + 1 < heads.length ? heads[i + 1].index : html.length)),
  }));
}

function searchEntries(guide, lang, data) {
  const guideName = L[lang].guide[guide.tab];
  const page = `${lang}/${guide.id}.html`;
  const entries = [{ l: lang, g: guideName, p: page, a: 'top', n: '', t: htmlText(data.title), c: '', x: data.introText }];
  for (const ch of data.chapters) {
    const chapterTitle = htmlText(ch.title);
    for (const sec of sectionsFromHtml(ch.html)) {
      entries.push({ l: lang, g: guideName, p: page, a: sec.id, n: sec.num, t: sec.title, c: sec.level === 3 ? chapterTitle : '', x: sec.text });
    }
  }
  return entries;
}

function bar({ prefix, lang, guide, langLinks }) {
  const t = L[lang];
  const placeholder = guide ? t.search : `${L.en.search} · ${L.th.search}`;
  const search = `<div class="search" role="search">
    <input id="doc-search" type="search" placeholder="${placeholder}" aria-label="${placeholder}" autocomplete="off" spellcheck="false"
      role="combobox" aria-expanded="false" aria-controls="search-results" aria-autocomplete="list"
      data-no-results="${guide ? t.noResults : L.en.noResults}" data-results="${guide ? t.results : L.en.results}" data-clear="${t.clear}">
    <kbd class="search-key" aria-hidden="true">/</kbd>
    <div id="search-results" class="search-results" role="listbox" hidden></div>
  </div>`;
  const langSwitch = langLinks
    ? `<nav class="lang" aria-label="${t.langNav}">${['th', 'en'].map((l) => {
      const href = langLinks[l];
      if (!href) return `<span class="seg off" aria-disabled="true" title="${L.en.onlyEn} / ${L.th.onlyEn}">${L[l].short}</span>`;
      return `<a class="seg${l === lang ? ' on' : ''}" href="${href}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="true"' : ' data-keep-chapter'}>${L[l].short}</a>`;
    }).join('')}</nav>`
    : '';
  const contents = guide
    ? `<details class="toc-menu"><summary>${t.contents}</summary><ol>${guide.chapters.map((c) => `<li><a href="#${c.id}">${c.num ? `<span class="n">${c.num}</span>` : ''}${c.title}</a></li>`).join('')}</ol></details>`
    : '';
  return `<header class="bar">
  <a class="brand" href="${prefix}index.html"><img src="${prefix}images/utac-logo.jpg" alt="" width="28" height="28"><span><b>UTAC QA Calendar</b><small>QMS-CASS · DOCUMENTATION</small></span></a>
  ${search}
  <div class="bar-tools">${contents}${langSwitch}<button type="button" class="btn ink" data-print>${t.print}</button></div>
</header>`;
}

function page({ lang, title, prefix, body, bodyClass = '', searchScope = 'lang' }) {
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="scripts/build-docs.mjs">
<title>${esc(stripTags(title))}</title>
<link rel="icon" href="${prefix}images/utac-logo.jpg">
<link rel="stylesheet" href="${prefix}assets/docs.css">
<script src="${prefix}assets/search-index.js" defer></script>
<script src="${prefix}assets/docs.js" defer></script>
</head>
<body class="${bodyClass}" data-root="${prefix}" data-search-scope="${searchScope}">
<!-- Generated file. Edit the Markdown source and run: npm run docs -->
<a class="skip" href="#main">${L[lang].skip}</a>
${body}
</body>
</html>
`;
}

function guidePage(guide, lang, data) {
  const t = L[lang];
  const prefix = '../';
  const total = data.chapters.length;
  const guideName = t.guide[guide.tab];
  const langLinks = Object.fromEntries(['th', 'en'].map((l) => [l, guide.langs.includes(l) ? `../${l}/${guide.id}.html` : null]));

  const tabs = `<nav class="tabs" aria-label="${t.guidesNav}"><div class="tabs-in">${GUIDES.map((g) => {
    const l = g.langs.includes(lang) ? lang : 'en';
    const on = g.id === guide.id;
    return `<a class="tab${on ? ' on' : ''}" style="--c:${g.color}" href="../${l}/${g.id}.html"${on ? ' aria-current="page"' : ''}>${t.tab[g.tab]}</a>`;
  }).join('')}</div></nav>`;

  const rail = `<nav class="rail" aria-label="${t.chapters}"><a class="rail-home" href="#top">${guideName}</a><ol>${data.chapters.map((c, i) => `<li><a href="#${c.id}" data-ch="${i + 1}">${c.num ? `<span class="n">${c.num}</span>` : ''}<span>${c.title}</span></a></li>`).join('')}</ol></nav>`;

  const contents = `<ol class="contents">${data.chapters.map((c) => `<li><a href="#${c.id}"><span class="n">${c.num}</span><span class="ct"><span class="cn">${c.title}</span>${c.subs.length ? `<span class="cs">${c.subs.join(' · ')}</span>` : ''}</span></a></li>`).join('')}</ol>`;

  const runhead = (left) => `<div class="runhead"><span>${left}</span><span>${t.rev} ${data.rev}</span></div>`;

  const cover = `<section class="sheet cover" id="top" data-ch="0">
${runhead(guideName)}
<h1>${data.title}</h1>
${data.lede ? `<p class="lede">${data.lede}</p>` : ''}
${data.intro}
<h2 class="contents-title">${t.contents}</h2>
${contents}
</section>`;

  const sheets = data.chapters.map((c, i) => {
    const prev = data.chapters[i - 1];
    const next = data.chapters[i + 1];
    const foot = `<footer class="sheet-foot">${prev ? `<a href="#${prev.id}" rel="prev"><span class="dir">← ${t.prev}</span>${prev.title}</a>` : '<span></span>'}<span class="folio">${i + 1} / ${total}</span>${next ? `<a href="#${next.id}" rel="next"><span class="dir">${t.next} →</span>${next.title}</a>` : '<span></span>'}</footer>`;
    return `<section class="sheet" id="ch-${i + 1}" data-ch="${i + 1}">
${runhead(`${guideName} · ${c.num || i + 1}`)}
${c.html}
${foot}
</section>`;
  }).join('\n');

  const body = `${bar({ prefix, lang, guide: data, langLinks })}
<div class="desk">
${rail}
<main id="main" class="binder" style="--tab:${guide.color}">
${tabs}
${cover}
${sheets}
</main>
</div>`;
  return page({ lang, title: `${stripTags(data.title)} · UTAC QA Calendar`, prefix, body, bodyClass: lang === 'th' ? 'th' : '' });
}

function indexPage(all) {
  const rev = all.reduce((max, g) => Object.values(g.data).reduce((m, d) => (d.rev > m ? d.rev : m), max), '');
  const rows = GUIDES.map((g) => {
    const d = all.find((x) => x.guide.id === g.id).data;
    const en = d.en, th = d.th;
    const enLede = stripTags(en.lede).split('. ')[0].replace(/\.$/, '') + '.';
    const links = ['th', 'en'].map((l) => (d[l]
      ? `<a href="${l}/${g.id}.html" hreflang="${l}" lang="${l}">${L[l].name}</a>`
      : `<span class="na" title="${L.en.onlyEn}">${L[l].name} —</span>`)).join('');
    return `<li style="--c:${g.color}">
  <span class="spine" aria-hidden="true">${L.en.tab[g.tab]}</span>
  <div class="entry"><h2><a href="${d.th ? 'th' : 'en'}/${g.id}.html">${stripTags(en.title)}</a>${th ? ` <span lang="th" class="alt">${stripTags(th.title)}</span>` : ''}</h2>
  <p>${enLede}</p>
  <ol class="chap">${en.chapters.map((c) => `<li><span class="n">${c.num}</span>&nbsp;${stripTags(c.title)}</li>`).join(' ')}</ol></div>
  <div class="open">${links}</div>
</li>`;
  }).join('\n');

  const body = `${bar({ prefix: '', lang: 'en', guide: null, langLinks: null })}
<div class="desk solo">
<main id="main" class="binder" style="--tab:#15191e">
<section class="sheet cover" id="top">
<div class="runhead"><span>Documentation · Index</span><span>Rev ${rev}</span></div>
<h1>UTAC QA Calendar documentation</h1>
<p class="lede-th" lang="th">เอกสารประกอบระบบ UTAC QA Calendar (QMS-CASS)</p>
<p class="lede">Three binders, one per audience. Open the one that matches your job; every guide comes in Thai and English.</p>
<ol class="shelf">
${rows}
</ol>
<h2 class="contents-title">About these documents</h2>
<div class="about">
<p>The Markdown files in <code>docs/th/</code> and <code>docs/en/</code> are the source. These HTML pages are generated from them by <code>npm run docs</code>; do not edit the HTML by hand. Screenshots live in <code>docs/images/</code>.</p>
<p lang="th">ไฟล์ Markdown ใน <code>docs/th/</code> และ <code>docs/en/</code> คือต้นฉบับ หน้า HTML สร้างจากไฟล์เหล่านี้ด้วย <code>npm run docs</code> อย่าแก้ไฟล์ HTML โดยตรง เมื่อแก้ภาษาหนึ่ง ให้แก้อีกภาษาให้ตรงกัน</p>
</div>
</section>
</main>
</div>`;
  return page({ lang: 'en', title: 'UTAC QA Calendar documentation', prefix: '', body, bodyClass: 'index', searchScope: 'all' });
}

const all = GUIDES.map((guide) => {
  const data = {};
  for (const lang of guide.langs) data[lang] = parseGuide(guide, lang);
  return { guide, data };
});

const written = [];
for (const { guide, data } of all) {
  for (const lang of guide.langs) {
    const out = join(DOCS, lang, `${guide.id}.html`);
    writeFileSync(out, guidePage(guide, lang, data[lang]));
    written.push(relative(ROOT, out));
  }
}
writeFileSync(join(DOCS, 'index.html'), indexPage(all));
written.push('docs/index.html');

const index = all.flatMap(({ guide, data }) => guide.langs.map((lang) => searchEntries(guide, lang, data[lang]))).flat();
writeFileSync(join(DOCS, 'assets', 'search-index.js'),
  `/* Generated by scripts/build-docs.mjs: full-text search index (loaded as a script so it works from file://). */\nwindow.DOCS_SEARCH = ${JSON.stringify(index)};\n`);
written.push('docs/assets/search-index.js');

for (const f of written) if (!existsSync(join(ROOT, f))) throw new Error(`missing ${f}`);
console.log(`Built ${written.length - 1} pages and a search index of ${index.length} sections:\n  ${written.join('\n  ')}`);
