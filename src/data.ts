import type { CertCode, Plant, State } from './types';

export const certName: Record<CertCode, string> = {
  AEC: 'AEC-Q100 Qual',
  REL: 'Reliability',
  CR1: 'Cleanroom Class 1',
  CR2: 'Cleanroom Class 2',
  FA: 'Failure Analysis',
  XCT: 'X-ray / CT',
  ATE: 'ATE Programming',
};

export const certOrder: CertCode[] = ['AEC', 'REL', 'FA', 'XCT', 'ATE', 'CR1', 'CR2'];

export const initialPlants: Plant[] = [
  { id: 'p1', name: 'Fab 7', loc: 'Chandler, AZ', code: 'FAB7', color: '#2f6df0', active: true },
  { id: 'p2', name: 'Fab 12', loc: 'Hillsboro, OR', code: 'FAB12', color: '#0f9d8c', active: true },
  { id: 'p3', name: 'Fab 22', loc: 'Dresden, DE', code: 'FAB22', color: '#c2620c', active: true },
  { id: 'p4', name: 'ATM Penang', loc: 'Penang, MY', code: 'ATM', color: '#7a4ddb', active: true },
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
export const newCustomers = ['Helio Compute', 'Vanta Auto', 'Cirrus Networks', 'Orion Medical', 'Nimbus Aero'];

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
    filterCust: '',
    loginEmail: 'jordan.lee@nexsil.com',
    loginPass: 'directorqa',
    userMenuOpen: false,
    createOpen: false,
    adminAddCertFor: null,
    createDraft: { order: '', eng: '', day: 0, shift: 'Day' },
    orderFormOpen: false,
    orderForm: { code: '', product: '', customer: '', plant: 'p1', priority: 'Med', req: [] },
    engFormOpen: false,
    engForm: { name: '', role: '', status: 'Active', certs: [] },
    siteFormOpen: false,
    siteForm: { name: '', loc: '', code: '', color: siteColors[0] },
    custFormOpen: false,
    custForm: { name: '' },
    leaveFormOpen: false,
    leaveForm: { eng: '', days: [], type: 'Vacation', note: '' },
    weekOffset: 0,
    activePlants: { p1: true, p2: true, p3: true, p4: true },
    selected: null,
    drag: null,
    overCell: null,
    draft: '',
    plants: initialPlants.map((p) => ({ ...p })),
    customers: [],
    leave: [
      { id: 'l1', eng: 'e9', week: 0, day: 0, type: 'Vacation', note: '' },
      { id: 'l2', eng: 'e9', week: 0, day: 1, type: 'Vacation', note: '' },
      { id: 'l3', eng: 'e6', week: 0, day: 2, type: 'Training', note: 'AEC-Q100 recert' },
    ],
    engineers: [
      { id: 'e1', name: 'Dana Okafor', role: 'Reliability Lead', certs: ['AEC', 'REL', 'CR1'], status: 'Active' },
      { id: 'e2', name: 'Marco Ruiz', role: 'Failure Analysis', certs: ['FA', 'XCT', 'CR2'], status: 'Active' },
      { id: 'e3', name: 'Priya Nair', role: 'ATE Engineer', certs: ['ATE', 'AEC'], status: 'Active' },
      { id: 'e4', name: 'Sven Holt', role: 'Test Technician', certs: ['CR2', 'ATE'], status: 'Active' },
      { id: 'e5', name: 'Lena Fischer', role: 'Reliability Eng', certs: ['REL', 'AEC', 'CR1'], status: 'Active' },
      { id: 'e6', name: 'Tom Becker', role: 'FA Technician', certs: ['FA', 'XCT'], status: 'Active' },
      { id: 'e7', name: 'Aiko Tan', role: 'ATE Engineer', certs: ['ATE', 'CR2'], status: 'Active' },
      { id: 'e8', name: 'Raj Patel', role: 'Quality Engineer', certs: ['AEC', 'REL'], status: 'Active' },
      { id: 'e9', name: 'Mia Cole', role: 'Test Technician', certs: ['ATE', 'CR2'], status: 'On leave' },
      { id: 'e10', name: 'Omar Haddad', role: 'FA Engineer', certs: ['FA', 'XCT', 'CR1'], status: 'Active' },
    ],
    orders: [
      { id: 'o1', code: 'NB-4471', customer: 'Nimbus Aero', product: 'Rad-hard FPGA', plant: 'p3', req: ['REL', 'CR1'], priority: 'High' },
      { id: 'o2', code: 'VA-2207', customer: 'Vanta Auto', product: 'Automotive MCU', plant: 'p1', req: ['AEC'], priority: 'High' },
      { id: 'o3', code: 'HC-9930', customer: 'Helio Compute', product: 'HPC GPU die', plant: 'p2', req: ['ATE'], priority: 'Med' },
      { id: 'o4', code: 'OM-1185', customer: 'Orion Medical', product: 'Implant ASIC', plant: 'p3', req: ['FA', 'CR1'], priority: 'High' },
      { id: 'o5', code: 'CN-7758', customer: 'Cirrus Networks', product: 'Switch SoC', plant: 'p1', req: ['ATE', 'AEC'], priority: 'Med' },
      { id: 'o6', code: 'HC-9931', customer: 'Helio Compute', product: 'HBM stack test', plant: 'p4', req: ['XCT'], priority: 'Low' },
      { id: 'o7', code: 'VA-2210', customer: 'Vanta Auto', product: 'Power IGBT qual', plant: 'p3', req: ['REL'], priority: 'Med' },
      { id: 'o8', code: 'NB-4480', customer: 'Nimbus Aero', product: 'Sensor MEMS', plant: 'p4', req: ['FA'], priority: 'Med' },
    ],
    assignments: [
      { id: 'a1', eng: 'e1', order: 'o1', day: 0, shift: 'Day', week: 0 },
      { id: 'a2', eng: 'e1', order: 'o1', day: 1, shift: 'Day', week: 0 },
      { id: 'a3', eng: 'e1', order: 'o1', day: 2, shift: 'Day', week: 0 },
      { id: 'a4', eng: 'e10', order: 'o4', day: 0, shift: 'Day', week: 0 },
      { id: 'a5', eng: 'e10', order: 'o4', day: 1, shift: 'Day', week: 0 },
      { id: 'a6', eng: 'e3', order: 'o2', day: 0, shift: 'Day', week: 0 },
      { id: 'a7', eng: 'e3', order: 'o5', day: 0, shift: 'Day', week: 0 },
      { id: 'a8', eng: 'e4', order: 'o2', day: 2, shift: 'Day', week: 0 },
      { id: 'a9', eng: 'e8', order: 'o2', day: 3, shift: 'Day', week: 0 },
      { id: 'a10', eng: 'e5', order: 'o7', day: 3, shift: 'Day', week: 0 },
      { id: 'a11', eng: 'e5', order: 'o7', day: 4, shift: 'Day', week: 0 },
      { id: 'a12', eng: 'e8', order: 'o5', day: 4, shift: 'Day', week: 0 },
      { id: 'a13', eng: 'e7', order: 'o3', day: 1, shift: 'Day', week: 0 },
      { id: 'a14', eng: 'e2', order: 'o8', day: 2, shift: 'Night', week: 0 },
    ],
    comments: {
      a8: [{ who: 'Marco Ruiz', initials: 'MR', text: 'Sven isn’t AEC-Q100 certified yet — needs Raj or Priya to co-sign the lot.', ago: '14m', color: '#0f9d8c' }],
      a6: [{ who: 'Priya Nair', initials: 'PN', text: 'Taking the Vanta MCU lot Monday, will hand to Raj for Thu.', ago: '9m', color: '#c2620c' }],
    },
    activity: [
      { who: 'Priya Nair', text: 'assigned VA-2207 → Mon', ago: '9 min ago', color: '#c2620c' },
      { who: 'Marco Ruiz', text: 'flagged Sven Holt · missing AEC-Q100', ago: '14 min ago', color: '#0f9d8c' },
      { who: 'Lena Fischer', text: 'added 2 days on VA-2210', ago: '22 min ago', color: '#7a4ddb' },
    ],
  };
}
