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

export const newHireNames = ['Kai Mori', 'Elena Vasquez', 'Sam Park', 'Nadia Khan', 'Leo Brandt'];
export const newCustomers = ['Company A', 'Company B', 'Company C', 'Company D', 'Company E'];

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
    filterEmp: '',
    filterSite: '',
    filterCompany: '',
    filterAuditType: '',
    filterAuditTopic: '',
    timetableOpenEng: null,
    loginEmail: 'jordan.lee@nexsil.com',
    loginPass: 'directorqa',
    userMenuOpen: false,
    createOpen: false,
    createDraft: { order: '', eng: '', day: 0, appointment: '08:00' },
    engFormOpen: false,
    engForm: { name: '', role: '', department: 'U1', subDepartments: [] },
    siteFormOpen: false,
    siteForm: { name: '', loc: '', code: '', color: siteColors[0] },
    custFormOpen: false,
    custForm: { name: '' },
    weekOffset: 0,
    activePlants: { QMS: true, EHS: true, ESD: true },
    selected: null,
    drag: null,
    overCell: null,
    draft: '',
    summaryScale: 'week',
    plants: initialPlants.map((p) => ({ ...p })),
    customers: [],
    engineers: [
      { id: 'e1', name: 'Dana Okafor', role: 'Reliability Lead', department: 'U1', subDepartments: ['QMS', 'EHS'], status: 'Active' },
      { id: 'e2', name: 'Marco Ruiz', role: 'Failure Analysis', department: 'U2', subDepartments: ['ESD'], status: 'Active' },
      { id: 'e3', name: 'Priya Nair', role: 'ATE Engineer', department: 'U1', subDepartments: ['QMS', 'ESD'], status: 'Active' },
      { id: 'e5', name: 'Lena Fischer', role: 'Reliability Eng', department: 'U1', subDepartments: ['QMS'], status: 'Active' },
      { id: 'e10', name: 'Omar Haddad', role: 'FA Engineer', department: 'U2', subDepartments: ['ESD'], status: 'Active' },
    ],
    orders: [
      { id: 'o1', code: 'NB-4471', customer: 'Company A', product: 'Rad-hard FPGA', plant: 'ESD', priority: 'High', purpose: 'annual' },
      { id: 'o2', code: 'VA-2207', customer: 'Company B', product: 'Automotive MCU', plant: 'QMS', priority: 'High', purpose: 'end cust' },
      { id: 'o3', code: 'HC-9930', customer: 'Company C', product: 'HPC GPU die', plant: 'EHS', priority: 'Med', purpose: 'VDA' },
      { id: 'o4', code: 'OM-1185', customer: 'Company D', product: 'Implant ASIC', plant: 'ESD', priority: 'High', purpose: 'annual' },
      { id: 'o5', code: 'CN-7758', customer: 'Company E', product: 'Switch SoC', plant: 'QMS', priority: 'Med', purpose: 'end cust' },
      { id: 'o6', code: 'HC-9931', customer: 'Company C', product: 'HBM stack test', plant: 'QMS', priority: 'Low', purpose: 'annual' },
      { id: 'o7', code: 'VA-2210', customer: 'Company B', product: 'Power IGBT qual', plant: 'ESD', priority: 'Med', purpose: 'VDA' },
      { id: 'o8', code: 'NB-4480', customer: 'Company A', product: 'Sensor MEMS', plant: 'ESD', priority: 'Med', purpose: 'end cust' },
    ],
    assignments: [
      { id: 'a1', eng: 'e1', order: 'o1', day: 0, appointment: '08:00', week: 0 },
      { id: 'a2', eng: 'e1', order: 'o1', day: 1, appointment: '08:00', week: 0 },
      { id: 'a3', eng: 'e1', order: 'o1', day: 2, appointment: '08:00', week: 0 },
      { id: 'a4', eng: 'e10', order: 'o4', day: 0, appointment: '08:00', week: 0 },
      { id: 'a5', eng: 'e10', order: 'o4', day: 1, appointment: '08:00', week: 0 },
      { id: 'a6', eng: 'e3', order: 'o2', day: 0, appointment: '08:00', week: 0 },
      { id: 'a7', eng: 'e3', order: 'o5', day: 0, appointment: '08:00', week: 0 },
      { id: 'a8', eng: 'e2', order: 'o2', day: 2, appointment: '08:00', week: 0 },
      { id: 'a9', eng: 'e5', order: 'o2', day: 3, appointment: '08:00', week: 0 },
      { id: 'a10', eng: 'e5', order: 'o7', day: 3, appointment: '08:00', week: 0 },
      { id: 'a11', eng: 'e5', order: 'o7', day: 4, appointment: '08:00', week: 0 },
      { id: 'a12', eng: 'e1', order: 'o5', day: 4, appointment: '08:00', week: 0 },
      { id: 'a13', eng: 'e3', order: 'o3', day: 1, appointment: '08:00', week: 0 },
      { id: 'a14', eng: 'e2', order: 'o8', day: 2, appointment: '22:00', week: 0 },
    ],
    comments: {
      a8: [{ who: 'Marco Ruiz', initials: 'MR', text: 'Sven isn\u2019t U1 — needs Raj or Priya to co-sign the lot.', ago: '14m', color: '#0f9d8c' }],
      a6: [{ who: 'Priya Nair', initials: 'PN', text: 'Taking the Vanta MCU lot Monday, will hand to Raj for Thu.', ago: '9m', color: '#c2620c' }],
    },
    activity: [
      { who: 'Priya Nair', text: 'assigned VA-2207 → Mon', ago: '9 min ago', color: '#c2620c' },
      { who: 'Marco Ruiz', text: 'flagged Sven Holt · not U1', ago: '14 min ago', color: '#0f9d8c' },
      { who: 'Lena Fischer', text: 'added 2 days on VA-2210', ago: '22 min ago', color: '#7a4ddb' },
    ],
  };
}


