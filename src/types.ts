export type Department = 'QA' | 'Non-QA';
export type SiteDepartment = 'UTL1' | 'UTL2' | 'UTL3' | 'U1' | 'U2' | 'U3';
export type SubDepartment = 'QMS' | 'EHS' | 'ESD' | 'ESD Audit' | 'QS Audit';

export interface Plant {
  id: string;
  name: string;
  loc: string;
  code: string;
  color: string;
  active: boolean;
}

export interface Engineer {
  id: string;
  name: string;
  role: string;
  site?: string;
  department?: Department | '';
  subDepartments: SubDepartment[];
  isMaster?: boolean;
}

export interface Order {
  id: string;
  code: string;
  customer: string;
  product: string;
  plant: string;
  purpose: string;
}

export interface SiteAuditResult {
  major: number;
  minor: number;
  ofi: number;
  obs: number;
  findings: number;
}


export const SITE_ORDER = [
  'UTL1',
  'UTL2',
  'UTL2A',
  'UTL2B',
  'UTL3',
  'UTL3A',
  'UTL3B',
  'UTL3T',
] as const;

export type SiteCode = typeof SITE_ORDER[number];

let currentConfiguredSiteOrder: string[] = (() => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('calendar_qa_snapshot');
      if (raw) {
        const snap = JSON.parse(raw);
        if (snap.siteCodeOptions && snap.siteCodeOptions.length > 0) {
          return snap.siteCodeOptions.map((s: string) => normalizeSite(s).toUpperCase());
        }
      }
    } catch {}
  }
  return [...SITE_ORDER];
})();

export function setConfiguredSiteOrder(order: string[]) {
  if (order && order.length > 0) {
    currentConfiguredSiteOrder = order.map((s) => normalizeSite(s).toUpperCase());
  }
}

export function getConfiguredSiteOrder(): string[] {
  return currentConfiguredSiteOrder;
}

/** Standardize site codes: prefix legacy U1..U3T with UTL */
export function normalizeSite(site: string): string {
  if (!site) return '';
  const s = site.trim();
  const legacyMatch = s.match(/^u(1|2|3|2a|2b|3a|3t)$/i);
  if (legacyMatch) {
    return 'UTL' + legacyMatch[1].toUpperCase();
  }
  const utlMatch = s.match(/^utl(1|2|3|2a|2b|3a|3t)$/i);
  if (utlMatch) {
    return 'UTL' + utlMatch[1].toUpperCase();
  }
  return s;
}

/** Get index of site in canonical or configured site order */
export function getSiteOrderIndex(site: string, orderList?: readonly string[] | string[]): number {
  if (!site) return 999;
  const norm = normalizeSite(site).toUpperCase();
  const list = orderList && orderList.length > 0
    ? orderList.map((s) => normalizeSite(s).toUpperCase())
    : currentConfiguredSiteOrder;
  const idx = list.indexOf(norm);
  return idx !== -1 ? idx : 999;
}

/** Sort an array of site names according to canonical or configured SITE_ORDER */
export function sortSites(sites: string[], orderList?: readonly string[] | string[]): string[] {
  if (!sites || sites.length <= 1) return sites ? [...sites] : [];
  return [...sites].sort((a, b) => {
    const idxA = getSiteOrderIndex(a, orderList);
    const idxB = getSiteOrderIndex(b, orderList);
    if (idxA !== idxB) {
      return idxA - idxB;
    }
    return normalizeSite(a).localeCompare(normalizeSite(b));
  });
}

/** Standardize slash/comma-separated multi-site string and sort in canonical site order */
export function normalizeSites(raw: string, orderList?: readonly string[] | string[]): string {
  if (!raw) return '';
  const parts = raw
    .split(/[/,]/)
    .map((s) => normalizeSite(s.trim()))
    .filter(Boolean);
  if (parts.length === 0) return '';
  const uniqueSites = Array.from(new Set(parts));
  const sorted = sortSites(uniqueSites, orderList);
  return sorted.join('/');
}

