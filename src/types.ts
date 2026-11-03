export type Department = 'U1' | 'U2' | 'U3';
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
  department: Department;
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

export interface Assignment {
  id: string;
  eng: string;
  order: string;
  day: number;
  week: number;
  sectionType?: 'customer' | 'internal';
  site1?: string;
  customer?: string;
  endCustomer?: string;
  auditor1?: string;
  purpose?: string;
  site2?: string;
  area?: string;
  auditor2?: string;
  department1?: string;
  department2?: string;
  major?: number;
  minor?: number;
  ofi?: number;
  request?: number;
  utl1?: number;
  utl2?: number;
  utl3?: number;
  createdBy?: string;
  createdAt?: number;
}

function hasValue(val: any): boolean {
  return val !== undefined && val !== null && String(val).trim() !== '';
}

export function isInternalAssignment(a: Assignment): boolean {
  if (!a) return false;
  return (
    a.sectionType === 'internal' ||
    !!(a.site2 || a.auditor2 || a.department2 || a.area) ||
    (typeof a.id === 'string' && a.id.startsWith('IA')) ||
    (typeof a.order === 'string' && a.order.startsWith('IA'))
  );
}

export function getMissingFields(a: Assignment): string[] {
  if (!a) return [];
  const isInternal = isInternalAssignment(a);
  const missing: string[] = [];

  const siteVal = (isInternal ? a.site2 || a.site1 : a.site1 || a.site2) || '';
  const auditorVal = (isInternal ? a.auditor2 || a.auditor1 : a.auditor1 || a.auditor2) || '';

  if (isInternal) {
    // Required fields for Internal Audit (IA): Site, Area, Auditor (No Purpose check)
    if (!hasValue(siteVal)) missing.push('Site');
    if (!hasValue(a.area)) missing.push('Area');
    if (!hasValue(auditorVal)) missing.push('Auditor');
  } else {
    // Required fields for Customer Audit (CS): Site, Customer, Purpose, Auditor
    if (!hasValue(siteVal)) missing.push('Site');
    if (!hasValue(a.customer)) missing.push('Customer');
    if (!hasValue(a.purpose)) missing.push('Purpose');
    if (!hasValue(auditorVal)) missing.push('Auditor');
  }

  return missing;
}

export function isAppointmentIncomplete(a: Assignment): boolean {
  if (!a) return false;
  return getMissingFields(a).length > 0;
}

export const isIncompleteAssignment = isAppointmentIncomplete;

export function formatApptDisplayTitle(a: Assignment, defaultOrder?: { customer?: string; plant?: string } | null): string {
  if (!a) return '';

  const isInternal = isInternalAssignment(a);

  if (isInternal) {
    // Label Formatting for "IA" (Internal Audit) Type:
    // Sequence: IA · {Department} · {Area} - {Site}
    const dept = (a.department2 || a.department1 || '').trim();
    const area = (a.area || '').trim();
    const site = (a.site2 || a.site1 || '').trim();

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
    const site = (a.site1 || a.site2 || (defaultOrder ? defaultOrder.plant : '') || '').trim();

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
  auditor1: string;
  department2: string;
  site2: string;
  area: string;
  auditor2: string;
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
  auditor1: string;
  department1: string;
  site2: string;
  area: string;
  auditor2: string;
  department2: string;
  warn?: boolean;
  warnText?: string;
}

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'REORDER' | 'MANAGE_ITEM' | 'OTHER';
export type EntityType = 'APPOINTMENT' | 'CUSTOMER' | 'END_CUSTOMER' | 'AUDITOR' | 'SITE' | 'STANDARD' | 'PURPOSE';

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
export interface GoogleSheetsConfig {
  webhookUrl: string;
  autoSync: boolean;
  lastSynced?: string;
}

export type AdminTab = 'engineers' | 'options' | 'sheets';

export interface EngineerForm {
  name: string;
  role: string;
  department: Department;
  subDepartments: SubDepartment[];
}

export interface State {
  authed: boolean;
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
  siteCodeOptions: string[];
  siteColors: Record<string, string>;
  customerOptions: string[];
  endCustomerOptions: string[];
  auditorOptions: string[];
  removedOptions: string[];
  masterCreatedOptions?: Record<string, boolean>;
  plants: Plant[];
  engineers: Engineer[];
  orders: Order[];
  assignments: Assignment[];
  comments: Record<string, Comment[]>;
  activity: Activity[];
  activityLogs: ActivityLog[];
  googleSheetsConfig?: GoogleSheetsConfig;
}
