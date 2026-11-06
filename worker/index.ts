interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}


function normalizeSite(site: string): string {
  if (!site) return '';
  const s = site.trim();
  const match = s.match(/^u(1|2|3|2a|2b|3a|3t)$/i);
  if (match) return 'UTL' + match[1].toUpperCase();
  const utlMatch = s.match(/^utl(1|2|3|2a|2b|3a|3t)$/i);
  if (utlMatch) return 'UTL' + utlMatch[1].toUpperCase();
  return s;
}

const SITE_ORDER = [
  'UTL1',
  'UTL2',
  'UTL2A',
  'UTL2B',
  'UTL3',
  'UTL3A',
  'UTL3B',
  'UTL3T',
] as const;

function getSiteOrderIndex(site: string): number {
  if (!site) return 999;
  const norm = normalizeSite(site).toUpperCase();
  const idx = (SITE_ORDER as readonly string[]).indexOf(norm);
  return idx !== -1 ? idx : 999;
}

function sortSites(sites: string[]): string[] {
  if (!sites || sites.length <= 1) return sites ? [...sites] : [];
  return [...sites].sort((a, b) => {
    const idxA = getSiteOrderIndex(a);
    const idxB = getSiteOrderIndex(b);
    if (idxA !== idxB) {
      return idxA - idxB;
    }
    return normalizeSite(a).localeCompare(normalizeSite(b));
  });
}

function normalizeSites(raw: string): string {
  if (!raw) return '';
  const parts = raw
    .split(/[/,]/)
    .map((s) => normalizeSite(s.trim()))
    .filter(Boolean);
  if (parts.length === 0) return '';
  const uniqueSites = Array.from(new Set(parts));
  const sorted = sortSites(uniqueSites);
  return sorted.join('/');
}

function normalizeAuditResults(results: any): Record<string, any> {
  if (!results || typeof results !== 'object') return {};
  const out: Record<string, any> = {};
  for (const [key, val] of Object.entries(results)) {
    if (!val) continue;
    const normKey = normalizeSite(key);
    if (!out[normKey]) {
      out[normKey] = val;
    } else {
      out[normKey] = {
        major: (Number((out[normKey] as any).major) || 0) + (Number((val as any).major) || 0),
        minor: (Number((out[normKey] as any).minor) || 0) + (Number((val as any).minor) || 0),
        ofi: (Number((out[normKey] as any).ofi) || 0) + (Number((val as any).ofi) || 0),
        obs: (Number((out[normKey] as any).obs) || 0) + (Number((val as any).obs) || 0),
        findings: (Number((out[normKey] as any).findings) || 0) + (Number((val as any).findings) || 0),
      };
    }
  }
  return out;
}

function engineerOut(r: any) {
  const dept = (r.host_department === 'Non-QA' || r.department === 'Non-QA')
    ? 'Non-QA'
    : ((r.host_department === 'QA' || r.department === 'QA') ? 'QA' : undefined);
  const site = r.site || (r.department && r.department !== 'QA' && r.department !== 'Non-QA' ? r.department : 'UTL1');
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    site,
    department: dept,
    subDepartments: JSON.parse(r.sub_departments || '[]'),
  };
}

function assignmentOut(r: any) {
  let parsedResults = {};
  if (r.results) {
    try {
      parsedResults = typeof r.results === 'string' ? JSON.parse(r.results) : r.results;
    } catch {}
  }
  return {
    id: r.id, eng: r.eng, order: r.order_id, day: r.day, week: r.week,
    site1: normalizeSites(r.site1 || ''), customer: r.customer, endCustomer: r.end_customer, auditor1: r.auditor1, purpose: r.purpose,
    targetPackage: r.target_package || '', customerNames: r.customer_names || '', auditCategory: r.audit_category || '',
    site2: normalizeSites(r.site2 || ''), area: r.area, auditor2: r.auditor2, department1: r.department1, department2: r.department2,
    department: (r.department === 'Non-QA' ? 'Non-QA' : r.department === 'QA' ? 'QA' : undefined) as any,
    major: r.major, minor: r.minor, ofi: r.ofi, request: r.request, utl1: r.utl1, utl2: r.utl2, utl3: r.utl3,
    results: normalizeAuditResults(parsedResults),
    createdAt: r.created_at || (r.created_at_num ? String(r.created_at_num) : undefined),
    updatedAt: r.updated_at || undefined,
  };
}