/** Standardize audit results record keys to UTL site codes */
export function normalizeAuditResults(results?: Record<string, SiteAuditResult>): Record<string, SiteAuditResult> {
  if (!results || typeof results !== 'object') return {};
  const out: Record<string, SiteAuditResult> = {};
  for (const [key, val] of Object.entries(results)) {
    if (!val) continue;
    const normKey = normalizeSite(key);
    if (!out[normKey]) {
      out[normKey] = {
        major: Number(val.major) || 0,
        minor: Number(val.minor) || 0,
        ofi: Number(val.ofi) || 0,
        obs: Number(val.obs) || 0,
        findings: Number(val.findings) || 0,
      };
    } else {
      out[normKey] = {
        major: out[normKey].major + (Number(val.major) || 0),
        minor: out[normKey].minor + (Number(val.minor) || 0),
        ofi: out[normKey].ofi + (Number(val.ofi) || 0),
        obs: out[normKey].obs + (Number(val.obs) || 0),
        findings: out[normKey].findings + (Number(val.findings) || 0),
      };
    }
  }
  return out;
}

/** Standardize an assignment's sites and audit results */
export function normalizeAssignment(a: Assignment): Assignment {
  if (!a) return a;
  return {
    ...a,
    site1: a.site1 ? normalizeSites(a.site1) : a.site1,
    site2: a.site2 ? normalizeSites(a.site2) : a.site2,
    results: a.results ? normalizeAuditResults(a.results) : a.results,
  };
}

export interface Assignment {
  id: string;
  eng: string;
  order: string;
  seriesId?: string;
  groupId?: string;
  isDaySplit?: boolean;
  day: number;
  week: number;
  sectionType?: 'customer' | 'internal';
  site1?: string;
  customer?: string;
  endCustomer?: string;
  auditor1?: string;
  purpose?: string;
  targetPackage?: string;
  customerNames?: string;
  auditCategory?: string;
  site2?: string;
  area?: string;
  auditor2?: string;
  department1?: string;
  department2?: string;
  department?: Department | '';
  standard?: string | string[];
  site?: string;
  qmsHost?: string | string[];
  auditor?: string;
  apptPurpose?: string;
  major?: number;
  minor?: number;
  ofi?: number;
  obs?: number;
  findings?: number | any;
  request?: number;
  utl1?: number;
  utl2?: number;
  utl3?: number;
  results?: Record<string, SiteAuditResult>;
  createdBy?: string;
  createdAt?: string | number;
  updatedAt?: string;
  status?: string;
  isCompleted?: boolean;
  resultSummary?: string;
  result?: any;
  auditResult?: any;
  date?: string;
  startDate?: string;
  endDate?: string;
  from?: string;
  to?: string;
  dateFrom?: string;
  dateTo?: string;
  auditType?: string;
  leadAuditor?: string;
  customerName?: string | string[];
}

export type Appointment = Assignment;

export function isInternalAssignment(a: Assignment | any): boolean {
  if (!a) return false;
  return (
    a.sectionType === 'internal' ||
    a.auditType === 'Internal Audit' ||
    a.auditType === 'IA' ||
    !!(a.site2 || a.auditor2 || a.department2 || a.area) ||
    (typeof a.id === 'string' && a.id.startsWith('IA')) ||
    (typeof a.order === 'string' && a.order.startsWith('IA'))
  );
}

/**
 * Retrieve formatted QMS Host(s) string for an appointment.
 * Returns empty string if unassigned, null, or empty array.
 */
export function getAppointmentQmsHost(audit: Assignment | any): string {
  if (!audit) return '';
  const isInternal = isInternalAssignment(audit);
  const raw =
    audit.qmsHost !== undefined && audit.qmsHost !== null && audit.qmsHost !== ''
      ? audit.qmsHost
      : audit.auditor !== undefined && audit.auditor !== null && audit.auditor !== ''
      ? audit.auditor
      : isInternal
      ? (audit.auditor2 || audit.auditor1)
      : (audit.auditor1 || audit.auditor2);
  if (!raw) return '';
  if (Array.isArray(raw)) {
    return raw.map((s: any) => String(s || '').trim()).filter(Boolean).join(', ');
  }
  return String(raw).split(/[,/]/).map((s) => s.trim()).filter(Boolean).join(', ');
}

