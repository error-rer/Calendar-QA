import type { Plant, State } from './types';

export const initialPlants: Plant[] = [
  { id: 'QMS', name: 'QMS', loc: '', code: 'QMS', color: '#2f6df0', active: true },
  { id: 'EHS', name: 'EHS', loc: '', code: 'EHS', color: '#0f9d8c', active: true },
  { id: 'ESD', name: 'ESD', loc: '', code: 'ESD', color: '#c2620c', active: true },
];

/** Swatch options offered when creating a new fab site. */
export const siteColors = ['#2f6df0', '#0f9d8c', '#c2620c', '#7a4ddb', '#1f9d57', '#c0407a', '#0c8599', '#b5503a'];

export const avatarPalette = [
  '#2f6df0', '#0f9d8c', '#c2620c', '#7a4ddb', '#1f9d57', '#c0407a',
  '#2756d6', '#8a6d12', '#0c8599', '#9a3d9a', '#3a7d44', '#b5503a',
];

export const custPalette = ['#2756d6', '#0f8a5b', '#b5503a', '#7a4ddb', '#0c8599'];

export const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

export const initialPurposeOptions = ['site qualification', 'system audit', 'product qualification', 'pre-audit', 'annual audit', 'process control', 'gemba walk', 'QMS audit'];
export const initialCustomerDepartmentOptions = ['ESD Audit', 'QS Audit', 'IATF16949/ISO9001', 'ISO14001/ISO45001', 'RBA'];
export const initialInternalDepartmentOptions = ['QMS', 'EHS', 'ESD'];
export const initialSiteCodeOptions = ['U1', 'U2', 'U2A', 'U2B', 'U3', 'U3A', 'U3T'];

export function initialState(): State {
  return {
    authed: false,
    page: 'schedule',
    view: 'person',
    adminTab: 'engineers',
    vw: 1440,
    selectedDay: 0,
    sidebarOpen: false,
    timeScale: 'week',
    monthOffset: 0,
    filterEmp: [],
    filterSite: [],
    filterCompany: [],
    filterAuditType: [],
    filterAuditTopic: [],
    filterApptType: [],
    dayDialog: null,
    timetableOpenEng: null,
    loginEmail: 'jordan.lee@nexsil.com',
    loginPass: 'directorqa',
    userMenuOpen: false,
    createOpen: false,
    createDraft: { order: '', eng: '', day: 0, dateFrom: '', dateTo: '', sectionType: 'customer', purpose: '', department1: '', site1: '', customer: '', endCustomer: '', auditor1: '', department2: '', site2: '', area: '', auditor2: '' },
    editOpen: false,
    editDraft: { targetId: '', sectionType: 'customer', dateFrom: '', dateTo: '', site1: '', customer: '', endCustomer: '', purpose: '', auditor1: '', department1: '', site2: '', area: '', auditor2: '', department2: '' },
    engFormOpen: false,
    engForm: { name: '', role: '', department: 'U1', subDepartments: [] },
    siteFormOpen: false,
    siteForm: { name: '', loc: '', code: '', color: siteColors[0] },
    orderFormOpen: false,
    orderForm: { code: '', product: '', customer: '', plant: 'QMS' },
    weekOffset: 0,
    activePlants: { QMS: true, EHS: true, ESD: true },
    selected: null,
    drag: null,
    overCell: null,
    draft: '',
    summaryYear: 2026,
    purposeOptions: initialPurposeOptions.slice(),
    customerDepartmentOptions: initialCustomerDepartmentOptions.slice(),
    internalDepartmentOptions: initialInternalDepartmentOptions.slice(),
    siteCodeOptions: initialSiteCodeOptions.slice(),
    customerOptions: [],
    plants: initialPlants.map((p) => ({ ...p })),
    engineers: [],
    orders: [],
    assignments: [],
    comments: {},
    activity: [],
  };
}


