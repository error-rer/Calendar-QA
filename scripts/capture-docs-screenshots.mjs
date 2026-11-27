#!/usr/bin/env node
// Captures the documentation screenshots in docs/images/ from the running dev app.
//
//   1. npm run dev            (Vite on http://localhost:5173, browser-local dev mode)
//   2. npm run docs:screenshots
//
// The app is loaded with FICTIONAL demonstration data (made-up companies and people), dated
// relative to today so every status colour appears. Requests to /api/* are answered by this
// script, so nothing touches a real Worker or D1 database. Requires Google Chrome or Chromium;
// set CHROME_PATH if it is not in a standard location. Set DOCS_APP_URL to use another port.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.DOCS_SHOTS_DIR || join(ROOT, 'docs', 'images');
const APP = process.env.DOCS_APP_URL || 'http://localhost:5173/';
const VIEW = { width: 1440, height: 900, deviceScaleFactor: 2 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- demonstration data, relative to the current week ----------
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const now = new Date();
const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
const day = (offset) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + offset);
const ago = (days, hour = 9) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - days, hour).toISOString();
const EPOCH = new Date(2026, 5, 29); // must match ASSIGNMENT_WEEK_EPOCH in src/data.ts
const slot = (d) => {
  const diff = Math.round((d - EPOCH) / 86400000);
  return { week: Math.floor(diff / 7), day: (d.getDay() + 6) % 7 };
};

const engineers = [
  { id: 'e1', name: 'Priya Nair', role: 'QA Engineer', site: 'UTL2A', department: 'QA', subDepartments: [] },
  { id: 'e2', name: 'Anan Kittisak', role: 'QA Lead', site: 'UTL1', department: 'QA', subDepartments: [] },
  { id: 'e3', name: 'Malee Srisuk', role: 'QA Engineer', site: 'UTL3', department: 'QA', subDepartments: [] },
  { id: 'e4', name: 'Wichai Thongdee', role: 'QA Engineer', site: 'UTL3A', department: 'QA', subDepartments: [] },
  { id: 'e5', name: 'Somchai Prasert', role: 'Process Engineer', site: 'UTL1', department: 'Non-QA', subDepartments: [] },
  { id: 'e6', name: 'Nicha Wongsa', role: 'QA Engineer', site: 'UTL2B', department: 'QA', subDepartments: [] },
];
// [id, type, first day, last day (offsets from this Monday), host, fields, created, updated, results]
const SERIES = [
  ['s1', 'customer', 0, 1, 'e2', { standard: 'IATF16949', site: 'UTL1', customer: 'Northwind Semiconductor', endCustomer: 'Northwind Auto', purpose: 'Annual Audit', targetPackage: 'QFN', customerNames: 'K. Fischer' }, ago(25), null, { UTL1: { major: 0, minor: 2, ofi: 1, obs: 0, findings: 3 } }],
  ['s2', 'customer', 2, 2, 'e1', { standard: 'ISO9001', site: 'UTL2', customer: 'Contoso Devices', endCustomer: 'Contoso Mobile', purpose: '', targetPackage: 'BGA', customerNames: 'L. Moreau' }, ago(1), null, null],
  ['s3', 'customer', 3, 4, 'e3', { standard: 'ISO9001', site: 'UTL3', customer: 'Fabrikam Micro', endCustomer: 'Fabrikam Health', purpose: 'Process Audit', targetPackage: 'WLCSP', customerNames: 'R. Ahmed' }, ago(17), ago(2, 14), null],
  ['s4', 'internal', 4, 4, 'e1', { standard: 'ISO14001', site: 'UTL2A', auditCategory: 'Environmental', area: 'Wastewater / Chemical store' }, ago(1, 16), null, null],
  ['s5', 'customer', -6, -5, 'e4', { standard: 'ISO9001', site: 'UTL3A', customer: 'Tailspin Mobile', endCustomer: 'Tailspin Wearables', purpose: 'Supplier Qualification', targetPackage: 'SiP', customerNames: 'A. Novak' }, ago(26), null, null],
  ['s6', 'internal', -13, -12, 'e2', { standard: 'IATF16949', site: 'UTL1', auditCategory: 'Process', area: 'Die attach / Wire bond' }, ago(38), null, { UTL1: { major: 0, minor: 1, ofi: 2, obs: 1, findings: 4 } }],
  ['s7', 'customer', 9, 10, 'e6', { standard: 'IATF16949', site: 'UTL3T', customer: 'Litware Power', endCustomer: 'Litware EV', purpose: 'Annual Audit', targetPackage: 'Power QFN', customerNames: 'J. Park' }, ago(1, 11), null, null],
  ['s8', 'customer', -19, -18, 'e6', { standard: 'ISO9001', site: 'UTL2B', customer: 'Adatum Sensors', endCustomer: 'Adatum Industrial', purpose: 'Product Audit', targetPackage: 'LGA', customerNames: 'M. Rossi' }, ago(43), null, { UTL2B: { major: 0, minor: 0, ofi: 1, obs: 2, findings: 3 } }],
];