let migrationChecked = false;
async function ensureAssignmentColumns(DB: D1Database) {
  if (migrationChecked) return;
  try {
    await DB.prepare('ALTER TABLE assignments ADD COLUMN target_package TEXT NOT NULL DEFAULT ""').run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE assignments ADD COLUMN customer_names TEXT NOT NULL DEFAULT ""').run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE assignments ADD COLUMN audit_category TEXT NOT NULL DEFAULT ""').run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE assignments ADD COLUMN department TEXT NOT NULL DEFAULT "QA"').run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE assignments ADD COLUMN results TEXT NOT NULL DEFAULT "{}"').run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE assignments ADD COLUMN created_at TEXT NOT NULL DEFAULT ""').run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE assignments ADD COLUMN updated_at TEXT NOT NULL DEFAULT ""').run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE engineers ADD COLUMN site TEXT NOT NULL DEFAULT "UTL1"').run();
  } catch {}
  try {
    await DB.prepare('ALTER TABLE engineers ADD COLUMN host_department TEXT NOT NULL DEFAULT "QA"').run();
  } catch {}
  try {
    await DB.prepare("UPDATE options SET value = 'UTL1' WHERE category = 'site_code' AND value = 'U1'").run();
    await DB.prepare("UPDATE options SET value = 'UTL2' WHERE category = 'site_code' AND value = 'U2'").run();
    await DB.prepare("UPDATE options SET value = 'UTL2A' WHERE category = 'site_code' AND value = 'U2A'").run();
    await DB.prepare("UPDATE options SET value = 'UTL2B' WHERE category = 'site_code' AND value = 'U2B'").run();
    await DB.prepare("UPDATE options SET value = 'UTL3' WHERE category = 'site_code' AND value = 'U3'").run();
    await DB.prepare("UPDATE options SET value = 'UTL3A' WHERE category = 'site_code' AND value = 'U3A'").run();
    await DB.prepare("UPDATE options SET value = 'UTL3T' WHERE category = 'site_code' AND value = 'U3T'").run();
  } catch {}
  migrationChecked = true;
}