export function getMissingFields(a: Assignment | any): string[] {
  if (!a) return [];
  const isInternal = isInternalAssignment(a);
  const missing: string[] = [];

  // 1. Standard (standard, department1 for customer, department2 for internal)
  const rawStandard =
    a.standard !== undefined && a.standard !== null && a.standard !== ''
      ? a.standard
      : isInternal
      ? (a.department2 || a.department1)
      : (a.department1 || a.department2) || a.department;
  const hasStandard = Array.isArray(rawStandard)
    ? rawStandard.length > 0 && rawStandard.some((s: any) => Boolean(s && String(s).trim()))
    : Boolean(rawStandard && String(rawStandard).trim());
  if (!hasStandard) missing.push('Standard');

  // 2. Site (site, site1 for customer, site2 for internal)
  const rawSite =
    a.site !== undefined && a.site !== null && a.site !== ''
      ? a.site
      : isInternal
      ? (a.site2 || a.site1)
      : (a.site1 || a.site2);
  const hasSite = Array.isArray(rawSite)
    ? rawSite.length > 0 && rawSite.some((s: any) => Boolean(s && String(s).trim()))
    : Boolean(rawSite && String(rawSite).trim());
  if (!hasSite) missing.push('Site');

  // 3. QMS Host (strictly required for both Customer and Internal Audit; cannot be empty or "Unassigned")
  const qmsHostStr = getAppointmentQmsHost(a);
  const hasQmsHost = Boolean(qmsHostStr && qmsHostStr.trim() && qmsHostStr.trim().toLowerCase() !== 'unassigned');
  if (!hasQmsHost) missing.push('QMS Host');

  // 4. Dates (valid date or date range)
  const hasDates = Boolean(
    (a.date && String(a.date).trim()) ||
    (a.startDate && a.endDate && String(a.startDate).trim() && String(a.endDate).trim()) ||
    (a.from && a.to && String(a.from).trim() && String(a.to).trim()) ||
    (a.dateFrom && a.dateTo && String(a.dateFrom).trim() && String(a.dateTo).trim()) ||
    (a.week !== undefined && a.day !== undefined && a.week !== null && a.day !== null)
  );
  if (!hasDates) missing.push('Date Range');

  if (isInternal) {
    // Internal Audit STRICT FULL-FORM COMPLETION:
    // Every single input field belonging to the Internal Audit form MUST be validated:
    // 1. STANDARD (checked above)
    // 2. SITE (checked above)
    // 3. AUDIT CATEGORY
    const rawAuditCategory =
      a.auditCategory !== undefined && a.auditCategory !== null && a.auditCategory !== ''
        ? a.auditCategory
        : a.category;
    const hasAuditCategory = Array.isArray(rawAuditCategory)
      ? rawAuditCategory.length > 0 && rawAuditCategory.some((s: any) => Boolean(s && String(s).trim()))
      : Boolean(rawAuditCategory && String(rawAuditCategory).trim());
    if (!hasAuditCategory) missing.push('Audit Category');

    // 4. AREA
    const rawArea = a.area !== undefined && a.area !== null
      ? a.area
      : (a.purpose || a.apptPurpose);
    const hasArea = Array.isArray(rawArea)
      ? rawArea.length > 0 && rawArea.some((s: any) => Boolean(s && String(s).trim()))
      : Boolean(rawArea && String(rawArea).trim());
    if (!hasArea) missing.push('Area');

    // 5. QMS HOST (checked above)
    // 6. DATE RANGE (checked above)

    // Optional schema checks
    if (a.leadAuditor !== undefined && a.leadAuditor !== null && !String(a.leadAuditor).trim()) {
      missing.push('Lead Auditor');
    }
    if (a.department !== undefined && a.department !== null && a.department !== '' && !String(a.department).trim()) {
      missing.push('Department');
    }
  } else {
    // Customer Audit: MUST fill ALL 8 fields shown in the form:
    // 1. STANDARD (checked above)
    // 2. SITE (checked above)
    // 3. CUSTOMER
    // 4. END CUSTOMER
    // 5. PURPOSE
    // 6. TARGET PACKAGE
    // 7. CUSTOMER NAME
    // 8. QMS HOST (checked above)
    // 9. DATE RANGE (checked above)
    const hasCustomer = Boolean(a.customer && String(a.customer).trim());
    if (!hasCustomer) missing.push('Customer');

    const hasEndCustomer = Boolean(a.endCustomer && String(a.endCustomer).trim());
    if (!hasEndCustomer) missing.push('End Customer');

    const rawPurpose = a.purpose !== undefined ? a.purpose : a.apptPurpose;
    const hasPurpose = Boolean(rawPurpose && String(rawPurpose).trim());
    if (!hasPurpose) missing.push('Purpose');

    const rawTargetPackage = a.targetPackage;
    const hasTargetPackage = Array.isArray(rawTargetPackage)
      ? rawTargetPackage.length > 0 && rawTargetPackage.some((s: any) => Boolean(s && String(s).trim()))
      : Boolean(rawTargetPackage && String(rawTargetPackage).trim());
    if (!hasTargetPackage) missing.push('Target Package');

    const rawCustomerName = a.customerName !== undefined ? a.customerName : a.customerNames;
    const hasCustomerName = Array.isArray(rawCustomerName)
      ? rawCustomerName.length > 0 && rawCustomerName.some((s: any) => Boolean(s && String(s).trim()))
      : Boolean(rawCustomerName && String(rawCustomerName).trim());
    if (!hasCustomerName) missing.push('Customer Name');
  }

  return missing;
}

