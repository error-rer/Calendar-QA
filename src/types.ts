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
  /** Set by Save Results, so an audit with zero findings still counts as having a result. */
  recorded?: boolean;
}


export const SITE_ORDER = [
  'UTL1',
  'UTL2',
  'UTL2A',
  'UTL2B',
  'UTL3',
  'UTL3A',
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
  const s = site.replace(/^\$+/, '').trim();
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
        ...(val.recorded ? { recorded: true } : {}),
      };
    } else {
      out[normKey] = {
        major: out[normKey].major + (Number(val.major) || 0),
        minor: out[normKey].minor + (Number(val.minor) || 0),
        ofi: out[normKey].ofi + (Number(val.ofi) || 0),
        obs: out[normKey].obs + (Number(val.obs) || 0),
        findings: out[normKey].findings + (Number(val.findings) || 0),
        ...((out[normKey].recorded || val.recorded) ? { recorded: true } : {}),
      };
    }
  }
  return out;
}

/** Standardize an assignment's sites and audit results */
export function normalizeAssignment(a: Assignment): Assignment {
  if (!a) return a;
  const canonicalSite = a.site ? normalizeSites(a.site) : (a.site1 ? normalizeSites(a.site1) : (a.site2 ? normalizeSites(a.site2) : ''));
  const canonicalAuditor = (a.auditor || (Array.isArray(a.qmsHost) ? a.qmsHost.join(', ') : a.qmsHost) || a.auditor1 || a.auditor2 || '').trim();
  const canonicalStandard = (typeof a.standard === 'string' ? a.standard : (Array.isArray(a.standard) ? a.standard.join('/') : (a.department1 || a.department2 || ''))).trim();
  return {
    ...a,
    site: canonicalSite || undefined,
    site1: a.site1 ? normalizeSites(a.site1) : (canonicalSite || undefined),
    site2: a.site2 ? normalizeSites(a.site2) : (canonicalSite || undefined),
    auditor: canonicalAuditor,
    auditor1: a.auditor1 ?? canonicalAuditor,
    auditor2: a.auditor2 ?? canonicalAuditor,
    qmsHost: a.qmsHost ?? canonicalAuditor,
    standard: canonicalStandard,
    department1: a.department1 ?? canonicalStandard,
    department2: a.department2 ?? canonicalStandard,
    results: a.results ? normalizeAuditResults(a.results) : a.results,
  };
}

export interface Assignment {
  id: string;
  eng: string;
  order: string;
  seriesId?: string;
  groupId?: string;
  campaignId?: string;
  auditGroupId?: string;
  type?: 'customer' | 'internal';
  isPlaceholder?: boolean;
  title?: string;
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
  // 1. Explicit internal flags
  if (a.isInternal === true) return true;
  if (a.type === 'internal' || a.type === 'IA' || a.type === 'ia') return true;
  if (a.sectionType === 'internal') return true;

  const auditTypeStr = String(a.auditType || '').trim().toLowerCase();
  if (auditTypeStr === 'internal' || auditTypeStr === 'internal audit' || auditTypeStr === 'ia') return true;

  // 2. Code / Title heuristics (e.g. "IA · EHS&RBA · FA & Legal - UTL1")
  const codeStr = String(a.code || '').trim();
  if (codeStr.startsWith('IA ·') || codeStr.startsWith('IA ') || codeStr === 'IA' || codeStr.toLowerCase().startsWith('ia')) return true;
  const titleStr = String(a.title || '').trim();
  if (titleStr.startsWith('IA ·') || titleStr.startsWith('IA ') || titleStr === 'IA' || titleStr.toLowerCase().startsWith('ia')) return true;

  if (typeof a.id === 'string' && a.id.startsWith('IA')) return true;
  if (typeof a.order === 'string' && a.order.startsWith('IA')) return true;

  // 3. Decide from the audit's own content. site2/auditor2/department2 are NOT signals: the Worker
  //    (assignmentOut) and normalizeAssignment fill them as copies of site/auditor/standard on every row.
  const hasCustomerData = Boolean(a.customer || a.customerName || a.customerNames || a.endCustomer || a.targetPackage);
  const hasInternalData = Boolean(a.area || a.auditCategory);

  // 4. Explicitly marked customer stays customer unless it holds only internal-audit data
  if (a.sectionType === 'customer' || a.type === 'customer' || auditTypeStr === 'customer' || auditTypeStr === 'customer audit') {
    return !hasCustomerData && hasInternalData;
  }

