import type { Plant, State } from './types';
import { normalizeSite, normalizeAssignment } from './types';

export const initialPlants: Plant[] = [
  { id: 'QMS', name: 'QMS', loc: '', code: 'QMS', color: '#2f6df0', active: true },
  { id: 'EHS', name: 'EHS', loc: '', code: 'EHS', color: '#0f9d8c', active: true },
  { id: 'ESD', name: 'ESD', loc: '', code: 'ESD', color: '#c2620c', active: true },
];

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
export const initialDepartmentOptions = ['QA', 'Non-QA'];
export const initialSiteCodeOptions = ['UTL1', 'UTL2', 'UTL2A', 'UTL2B', 'UTL3', 'UTL3A', 'UTL3T'];
// red for U1, green shades for U2 family, blue shades for U3 family
export const initialSiteColors: Record<string, string> = {
  UTL1: '#c0392b',
  UTL2: '#2e7d32',
  UTL2A: '#66bb6a',
  UTL2B: '#1b5e20',
  UTL3: '#1e5fa8',
  UTL3A: '#4a90d9',
  UTL3T: '#123f73',
  // Backward compatibility keys for legacy records
  U1: '#c0392b',
  U2: '#2e7d32',
  U2A: '#66bb6a',
  U2B: '#1b5e20',
  U3: '#1e5fa8',
  U3A: '#4a90d9',
  U3T: '#123f73',
};

export function initialState(): State {
  let snapshot: any = {};
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('calendar_qa_snapshot') : null;
    if (raw) snapshot = JSON.parse(raw);
  } catch {}

  return {
    authed: false,
    page: 'schedule',
    view: 'person',
    adminTab: 'engineers',
    vw: typeof window !== 'undefined' ? window.innerWidth : 1440,
    selectedDay: 0,
    sidebarOpen: false,
    timeScale: 'week',
    monthOffset: 0,
    filterEmp: [],
    filterSite: [],
    filterCompany: [],
    filterAuditType: [],
    filterAuditTopic: [],
    filterTargetPackage: [],
    filterCustomerName: [],
    filterAuditCategory: [],
    filterApptType: [],
    adminFilterSite: [],
    adminFilterDept: [],
    dayDialog: null,
    monthSelectedDate: null,
    timetableOpenEng: null,
    currentUser: {
      id: 'usr_jordan',
      username: 'jordan.lee',
      name: 'Jordan Lee',
      role: 'admin',
    },
    loginEmail: '',
    loginPass: '',
    userMenuOpen: false,
    createOpen: false,
    createDraft: { order: '', eng: '', day: 0, dateFrom: '', dateTo: '', sectionType: 'customer', purpose: '', department1: '', site1: '', customer: '', endCustomer: '', targetPackage: '', customerNames: '', auditCategory: '', auditor1: '', department2: '', site2: '', area: '', auditor2: '', department: undefined },
    editOpen: false,
    editDraft: { targetId: '', sectionType: 'customer', dateFrom: '', dateTo: '', site1: '', customer: '', endCustomer: '', purpose: '', targetPackage: '', customerNames: '', auditCategory: '', auditor1: '', department1: '', site2: '', area: '', auditor2: '', department2: '', department: undefined },
    editScopePrompt: null,
    resultsModalOpen: false,
    resultsTargetId: null,
    engFormOpen: false,
    engEditingId: null,
    engForm: { name: '', role: '', site: 'UTL1', department: 'QA', subDepartments: [] },
    weekOffset: 0,
    activePlants: snapshot.activePlants || { QMS: true, EHS: true, ESD: true },
    selected: null,
    drag: null,
    overCell: null,
    draft: '',
    summaryYear: 2026,
    searchQuery: '',
    searchSort: 'oldest',
    searchDateFrom: '',
    searchDateTo: '',
    purposeOptions: snapshot.purposeOptions || initialPurposeOptions.slice(),
    customerDepartmentOptions: snapshot.customerDepartmentOptions || initialCustomerDepartmentOptions.slice(),
    internalDepartmentOptions: snapshot.internalDepartmentOptions || initialInternalDepartmentOptions.slice(),
    departmentOptions: snapshot.departmentOptions || initialDepartmentOptions.slice(),
    siteCodeOptions: snapshot.siteCodeOptions ? Array.from(new Set(snapshot.siteCodeOptions.map((s: string) => normalizeSite(s)))) : initialSiteCodeOptions.slice(),
    siteColors: (() => {
      const base: Record<string, string> = { ...initialSiteColors, ...(snapshot.siteColors || {}) };
      for (const [k, v] of Object.entries(base)) {
        const norm = normalizeSite(k);
        if (!base[norm]) base[norm] = v;
      }
      return base;
    })(),
    customerOptions: snapshot.customerOptions || [],
    endCustomerOptions: snapshot.endCustomerOptions || [],
    auditorOptions: snapshot.auditorOptions || [],
    targetPackageOptions: snapshot.targetPackageOptions || [],
    customerNameOptions: snapshot.customerNameOptions || [],
    auditCategoryOptions: snapshot.auditCategoryOptions || [],
    removedOptions: snapshot.removedOptions || [],
    masterCreatedOptions: snapshot.masterCreatedOptions || (() => {
      const map: Record<string, boolean> = {};
      initialSiteCodeOptions.forEach((s) => { map['siteCodeOptions:' + s.toLowerCase()] = true; });
      initialCustomerDepartmentOptions.forEach((d) => { map['customerDepartmentOptions:' + d.toLowerCase()] = true; });
      initialInternalDepartmentOptions.forEach((d) => { map['internalDepartmentOptions:' + d.toLowerCase()] = true; });
      initialDepartmentOptions.forEach((d) => { map['departmentOptions:' + d.toLowerCase()] = true; });
      initialPurposeOptions.forEach((p) => { map['purposeOptions:' + p.toLowerCase()] = true; });
      return map;
    })(),
    plants: snapshot.plants || initialPlants.map((p) => ({ ...p })),
    engineers: snapshot.engineers || [],
    orders: snapshot.orders || [],
    assignments: (snapshot.assignments || []).map(normalizeAssignment),
    comments: snapshot.comments || (() => {
      try {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('calendar_qa_comments') : null;
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    })(),
    activity: snapshot.activity || [],
    activityLogs: snapshot.activityLogs || [],
  };
}