/**
 * Validate whether all required fields are filled for an appointment.
 * An appointment MUST have EVERY SINGLE field present on its respective
 * creation/edit form filled with valid data.
 * Returns true if the appointment is fully filled, false if ANY field is missing or empty.
 */
export function isAppointmentFormFullyFilled(audit: Appointment | any): boolean {
  if (!audit) return false;
  return getMissingFields(audit).length === 0;
}

/**
 * Validate whether all required fields are filled for an appointment.
 * Returns true if ANY required field is missing, empty, or unassigned.
 */
export function isAppointmentFormIncomplete(audit: Appointment | any): boolean {
  if (!audit) return false;
  return !isAppointmentFormFullyFilled(audit);
}

export const isAppointmentIncomplete = isAppointmentFormIncomplete;
export const isIncompleteAssignment = isAppointmentFormIncomplete;

export function formatApptDisplayTitle(a: Assignment, defaultOrder?: { customer?: string; plant?: string } | null): string {
  if (!a) return '';

  const isInternal = isInternalAssignment(a);

  if (isInternal) {
    // Label Formatting for "IA" (Internal Audit) Type:
    // Sequence: IA · {Department} · {Area} - {Site}
    const dept = (a.department2 || a.department1 || '').trim();
    const area = (a.area || '').trim();
    const site = normalizeSites((a.site2 || a.site1 || '').trim());

    const mainSegments: string[] = ['IA'];
    if (dept) mainSegments.push(dept);
    if (area) mainSegments.push(area);

    let title = mainSegments.join(' · ');
    if (site) {
      title += ` - ${site}`;
    }
    return title;
  } else {
    // Label Formatting for "CS" (Customer Audit) Type:
    // Sequence: CS · {Customer} - {Site}
    const cust = (a.customer || (defaultOrder ? defaultOrder.customer : '') || 'Customer Audit').trim();
    const site = normalizeSites((a.site1 || a.site2 || (defaultOrder ? defaultOrder.plant : '') || '').trim());

    let title = 'CS';
    if (cust) {
      title += ` · ${cust}`;
    }
    if (site) {
      title += ` - ${site}`;
    }
    return title;
  }
}