function buildData() {
  const orders = [];
  const assignments = [];
  let n = 1;
  for (const [sid, type, from, to, eng, f, createdAt, updatedAt, results] of SERIES) {
    const host = engineers.find((e) => e.id === eng).name;
    const isCS = type === 'customer';
    orders.push({ id: 'o_' + sid, code: 'DEMO-' + sid.slice(1).padStart(3, '0'), customer: f.customer || '', product: f.endCustomer || f.area || '', plant: f.site, purpose: f.purpose || '' });
    for (let off = from; off <= to; off++) {
      const d = day(off);
      if (d.getDay() % 6 === 0) continue;
      // Same shape as assignmentOut() in worker/index.ts.
      assignments.push({
        id: 'a' + n++, eng, order: 'o_' + sid, seriesId: 'ser_' + sid, groupId: 'ser_' + sid, ...slot(d),
        site: f.site, site1: f.site, site2: f.site,
        customer: isCS ? f.customer : '', endCustomer: isCS ? f.endCustomer : '',
        targetPackage: isCS ? f.targetPackage : '', customerNames: isCS ? f.customerNames : '',
        auditCategory: isCS ? '' : f.auditCategory, area: isCS ? '' : f.area, purpose: f.purpose || '',
        standard: f.standard, auditor: host, auditor1: host, auditor2: host, qmsHost: host, department: 'QA',
        createdAt, ...(updatedAt ? { updatedAt } : {}), ...(results ? { results } : {}),
      });
    }
  }
  const rule = (offset, type, note, lockedSites) => ({ date: iso(day(offset)), type, note, ...(lockedSites ? { lockedSites } : {}) });
  const customHolidays = [
    rule(7, 'NO_CUSTOMER_AUDITS', 'Management review day'),
    rule(28, 'SHUTDOWN_PLANT', 'Planned maintenance', ['UTL1', 'UTL2']),
    rule(29, 'SHUTDOWN_PLANT', 'Planned maintenance', ['UTL1', 'UTL2']),
    rule(30, 'SHUTDOWN_PLANT', 'Planned maintenance', ['UTL1', 'UTL2']),
  ];
  const jl = { name: 'Jordan Lee', avatarInitials: 'JL' };
  const activityLogs = [
    { id: 'l6', timestamp: ago(1, 16), user: jl, actionType: 'CREATE', entityType: 'APPOINTMENT', description: 'Created Internal Audit ISO14001 at UTL2A' },
    { id: 'l5', timestamp: ago(1, 11), user: jl, actionType: 'CREATE', entityType: 'APPOINTMENT', description: 'Created Customer Audit for Litware Power at UTL3T' },
    { id: 'l4', timestamp: ago(2, 14), user: jl, actionType: 'UPDATE', entityType: 'APPOINTMENT', description: 'Updated Customer Audit for Fabrikam Micro: purpose set to Process Audit' },
    { id: 'l3', timestamp: ago(1, 10), user: jl, actionType: 'CREATE', entityType: 'APPOINTMENT', description: 'Created Customer Audit for Contoso Devices at UTL2' },
    { id: 'l2', timestamp: ago(3, 15), user: jl, actionType: 'MANAGE_ITEM', entityType: 'HOLIDAY', description: 'Added Shutdown Plant for UTL1, UTL2' },
    { id: 'l1', timestamp: ago(3, 9), user: { name: 'Priya Nair', avatarInitials: 'PN' }, actionType: 'UPDATE', entityType: 'APPOINTMENT', description: 'Recorded audit results for Northwind Semiconductor at UTL1' },
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return { engineers, orders, assignments, comments: {}, activity: [], activityLogs, customHolidays };
}

// ---------- browser ----------
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(p));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH to a Chrome or Chromium executable.');
  return found;
}

async function main() {
  try {
    await fetch(APP);
  } catch {
    throw new Error(`The app is not reachable at ${APP}. Start it first with: npm run dev`);
  }
  const profile = mkdtempSync(join(tmpdir(), 'qa-docs-shots-'));
  const chrome = spawn(findChrome(), ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  try {
    const portFile = join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !existsSync(portFile); i++) await sleep(100);
    const [port, path] = readFileSync(portFile, 'utf8').trim().split('\n');
    await capture(`ws://127.0.0.1:${port}${path}`);
  } finally {
    chrome.kill();
    await sleep(300);
    rmSync(profile, { recursive: true, force: true });
  }
}

