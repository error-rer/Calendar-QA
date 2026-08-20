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

export function isIncompleteAssignment(a: Assignment): boolean {
  if (!a) return false;
  const isInternal = isInternalAssignment(a);

  if (isInternal) {
    // Required fields for Internal Audit (IA): Site (site2), Department (department2), Area (area), Auditor (auditor2)
    // Purpose, Customer, and End Customer are NOT fields/required for IA
    return (
      !hasValue(a.site2) ||
      !hasValue(a.department2) ||
      !hasValue(a.area) ||
      !hasValue(a.auditor2)
    );
  } else {
    // Required fields for Customer Audit (CS): Site (site1), Customer (customer), Purpose (purpose), Auditor (auditor1), Department (department1)
    // End Customer is optional
    return (
      !hasValue(a.site1) ||
      !hasValue(a.customer) ||
      !hasValue(a.purpose) ||
      !hasValue(a.auditor1) ||
      !hasValue(a.department1)
    );
  }
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

export type Page = 'schedule' | 'admin' | 'profile' | 'summary';
export type View = 'person' | 'plant' | 'site' | 'timetable';
export type TimeScale = 'week' | 'month' | 'year' | 'search';
export type AdminTab = 'engineers' | 'options';

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
  auditorOptions: string[];
  removedOptions: string[];
  plants: Plant[];
  engineers: Engineer[];
  orders: Order[];
  assignments: Assignment[];
  comments: Record<string, Comment[]>;
  activity: Activity[];
}