export function formatDMY(isoOrDate: string | Date): string {
  if (!isoOrDate) return '';
  if (isoOrDate instanceof Date) {
    const d = String(isoOrDate.getDate()).padStart(2, '0');
    const m = String(isoOrDate.getMonth() + 1).padStart(2, '0');
    const y = isoOrDate.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const parts = isoOrDate.split('-');
  if (parts.length === 3) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  return isoOrDate;
}

export function formatDateRange(
  fromDate: string | Date,
  toDate: string | Date
): string {
  const fromStr = formatDMY(fromDate);
  const toStr = formatDMY(toDate);
  if (!fromStr && !toStr) return '';
  if (!fromStr) return toStr;
  if (!toStr || fromStr === toStr) return fromStr;
  return `${fromStr} - ${toStr}`;
}

export function getAssignmentDateRange(a: Assignment, allAssignments: Assignment[]): { fromDate: Date; toDate: Date } {
  if (!a) {
    const now = new Date();
    return { fromDate: now, toDate: now };
  }
  const seriesKey = a.seriesId || a.groupId || a.order;
  const siblings = allAssignments
    ? allAssignments.filter(
        (x) =>
          (x.seriesId && x.seriesId === seriesKey) ||
          (x.groupId && x.groupId === seriesKey) ||
          (x.eng === a.eng && x.order === a.order) ||
          x.id === a.id
      )
    : [];
  if (siblings.length === 0) {
    const d = new Date(2026, 5, 29 + a.week * 7 + a.day);
    return { fromDate: d, toDate: d };
  }
  const minWeek = Math.min(...siblings.map((x) => x.week));
  const maxWeek = Math.max(...siblings.map((x) => x.week));
  const minDay = Math.min(...siblings.filter((x) => x.week === minWeek).map((x) => x.day));
  const maxDay = Math.max(...siblings.filter((x) => x.week === maxWeek).map((x) => x.day));
  const fromDate = new Date(2026, 5, 29 + minWeek * 7 + minDay);
  const toDate = new Date(2026, 5, 29 + maxWeek * 7 + maxDay);
  return { fromDate, toDate };
}

/**
 * Helper to check if actual result data exists and is completed.
 * Used for evaluation of audit results across calendar cards and forms.
 *
 * Rules:
 * - Check if results object/fields exist and are not empty
 * - If result is an object with finding categories (Major, Minor, OFI, etc.):
 *   Ensure at least one finding count or status field is officially recorded,
 *   or check dedicated completed flag if schema uses `isCompleted` / `status === 'Completed'`.
 * - If results were previously entered but later deleted/cleared (all 0s/empty), returns false.
 */
export function isAuditResultCompleted(audit?: any): boolean {
  if (!audit) return false;

  // Check dedicated completed flags
  if (audit.status === 'Completed' || Boolean(audit.isCompleted) || Boolean(audit.resultSummary)) {
    return true;
  }

  // Check legacy top-level finding fields
  const legacySum =
    (Number(audit.major) || 0) +
    (Number(audit.minor) || 0) +
    (Number(audit.ofi) || 0) +
    (Number(audit.obs) || 0) +
    (Number(audit.findings) || 0);
  if (legacySum > 0) return true;

  // Check if results object/fields exist and are not empty
  if (!audit.result && !audit.findings && !audit.auditResult && !audit.results) {
    return false;
  }

  const res = audit.result ?? audit.findings ?? audit.auditResult ?? audit.results;

  // If result is an object with finding categories (Major, Minor, OFI, etc.)
  if (typeof res === 'object' && res !== null) {
    const hasRecordedFinding = (val: any): boolean => {
      if (val === null || val === undefined || val === '') return false;
      if (typeof val === 'number') return val > 0;
      if (typeof val === 'string') {
        const num = Number(val);
        return !isNaN(num) ? num > 0 : val.trim() !== '';
      }
      if (typeof val === 'object') {
        return Object.values(val).some(hasRecordedFinding);
      }
      return Boolean(val);
    };

    const hasFindings = Object.values(res).some(hasRecordedFinding);
    return hasFindings || audit.status === 'Completed' || Boolean(audit.isCompleted) || Boolean(audit.resultSummary);
  }

  return Boolean(res);
}

export function hasAuditResultsEntered(a?: any): boolean {
  return isAuditResultCompleted(a);
}

export function parseTimestamp(val?: string | number): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const t = new Date(val).getTime();
  return isNaN(t) ? 0 : t;
}

export function isTodayWithinAssignmentRange(fromDate?: Date | string, toDate?: Date | string, now: Date = new Date()): boolean {
  const start = fromDate || toDate;
  if (!start) return false;
  const fromD = typeof start === 'string' ? new Date(start) : start;
  if (!fromD || isNaN(fromD.getTime())) return false;
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const fromISO = `${fromD.getFullYear()}-${String(fromD.getMonth() + 1).padStart(2, '0')}-${String(fromD.getDate()).padStart(2, '0')}`;
  // When an audit reaches today (date <= today) or has already passed:
  return fromISO <= todayISO;
}

export const isAuditDatePassedOrToday = isTodayWithinAssignmentRange;

export function getAssignmentDateFormatted(a: Assignment, allAssignments: Assignment[]): string {
  if (!a) return '';
  const { fromDate, toDate } = getAssignmentDateRange(a, allAssignments);
  return formatDateRange(fromDate, toDate);
}

export interface FormatApptLogRefOptions {
  isCustomer: boolean;
  customer?: string;
  site?: string;
  standard?: string;
  area?: string;
  dateStr: string;
  isSiteChanged?: boolean;
  isStandardChanged?: boolean;
  isAreaChanged?: boolean;
}

