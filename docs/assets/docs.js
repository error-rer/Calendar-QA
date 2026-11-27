// UTAC QA Calendar documentation: print, copy buttons, and chapter tracking.
(() => {
  document.querySelectorAll('[data-print]').forEach((b) => b.addEventListener('click', () => window.print()));

  document.querySelectorAll('.code .copy').forEach((btn) => {
    const label = btn.textContent;
    btn.addEventListener('click', async () => {
      const code = btn.parentElement.querySelector('code');
      try {
        await navigator.clipboard.writeText(code.innerText);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(code);
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('copy');
        sel.removeAllRanges();
      }
      btn.textContent = btn.dataset.copied;
      btn.classList.add('done');
      setTimeout(() => { btn.textContent = label; btn.classList.remove('done'); }, 1600);
    });
  });

  // Wide tables and diagrams scroll sideways on small screens: fade the cut edge and say so.
  const hintText = document.documentElement.lang === 'th' ? 'เลื่อนไปทางขวาเพื่อดูเพิ่ม →' : 'Scroll sideways for more →';
  document.querySelectorAll('.table, figure.diagram .shot').forEach((box) => {
    const hint = document.createElement('p');
    hint.className = 'scroll-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = hintText;
    (box.classList.contains('shot') ? box.parentElement : box.parentElement).insertBefore(hint, box.nextSibling);
    const update = () => {
      const overflow = box.scrollWidth - box.clientWidth > 2;
      box.classList.toggle('scrolls', overflow);
      box.classList.toggle('at-end', overflow && box.scrollLeft + box.clientWidth >= box.scrollWidth - 2);
    };
    box.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    if (document.fonts) document.fonts.ready.then(update);
    update();
  });

  // ---------- Full-text search ----------
  const input = document.getElementById('doc-search');
  const list = document.getElementById('search-results');
  const index = window.DOCS_SEARCH || [];
  const root = document.body.dataset.root || '';
  const scope = document.body.dataset.searchScope === 'all' ? null : document.documentElement.lang;
  const norm = (s) => s.toLocaleLowerCase();
  const terms = (q) => norm(q).split(/\s+/).filter(Boolean);
  const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const markTerms = (text, ts) => {
    let html = escapeHtml(text);
    for (const t of [...ts].sort((x, y) => y.length - x.length)) {
      const re = new RegExp(escapeHtml(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      html = html.replace(re, (m) => `<mark>${m}</mark>`);
    }
    return html.replace(/<mark>(<mark>)+/g, '<mark>').replace(/(<\/mark>)+<\/mark>/g, '</mark>');
  };
  const snippet = (text, ts) => {
    const lower = norm(text);
    let at = -1;
    for (const t of ts) { const i = lower.indexOf(t); if (i !== -1 && (at === -1 || i < at)) at = i; }
    if (at === -1) return text.slice(0, 140) + (text.length > 140 ? '…' : '');
    let start = Math.max(0, at - 50);
    // Start on a word boundary so Thai text never begins mid-character cluster.
    if (start > 0 && window.Intl && Intl.Segmenter) {
      const lang = document.documentElement.lang === 'th' ? 'th' : 'en';
      for (const seg of new Intl.Segmenter(lang, { granularity: 'word' }).segment(text.slice(Math.max(0, start - 30), at + 1))) {
        const pos = Math.max(0, start - 30) + seg.index;
        if (pos >= start) { start = pos; break; }
      }
    }
    while (start > 0 && /\p{M}/u.test(text[start])) start--;
    const end = Math.min(text.length, at + 110);
    return (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
  };
  const search = (q) => {
    const ts = terms(q);
    if (!ts.length) return { ts, hits: [] };
    const hits = [];
    for (const e of index) {
      if (scope && e.l !== scope) continue;
      const title = norm(`${e.n} ${e.t}`);
      const body = norm(`${e.c} ${e.x}`);
      if (!ts.every((t) => title.includes(t) || body.includes(t))) continue;
      let score = 0;
      for (const t of ts) {
        if (title.includes(t)) score += 10;
        score += Math.min(body.split(t).length - 1, 5);
      }
      hits.push({ e, score });
    }
    hits.sort((a, b) => b.score - a.score);
    return { ts, hits: hits.slice(0, 12) };
  };

  if (input && list) {
    let active = -1;
    let items = [];
    const setOpen = (open) => {
      list.hidden = !open;
      input.setAttribute('aria-expanded', String(open));
      if (!open) { active = -1; input.removeAttribute('aria-activedescendant'); }
    };
    const highlight = (i) => {
      items.forEach((el, j) => el.setAttribute('aria-selected', String(i === j)));
      active = i;
      if (items[i]) { input.setAttribute('aria-activedescendant', items[i].id); items[i].scrollIntoView({ block: 'nearest' }); }
    };
    const render = () => {
      const q = input.value.trim();
      if (!q) { list.innerHTML = ''; setOpen(false); return; }
      const { ts, hits } = search(q);
      if (!hits.length) {
        list.innerHTML = `<p class="search-empty">${escapeHtml(input.dataset.noResults || 'No results for')} “${escapeHtml(q)}”</p>`;
        items = [];
      } else {
        list.innerHTML = hits.map(({ e }, i) => {
          const href = `${root}${e.p}?q=${encodeURIComponent(q)}#${e.a}`;
          const where = [e.g, e.l.toUpperCase(), e.n].filter(Boolean).join(' · ');
          const context = e.c ? `<span class="sr-chapter">${escapeHtml(e.c)}</span>` : '';
          return `<a class="sr-item" id="sr-${i}" role="option" aria-selected="false" href="${href}">
            <span class="sr-where">${escapeHtml(where)}</span>
            <span class="sr-title">${markTerms(e.t, ts)}</span>${context}
            <span class="sr-snip">${markTerms(snippet(e.x, ts), ts)}</span></a>`;
        }).join('') + `<p class="search-count">${hits.length}${hits.length === 12 ? '+' : ''} ${escapeHtml(input.dataset.results || 'results')}</p>`;
        items = [...list.querySelectorAll('.sr-item')];
      }
      setOpen(true);
      active = -1;
    };
    input.addEventListener('input', render);
    input.addEventListener('focus', () => { if (input.value.trim()) render(); });
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown' && items.length) { ev.preventDefault(); highlight(Math.min(active + 1, items.length - 1)); }
      else if (ev.key === 'ArrowUp' && items.length) { ev.preventDefault(); highlight(Math.max(active - 1, 0)); }
      else if (ev.key === 'Enter') { const target = items[active] || items[0]; if (target) { ev.preventDefault(); target.click(); } }
      else if (ev.key === 'Escape') { if (!list.hidden) { setOpen(false); } else { input.value = ''; input.blur(); } }
    });
    document.addEventListener('click', (ev) => { if (!ev.target.closest('.search')) setOpen(false); });
    document.addEventListener('keydown', (ev) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
      if (ev.key === '/' && !typing && !ev.metaKey && !ev.ctrlKey) { ev.preventDefault(); input.focus(); input.select(); }
    });
  }

  // Arriving from a search result: highlight the matched words on this page (Esc clears).
  const arrived = new URLSearchParams(location.search).get('q');
  if (arrived && window.CSS && CSS.highlights && window.Highlight) {
    const ts = terms(arrived);
    const ranges = [];
    const main = document.getElementById('main');
    const walker = main && document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement.closest('script, style, .copy, .anchor') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let n = walker && walker.nextNode(); n; n = walker.nextNode()) {
      const lower = norm(n.nodeValue);
      for (const t of ts) {
        for (let i = lower.indexOf(t); i !== -1; i = lower.indexOf(t, i + t.length)) {
          const r = new Range();
          r.setStart(n, i);
          r.setEnd(n, i + t.length);
          ranges.push(r);
        }
      }
    }
    if (ranges.length) {
      CSS.highlights.set('doc-search', new Highlight(...ranges));
      document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && document.activeElement !== input) CSS.highlights.delete('doc-search');
      });
    }
  }

  // Close the contents menu after choosing a chapter.
  document.querySelectorAll('.toc-menu a').forEach((a) => a.addEventListener('click', () => a.closest('details').removeAttribute('open')));

  // Track the chapter in view: mark it in the rail and keep it when switching language.
  const sheets = [...document.querySelectorAll('.sheet[data-ch]')];
  const rail = [...document.querySelectorAll('.rail a[data-ch]')];
  const keep = [...document.querySelectorAll('[data-keep-chapter]')];
  let current = -1;
  const set = (n) => {
    if (n === current) return;
    current = n;
    rail.forEach((a) => (Number(a.dataset.ch) === n ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    keep.forEach((a) => {
      const base = a.getAttribute('href').split('#')[0];
      a.setAttribute('href', n > 0 ? `${base}#ch-${n}` : base);
    });
  };
  if (sheets.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) set(Number(e.target.dataset.ch)); });
    }, { rootMargin: '-30% 0px -69% 0px' });
    sheets.forEach((s) => io.observe(s));
  }
})();
