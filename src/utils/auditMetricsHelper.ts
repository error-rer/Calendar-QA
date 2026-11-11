import type { Order } from '../types';

export interface AuditStatsResult {
  totalAudits: number;
  customerAudits: number;
  internalAudits: number;
  totalAppointments: number;
  customerCount: number;
  internalCount: number;
}

/**
 * Calculates audit stats with strict merge conditions:
 * Consecutive days are merged into a single audit event ONLY when ALL of the following criteria match:
 * 1. Same Customer Name / Entity (case-insensitive)
 * 2. Same Site (exact string match, e.g. UTL2A vs UTL1 must NOT merge)
 * 3. Same Purpose / Scope (exact match, e.g. "Pre-audit" vs "Process Control" must NOT merge)
 * 4. Consecutive Dates (difference between days <= 1)
 *
 * If Site or Purpose differs, they count as separate events (= 1 each).
 * Non-audit placeholders / notes (e.g. "No customer audit") are excluded.
 */
export const calculateAuditStats = (
  records: any[],
  orderLookup?: (orderId: string) => Order | undefined
): AuditStatsResult => {
  if (!records || records.length === 0) {
    return {
      totalAudits: 0,
      customerAudits: 0,
      internalAudits: 0,
      totalAppointments: 0,
      customerCount: 0,
      internalCount: 0,
    };
  }

  // Exclude placeholders / notes
  const validRecords = records.filter((r) => {
    if (!r) return false;
    if (r.isPlaceholder) return false;
    const title = String(r.title || '').toLowerCase();
    const purpose = String(r.purpose || r.apptPurpose || '').toLowerCase();
    const customer = String(r.customer || r.customerName || '').toLowerCase();
    if (
      title.includes('no customer audit') ||
      purpose.includes('no customer audit') ||
      customer.includes('no customer audit')
    ) {
      return false;
    }
    return true;
  });

  // Group key strictly combines Type, Entity, Site, and Purpose
  const groups = new Map<string, any[]>();

  validRecords.forEach((r) => {
    const o = orderLookup && r.order ? orderLookup(r.order) : undefined;

    const isInternal =
      r.type === 'internal' ||
      r.auditType === 'Internal Audit' ||
      r.sectionType === 'internal' ||
      Boolean(r.site2 || r.auditor2 || r.department2 || r.area) ||
      (typeof r.id === 'string' && r.id.startsWith('IA')) ||
      (typeof r.order === 'string' && r.order.startsWith('IA'));

    const type: 'customer' | 'internal' = isInternal ? 'internal' : 'customer';

    const rawEntity =
      (type === 'internal'
        ? (r.standard || r.auditCategory || r.area || (Array.isArray(r.department2) ? r.department2.join('/') : r.department2))
        : (r.customerName || r.customer || r.customerNames || (Array.isArray(r.customerName) ? r.customerName.join('/') : '') || (o ? o.customer : ''))
      ) || 'Unknown';
    const entity = String(rawEntity).trim();

    const rawSite =
      r.site ||
      (type === 'internal' ? (r.site2 || r.site1) : (r.site1 || r.site2)) ||
      (o ? o.plant : '') ||
      'Unknown';
    const site = String(rawSite).trim();

    const rawPurpose =
      r.purpose ||
      r.apptPurpose ||
      (r as any).auditScope ||
      (r as any).auditCategory ||
      r.title ||
      (o ? (o.purpose || o.product) : '') ||
      'General';
    const purpose = String(rawPurpose).trim().toLowerCase();

    // Extract standardized date for sorting and diffing
    let dateObj: Date;
    if (r.dateObj instanceof Date && !isNaN(r.dateObj.getTime())) {
      dateObj = r.dateObj;
    } else if (r.date) {
      dateObj = new Date(r.date);
    } else if (r.dateStr) {
      dateObj = new Date(r.dateStr);
    } else if (r.startDate) {
      dateObj = new Date(r.startDate);
    } else if (r.fromDate) {
      dateObj = new Date(r.fromDate);
    } else if (r.week !== undefined && r.day !== undefined) {
      dateObj = new Date(2026, 5, 29 + r.week * 7 + r.day);
    } else {
      dateObj = new Date(0);
    }

    const key = `${type}:::${entity.toLowerCase()}:::${site}:::${purpose}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push({
      raw: r,
      date: dateObj,
      type,
      entity,
      site,
      purpose,
    });
  });

  let customerAudits = 0;
  let internalAudits = 0;

  groups.forEach((items, key) => {
    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    let eventCount = 0;
    let lastDate: Date | null = null;

    items.forEach((item) => {
      const d = item.date;
      const currentDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

      if (!lastDate) {
        eventCount++;
      } else {
        const diffDays = Math.round(Math.abs(currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          eventCount++;
        }
      }
      lastDate = currentDate;
    });

    if (key.startsWith('customer:::')) {
      customerAudits += eventCount;
    } else {
      internalAudits += eventCount;
    }
  });

  return {
    totalAudits: customerAudits + internalAudits,
    customerAudits,
    internalAudits,
    totalAppointments: customerAudits + internalAudits,
    customerCount: customerAudits,
    internalCount: internalAudits,
  };
};

/**
 * Returns grouped appointment arrays matching calculateAuditStats events.
 */
export const getGroupedAuditEvents = (
  records: any[],
  orderLookup?: (orderId: string) => Order | undefined
): any[][] => {
  if (!records || records.length === 0) return [];

  const validRecords = records.filter((r) => {
    if (!r) return false;
    if (r.isPlaceholder) return false;
    const title = String(r.title || '').toLowerCase();
    const purpose = String(r.purpose || r.apptPurpose || '').toLowerCase();
    const customer = String(r.customer || r.customerName || '').toLowerCase();
    if (
      title.includes('no customer audit') ||
      purpose.includes('no customer audit') ||
      customer.includes('no customer audit')
    ) {
      return false;
    }
    return true;
  });

  const groups = new Map<string, any[]>();

  validRecords.forEach((r) => {
    const o = orderLookup && r.order ? orderLookup(r.order) : undefined;

    const isInternal =
      r.type === 'internal' ||
      r.auditType === 'Internal Audit' ||
      r.sectionType === 'internal' ||
      Boolean(r.site2 || r.auditor2 || r.department2 || r.area) ||
      (typeof r.id === 'string' && r.id.startsWith('IA')) ||
      (typeof r.order === 'string' && r.order.startsWith('IA'));

    const type: 'customer' | 'internal' = isInternal ? 'internal' : 'customer';

    const rawEntity =
      (type === 'internal'
        ? (r.standard || r.auditCategory || r.area || (Array.isArray(r.department2) ? r.department2.join('/') : r.department2))
        : (r.customerName || r.customer || r.customerNames || (Array.isArray(r.customerName) ? r.customerName.join('/') : '') || (o ? o.customer : ''))
      ) || 'Unknown';
    const entity = String(rawEntity).trim();

    const rawSite =
      r.site ||
      (type === 'internal' ? (r.site2 || r.site1) : (r.site1 || r.site2)) ||
      (o ? o.plant : '') ||
      'Unknown';
    const site = String(rawSite).trim();

    const rawPurpose =
      r.purpose ||
      r.apptPurpose ||
      (r as any).auditScope ||
      (r as any).auditCategory ||
      r.title ||
      (o ? (o.purpose || o.product) : '') ||
      'General';
    const purpose = String(rawPurpose).trim().toLowerCase();

    let dateObj: Date;
    if (r.dateObj instanceof Date && !isNaN(r.dateObj.getTime())) {
      dateObj = r.dateObj;
    } else if (r.date) {
      dateObj = new Date(r.date);
    } else if (r.dateStr) {
      dateObj = new Date(r.dateStr);
    } else if (r.startDate) {
      dateObj = new Date(r.startDate);
    } else if (r.fromDate) {
      dateObj = new Date(r.fromDate);
    } else if (r.week !== undefined && r.day !== undefined) {
      dateObj = new Date(2026, 5, 29 + r.week * 7 + r.day);
    } else {
      dateObj = new Date(0);
    }

    r.type = type;
    if (!r.customerName) r.customerName = entity;
    if (!r.standard) r.standard = entity;
    if (!r.site) r.site = site;
    if (!r.purpose) r.purpose = rawPurpose;
    if (!r.title) r.title = rawPurpose;

    const key = `${type}:::${entity.toLowerCase()}:::${site}:::${purpose}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push({ raw: r, date: dateObj });
  });

  const eventClusters: any[][] = [];

  groups.forEach((items) => {
    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    let currentCluster: any[] = [];
    let lastDate: Date | null = null;

    items.forEach((item) => {
      const d = item.date;
      const currentDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

      if (!lastDate) {
        currentCluster = [item.raw];
      } else {
        const diffDays = Math.round(Math.abs(currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          eventClusters.push(currentCluster);
          currentCluster = [item.raw];
        } else {
          currentCluster.push(item.raw);
        }
      }
      lastDate = currentDate;
    });

    if (currentCluster.length > 0) {
      eventClusters.push(currentCluster);
    }
  });

  return eventClusters;
};

// Aliases
export const getUniqueAuditEvents = getGroupedAuditEvents;
export const calculateAuditMetrics = calculateAuditStats;