async function capture(wsUrl) {
  const data = buildData();
  const user = { id: 'usr_demo', username: 'jordan.lee', name: 'Jordan Lee', role: 'admin' };
  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', j, { once: true }); });
  let seq = 0;
  const pending = new Map();
  const errors = [];
  let serveApi = false;
  let sessionId;
  const send = (method, params = {}, sid) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sid ? { sessionId: sid } : {}) }));
  });
  const p = (m, pa) => send(m, pa, sessionId);
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
      return;
    }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    if (msg.method === 'Fetch.requestPaused') {
      // Answer /api/* the way the Worker would, so the dev app shows the demo data without errors.
      const { requestId, request } = msg.params;
      const route = new URL(request.url).pathname;
      let status = 200;
      let body = { ok: true };
      if (!serveApi) { status = 401; body = { error: 'Not signed in' }; }
      else if (route === '/api/auth/session') body = { user };
      else if (route === '/api/state') body = data;
      p('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(body)).toString('base64') }).catch(() => {});
    }
  });

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  ({ sessionId } = await send('Target.attachToTarget', { targetId, flatten: true }));
  await p('Page.enable');
  await p('Runtime.enable');
  await p('Fetch.enable', { patterns: [{ urlPattern: '*/api/*', requestStage: 'Request' }] });
  await p('Emulation.setDeviceMetricsOverride', { ...VIEW, mobile: false });

  const evaluate = async (expression) => (await p('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;
  const load = async () => { await p('Page.navigate', { url: APP }); await sleep(2500); };
  const click = async (text) => {
    const ok = await evaluate(`(() => {
      const want = ${JSON.stringify(text)};
      const strip = (s) => s.trim().replace(/^[^A-Za-z0-9\\u0E00-\\u0E7F]+/, '');
      const hits = [...document.querySelectorAll('button, a, [role=button], [role=tab], label, span, div')]
        .filter((e) => e.offsetParent !== null && (e.textContent.trim() === want || (e.tagName === 'BUTTON' && strip(e.textContent) === want)));
      if (!hits.length) return false;
      hits.sort((a, b) => a.querySelectorAll('*').length - b.querySelectorAll('*').length);
      (hits[0].closest('button, a, [role=button], [role=tab]') || hits[0]).click();
      return true;
    })()`);
    if (!ok) throw new Error(`Could not find "${text}" on the page. The UI may have changed; update scripts/capture-docs-screenshots.mjs.`);
    await sleep(800);
  };
  const shot = async (name, clip) => {
    await sleep(400);
    const params = { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) };
    const { data: png } = await p('Page.captureScreenshot', params);
    writeFileSync(join(OUT, `${name}.png`), Buffer.from(png, 'base64'));
    console.log(`  docs/images/${name}.png`);
  };
  const pageText = () => evaluate('document.body.innerText');

  console.log('Capturing documentation screenshots (demonstration data):');
  await load();
  await evaluate('localStorage.clear(); sessionStorage.clear(); true');
  await load();
  await shot('login');

  await evaluate(`localStorage.setItem('calendar_qa_remembered_user', ${JSON.stringify(JSON.stringify(user))}); true`);
  serveApi = true;
  await load();
  await shot('app-header', { x: 0, y: 0, width: VIEW.width, height: 58 });
  await click('Month');
  await shot('schedule-month');
  await click('Week');
  for (let i = 0; i < 12 && !(await pageText()).includes('CURRENT WEEK'); i++) {
    const forward = !/WK BACK/.test(await pageText()) ? '‹' : '›';
    await click(forward);
  }
  await shot('schedule-week');

  await click('New appointment');
  const rect = await evaluate(`(() => {
    const label = [...document.querySelectorAll('*')].find((e) => e.children.length <= 1 && /^STANDARD/.test(e.textContent.trim()) && e.offsetParent);
    const option = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && /^(IATF16949|ISO9001|ISO14001)$/.test(e.textContent.trim()) && e.offsetParent).pop();
    const input = [...document.querySelectorAll('input')].find((e) => /standard/i.test(e.placeholder || '') && e.offsetParent);
    if (!label || !option || !input) return null;
    const box = (input.closest('div') || input).getBoundingClientRect();
    const top = label.getBoundingClientRect().top - 14;
    const bottom = option.getBoundingClientRect().bottom + 24;
    return { x: box.left - 16, y: top, width: box.width + 32, height: bottom - top };
  })()`);
  if (rect) await shot('multi-select', rect);
  // Close the auto-opened dropdown with a press outside it, as a user would.
  await evaluate(`(() => {
    document.activeElement && document.activeElement.blur();
    const tip = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /Press Tab/.test(e.textContent) && e.offsetParent);
    const target = tip || document.body;
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    return true;
  })()`);
  await sleep(500);
  await shot('form-customer-audit');
  await click('Cancel');

  await click('Table');
  await shot('table');
  await click('Summary');
  await shot('summary');
  await click('Manage');
  await shot('manage-qms-host');
  await click('Holidays');
  await shot('manage-holidays');
  await click('History');
  await shot('history');

  if (errors.length) console.warn('Page errors:', errors.slice(0, 5));
  await send('Target.closeTarget', { targetId });
  ws.close();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