export function formatApptLogRef(opts: FormatApptLogRefOptions): string {
  const { isCustomer, customer, site, standard, area, dateStr, isSiteChanged, isStandardChanged, isAreaChanged } = opts;

  if (isCustomer) {
    const custName = (customer || 'Customer Audit').trim();
    const cleanSite = normalizeSites((site || '').trim());
    const cleanStd = (standard || '').trim();

    // If site changed AND standard is present, omit site from prefix.
    // Otherwise, include site in prefix if site is present.
    const includeSiteInPrefix = cleanSite && (!isSiteChanged || !cleanStd);
    const prefix = includeSiteInPrefix ? `${custName} - ${cleanSite}` : custName;

    const details: string[] = [];
    if (dateStr) details.push(dateStr);
    if (cleanStd && !isStandardChanged) {
      details.push(`Standard: ${cleanStd}`);
    }

    return details.length > 0 ? `${prefix} (${details.join(', ')})` : prefix;
  } else {
    const cleanStd = (standard || '').trim();
    const cleanArea = (area || '').trim();
    const cleanSite = normalizeSites((site || '').trim());

    const segments: string[] = ['Internal Audit'];
    if (cleanStd && !isStandardChanged) segments.push(cleanStd);
    if (cleanArea && !isAreaChanged) segments.push(cleanArea);

    let prefix = segments.join(' · ');
    if (cleanSite && !isSiteChanged) {
      prefix += ` - ${cleanSite}`;
    }

    return dateStr ? `${prefix} (${dateStr})` : prefix;
  }
}

/**
 * Calculates total Customer Audit visits by grouping consecutive calendar days per customer.
 * - Same customer on consecutive calendar days (diffDays === 1) counts as a single audit visit (1).
 * - Non-consecutive dates or breaks start a new visit (+1).
 */
export function calculateCustomerAuditsCount(
  items: {
    auditType?: string;
    customer?: string;
    dateObj?: Date;
    week?: number;
    day?: number;
    isInternal?: boolean;
  }[]
): number {
  const customerDatesMap = new Map<string, Set<string>>();
  let noCustCount = 0;

  for (const item of items) {
    const isInternal = item.auditType
      ? item.auditType === 'Internal Audit'
      : (item.isInternal ?? false);
    if (isInternal) continue;

    let d = item.dateObj;
    if (!d && item.week !== undefined && item.day !== undefined) {
      d = new Date(2026, 5, 29 + item.week * 7 + item.day);
    }
    if (!d) continue;

    const cust = (item.customer || '').trim().toLowerCase();
    if (!cust) {
      noCustCount++;
      continue;
    }

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dayStr = String(d.getDate()).padStart(2, '0');
    const dateKey = y + '-' + m + '-' + dayStr;

    let set = customerDatesMap.get(cust);
    if (!set) {
      set = new Set<string>();
      customerDatesMap.set(cust, set);
    }
    set.add(dateKey);
  }

  let totalVisits = 0;

  for (const [, dateSet] of customerDatesMap) {
    const sortedDates = Array.from(dateSet).sort();
    if (sortedDates.length === 0) continue;

    let visits = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const dPrev = sortedDates[i - 1];
      const dCurr = sortedDates[i];
      if (!dPrev || !dCurr) continue;

      const p1 = dPrev.split('-').map(Number);
      const p2 = dCurr.split('-').map(Number);
      const y1 = p1[0] || 0;
      const m1 = p1[1] || 1;
      const day1 = p1[2] || 1;
      const y2 = p2[0] || 0;
      const m2 = p2[1] || 1;
      const day2 = p2[2] || 1;

      const utc1 = Date.UTC(y1, m1 - 1, day1);
      const utc2 = Date.UTC(y2, m2 - 1, day2);
      const diffDays = Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));

      if (diffDays !== 1) {
        visits++;
      }
    }
    totalVisits += visits;
  }

  totalVisits += noCustCount;
  return totalVisits;
}

export interface Comment {
  id: string;
  who: string;
  initials: string;
  text: string;
  ago: string;
  color: string;
}

export interface Activity {
  who: string;
  text: string;
  ago: string;
  color: string;
}

export type DragState =
  | { kind: 'order' | 'assign'; id: string }
  | null;

export interface CreateDraft {
  order: string;
  eng: string;
  day: number;
  dateFrom: string;
  dateTo: string;
  sectionType: 'customer' | 'internal';
  purpose: string;
  department1: string;
  site1: string;
  customer: string;
  endCustomer: string;
  targetPackage: string;
  customerNames: string;
  auditCategory: string;
  auditor1: string;
  department2: string;
  site2: string;
  area: string;
  auditor2: string;
  department?: Department | '';
  warn?: boolean;
  warnText?: string;
}