  // 5. No explicit type (rows saved before audit_type existed): internal only when it carries IA data and no CS data
  return hasInternalData && !hasCustomerData;
}

export interface StatusColorItem {
  key: string;
  label: string;
  color: string;
  bg: string;
  border: string;
}

/**
 * Shared Single Source of Truth for Appointment Card Status Colors and Sidebar Legend.
 * 1. Incomplete Data (Red)
 * 2. New Data (Purple)
 * 3. Updated Data (Blue)
 * 4. Pending Result (Yellow)
 * 5. Complete Data (Green)
 */
export const STATUS_COLOR_MAP = {
  incomplete: {
    key: 'incomplete',
    label: 'Incomplete Data',
    color: '#dc2626', // Red (Tailwind red-600)
    bg: '#fef2f2',
    border: '#fca5a5',
  },
  new: {
    key: 'new',
    label: 'New Data',
    color: '#7c3aed', // Purple (Tailwind violet-600)
    bg: '#f5f3ff',
    border: '#c4b5fd',
  },
  updated: {
    key: 'updated',
    label: 'Updated Data',
    color: '#0284c7', // Blue (Tailwind sky-600)
    bg: '#f0f9ff',
    border: '#bae6fd',
  },
  pending: {
    key: 'pending',
    label: 'Pending Result',
    color: '#d97706', // Yellow (Tailwind amber-600)
    bg: '#fffbeb',
    border: '#fde047',
  },
  complete: {
    key: 'complete',
    label: 'Complete Data',
    color: '#059669', // Green (Tailwind emerald-600)
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
} as const;

export const STATUS_COLOR_LIST: readonly StatusColorItem[] = [
  STATUS_COLOR_MAP.incomplete,
  STATUS_COLOR_MAP.new,
  STATUS_COLOR_MAP.updated,
  STATUS_COLOR_MAP.pending,
  STATUS_COLOR_MAP.complete,
];

export function getStatusColor(priority: string): string {
  switch (priority) {
    case 'INCOMPLETE_DATA':
    case 'incomplete':
      return STATUS_COLOR_MAP.incomplete.color;
    case 'NEW_DATA':
    case 'recently_created':
    case 'new':
      return STATUS_COLOR_MAP.new.color;
    case 'UPDATED_DATA':
    case 'recently_updated':
    case 'updated':
      return STATUS_COLOR_MAP.updated.color;
    case 'PENDING_RESULT':
    case 'pending_result':
    case 'pending':
      return STATUS_COLOR_MAP.pending.color;
    case 'COMPLETE_DATA':
    case 'default':
    case 'complete':
    default:
      return STATUS_COLOR_MAP.complete.color;
  }
}

/**
 * Retrieve formatted QMS Host(s) string for an appointment.
 * Returns empty string if unassigned, null, or empty array.
 */
export function getAppointmentQmsHost(audit: Assignment | any): string {
  if (!audit) return '';
  const isInternal =
    audit.sectionType === 'internal' ||
    (audit.sectionType !== 'customer' && isInternalAssignment(audit));
  const raw =
    audit.qmsHost !== undefined && audit.qmsHost !== null && audit.qmsHost !== ''
      ? audit.qmsHost
      : audit.auditor !== undefined && audit.auditor !== null && audit.auditor !== ''
      ? audit.auditor
      : isInternal
      ? (audit.auditor2 || (audit.sectionType === 'internal' ? '' : audit.auditor1))
      : (audit.auditor1 || (audit.sectionType === 'customer' ? '' : audit.auditor2));
  if (!raw) return '';
  if (Array.isArray(raw)) {
    return raw.map((s: any) => String(s || '').trim()).filter(Boolean).join(', ');
  }
  return String(raw).split(/[,/]/).map((s) => s.trim()).filter(Boolean).join(', ');
}

/**
 * Formats appointment card subtitle (Purpose and Host) avoiding duplicates.
 * Rules:
 * Case 1 (Both Purpose and Host exist): "${purpose} - ${host}"
 * Case 2 (Purpose is empty/null/undefined, but Host exists): ONLY "${host}" (no hyphen or duplicate name)
 * Case 3 (Purpose exists, but Host is empty/unassigned): ONLY "${purpose}" (or "${purpose} - Unassigned" if explicit)
 * Case 4 (Both are empty): "Unassigned"
 */
export function formatCardSubtitle(purpose?: string, host?: string, showExplicitUnassignedHost = false): string {
  let cleanPurpose = (purpose || '').trim();
  let cleanHost = (host || '').trim();

  // Strip trailing " - Unassigned" if present
  if (cleanPurpose.toLowerCase().endsWith(' - unassigned')) {
    cleanPurpose = cleanPurpose.slice(0, -14).trim();
  } else if (cleanPurpose.toLowerCase() === 'unassigned') {
    cleanPurpose = '';
  }

  const isHostUnassigned = !cleanHost || cleanHost.toLowerCase() === 'unassigned';

  // If host is provided and not unassigned, strip trailing " - ${cleanHost}" from purpose if already present
  if (!isHostUnassigned && cleanHost) {
    const escapedHost = cleanHost.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleanPurpose = cleanPurpose.replace(new RegExp(`\\s*-\\s*${escapedHost}$`, 'i'), '').trim();
  }

  // Prevent accidental duplication if fallback values match (e.g. purpose fell back to host name)
  if (!isHostUnassigned && cleanPurpose && cleanPurpose.toLowerCase() === cleanHost.toLowerCase()) {
    cleanPurpose = '';
  }

  // Case 1: Both Purpose and Host exist
  if (cleanPurpose && !isHostUnassigned) {
    return `${cleanPurpose} - ${cleanHost}`;
  }

  // Case 3: Purpose exists, but Host is empty/unassigned
  if (cleanPurpose) {
    return showExplicitUnassignedHost ? `${cleanPurpose} - Unassigned` : cleanPurpose;
  }

  // Case 2: Purpose is empty, but Host exists
  if (!isHostUnassigned) {
    return cleanHost;
  }

  // Case 4: Both are empty
  return 'Unassigned';
}

export function getMissingFields(a: Assignment | any): string[] {
  if (!a) return [];
  const isInternal = isInternalAssignment(a);
  const missing: string[] = [];

  // Common Date Range check (required for both Internal and Customer audits)
  const hasDateFrom = Boolean(a.dateFrom && String(a.dateFrom).trim());
  const hasDateTo = Boolean(a.dateTo && String(a.dateTo).trim());
  const hasLegacyDates = Boolean(
    (a.date && String(a.date).trim()) ||
    (a.startDate && a.endDate && String(a.startDate).trim() && String(a.endDate).trim()) ||
    (a.from && a.to && String(a.from).trim() && String(a.to).trim()) ||
    (a.fromDate && a.toDate && String(a.fromDate).trim() && String(a.toDate).trim()) ||
    (a._fromDate && a._toDate && String(a._fromDate).trim() && String(a._toDate).trim()) ||
    (a.week !== undefined && a.day !== undefined && a.week !== null && a.day !== null)
  );
  const hasDates = (hasDateFrom && hasDateTo) || hasLegacyDates;
  const isDateOrderValid = !(hasDateFrom && hasDateTo && String(a.dateFrom) > String(a.dateTo));
  if (!hasDates || !isDateOrderValid) missing.push('Date Range');

  if (isInternal) {
    // =========================================================================
    // INTERNAL AUDIT (IA): Check ONLY the 5 Internal Audit fields:
    // 1. STANDARD (non-empty)
    // 2. SITE (non-empty)
    // 3. AUDIT CATEGORY (non-empty — check actual property name in state/DB)
    // 4. AREA (non-empty — check actual property name in state/DB, e.g. area or purpose)
    // 5. QMS HOST (non-empty and not "Unassigned")
    // *(Do NOT check customer, endCustomer, customerName, or targetPackage for Internal Audits!)*
    // =========================================================================

    // 1. STANDARD
    const rawStandard =
      a.standard !== undefined && a.standard !== null && a.standard !== ''
        ? a.standard
        : a.department2 !== undefined && a.department2 !== null && a.department2 !== ''
        ? a.department2
        : a.department !== undefined && a.department !== null && a.department !== ''
        ? a.department
        : a.department1;
    const hasStandard = Array.isArray(rawStandard)
      ? rawStandard.length > 0 && rawStandard.some((s: any) => Boolean(s && String(s).trim()))
      : Boolean(rawStandard && String(rawStandard).trim());
    if (!hasStandard) missing.push('Standard');

    // 2. SITE
    const rawSite =
      a.site !== undefined && a.site !== null && a.site !== ''
        ? a.site
        : a.site2 !== undefined && a.site2 !== null && a.site2 !== ''
        ? a.site2
        : a.site1 !== undefined && a.site1 !== null && a.site1 !== ''
        ? a.site1
        : a.plant;
    const hasSite = Array.isArray(rawSite)
      ? rawSite.length > 0 && rawSite.some((s: any) => Boolean(s && String(s).trim()))
      : Boolean(rawSite && String(rawSite).trim());
    if (!hasSite) missing.push('Site');

    // 3. AUDIT CATEGORY
    const rawAuditCategory =
      a.auditCategory !== undefined && a.auditCategory !== null && a.auditCategory !== ''
        ? a.auditCategory
        : a.audit_category !== undefined && a.audit_category !== null && a.audit_category !== ''
        ? a.audit_category
        : a.category;
    const hasAuditCategory = Array.isArray(rawAuditCategory)
      ? rawAuditCategory.length > 0 && rawAuditCategory.some((s: any) => Boolean(s && String(s).trim()))
      : Boolean(rawAuditCategory && String(rawAuditCategory).trim());
    if (!hasAuditCategory) missing.push('Audit Category');

    // 4. AREA (check area, or purpose / apptPurpose / rawPurpose / product)
    const rawArea =
      a.area !== undefined && a.area !== null && a.area !== ''
        ? a.area
        : a.purpose !== undefined && a.purpose !== null && a.purpose !== ''
        ? a.purpose
        : a.apptPurpose !== undefined && a.apptPurpose !== null && a.apptPurpose !== ''
        ? a.apptPurpose
        : a.rawPurpose || a.product;
    const hasArea = Array.isArray(rawArea)
      ? rawArea.length > 0 && rawArea.some((s: any) => Boolean(s && String(s).replace(/^[\s/]+|[\s/]+$/g, '').trim()))
      : Boolean(rawArea && String(rawArea).replace(/^[\s/]+|[\s/]+$/g, '').trim());
    if (!hasArea) missing.push('Area');

    // 5. QMS HOST (must be populated and not "Unassigned")
    const qmsHostStr = getAppointmentQmsHost(a);
    const hasQmsHost = Boolean(
      qmsHostStr &&
      String(qmsHostStr).trim() &&
      String(qmsHostStr).trim().toLowerCase() !== 'unassigned'
    );
    if (!hasQmsHost) missing.push('QMS Host');

    if (a.leadAuditor !== undefined && a.leadAuditor !== null && !String(a.leadAuditor).trim()) {
      missing.push('Lead Auditor');
    }
  } else {
    // =========================================================================
    // CUSTOMER AUDIT (CS): Check all 8 Customer Audit fields:
    // 1. STANDARD
    // 2. SITE
    // 3. CUSTOMER
    // 4. END CUSTOMER
    // 5. PURPOSE
    // 6. TARGET PACKAGE
    // 7. CUSTOMER NAME
    // 8. QMS HOST
    // =========================================================================

    // 1. STANDARD
    const rawStandard =
      a.standard !== undefined && a.standard !== null && a.standard !== ''
        ? a.standard
        : a.department1 !== undefined && a.department1 !== null && a.department1 !== ''
        ? a.department1
        : a.department;
    const hasStandard = Array.isArray(rawStandard)
      ? rawStandard.length > 0 && rawStandard.some((s: any) => Boolean(s && String(s).trim()))
      : Boolean(rawStandard && String(rawStandard).trim());
    if (!hasStandard) missing.push('Standard');

    // 2. SITE
    const rawSite =
      a.site !== undefined && a.site !== null && a.site !== ''
        ? a.site
        : a.site1 !== undefined && a.site1 !== null && a.site1 !== ''
        ? a.site1
        : a.plant;
    const hasSite = Array.isArray(rawSite)
      ? rawSite.length > 0 && rawSite.some((s: any) => Boolean(s && String(s).trim()))
      : Boolean(rawSite && String(rawSite).trim());
    if (!hasSite) missing.push('Site');

    // 3. CUSTOMER
    const hasCustomer = Boolean(a.customer && String(a.customer).trim());
    if (!hasCustomer) missing.push('Customer');

    // 4. END CUSTOMER
    const hasEndCustomer = Boolean(a.endCustomer && String(a.endCustomer).trim());
    if (!hasEndCustomer) missing.push('End Customer');

    // 5. PURPOSE
    const rawPurpose = a.purpose !== undefined && a.purpose !== null && a.purpose !== ''
      ? a.purpose
      : a.apptPurpose;
    const hasPurpose = Boolean(rawPurpose && String(rawPurpose).trim());
    if (!hasPurpose) missing.push('Purpose');

    // 6. TARGET PACKAGE
    const rawTargetPackage = a.targetPackage;
    const hasTargetPackage = Array.isArray(rawTargetPackage)
      ? rawTargetPackage.length > 0 && rawTargetPackage.some((s: any) => Boolean(s && String(s).trim()))
      : Boolean(rawTargetPackage && String(rawTargetPackage).trim());
    if (!hasTargetPackage) missing.push('Target Package');

    // 7. CUSTOMER NAME
    const rawCustomerName = a.customerName !== undefined && a.customerName !== null && a.customerName !== ''
      ? a.customerName
      : a.customerNames;
    const hasCustomerName = Array.isArray(rawCustomerName)
      ? rawCustomerName.length > 0 && rawCustomerName.some((s: any) => Boolean(s && String(s).trim()))
      : Boolean(rawCustomerName && String(rawCustomerName).trim());
    if (!hasCustomerName) missing.push('Customer Name');

    // 8. QMS HOST
    const qmsHostStr = getAppointmentQmsHost(a);
    const hasQmsHost = Boolean(
      qmsHostStr &&
      String(qmsHostStr).trim() &&
      String(qmsHostStr).trim().toLowerCase() !== 'unassigned'
    );
    if (!hasQmsHost) missing.push('QMS Host');
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

/**
 * Formats multiple areas with " / " separator.
 * Handles string[], comma-separated, and slash-separated input cleanly.
 */
export function formatAreaString(area: unknown): string {
  if (!area) return '';
  const parts = Array.isArray(area)
    ? area
    : String(area).split(/[/,]/);
  return parts
    .map((s) => String(s || '').trim().replace(/^\$+/, '').trim())
    .filter(Boolean)
    .join(' / ');
}

export function formatApptDisplayTitle(a: Assignment, defaultOrder?: { customer?: string; plant?: string } | null): string {
  if (!a) return '';

  const isInternal = isInternalAssignment(a);

  if (isInternal) {
    // Label Formatting for "IA" (Internal Audit) Type:
    // Sequence: IA · {Department} · {Area} - {Site}
    const dept = (a.department2 || a.department1 || '').trim();
    const area = formatAreaString(a.area);
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

/** Every day of the multi-day appointment `a` belongs to (including `a`), matched the same way edit and delete match them. */
export function getSeriesSiblings<T extends { id: string; eng: string; order: string; seriesId?: string; groupId?: string }>(all: T[], a: T): T[] {
  const key = a.seriesId || a.groupId || a.order;
  return all.filter(
    (x) => (x.seriesId && x.seriesId === key) || (x.groupId && x.groupId === key) || (x.eng === a.eng && x.order === a.order) || x.id === a.id
  );
}

/**
 * Whether an audit has a result.
 *
 * - Results saved with Save Results carry `recorded: true` per site, so an audit
 *   with zero findings counts as having a result.
 * - Any finding count above 0 also counts (older records saved before `recorded` existed).
 * - Clear Results saves zeros without the flag, which counts as no result.
 */
export function isAuditResultCompleted(audit?: any): boolean {
  if (!audit) return false;
  if (audit.status === 'Completed' || Boolean(audit.isCompleted) || Boolean(audit.resultSummary)) return true;

  // Totals kept on the record itself (legacy fields, and the copy saveResults keeps in memory).
  const total = ['major', 'minor', 'ofi', 'obs'].reduce((sum, k) => sum + (Number(audit[k]) || 0), 0)
    + (typeof audit.findings === 'object' ? 0 : Number(audit.findings) || 0);
  if (total > 0) return true;

  // Per-site results. `findings` is a number on current records, so it is only a results map when it is an object.
  const candidates = [audit.results, audit.result, audit.auditResult, typeof audit.findings === 'object' ? audit.findings : undefined];
  const res = candidates.find((v) => v !== undefined && v !== null && v !== '');
  if (res === undefined) return false;
  if (typeof res !== 'object') return typeof res === 'string' ? res.trim() !== '' : Boolean(res);

  const hasResult = (val: any): boolean => {
    if (val === null || val === undefined || val === '') return false;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val > 0;
    if (typeof val === 'string') {
      const num = Number(val);
      return !isNaN(num) ? num > 0 : val.trim() !== '';
    }
    if (typeof val === 'object') return Object.values(val).some(hasResult);
    return false;
  };
  return Object.values(res).some(hasResult);
}

export function hasAuditResultsEntered(a?: any): boolean {
  return isAuditResultCompleted(a);
}

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 604,800,000 ms

export function parseTimestamp(val?: string | number): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return 0;
    if (/^\d{10,}$/.test(trimmed)) {
      const num = Number(trimmed);
      if (!isNaN(num)) return num;
    }
    // Handle SQLite UTC CURRENT_TIMESTAMP "YYYY-MM-DD HH:MM:SS" -> convert to ISO UTC
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      const utcIso = trimmed.replace(' ', 'T') + 'Z';
      const t = new Date(utcIso).getTime();
      if (!isNaN(t)) return t;
    }
    const t = new Date(trimmed).getTime();
    return isNaN(t) ? 0 : t;
  }
  return 0;
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

export type AuditStatusKey =
  | 'INCOMPLETE_DATA'
  | 'NEW_DATA'
  | 'UPDATED_DATA'
  | 'PENDING_RESULT'
  | 'COMPLETE_DATA';

export function isIncompleteData(apt: any): boolean {
  if (!apt) return false;
  if (typeof apt.isIncomplete === 'boolean') {
    return apt.isIncomplete;
  }
  return isAppointmentFormIncomplete(apt);
}

export function isAppointmentDatePastOrToday(apt: any, now: Date = new Date()): boolean {
  if (!apt) return false;
  if (typeof apt.isAuditDate === 'boolean') {
    return apt.isAuditDate;
  }
  const from = apt.fromDate || apt.date || apt.startDate || apt.from || apt.dateFrom;
  const to = apt.toDate || apt.endDate || apt.to || apt.dateTo;
  if (from || to) {
    return isTodayWithinAssignmentRange(from, to, now);
  }
  if (typeof apt.week === 'number' && typeof apt.day === 'number') {
    const d = new Date(2026, 5, 29 + apt.week * 7 + apt.day);
    return isTodayWithinAssignmentRange(d, d, now);
  }
  return false;
}

/**
 * Strict Status Priority Order:
 * 1. Red (Incomplete Data): Required fields are missing or unassigned.
 * 2. Blue (Updated Data): Data is complete AND updatedAt exists AND (now - updatedAt) <= 7 days (and updatedAt > createdAt).
 * 3. Purple (New Data): Data is complete AND (now - createdAt) <= 7 days (future OR backdated past), unless a more recent edit qualifies as blue.
 * 4. Yellow (Pending Result): Data is complete, older than 7 days since creation/update, AND appointmentDate is in the past without a recorded audit result.
 * 5. Green (Complete Data): Default fallback when data is complete and older than 7 days.
 */
export const resolveAuditStatus = (apt: any, nowMs: number = Date.now()): AuditStatusKey => {
  if (!apt) return 'COMPLETE_DATA';

  // 1. Check data completeness first (Red)
  if (isIncompleteData(apt)) {
    return 'INCOMPLETE_DATA';
  }

  const now = typeof nowMs === 'number' ? nowMs : Date.now();
  const createdTime = parseTimestamp(apt.createdAt);
  const updatedTime = parseTimestamp(apt.updatedAt);

  // 2. A recent edit takes precedence over the new-data window, so editing
  //    a newly created assignment (for example, changing its site) turns it blue.
  if (
    updatedTime > 0 &&
    (!createdTime || updatedTime > createdTime + 1000) &&
    (now - updatedTime) <= SEVEN_DAYS_MS &&
    now >= updatedTime
  ) {
    return 'UPDATED_DATA';
  }

  // 3. Newly created within 7 days -> Purple (even if appointmentDate in the past)
  if (createdTime > 0 && (now - createdTime) <= SEVEN_DAYS_MS && createdTime <= now + 60000) {
    return 'NEW_DATA';
  }

  // 4. Pending result -> Yellow (appointmentDate in past without recorded result, older than 7 days)
  if (isAppointmentDatePastOrToday(apt, new Date(now)) && !isAuditResultCompleted(apt)) {
    return 'PENDING_RESULT';
  }

  // 5. Default fallback -> Green
  return 'COMPLETE_DATA';
};

export function getAppointmentStatusColor(apt: any, nowMs: number = Date.now()): string {
  const status = resolveAuditStatus(apt, nowMs);
  switch (status) {
    case 'INCOMPLETE_DATA':
      return STATUS_COLOR_MAP.incomplete.color;
    case 'NEW_DATA':
      return STATUS_COLOR_MAP.new.color;
    case 'UPDATED_DATA':
      return STATUS_COLOR_MAP.updated.color;
    case 'PENDING_RESULT':
      return STATUS_COLOR_MAP.pending.color;
    case 'COMPLETE_DATA':
    default:
      return STATUS_COLOR_MAP.complete.color;
  }
}

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

export function getAppointmentDateObj(a: Assignment | any): Date {
  if (!a) return new Date(0);
  if (a.dateObj instanceof Date && !isNaN(a.dateObj.getTime())) return a.dateObj;
  if (a.date) {
    const d = new Date(a.date);
    if (!isNaN(d.getTime())) return d;
  }
  if (a.startDate) {
    const d = new Date(a.startDate);
    if (!isNaN(d.getTime())) return d;
  }
  if (a.fromDate) {
    const d = new Date(a.fromDate);
    if (!isNaN(d.getTime())) return d;
  }
  if (a.week !== undefined && a.day !== undefined) {
    return new Date(2026, 5, 29 + a.week * 7 + a.day);
  }
  return new Date(0);
}

export {
  calculateAuditStats,
  getGroupedAuditEvents,
  getUniqueAuditEvents,
  calculateAuditMetrics,
  calculateUnifiedAuditMetrics,
} from './utils/auditMetricsHelper';
export type { AuditStatsResult, AuditStatsResult as AuditMetrics } from './utils/auditMetricsHelper';

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
  standard?: string;
  department1: string;
  site?: string;
  site1: string;
  customer: string;
  endCustomer: string;
  targetPackage: string;
  customerNames: string;
  auditCategory: string;
  auditor?: string;
  auditor1: string;
  department2: string;
  site2: string;
  area: string;
  auditor2: string;
  qmsHost?: string;
  department?: Department | '';
  warn?: boolean;
  warnText?: string;
}

export interface EditDraft {
  targetId: string;
  sectionType: 'customer' | 'internal';
  dateFrom: string;
  dateTo: string;
  site?: string;
  site1: string;
  customer: string;
  endCustomer: string;
  purpose: string;
  targetPackage: string;
  customerNames: string;
  auditCategory: string;
  auditor?: string;
  auditor1: string;
  standard?: string;
  department1: string;
  site2: string;
  area: string;
  auditor2: string;
  department2: string;
  qmsHost?: string;
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

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'REORDER' | 'MANAGE_ITEM' | 'RESET' | 'OTHER';
export type EntityType = 'APPOINTMENT' | 'CUSTOMER' | 'END_CUSTOMER' | 'AUDITOR' | 'QMS_HOST' | 'SITE' | 'STANDARD' | 'DEPARTMENT' | 'PURPOSE' | 'TARGET_PACKAGE' | 'CUSTOMER_NAME' | 'AUDIT_CATEGORY' | 'HOLIDAY';

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
  /** True once the entry is stored in the shared History on the server (user and time then come from the server). */
  synced?: boolean;
}

export type { CustomHolidayType, CustomHoliday, HolidayInfo, HolidayStyle, EffectivePublicHoliday } from './holidays';
export {
  SHUTDOWN_SITE_OPTIONS,
  getHolidayForDate,
  getHolidayStyle,
  isOfficialHoliday,
  isDateCompletelyBlocked,
  isDateRestrictedToInternalAuditOnly,
  getShutdownSitesForDate,
  getShutdownSitesForRange,
  setCustomHolidays,
  getCustomHolidays,
  formatYMD,
  getEffectivePublicHolidaysForYear,
} from './holidays';

export type Page = 'schedule' | 'table' | 'admin' | 'profile' | 'summary' | 'history';
export type View = 'person' | 'plant' | 'site' | 'timetable';
export type TimeScale = 'week' | 'month' | 'year' | 'search';
export type AdminTab = 'engineers' | 'options' | 'holidays';

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
  email?: string;
  avatarInitials?: string;
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
  /** The server stores History (migration 0021 applied and the user signed in). */
  historyOnServer?: boolean;
  /** Older History entries exist on the server beyond those loaded. */
  historyHasMore?: boolean;
  customHolidays: Record<string, import('./holidays').CustomHoliday>;
}