async function handleApi(request: Request, env: Env, path: string): Promise<Response> {
  const method = request.method.toUpperCase();
  const DB = env.DB;

  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const body = method === 'GET' || method === 'HEAD' ? null : await request.json().catch(() => null);

  try {
    await ensureAssignmentColumns(DB);

    // --- GET /api/state (full data dump for initial load) ---
    if (method === 'GET' && path === 'state') {
      const [engineers, plants, activePlantsRows, orders, assignments, comments, activity, optionsRows] = await Promise.all([
        DB.prepare('SELECT * FROM engineers').all(),
        DB.prepare('SELECT * FROM plants').all(),
        DB.prepare('SELECT * FROM active_plants').all(),
        DB.prepare('SELECT * FROM orders').all(),
        DB.prepare('SELECT * FROM assignments').all(),
        DB.prepare('SELECT * FROM comments').all(),
        DB.prepare('SELECT * FROM activity ORDER BY rowid DESC LIMIT 9').all(),
        DB.prepare('SELECT * FROM options').all(),
      ]);

      const activePlants: Record<string, boolean> = {};
      for (const row of activePlantsRows.results as any[]) activePlants[row.plant_id] = !!row.active;

      const purposeOptions: string[] = [];
      const customerDepartmentOptions: string[] = [];
      const internalDepartmentOptions: string[] = [];
      const departmentOptions: string[] = [];
      const siteCodeOptions: string[] = [];
      const siteColors: Record<string, string> = {};
      const customerOptions: string[] = [];
      const endCustomerOptions: string[] = [];
      const auditorOptions: string[] = [];
      const targetPackageOptions: string[] = [];
      const customerNameOptions: string[] = [];
      const auditCategoryOptions: string[] = [];
      for (const row of (optionsRows.results as any[] || [])) {
        if (row.category === 'purpose') purposeOptions.push(row.value);
        else if (row.category === 'customer_department') customerDepartmentOptions.push(row.value);
        else if (row.category === 'internal_department') internalDepartmentOptions.push(row.value);
        else if (row.category === 'department') departmentOptions.push(row.value);
        else if (row.category === 'site_code') {
          const norm = normalizeSite(row.value);
          if (!siteCodeOptions.includes(norm)) siteCodeOptions.push(norm);
          if (row.meta) {
            siteColors[norm] = row.meta;
            siteColors[row.value] = row.meta;
          }
        } else if (row.category === 'customer_name') {
          customerOptions.push(row.value);
        } else if (row.category === 'end_customer') {
          endCustomerOptions.push(row.value);
        } else if (row.category === 'auditor') {
          auditorOptions.push(row.value);
        } else if (row.category === 'target_package') {
          targetPackageOptions.push(row.value);
        } else if (row.category === 'customer_names' || row.category === 'customer_name_item') {
          customerNameOptions.push(row.value);
        } else if (row.category === 'audit_category') {
          auditCategoryOptions.push(row.value);
        }
      }

      return json({
        engineers: (engineers.results as any[]).map(engineerOut),
        plants: plants.results,
        activePlants,
        orders: orders.results,
        assignments: (assignments.results as any[]).map(assignmentOut),
        comments: (comments.results as any[]).reduce((acc, r) => {
          (acc[r.assignment_id] ||= []).push({ id: r.id, who: r.who, initials: r.initials, text: r.text, ago: r.ago, color: r.color });
          return acc;
        }, {} as Record<string, any[]>),
        activity: activity.results,
        purposeOptions,
        customerDepartmentOptions,
        internalDepartmentOptions,
        departmentOptions: departmentOptions.length > 0 ? departmentOptions : ['QA', 'Non-QA'],
        siteCodeOptions,
        siteColors,
        customerOptions,
        endCustomerOptions,
        auditorOptions,
        targetPackageOptions,
        customerNameOptions,
        auditCategoryOptions,
      });
    }

    // --- engineers ---
    if (method === 'GET' && path === 'engineers') {
      const { results } = await DB.prepare('SELECT * FROM engineers').all();
      return json((results as any[]).map(engineerOut));
    }
    if (method === 'POST' && path === 'engineers') {
      const { id, name, role, site, department, subDepartments } = body || {};
      const sd = JSON.stringify(subDepartments || []);
      const hostDept = department === 'Non-QA' ? 'Non-QA' : (department === 'QA' ? 'QA' : '');
      const engSite = site || 'UTL1';
      await DB.prepare('INSERT INTO engineers (id, name, role, department, site, host_department, sub_departments) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(id, name || '', role || '', hostDept, engSite, hostDept, sd).run();
      return json({ id, name, role, site: engSite, department: hostDept || undefined, subDepartments: subDepartments || [] }, 201);
    }
    const engMatch = path.match(/^engineers\/(.+)$/);
    if (engMatch && method === 'PUT') {
      const { name, role, site, department, subDepartments } = body || {};
      const hostDept = department === 'Non-QA' ? 'Non-QA' : (department === 'QA' ? 'QA' : '');
      const engSite = site || 'UTL1';
      await DB.prepare('UPDATE engineers SET name = ?, role = ?, department = ?, site = ?, host_department = ?, sub_departments = ? WHERE id = ?')
        .bind(name || '', role || '', hostDept, engSite, hostDept, JSON.stringify(subDepartments || []), engMatch[1]).run();
      return json({ ok: true });
    }
    if (engMatch && method === 'DELETE') {
      const id = engMatch[1];
      await DB.prepare('DELETE FROM comments WHERE assignment_id IN (SELECT id FROM assignments WHERE eng = ?)').bind(id).run();
      await DB.prepare('DELETE FROM assignments WHERE eng = ?').bind(id).run();
      await DB.prepare('DELETE FROM engineers WHERE id = ?').bind(id).run();
      return json({ ok: true });
    }

    // --- plants ---
    if (method === 'GET' && path === 'plants') {
      const { results } = await DB.prepare('SELECT * FROM plants').all();
      return json(results);
    }
    if (method === 'POST' && path === 'plants') {
      const { id, name, loc, code, color } = body || {};
      const pid = id || name;
      await DB.prepare('INSERT INTO plants (id, name, loc, code, color) VALUES (?, ?, ?, ?, ?)')
        .bind(pid, name || '', loc || '', code || '', color || '#2f6df0').run();
      await DB.prepare('INSERT OR IGNORE INTO active_plants (plant_id, active) VALUES (?, 1)').bind(pid).run();
      return json({ id: pid, name, loc, code, color: color || '#2f6df0' }, 201);
    }
    const plantToggleMatch = path.match(/^plants\/(.+)\/toggle$/);
    if (plantToggleMatch && method === 'POST') {
      const pid = plantToggleMatch[1];
      const existing = await DB.prepare('SELECT active FROM active_plants WHERE plant_id = ?').bind(pid).first<{ active: number }>();
      const nowActive = existing ? !existing.active : true;
      if (existing) {
        await DB.prepare('UPDATE active_plants SET active = ? WHERE plant_id = ?').bind(nowActive ? 1 : 0, pid).run();
      } else {
        await DB.prepare('INSERT INTO active_plants (plant_id, active) VALUES (?, ?)').bind(pid, nowActive ? 1 : 0).run();
      }
      return json({ plant_id: pid, active: nowActive });
    }
    const plantMatch = path.match(/^plants\/([^/]+)$/);
    if (plantMatch && method === 'DELETE') {
      await DB.prepare('DELETE FROM active_plants WHERE plant_id = ?').bind(plantMatch[1]).run();
      await DB.prepare('DELETE FROM plants WHERE id = ?').bind(plantMatch[1]).run();
      return json({ ok: true });
    }

    // --- orders ---
    if (method === 'GET' && path === 'orders') {
      const { results } = await DB.prepare('SELECT * FROM orders').all();
      return json(results);
    }
    if (method === 'POST' && path === 'orders') {
      const { id, code, customer, product, plant, purpose } = body || {};
      await DB.prepare('INSERT INTO orders (id, code, customer, product, plant, purpose) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, code || '', customer || '', product || '', plant || '', purpose || '').run();
      return json({ id, code, customer, product, plant, purpose }, 201);
    }
    const orderMatch = path.match(/^orders\/(.+)$/);
    if (orderMatch && method === 'PUT') {
      const { code, customer, product, plant, purpose } = body || {};
      await DB.prepare('UPDATE orders SET code = ?, customer = ?, product = ?, plant = ?, purpose = ? WHERE id = ?')
        .bind(code || '', customer || '', product || '', plant || '', purpose || '', orderMatch[1]).run();
      return json({ ok: true });
    }
    if (orderMatch && method === 'DELETE') {
      const id = orderMatch[1];
      await DB.prepare('DELETE FROM comments WHERE assignment_id IN (SELECT id FROM assignments WHERE order_id = ?)').bind(id).run();
      await DB.prepare('DELETE FROM assignments WHERE order_id = ?').bind(id).run();
      await DB.prepare('DELETE FROM orders WHERE id = ?').bind(id).run();
      return json({ ok: true });
    }

    // --- assignments ---
    if (method === 'GET' && path === 'assignments') {
      const { results } = await DB.prepare('SELECT * FROM assignments').all();
      return json((results as any[]).map(assignmentOut));
    }
    if (method === 'POST' && path === 'assignments') {
      await ensureAssignmentColumns(DB);
      const d = body || {};
      const dept = d.department === 'Non-QA' ? 'Non-QA' : d.department === 'QA' ? 'QA' : '';
      await DB.prepare(
        `INSERT INTO assignments (id, eng, order_id, day, week, site1, customer, end_customer, auditor1, purpose, target_package, customer_names, audit_category, site2, area, auditor2, department1, department2, department, results, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        d.id, d.eng || '', d.order || '', d.day ?? 0, d.week ?? 0,
        d.site1 || '', d.customer || '', d.endCustomer || '', d.auditor1 || '', d.purpose || '',
        d.targetPackage || '', d.customerNames || '', d.auditCategory || '',
        d.site2 || '', d.area || '', d.auditor2 || '', d.department1 || '', d.department2 || '',
        dept,
        typeof d.results === 'string' ? d.results : JSON.stringify(d.results || {}),
        d.createdAt ? String(d.createdAt) : '',
        d.updatedAt ? String(d.updatedAt) : '',
      ).run();
      return json({ id: d.id }, 201);
    }
    const assignMatch = path.match(/^assignments\/(.+)$/);
    if (assignMatch && method === 'PUT') {
      // partial update: callers like moveAssign only send {eng, day, week},
      // submitEdit sends the full field set — merge onto the existing row
      // rather than overwriting untouched columns with blanks.
      const d = body || {};
      const existing = await DB.prepare('SELECT * FROM assignments WHERE id = ?').bind(assignMatch[1]).first<any>();
      if (!existing) return json({ error: 'not found' }, 404);
      await ensureAssignmentColumns(DB);
      await DB.prepare(
        `UPDATE assignments SET eng = ?, order_id = ?, day = ?, week = ?, site1 = ?, customer = ?, end_customer = ?, auditor1 = ?, purpose = ?,
           target_package = ?, customer_names = ?, audit_category = ?, site2 = ?, area = ?, auditor2 = ?, department1 = ?, department2 = ?, department = ?, results = ?,
           created_at = ?, updated_at = ? WHERE id = ?`,
      ).bind(
        d.eng ?? existing.eng, d.order ?? existing.order_id, d.day ?? existing.day, d.week ?? existing.week,
        d.site1 ?? existing.site1, d.customer ?? existing.customer, d.endCustomer ?? existing.end_customer, d.auditor1 ?? existing.auditor1, d.purpose ?? existing.purpose,
        d.targetPackage ?? existing.target_package ?? '', d.customerNames ?? existing.customer_names ?? '', d.auditCategory ?? existing.audit_category ?? '',
        d.site2 ?? existing.site2, d.area ?? existing.area, d.auditor2 ?? existing.auditor2, d.department1 ?? existing.department1, d.department2 ?? existing.department2,
        d.department !== undefined ? (d.department || '') : (existing.department ?? ''),
        d.results !== undefined ? (typeof d.results === 'string' ? d.results : JSON.stringify(d.results)) : (existing.results ?? '{}'),
        d.createdAt !== undefined ? String(d.createdAt) : (existing.created_at ?? ''),
        d.updatedAt !== undefined ? String(d.updatedAt) : (existing.updated_at ?? ''),
        assignMatch[1],
      ).run();
      return json({ ok: true });
    }
    if (assignMatch && method === 'DELETE') {
      await DB.prepare('DELETE FROM comments WHERE assignment_id = ?').bind(assignMatch[1]).run();
      await DB.prepare('DELETE FROM assignments WHERE id = ?').bind(assignMatch[1]).run();
      return json({ ok: true });
    }

    // --- comments ---
    if (method === 'POST' && path === 'comments') {
      const { id, assignmentId, who, initials, text, ago, color } = body || {};
      await DB.prepare('INSERT INTO comments (id, assignment_id, who, initials, text, ago, color) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(id, assignmentId, who || '', initials || '', text || '', ago || '', color || '#0f9d8c').run();
      return json({ id }, 201);
    }
    const commentMatch = path.match(/^comments\/(.+)$/);
    if (commentMatch && method === 'DELETE') {
      await DB.prepare('DELETE FROM comments WHERE id = ?').bind(commentMatch[1]).run();
      return json({ ok: true });
    }

    // --- activity ---
    if (method === 'POST' && path === 'activity') {
      const { id, who, text, ago, color } = body || {};
      await DB.prepare('INSERT INTO activity (id, who, text, ago, color) VALUES (?, ?, ?, ?, ?)')
        .bind(id, who || '', text || '', ago || '', color || '#0f9d8c').run();
      return json({ id }, 201);
    }

    // --- options ---
    if (method === 'POST' && path === 'options') {
      const { category, value, meta } = body || {};
      if (category && value) {
        await DB.prepare('INSERT OR REPLACE INTO options (category, value, meta) VALUES (?, ?, ?)')
          .bind(category, value, meta || '').run();
      }
      return json({ ok: true });
    }
    if (method === 'DELETE' && path === 'options') {
      const { category, value } = body || {};
      if (category && value) {
        await DB.prepare('DELETE FROM options WHERE category = ? AND (value = ? OR LOWER(value) = LOWER(?))')
          .bind(category, value, value).run();
      }
      return json({ ok: true });
    }

    // --- google-sheets ---
    if (method === 'GET' && path === 'google-sheets/config') {
      const row = await DB.prepare("SELECT value FROM options WHERE category = 'google_sheets_config'").first<{ value: string }>();
      const lastSyncRow = await DB.prepare("SELECT value FROM options WHERE category = 'google_sheets_last_sync'").first<{ value: string }>();
      let config = {
        webhookUrl: env.GOOGLE_SHEETS_WEBHOOK_URL || '',
        autoSync: true,
        lastSynced: lastSyncRow?.value || '',
      };
      if (row) {
        try {
          config = { ...config, ...JSON.parse(row.value) };
        } catch {}
      }
      if (lastSyncRow) config.lastSynced = lastSyncRow.value;
      return json(config);
    }

    if (method === 'POST' && path === 'google-sheets/config') {
      const cfg = body || {};
      await DB.prepare("INSERT OR REPLACE INTO options (category, value, meta) VALUES ('google_sheets_config', ?, '')")
        .bind(JSON.stringify(cfg)).run();
      return json({ ok: true });
    }

    if (method === 'POST' && path === 'google-sheets/sync') {
      const row = await DB.prepare("SELECT value FROM options WHERE category = 'google_sheets_config'").first<{ value: string }>();
      let webhookUrl = env.GOOGLE_SHEETS_WEBHOOK_URL || '';
      if (row) {
        try {
          const cfg = JSON.parse(row.value);
          if (cfg.webhookUrl) webhookUrl = cfg.webhookUrl;
        } catch {}
      }

      if (!webhookUrl) {
        return json({ ok: false, error: 'Google Sheets webhook URL is not configured' }, 400);
      }

      const syncPayload = body || {};

      // If sync_all without pre-formatted rows, query all from DB
      if (syncPayload.action === 'sync_all' && (!syncPayload.rows || syncPayload.rows.length === 0)) {
        const [assignRes, engRes] = await Promise.all([
          DB.prepare('SELECT * FROM assignments ORDER BY week ASC, day ASC').all(),
          DB.prepare('SELECT id, name FROM engineers').all(),
        ]);
        const engMap = new Map((engRes.results as any[]).map((e) => [e.id, e.name]));
        const rows = (assignRes.results as any[]).map((a) => {
          const base = new Date(2026, 5, 29 + (a.week || 0) * 7);
          base.setDate(base.getDate() + (a.day || 0));
          const dd = String(base.getDate()).padStart(2, '0');
          const mm = String(base.getMonth() + 1).padStart(2, '0');
          const yyyy = base.getFullYear();
          const dateStr = `${dd}/${mm}/${yyyy}`;

          const isInternal = !!(a.site2 || a.auditor2 || a.department2 || a.area) || String(a.id || '').startsWith('IA') || String(a.order_id || '').startsWith('IA');
          const auditType = isInternal ? 'Internal Audit' : 'Customer Audit';
          const customer = isInternal ? '' : (a.customer || '');
          const site = (isInternal ? (a.site2 || a.site1) : (a.site1 || a.site2)) || '';
          const standard = (isInternal ? (a.department2 || a.department1) : (a.department1 || a.department2)) || '';
          const purpose = (isInternal ? (a.area || a.purpose) : (a.purpose || '')) || '';
          const auditor = (isInternal ? (a.auditor2 || a.auditor1) : (a.auditor1 || a.auditor2)) || (engMap.get(a.eng) || '');

          return [dateStr, auditType, customer, site, standard, purpose, auditor, a.id];
        });
        syncPayload.rows = rows;
      }

      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syncPayload),
        redirect: 'follow',
      });

      const nowIso = new Date().toISOString();
      await DB.prepare("INSERT OR REPLACE INTO options (category, value, meta) VALUES ('google_sheets_last_sync', ?, '')")
        .bind(nowIso).run();

      let parsedResp = null;
      try {
        parsedResp = await resp.json();
      } catch {
        parsedResp = { status: resp.status, ok: resp.ok };
      }

      return json({ ok: true, timestamp: nowIso, googleResponse: parsedResp });
    }

    return json({ error: 'not found', path, method }, 404);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const path = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
      return handleApi(request, env, path);
    }
    return env.ASSETS.fetch(request);
  },
};