export interface EditDraft {
  targetId: string;
  sectionType: 'customer' | 'internal';
  dateFrom: string;
  dateTo: string;
  site1: string;
  customer: string;
  endCustomer: string;
  purpose: string;
  targetPackage: string;
  customerNames: string;
  auditCategory: string;
  auditor1: string;
  department1: string;
  site2: string;
  area: string;
  auditor2: string;
  department2: string;
  department?: Department | '';
  warn?: boolean;
  warnText?: string;
  editScope?: 'day' | 'all';
  scopeDateStr?: string;
}

export interface EditScopePrompt {
  open: boolean;
  targetId: string;
  singleDateStr: string;
  singleDateISO: string;
  fullRangeStr: string;
  title: string;
  site: string;
  totalDays: number;
}

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'REORDER' | 'MANAGE_ITEM' | 'OTHER';
export type EntityType = 'APPOINTMENT' | 'CUSTOMER' | 'END_CUSTOMER' | 'AUDITOR' | 'QMS_HOST' | 'SITE' | 'STANDARD' | 'DEPARTMENT' | 'PURPOSE' | 'TARGET_PACKAGE' | 'CUSTOMER_NAME' | 'AUDIT_CATEGORY';

export interface ActivityUser {
  name: string;
  email?: string;
  avatarInitials?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: ActivityUser;
  actionType: ActionType;
  entityType: EntityType;
  description: string;
  metadata?: Record<string, any>;
}

export type Page = 'schedule' | 'table' | 'admin' | 'profile' | 'summary' | 'history';
export type View = 'person' | 'plant' | 'site' | 'timetable';
export type TimeScale = 'week' | 'month' | 'year' | 'search';
export type AdminTab = 'engineers' | 'options';

export interface EngineerForm {
  name: string;
  role: string;
  site?: string;
  department?: Department | '';
  subDepartments: SubDepartment[];
}

export interface UserSession {
  id: string;
  username: string;
  name?: string;
  role?: string;
}

export interface State {
  authed: boolean;
  currentUser?: UserSession;
  page: Page;
  view: View;
  adminTab: AdminTab;
  vw: number;
  selectedDay: number;
  sidebarOpen: boolean;
  timeScale: TimeScale;
  monthOffset: number;
  filterEmp: string[];
  filterSite: string[];
  filterCompany: string[];
  filterAuditType: string[];
  filterAuditTopic: string[];
  filterTargetPackage: string[];
  filterCustomerName: string[];
  filterAuditCategory: string[];
  filterApptType: string[];
  adminFilterSite: string[];
  adminFilterDept: string[];
  dayDialog: { weekOffset: number; day: number } | null;
  /** Last date clicked in Month view — switching to Week view jumps to its week. */
  monthSelectedDate: { weekOffset: number; day: number } | null;
  timetableOpenEng: string | null;
  loginEmail: string;
  loginPass: string;
  userMenuOpen: boolean;
  createOpen: boolean;
  createDraft: CreateDraft;
  editOpen: boolean;
  editDraft: EditDraft;
  editScopePrompt: EditScopePrompt | null;
  resultsModalOpen: boolean;
  resultsTargetId: string | null;
  engFormOpen: boolean;
  engEditingId: string | null;
  engForm: EngineerForm;
  weekOffset: number;
  activePlants: Record<string, boolean>;
  selected: string | null;
  drag: DragState;
  overCell: string | null;
  draft: string;
  summaryYear: number;
  searchQuery: string;
  searchSort?: 'oldest' | 'newest';
  searchDateFrom?: string;
  searchDateTo?: string;
  purposeOptions: string[];
  customerDepartmentOptions: string[];
  internalDepartmentOptions: string[];
  departmentOptions: string[];
  siteCodeOptions: string[];
  siteColors: Record<string, string>;
  customerOptions: string[];
  endCustomerOptions: string[];
  auditorOptions: string[];
  targetPackageOptions: string[];
  customerNameOptions: string[];
  auditCategoryOptions: string[];
  removedOptions: string[];
  masterCreatedOptions?: Record<string, boolean>;
  plants: Plant[];
  engineers: Engineer[];
  orders: Order[];
  assignments: Assignment[];
  comments: Record<string, Comment[]>;
  activity: Activity[];
  activityLogs: ActivityLog[];
}
