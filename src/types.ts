export type Department = 'U1' | 'U2' | 'U3';
export type SubDepartment = 'QMS' | 'EHS' | 'ESD' | 'ESD Audit' | 'QS Audit';

export type Priority = 'High' | 'Med' | 'Low';
export type AppointmentKind = string;
export type EngStatus = 'Active' | 'On leave' | 'Onboarding';

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
  status: EngStatus;
}

export interface Order {
  id: string;
  code: string;
  customer: string;
  product: string;
  plant: string;
  priority: Priority;
  purpose: string;
}

export interface Assignment {
  id: string;
  eng: string;
  order: string;
  day: number;
  appointment: AppointmentKind;
  week: number;
}

export interface Comment {
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
  appointment: AppointmentKind;
}

export type Page = 'schedule' | 'admin' | 'profile';
export type View = 'person' | 'plant' | 'customer' | 'timetable';
export type TimeScale = 'week' | 'month';
export type AdminTab = 'engineers' | 'sites';

export interface EngineerForm {
  name: string;
  role: string;
  department: Department;
  subDepartments: SubDepartment[];
}

export interface SiteForm {
  name: string;
  loc: string;
  code: string;
  color: string;
}

export interface CustomerForm {
  name: string;
}

export type LeaveType = 'Vacation' | 'Sick' | 'Personal' | 'Training';

export interface Leave {
  id: string;
  eng: string;
  week: number;
  day: number;
  type: LeaveType;
  note: string;
}

export interface LeaveForm {
  eng: string;
  days: number[];
  type: LeaveType;
  note: string;
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
  filterEmp: string;
  filterSite: string;
  filterCompany: string;
  filterAuditType: string;
  filterAuditTopic: string;
  timetableOpenEng: string | null;
  loginEmail: string;
  loginPass: string;
  userMenuOpen: boolean;
  createOpen: boolean;
  createDraft: CreateDraft;
  engFormOpen: boolean;
  engForm: EngineerForm;
  siteFormOpen: boolean;
  siteForm: SiteForm;
  custFormOpen: boolean;
  custForm: CustomerForm;
  leaveFormOpen: boolean;
  leaveForm: LeaveForm;
  weekOffset: number;
  activePlants: Record<string, boolean>;
  selected: string | null;
  drag: DragState;
  overCell: string | null;
  draft: string;
  plants: Plant[];
  customers: string[];
  leave: Leave[];
  engineers: Engineer[];
  orders: Order[];
  assignments: Assignment[];
  comments: Record<string, Comment[]>;
  activity: Activity[];
}
