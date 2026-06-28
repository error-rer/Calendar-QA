import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type {
  Assignment,
  CreateDraft,
  CustomerForm,
  EngineerForm,
  LeaveForm,
  LeaveType,
  OrderForm,
  Priority,
  SiteForm,
  State,
  SubDepartment,
} from './types';
import {
  avatarPalette,
  custPalette,
  dayLabels,
  dayNames,
  initialState,
  siteColors,
} from './data';

/** Identity tag that supplies a contextual CSSProperties type to a style literal. */
const sx = (o: CSSProperties): CSSProperties => o;

interface Conflict {
  isDbl: boolean;
  onLeave: boolean;
  has: boolean;
}
type ConflictMap = Record<string, Conflict>;

/** Swatch / pill colour per leave type. */
const leaveColor: Record<LeaveType, string> = {
  Vacation: '#7a4ddb',
  Sick: '#b32f2f',
  Personal: '#0c8599',
  Training: '#a96e08',
};

interface MonthChip {
  code: string;
  countTxt: string;
  dotStyle: CSSProperties;
  style: CSSProperties;
}
interface MonthCell {
  blank: boolean;
  style: CSSProperties;
  dateNum?: string;
  countTxt?: string;
  numStyle?: CSSProperties;
  countDotStyle?: CSSProperties;
  chips?: MonthChip[];
  more?: number;
  moreTxt?: string;
  onClick?: () => void;
}

export function useScheduler() {
  const [state, setRaw] = useState<State>(initialState);
  const ids = useRef({ id: 100, nh: 0, no: 0 });

  const setState = useCallback(
    (patch: Partial<State> | ((s: State) => Partial<State>)) => {
      setRaw((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
    },
    [],
  );

  useEffect(() => {
    const onResize = () => setRaw((s) => ({ ...s, vw: window.innerWidth }));
    window.addEventListener('resize', onResize);
    setRaw((s) => ({ ...s, vw: window.innerWidth }));
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const S = state;

  // ---- pure-ish helpers ----
  const hexA = (h: string, a: number) => {
    const n = parseInt(h.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  const engById = (id: string) => S.engineers.find((e) => e.id === id);
  const orderById = (id: string) => S.orders.find((o) => o.id === id);
  const plantById = (id: string) => S.plants.find((p) => p.id === id);
  const initials = (name: string) =>
    name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const avatarColor = (id: string) => {
    const i = S.engineers.findIndex((e) => e.id === id);
    return avatarPalette[(i < 0 ? 0 : i) % avatarPalette.length];
  };
  const fmtDate = (d: Date) => {
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    return m + ' ' + d.getDate();
  };
  const weekAssignments = () => S.assignments.filter((a) => a.week === S.weekOffset);
  const weekLeave = () => S.leave.filter((l) => l.week === S.weekOffset);
  const monthBaseDate = () => new Date(2026, 5 + (S.monthOffset || 0), 1);
  /** Map an absolute date onto the seeded scheduling grid (week offset + weekday index). */
  const dateSlot = (d: Date) => {
    const base = new Date(2026, 5, 29);
    const diff = Math.round((d.getTime() - base.getTime()) / 86400000);
    return { weekOffset: Math.floor(diff / 7), wd: (d.getDay() + 6) % 7 };
  };
  /** Per-week conflict lookup (has-conflict only), memoised across the month grid. */
  const confMapForWeek = (wo: number, cache: Record<number, Record<string, { has: boolean }>>) => {
    if (cache[wo]) return cache[wo];
    const list = S.assignments.filter((a) => a.week === wo);
    const leaveSet = new Set(S.leave.filter((l) => l.week === wo).map((l) => l.eng + '|' + l.day));
    const slots: Record<string, string[]> = {};
    list.forEach((a) => {
      const k = a.eng + '|' + a.day + '|' + a.appointment;
      (slots[k] = slots[k] || []).push(a.id);
    });
    const m: Record<string, { has: boolean }> = {};
    list.forEach((a) => {
      const isDbl = slots[a.eng + '|' + a.day + '|' + a.appointment].length > 1;
      const onLeave = leaveSet.has(a.eng + '|' + a.day);
      m[a.id] = { has: isDbl || onLeave };
    });
    cache[wo] = m;
    return m;
  };
  const priorityColors = (p: Priority) =>
    ({
      High: { c: '#b32f2f', b: '#fbe3e3', bd: '#f0c4c4' },
      Med: { c: '#a96e08', b: '#fff3df', bd: '#f1dcb0' },
      Low: { c: '#6a706a', b: '#eef1ea', bd: '#e2e5de' },
    })[p];
  const chipDimmed = (a: Assignment) => {
    const o = orderById(a.order);
    if (!o) return false;
    if (!S.activePlants[o.plant]) return true;
    if (S.filterEmp && a.eng !== S.filterEmp) return true;
    if (S.filterCust && o.customer !== S.filterCust) return true;
    return false;
  };

  const conflictMap = (): ConflictMap => {
    const wk = weekAssignments();
    const leaveSet = new Set(weekLeave().map((l) => l.eng + '|' + l.day));
    const slots: Record<string, string[]> = {};
    wk.forEach((a) => {
      const k = a.eng + '|' + a.day + '|' + a.appointment;
      (slots[k] = slots[k] || []).push(a.id);
    });
    const map: ConflictMap = {};
    wk.forEach((a) => {
      const isDbl = slots[a.eng + '|' + a.day + '|' + a.appointment].length > 1;
      const onLeave = leaveSet.has(a.eng + '|' + a.day);
      map[a.id] = { isDbl, onLeave, has: isDbl || onLeave };
    });
    return map;
  };

  const log = (who: string, text: string, color: string) =>
    setState((s) => ({
      activity: [{ who, text, ago: 'just now', color }].concat(s.activity).slice(0, 9),
    }));

  // ---- auth / nav ----
  const signIn = () => setState({ authed: true });
  const signOut = () => setState({ authed: false, userMenuOpen: false, selected: null });
  const goSchedule = () => setState({ page: 'schedule', userMenuOpen: false });
  const goAdmin = () => setState({ page: 'admin', userMenuOpen: false, selected: null });
  const goProfile = () => setState({ page: 'profile', userMenuOpen: false, selected: null, sidebarOpen: false });
  const setView = (v: State['view']) => setState({ view: v, selected: null, sidebarOpen: false });
  const setScale = (sc: State['timeScale']) => setState({ timeScale: sc, selected: null, sidebarOpen: false });
  const togglePlant = (pid: string) =>
    setState((s) => ({ activePlants: { ...s.activePlants, [pid]: !s.activePlants[pid] } }));
  const shiftWeek = (n: number) => setState((s) => ({ weekOffset: s.weekOffset + n, selected: null }));
  const shiftMonth = (n: number) => setState((s) => ({ monthOffset: (s.monthOffset || 0) + n, selected: null }));
  const drillToDay = (weekOffset: number, wd: number) =>
    setState({ timeScale: 'week', weekOffset, selectedDay: wd, selected: null });
  const setSelectedDay = (i: number) => setState({ selectedDay: i });
  const toggleSidebar = () => setState((s) => ({ sidebarOpen: !s.sidebarOpen }));
  const closeSidebar = () => setState({ sidebarOpen: false });
  const setFilterEmp = (v: string) => setState({ filterEmp: v });
  const setFilterCust = (v: string) => setState({ filterCust: v });
  const clearFilters = () =>
    setState((s) => ({ filterEmp: '', filterCust: '', activePlants: Object.fromEntries(s.plants.map((p) => [p.id, true])) }));

  const copyWeek = () => {
    const off = S.weekOffset;
    const clones = S.assignments
      .filter((a) => a.week === 0)
      .map((a) => ({ ...a, id: 'a' + ids.current.id++, week: off }));
    setState((s) => ({ assignments: s.assignments.concat(clones) }));
    log('You', 'copied current week’s plan', '#2756d6');
  };

  // ---- schedule mutations ----
  const select = (aid: string) => setState({ selected: aid, draft: '' });
  const createAssign = (orderId: string, engId: string, day: number, appointment: State['createDraft']['appointment']) => {
    const id = 'a' + ids.current.id++;
    setState((s) => ({
      assignments: s.assignments.concat([{ id, eng: engId, order: orderId, day, appointment: appointment || 'Day', week: s.weekOffset }]),
      selected: id,
    }));
    const ord = orderById(orderId);
    const eng = engById(engId);
    if (ord && eng) log('You', `staffed ${ord.code} → ${eng.name.split(' ')[0]}, ${dayLabels[day]}`, '#2756d6');
  };
  const moveAssign = (aid: string, engId: string, day: number) => {
    const a = S.assignments.find((x) => x.id === aid);
    setState((s) => ({
      assignments: s.assignments.map((x) => (x.id === aid ? { ...x, eng: engId, day, week: s.weekOffset } : x)),
      selected: aid,
    }));
    if (a) {
      const ord = orderById(a.order);
      const eng = engById(engId);
      if (ord && eng) log('You', `moved ${ord.code} → ${eng.name.split(' ')[0]}, ${dayLabels[day]}`, '#2756d6');
    }
  };
  const setAppointment = (aid: string, appointment: State['createDraft']['appointment']) =>
    setState((s) => ({ assignments: s.assignments.map((a) => (a.id === aid ? { ...a, appointment } : a)) }));
  const removeAssign = (aid: string) => {
    const a = S.assignments.find((x) => x.id === aid);
    setState((s) => ({ assignments: s.assignments.filter((x) => x.id !== aid), selected: null }));
    if (a) {
      const ord = orderById(a.order);
      if (ord) log('You', `removed ${ord.code} appointment`, '#2756d6');
    }
  };
  const duplicate = (aid: string) => {
    const a = S.assignments.find((x) => x.id === aid);
    if (!a) return;
    const nd = Math.min(a.day + 1, 4);
    const id = 'a' + ids.current.id++;
    setState((s) => ({ assignments: s.assignments.concat([{ ...a, id, day: nd }]), selected: id }));
    const ord = orderById(a.order);
    if (ord) log('You', `duplicated ${ord.code} → ${dayLabels[nd]}`, '#2756d6');
  };
  const addComment = () => {
    const aid = S.selected;
    const t = S.draft.trim();
    if (!aid || !t) return;
    setState((s) => {
      const list = (s.comments[aid] || []).concat([
        { who: 'You', initials: 'YO', text: t, ago: 'just now', color: '#2756d6' },
      ]);
      return { comments: { ...s.comments, [aid]: list }, draft: '' };
    });
    const a = S.assignments.find((x) => x.id === aid);
    if (a) {
      const ord = orderById(a.order);
      if (ord) log('You', `noted on ${ord.code}`, '#2756d6');
    }
  };

  // ---- create modal ----
  const openCreate = () =>
    setState((s) => ({
      createOpen: true,
      userMenuOpen: false,
      sidebarOpen: false,
      createDraft: { order: '', eng: '', day: s.selectedDay || 0, appointment: 'Day' },
    }));
  const openCreateAt = (engId: string, day: number) =>
    setState({ createOpen: true, userMenuOpen: false, createDraft: { order: '', eng: engId, day, appointment: 'Day' } });
  const closeCreate = () => setState({ createOpen: false });
  const setDraft = (patch: Partial<CreateDraft>) =>
    setState((s) => ({ createDraft: { ...s.createDraft, ...patch } }));
  const submitCreate = () => {
    const d = S.createDraft;
    if (!d.order || !d.eng) return;
    createAssign(d.order, d.eng, d.day, d.appointment);
    setState({ createOpen: false });
  };

  // ---- admin ----
  const toggleUserMenu = () => setState((s) => ({ userMenuOpen: !s.userMenuOpen }));
  const setAdminTab = (t: State['adminTab']) => setState({ adminTab: t });
  const toggleStatus = (id: string) =>
    setState((s) => ({
      engineers: s.engineers.map((e) =>
        e.id === id ? { ...e, status: e.status === 'Active' ? 'On leave' : 'Active' } : e,
      ),
    }));
  // ---- create-engineer modal ----
  const openEngForm = () =>
    setState({ engFormOpen: true, userMenuOpen: false, sidebarOpen: false, engForm: { name: '', role: '', department: 'QA-U1', subDepartments: [], status: 'Active' } });
  const closeEngForm = () => setState({ engFormOpen: false });
  const setEngForm = (patch: Partial<EngineerForm>) => setState((s) => ({ engForm: { ...s.engForm, ...patch } }));
  const toggleEngSubDept = (c: SubDepartment) =>
    setState((s) => {
      const has = s.engForm.subDepartments.includes(c);
      return { engForm: { ...s.engForm, subDepartments: has ? s.engForm.subDepartments.filter((x) => x !== c) : s.engForm.subDepartments.concat([c]) } };
    });
  const submitEngForm = () => {
    const f = S.engForm;
    if (!f.name.trim()) return;
    const id = 'e' + ids.current.id++;
    setState((s) => ({
      engineers: s.engineers.concat([{ id, name: f.name.trim(), role: f.role.trim() || 'QA Engineer', department: f.department, subDepartments: f.subDepartments.slice(), status: f.status }]),
      engFormOpen: false,
    }));
    log('You', `added ${f.name.trim().split(' ')[0]} · ${f.status.toLowerCase()}`, '#2756d6');
  };

  // ---- create-site modal ----
  const openSiteForm = () =>
    setState({ siteFormOpen: true, userMenuOpen: false, sidebarOpen: false, siteForm: { name: '', loc: '', code: '', color: siteColors[0] } });
  const closeSiteForm = () => setState({ siteFormOpen: false });
  const setSiteForm = (patch: Partial<SiteForm>) => setState((s) => ({ siteForm: { ...s.siteForm, ...patch } }));
  const submitSiteForm = () => {
    const f = S.siteForm;
    if (!f.name.trim()) return;
    const id = 'p' + ids.current.id++;
    const code = (f.code.trim() || f.name.trim().replace(/[^A-Za-z0-9]/g, '').slice(0, 5)).toUpperCase();
    setState((s) => ({
      plants: s.plants.concat([{ id, name: f.name.trim(), loc: f.loc.trim() || '—', code, color: f.color, active: true }]),
      activePlants: { ...s.activePlants, [id]: true },
      siteFormOpen: false,
    }));
    log('You', `added site ${f.name.trim()}`, '#2756d6');
  };

  // ---- create-customer modal ----
  const openCustForm = () =>
    setState({ custFormOpen: true, userMenuOpen: false, sidebarOpen: false, custForm: { name: '' } });
  const closeCustForm = () => setState({ custFormOpen: false });
  const setCustForm = (patch: Partial<CustomerForm>) => setState((s) => ({ custForm: { ...s.custForm, ...patch } }));
  const submitCustForm = () => {
    const name = S.custForm.name.trim();
    if (!name) return;
    setState((s) => {
      const exists = s.customers.includes(name) || s.orders.some((o) => o.customer === name);
      return { customers: exists ? s.customers : s.customers.concat([name]), custFormOpen: false };
    });
    log('You', `added customer ${name}`, '#2756d6');
  };

  // ---- leave / time-off ----
  const openLeaveForm = () =>
    setState({ leaveFormOpen: true, userMenuOpen: false, sidebarOpen: false, leaveForm: { eng: '', days: [], type: 'Vacation', note: '' } });
  const closeLeaveForm = () => setState({ leaveFormOpen: false });
  const setLeaveForm = (patch: Partial<LeaveForm>) => setState((s) => ({ leaveForm: { ...s.leaveForm, ...patch } }));
  const toggleLeaveDay = (d: number) =>
    setState((s) => {
      const has = s.leaveForm.days.includes(d);
      return { leaveForm: { ...s.leaveForm, days: has ? s.leaveForm.days.filter((x) => x !== d) : s.leaveForm.days.concat([d]) } };
    });
  const submitLeaveForm = () => {
    const f = S.leaveForm;
    if (!f.eng || !f.days.length) return;
    const wkOff = S.weekOffset;
    const existing = new Set(S.leave.filter((l) => l.eng === f.eng && l.week === wkOff).map((l) => l.day));
    const adds = f.days
      .filter((d) => !existing.has(d))
      .map((d) => ({ id: 'l' + ids.current.id++, eng: f.eng, week: wkOff, day: d, type: f.type, note: f.note.trim() }));
    setState((s) => ({ leave: s.leave.concat(adds), leaveFormOpen: false }));
    const eng = engById(f.eng);
    if (eng && adds.length) log('You', `logged ${f.type.toLowerCase()} for ${eng.name.split(' ')[0]} · ${adds.map((a) => dayLabels[a.day]).join(', ')}`, '#2756d6');
  };
  const removeLeaveAt = (engId: string, day: number) => {
    setState((s) => ({ leave: s.leave.filter((l) => !(l.eng === engId && l.week === s.weekOffset && l.day === day)) }));
    const eng = engById(engId);
    if (eng) log('You', `cleared leave for ${eng.name.split(' ')[0]} · ${dayLabels[day]}`, '#2756d6');
  };

  const cyclePriority = (id: string) => {
    const nx: Record<Priority, Priority> = { High: 'Med', Med: 'Low', Low: 'High' };
    setState((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, priority: nx[o.priority] } : o)) }));
  };
  // ---- create-order modal ----
  const openOrderForm = () =>
    setState({
      orderFormOpen: true,
      userMenuOpen: false,
      sidebarOpen: false,
      orderForm: { code: '', product: '', customer: '', plant: 'p1', priority: 'Med' },
    });
  const closeOrderForm = () => setState({ orderFormOpen: false });
  const setOrderForm = (patch: Partial<OrderForm>) =>
    setState((s) => ({ orderForm: { ...s.orderForm, ...patch } }));
  const submitOrderForm = () => {
    const f = S.orderForm;
    if (!f.product.trim() || !f.customer.trim()) return;
    const id = 'o' + ids.current.id++;
    const code = f.code.trim() || 'NX-' + (7000 + Math.floor(Math.random() * 900));
    setState((s) => ({
      orders: s.orders.concat([
        { id, code, customer: f.customer.trim(), product: f.product.trim(), plant: f.plant, priority: f.priority },
      ]),
      orderFormOpen: false,
    }));
    log('You', `opened order ${code} · ${f.customer.trim()}`, '#2756d6');
  };

  // ---- chip builders ----
  const buildChip = (a: Assignment, cmap: ConflictMap) => {
    const ord = orderById(a.order)!;
    const pl = plantById(ord.plant)!;
    const cf = cmap[a.id] || ({} as Conflict);
    const dim = chipDimmed(a);
    const sel = S.selected === a.id;
    const base: CSSProperties = {
      display: 'block', padding: '7px 9px', borderRadius: '6px', background: '#fff', cursor: 'grab', position: 'relative',
      border: '1px solid #e3e6e0', borderLeft: '3px solid ' + pl.color,
      boxShadow: sel ? '0 0 0 2px ' + hexA(pl.color, 0.55) : '0 1px 1px rgba(20,25,30,.05)',
      opacity: dim ? 0.32 : 1, filter: dim ? 'grayscale(.5)' : 'none', transition: 'box-shadow .12s',
    };
    if (cf.has) {
      base.border = '1px solid #e6a3a3';
      base.borderLeft = '3px solid #d23b3b';
      base.boxShadow = sel ? '0 0 0 2px rgba(210,59,59,.5)' : '0 0 0 1px rgba(210,59,59,.22)';
    }
    const isNight = a.appointment === 'Night';
    return {
      aid: a.id, code: ord.code, customer: ord.customer, style: base, appointment: isNight ? 'N' : 'D',
      appointmentStyle: sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 600, padding: '1px 5px', borderRadius: '3px', background: isNight ? '#23282e' : '#fff4dd', color: isNight ? '#cfd6cc' : '#a96e08', border: '1px solid ' + (isNight ? '#23282e' : '#f1dcb0') }),
      warnGlyph: cf.has ? '⚠' : '',
      warnDotStyle: sx({ fontSize: '11px', color: '#d23b3b', lineHeight: 1, display: cf.has ? 'inline' : 'none' }),
      onClick: () => select(a.id),
      onDragStart: (e: React.DragEvent) => { e.stopPropagation(); setState({ drag: { kind: 'assign', id: a.id } }); },
      onDragEnd: () => setState({ drag: null, overCell: null }),
    };
  };

  const buildPersonChip = (a: Assignment, cmap: ConflictMap, accent?: string) => {
    const e = engById(a.eng)!;
    const ord = orderById(a.order)!;
    const pl = plantById(ord.plant)!;
    const cf = cmap[a.id] || ({} as Conflict);
    const ac = avatarColor(a.eng);
    const dim = chipDimmed(a);
    return {
      aid: a.id, name: e.name, initials: initials(e.name), code: ord.code, plantCode: pl.code, appointment: a.appointment === 'Night' ? 'N' : 'D',
      style: sx({ display: 'flex', alignItems: 'center', gap: '7px', padding: '5px 7px', background: '#fff', border: '1px solid ' + (cf.has ? '#e6a3a3' : '#e8ebe4'), borderLeft: '3px solid ' + (cf.has ? '#d23b3b' : accent || pl.color), borderRadius: '6px', cursor: 'pointer', opacity: dim ? 0.32 : 1, filter: dim ? 'grayscale(.5)' : 'none' }),
      avatarStyle: sx({ width: '22px', height: '22px', borderRadius: '6px', background: hexA(ac, 0.14), color: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 600, flexShrink: 0 }),
      warnGlyph: cf.has ? '⚠' : '',
      warnDotStyle: sx({ fontSize: '11px', color: '#d23b3b', display: cf.has ? 'inline' : 'none' }),
      onClick: () => select(a.id),
    };
  };

  // ======================= VIEW MODEL =======================
  const isMobile = (S.vw || 1440) < 860;
  const selDay = S.selectedDay || 0;

  const tabOn = sx({ padding: '6px 13px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: "'Archivo',sans-serif", background: '#15191e', color: '#fff', whiteSpace: 'nowrap' });
  const tabOff = sx({ padding: '6px 13px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: "'Archivo',sans-serif", background: 'transparent', color: '#5c625c', whiteSpace: 'nowrap' });

  const cmap = conflictMap();
  const wk = weekAssignments();
  const baseDate = new Date(2026, 5, 29);
  const days = dayLabels.map((lbl, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + S.weekOffset * 7 + i);
    const cnt = wk.filter((a) => a.day === i && cmap[a.id] && cmap[a.id].has).length;
    return {
      label: lbl, date: fmtDate(d), warn: cnt ? String(cnt) : '',
      warnStyle: cnt
        ? sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', fontWeight: 600, color: '#b32f2f', background: '#fbe3e3', border: '1px solid #f0c4c4', borderRadius: '20px', padding: '1px 7px' })
        : sx({ display: 'none' }),
    };
  });
  const weekLabel = days[0].date + ' – ' + days[4].date;
  const weekTag = S.weekOffset === 0 ? 'CURRENT WEEK' : S.weekOffset > 0 ? '+' + S.weekOffset + ' WK AHEAD' : Math.abs(S.weekOffset) + ' WK BACK';
  const gridCols = '220px repeat(5, minmax(168px, 1fr))';

  // ======================= MONTH SCALE =======================
  const isMonth = S.timeScale === 'month';
  const confCache: Record<number, Record<string, { has: boolean }>> = {};
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const mb = monthBaseDate();
  const mYear = mb.getFullYear();
  const mMon = mb.getMonth();
  const monthName = monthNames[mMon] + ' ' + mYear;
  const firstWd = (mb.getDay() + 6) % 7;
  const daysInMonth = new Date(mYear, mMon + 1, 0).getDate();
  const todayStr = '2026-5-29';
  const monthWeekdayHeads = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const blankCellStyle = (): CSSProperties => ({ background: '#f1f3ee', border: '1px solid #e6e9e2', borderRadius: '9px', minHeight: isMobile ? '52px' : '112px' });
  const monthCells: MonthCell[] = [];
  for (let i = 0; i < firstWd; i++) monthCells.push({ blank: true, style: blankCellStyle() });
  const monthOrderAgg: Record<string, { appointments: number; days: Record<number, 1>; engs: Record<string, 1>; conf: number }> = {};
  for (let dn = 1; dn <= daysInMonth; dn++) {
    const date = new Date(mYear, mMon, dn);
    const slot = dateSlot(date);
    const weekend = slot.wd > 4;
    const cm = confMapForWeek(slot.weekOffset, confCache);
    const all = weekend ? [] : S.assignments.filter((a) => a.week === slot.weekOffset && a.day === slot.wd);
    const appointments = all.filter((a) => !chipDimmed(a));
    const conf = appointments.filter((a) => cm[a.id] && cm[a.id].has).length;
    all.forEach((a) => {
      const o = orderById(a.order);
      if (!o) return;
      if (S.filterCust && o.customer !== S.filterCust) return;
      if (!S.activePlants[o.plant]) return;
      if (S.filterEmp && a.eng !== S.filterEmp) return;
      const g = monthOrderAgg[o.id] || (monthOrderAgg[o.id] = { appointments: 0, days: {}, engs: {}, conf: 0 });
      g.appointments++;
      g.days[dn] = 1;
      g.engs[a.eng] = 1;
      if (cm[a.id] && cm[a.id].has) g.conf++;
    });
    const byOrder: Record<string, number> = {};
    appointments.forEach((a) => { byOrder[a.order] = (byOrder[a.order] || 0) + 1; });
    const keys = Object.keys(byOrder);
    const chips: MonthChip[] = keys.slice(0, 3).map((oid) => {
      const o = orderById(oid)!;
      const pl = plantById(o.plant)!;
      return {
        code: o.code, countTxt: byOrder[oid] > 1 ? '×' + byOrder[oid] : '',
        dotStyle: sx({ width: '7px', height: '7px', borderRadius: '2px', background: pl.color, flexShrink: 0 }),
        style: sx({ display: 'flex', alignItems: 'center', gap: '5px', padding: '2px 5px', background: '#f6f7f4', border: '1px solid #e6e9e2', borderRadius: '5px' }),
      };
    });
    const more = keys.length - chips.length;
    const isToday = mYear + '-' + mMon + '-' + dn === todayStr;
    const cur = slot.weekOffset === 0;
    monthCells.push({
      blank: false, dateNum: String(dn), countTxt: appointments.length ? String(appointments.length) : '',
      chips, more, moreTxt: more > 0 ? '+' + more + ' more' : '',
      onClick: weekend ? () => {} : () => drillToDay(slot.weekOffset, slot.wd),
      style: sx({ position: 'relative', background: weekend ? '#f3f5ef' : '#fff', border: '1px solid ' + (isToday ? '#15191e' : '#e6e9e2'), boxShadow: isToday ? '0 0 0 1px #15191e' : 'none', borderRadius: '9px', minHeight: isMobile ? '52px' : '112px', padding: isMobile ? '5px' : '8px 9px', cursor: weekend ? 'default' : 'pointer', opacity: weekend ? 0.6 : 1, display: 'flex', flexDirection: 'column', gap: isMobile ? '2px' : '6px', overflow: 'hidden' }),
      numStyle: sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: isMobile ? '11px' : '12px', fontWeight: isToday ? 700 : 600, color: cur ? '#15191e' : '#9aa097' }),
      countDotStyle: appointments.length
        ? sx({ minWidth: '16px', height: '16px', borderRadius: '8px', background: conf ? '#d23b3b' : '#15191e', color: '#fff', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' })
        : sx({ display: 'none' }),
    });
  }
  while (monthCells.length % 7 !== 0) monthCells.push({ blank: true, style: blankCellStyle() });
  const monthOrders = S.orders
    .filter((o) => {
      if (S.filterCust && o.customer !== S.filterCust) return false;
      if (!S.activePlants[o.plant]) return false;
      return true;
    })
    .map((o) => {
      const pl = plantById(o.plant)!;
      const pc = priorityColors(o.priority);
      const g = monthOrderAgg[o.id];
      const appointments = g ? g.appointments : 0;
      const days = g ? Object.keys(g.days).length : 0;
      const engs = g ? Object.keys(g.engs).length : 0;
      const conf = g ? g.conf : 0;
      return {
        orderId: o.id, code: o.code, product: o.product, customer: o.customer, plantCode: pl.code, priority: o.priority,
        scheduled: appointments > 0, appointments, days, engs, conf, hasConf: conf > 0,
        appointmentsTxt: appointments + (appointments === 1 ? ' appointment' : ' appointments'), daysTxt: days + (days === 1 ? ' day' : ' days'),
        statusLabel: appointments > 0 ? 'Scheduled' : 'Not scheduled',
        statusStyle: sx({ fontFamily: "'Archivo',sans-serif", fontSize: '10px', fontWeight: 600, color: appointments > 0 ? '#1f8a5b' : '#9a7a3a', background: appointments > 0 ? '#e3f5ea' : '#fff3df', border: '1px solid ' + (appointments > 0 ? '#c4e6d2' : '#f1dcb0'), borderRadius: '20px', padding: '2px 9px' }),
        swatchStyle: sx({ width: '10px', height: '10px', borderRadius: '3px', background: pl.color, flexShrink: 0 }),
        priorityStyle: sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8.5px', fontWeight: 600, color: pc.c, background: pc.b, border: '1px solid ' + pc.bd, borderRadius: '3px', padding: '1px 5px' }),
        confStyle: conf > 0
          ? sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9.5px', fontWeight: 600, color: '#b32f2f', background: '#fbe3e3', border: '1px solid #f0c4c4', borderRadius: '20px', padding: '1px 7px' })
          : sx({ display: 'none' }),
        cardStyle: sx({ background: '#fff', border: '1px solid ' + (appointments > 0 ? '#e4e7e0' : '#eceee8'), borderRadius: '11px', padding: '13px 14px', opacity: appointments > 0 ? 1 : 0.66 }),
      };
    })
    .sort((a, b) => Number(b.scheduled) - Number(a.scheduled) || b.appointments - a.appointments);
  const monthScheduledCount = monthOrders.filter((o) => o.scheduled).length;
  const periodLabel = isMonth ? monthName : weekLabel;
  const periodTag = isMonth
    ? (S.monthOffset || 0) === 0 ? 'THIS MONTH' : (S.monthOffset > 0 ? '+' : '') + S.monthOffset + ' MO'
    : weekTag;

  const daySel = days.map((d, i) => {
    const dayLeaveCount = S.leave.filter((l) => l.week === S.weekOffset && l.day === i).length;
    return {
      label: d.label, date: d.date, warn: d.warn,
      warnDotStyle: d.warn
        ? sx({ position: 'absolute', top: '-5px', right: '-4px', minWidth: '15px', height: '15px', borderRadius: '8px', background: '#d23b3b', color: '#fff', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' })
        : sx({ display: 'none' }),
      leaveDotStyle: dayLeaveCount
        ? sx({ position: 'absolute', top: '-4px', left: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#7a4ddb', border: '1.5px solid #fff' })
        : sx({ display: 'none' }),
      style: sx({ position: 'relative', flex: 1, minWidth: 0, padding: '6px 3px', borderRadius: '8px', border: '1px solid ' + (selDay === i ? '#15191e' : '#e2e5de'), background: selDay === i ? '#15191e' : '#fff', cursor: 'pointer', textAlign: 'center', fontFamily: "'Archivo',sans-serif" }),
      labelStyle: sx({ fontSize: '11px', fontWeight: 700, color: selDay === i ? '#fff' : '#23282a' }),
      dateStyle: sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', color: selDay === i ? '#aeb6c8' : '#9aa097', marginTop: '1px' }),
      onClick: () => setSelectedDay(i),
    };
  });

  const conflicts = wk.filter((a) => cmap[a.id] && cmap[a.id].has).length;
  const staffed = new Set(wk.map((a) => a.order));
  const poolOrders = S.orders.filter((o) => !staffed.has(o.id));

  const plantsVm = S.plants.map((p) => {
    const cnt = wk.filter((a) => {
      const o = orderById(a.order);
      return o && o.plant === p.id;
    }).length;
    const on = S.activePlants[p.id];
    return {
      id: p.id, name: p.name, loc: p.loc, count: cnt,
      rowStyle: sx({ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 8px', borderRadius: '7px', cursor: 'pointer', background: on ? '#fff' : 'transparent', border: '1px solid ' + (on ? '#e6e9e2' : 'transparent'), opacity: on ? 1 : 0.5, transition: 'opacity .12s' }),
      swatchStyle: sx({ width: '11px', height: '11px', borderRadius: '3px', background: p.color, flexShrink: 0, boxShadow: on ? 'none' : 'inset 0 0 0 2px #fff, inset 0 0 0 3px ' + p.color }),
      toggle: () => togglePlant(p.id),
    };
  });

  const pool = poolOrders.map((o) => {
    const pl = plantById(o.plant)!;
    const pc = priorityColors(o.priority);
    return {
      orderId: o.id, code: o.code, customer: o.customer, product: o.product, priority: o.priority, plantCode: pl.code,
      dotStyle: sx({ width: '9px', height: '9px', borderRadius: '2px', background: pl.color, flexShrink: 0 }),
      priorityStyle: sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8.5px', fontWeight: 600, color: pc.c, background: pc.b, border: '1px solid ' + pc.bd, borderRadius: '3px', padding: '1px 5px' }),
      tileStyle: sx({ background: '#fff', border: '1px solid #e3e6e0', borderRadius: '9px', padding: '9px 10px', cursor: 'grab', boxShadow: '0 1px 2px rgba(20,25,30,.04)' }),
      onDragStart: () => setState({ drag: { kind: 'order', id: o.id } }),
      onDragEnd: () => setState({ drag: null, overCell: null }),
    };
  });

  const wleave = weekLeave();
  const leavePill = (t: LeaveType) => {
    const c = leaveColor[t];
    return sx({ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 7px', borderRadius: '6px', cursor: 'pointer', color: c, fontFamily: "'Archivo',sans-serif", fontSize: '10px', fontWeight: 600, border: '1px solid ' + hexA(c, 0.32), backgroundColor: hexA(c, 0.08), backgroundImage: 'repeating-linear-gradient(45deg,' + hexA(c, 0.07) + ',' + hexA(c, 0.07) + ' 4px,transparent 4px,transparent 8px)' });
  };

  // Who's on leave on the day the mobile view is focused on (the day strip selection).
  const awayToday = wleave
    .filter((l) => l.day === selDay)
    .flatMap((l) => {
      const e = engById(l.eng);
      if (!e) return [];
      const c = leaveColor[l.type];
      const ac = avatarColor(e.id);
      return [{
        engId: e.id, name: e.name, type: l.type, note: l.note, initials: initials(e.name),
        avatarStyle: sx({ width: '22px', height: '22px', borderRadius: '6px', background: hexA(ac, 0.16), color: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 600, flexShrink: 0 }),
        pillStyle: sx({ display: 'flex', alignItems: 'center', gap: '7px', padding: '5px 8px 5px 6px', borderRadius: '8px', cursor: 'pointer', color: '#3c423d', border: '1px solid ' + hexA(c, 0.3), backgroundColor: hexA(c, 0.08) }),
        typeStyle: sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 600, color: c }),
        onRemove: () => removeLeaveAt(e.id, selDay),
      }];
    });

  const personRows = S.engineers.map((e) => {
    const ac = avatarColor(e.id);
    const cells = [0, 1, 2, 3, 4].map((day) => {
      const cellId = e.id + '-' + day;
      const chips = wk.filter((a) => a.eng === e.id && a.day === day).map((a) => buildChip(a, cmap));
      const dayLeave = wleave.find((l) => l.eng === e.id && l.day === day);
      const over = S.overCell === cellId;
      return {
        cellId, chips, empty: chips.length === 0,
        onLeave: !!dayLeave,
        leaveTag: dayLeave
          ? { label: 'On leave · ' + dayLeave.type, note: dayLeave.note, style: leavePill(dayLeave.type), onRemove: () => removeLeaveAt(e.id, day) }
          : null,
        style: sx({ borderBottom: '1px solid #e2e5de', borderRight: '1px solid #e2e5de', padding: '7px', minHeight: '78px', display: 'flex', flexDirection: 'column', gap: '5px', background: over ? '#e7efff' : '#fbfcfa', boxShadow: over ? 'inset 0 0 0 2px #9bb0e8' : 'none', transition: 'background .1s' }),
        hintStyle: sx({ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: over ? '#5b7fd6' : '#cdd2c9', fontSize: '15px', border: '1px dashed ' + (over ? '#9bb0e8' : '#e2e5de'), borderRadius: '6px', minHeight: '40px', cursor: 'pointer', transition: 'all .12s' }),
        onHintClick: () => openCreateAt(e.id, day),
        onDragOver: (ev: React.DragEvent) => { ev.preventDefault(); if (S.overCell !== cellId) setState({ overCell: cellId }); },
        onDragLeave: () => { if (state.overCell === cellId) setState({ overCell: null }); },
        onDrop: (ev: React.DragEvent) => {
          ev.preventDefault();
          const d = state.drag;
          if (d) {
            if (d.kind === 'order') createAssign(d.id, e.id, day, 'Day');
            else moveAssign(d.id, e.id, day);
          }
          setState({ drag: null, overCell: null });
        },
      };
    });
    return {
      engId: e.id, name: e.name, role: e.role, department: e.department, subDepartments: e.subDepartments, initials: initials(e.name),
      avatarStyle: sx({ width: '30px', height: '30px', borderRadius: '8px', background: hexA(ac, 0.14), color: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 600, flexShrink: 0 }),
      nameCellStyle: sx({ borderBottom: '1px solid #e2e5de', borderRight: '1px solid #e2e5de', padding: '11px 13px', background: '#fff', position: 'sticky', left: 0, zIndex: 2 }),
      cells,
    };
  });

  const cellShell = sx({ borderBottom: '1px solid #e2e5de', borderRight: '1px solid #e2e5de', padding: '8px', minHeight: '78px', display: 'flex', flexDirection: 'column', gap: '5px', background: '#fbfcfa' });
  const plantRows = S.plants.map((p) => {
    const cells = [0, 1, 2, 3, 4].map((day) => {
      const chips = wk
        .filter((a) => {
          const o = orderById(a.order);
          return o && o.plant === p.id && a.day === day;
        })
        .map((a) => buildPersonChip(a, cmap, p.color));
      return { chips, empty: chips.length === 0, style: cellShell };
    });
    return { name: p.name, loc: p.loc, swatchStyle: sx({ width: '12px', height: '12px', borderRadius: '3px', background: p.color, flexShrink: 0 }), cells };
  });

  const customers = [...new Set([...S.orders.map((o) => o.customer), ...S.customers])];
  const customerRows = customers.map((cust, ci) => {
    const col = custPalette[ci % custPalette.length];
    const cells = [0, 1, 2, 3, 4].map((day) => {
      const chips = wk
        .filter((a) => {
          const o = orderById(a.order);
          return o && o.customer === cust && a.day === day;
        })
        .map((a) => buildPersonChip(a, cmap));
      return { chips, empty: chips.length === 0, style: cellShell };
    });
    const lots = new Set(
      wk
        .filter((a) => {
          const o = orderById(a.order);
          return o && o.customer === cust;
        })
        .map((a) => a.order),
    ).size;
    return {
      name: cust, initials: initials(cust), sub: lots + (lots === 1 ? ' active lot' : ' active lots'),
      swatchStyle: sx({ width: '28px', height: '28px', borderRadius: '8px', background: hexA(col, 0.14), color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', fontWeight: 700, flexShrink: 0 }),
      cells,
    };
  });

  const mobilePersonRows = personRows.map((r) => ({ engId: r.engId, name: r.name, role: r.role, department: r.department, subDepartments: r.subDepartments, initials: r.initials, avatarStyle: r.avatarStyle, cell: r.cells[selDay] }));
  const mobileSiteRows = plantRows.map((r) => ({ name: r.name, loc: r.loc, swatchStyle: r.swatchStyle, cell: r.cells[selDay] }));
  const mobileCustomerRows = customerRows.map((r) => ({ name: r.name, sub: r.sub, initials: r.initials, swatchStyle: r.swatchStyle, cell: r.cells[selDay] }));

  const team = [
    { name: 'You', initials: 'YO', color: '#15191e' },
    { name: 'Marco Ruiz', initials: 'MR', color: '#0f9d8c' },
    { name: 'Priya Nair', initials: 'PN', color: '#c2620c' },
    { name: 'Lena Fischer', initials: 'LF', color: '#7a4ddb' },
  ];
  const presence = team.map((t, i) => ({
    name: t.name, initials: t.initials,
    avatarStyle: sx({ width: '27px', height: '27px', borderRadius: '50%', background: t.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '9.5px', fontWeight: 600, border: '2px solid #fff', marginLeft: i ? '-8px' : 0, position: 'relative', zIndex: 10 - i }),
  }));
  const activity = S.activity.map((a) => ({
    who: a.who, text: a.text, ago: a.ago,
    dotStyle: sx({ width: '7px', height: '7px', borderRadius: '50%', background: a.color, marginTop: '4px', flexShrink: 0 }),
  }));

  // ---- detail panel ----
  let detail: ReturnType<typeof buildDetail> | null = null;
  function buildDetail(selA: Assignment) {
    const ord = orderById(selA.order)!;
    const pl = plantById(ord.plant)!;
    const eng = engById(selA.eng)!;
    const cf = cmap[selA.id] || ({} as Conflict);
    const ac = avatarColor(selA.eng);
    const pc = priorityColors(ord.priority);
    const cs: string[] = [];
    if (cf.isDbl) cs.push(`${eng.name.split(' ')[0]} is double-booked on ${dayNames[selA.day]} (${selA.appointment} appointment).`);
    if (cf.onLeave) cs.push(`${eng.name.split(' ')[0]} is on leave on ${dayNames[selA.day]}.`);
    const comments = (S.comments[selA.id] || []).map((m) => ({
      who: m.who, initials: m.initials, text: m.text, ago: m.ago,
      avatarStyle: sx({ width: '24px', height: '24px', borderRadius: '7px', background: hexA(m.color, 0.15), color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 600, flexShrink: 0 }),
    }));
    const isNight = selA.appointment === 'Night';
    const segOn = sx({ flex: 1, padding: '7px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: "'Archivo',sans-serif", background: '#15191e', color: '#fff' });
    const segOff = sx({ flex: 1, padding: '7px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: "'Archivo',sans-serif", background: 'transparent', color: '#6a706a' });
    return {
      aid: selA.id, orderCode: ord.code, product: ord.product, customer: ord.customer, priority: ord.priority, plantName: pl.name + ' · ' + pl.loc,
      priorityStyle: sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 600, color: pc.c, background: pc.b, border: '1px solid ' + pc.bd, borderRadius: '3px', padding: '2px 6px' }),
      swatchStyle: sx({ width: '12px', height: '40px', borderRadius: '3px', background: pl.color, flexShrink: 0, marginTop: '2px' }),
      engName: eng.name, engRole: eng.role, engInitials: initials(eng.name), dayName: dayNames[selA.day],
      avatarStyle: sx({ width: '34px', height: '34px', borderRadius: '9px', background: hexA(ac, 0.14), color: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', fontWeight: 600, flexShrink: 0 }),
      department: eng.department, subDepartments: eng.subDepartments,
      hasConflict: cf.has, conflicts: cs,
      dayBtnStyle: isNight ? segOff : segOn, nightBtnStyle: isNight ? segOn : segOff,
      setDay: () => setAppointment(selA.id, 'Day'), setNight: () => setAppointment(selA.id, 'Night'),
      comments, commentCount: comments.length, noComments: comments.length === 0, draft: S.draft,
      onDraft: (e: React.ChangeEvent<HTMLInputElement>) => setState({ draft: e.target.value }),
      onKey: (e: React.KeyboardEvent) => { if (e.key === 'Enter') addComment(); },
      addComment: () => addComment(), remove: () => removeAssign(selA.id), duplicate: () => duplicate(selA.id), close: () => setState({ selected: null }),
    };
  }
  const selA = wk.find((a) => a.id === S.selected);
  if (selA) detail = buildDetail(selA);

  // ---- create modal VM ----
  const cd = S.createDraft;
  const cOrders = S.orders.map((o) => {
    const pl = plantById(o.plant)!;
    const pc = priorityColors(o.priority);
    const onSel = cd.order === o.id;
    return {
      orderId: o.id, code: o.code, product: o.product, customer: o.customer, priority: o.priority, plantCode: pl.code,
      dotStyle: sx({ width: '8px', height: '8px', borderRadius: '2px', background: pl.color, flexShrink: 0 }),
      priorityStyle: sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', fontWeight: 600, color: pc.c, background: pc.b, border: '1px solid ' + pc.bd, borderRadius: '3px', padding: '0 4px' }),
      style: sx({ padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', border: '1px solid ' + (onSel ? '#9bb0e8' : '#e8ebe4'), background: onSel ? '#eef2fd' : '#fff' }),
      select: () => setDraft({ order: o.id }),
    };
  });
  const selOrd = cd.order ? orderById(cd.order) : null;
  const cEngs = S.engineers.map((e) => {
    const ac = avatarColor(e.id);
    const onSel = cd.eng === e.id;
    let flag = '';
    let fs: CSSProperties = { display: 'none' };
    if (selOrd) {
      const onLeave = wleave.some((l) => l.eng === e.id && l.day === cd.day);
      const busy = wk.some((a) => a.eng === e.id && a.day === cd.day && a.appointment === cd.appointment);
      if (onLeave) { flag = 'on leave'; fs = sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 600, color: '#7a4ddb', background: '#efe9fb', border: '1px solid #dccdf5', borderRadius: '4px', padding: '2px 6px' }); }
      else if (busy) { flag = 'busy'; fs = sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 600, color: '#a96e08', background: '#fff3df', border: '1px solid #f1dcb0', borderRadius: '4px', padding: '2px 6px' }); }
      else { flag = '✓ fit'; fs = sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 600, color: '#1f9d57', background: '#e3f5ea', border: '1px solid #c4e6d2', borderRadius: '4px', padding: '2px 6px' }); }
    }
    return {
      engId: e.id, name: e.name, role: e.role, initials: initials(e.name), flag, flagStyle: fs,
      avatarStyle: sx({ width: '26px', height: '26px', borderRadius: '7px', background: hexA(ac, 0.14), color: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', fontWeight: 600, flexShrink: 0 }),
      style: sx({ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 9px', borderRadius: '8px', cursor: 'pointer', border: '1px solid ' + (onSel ? '#9bb0e8' : '#eef1ea'), background: onSel ? '#eef2fd' : '#fff' }),
      select: () => setDraft({ eng: e.id }),
    };
  });
  const segSm = (on: boolean) => sx({ padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11.5px', fontWeight: 600, fontFamily: "'Archivo',sans-serif", background: on ? '#15191e' : 'transparent', color: on ? '#fff' : '#6a706a' });
  const dayBtns = dayLabels.map((lbl, i) => ({ label: lbl, style: segSm(cd.day === i), select: () => setDraft({ day: i }) }));
  let warnText = '';
  if (selOrd && cd.eng) {
    const onLeave = wleave.some((l) => l.eng === cd.eng && l.day === cd.day);
    const busy = wk.some((a) => a.eng === cd.eng && a.day === cd.day && a.appointment === cd.appointment);
    if (onLeave) warnText = `${engById(cd.eng)!.name.split(' ')[0]} is on leave on ${dayNames[cd.day]} — this will create a conflict.`;
    else if (busy) warnText = `${engById(cd.eng)!.name.split(' ')[0]} already has a ${cd.appointment.toLowerCase()} appointment on ${dayNames[cd.day]}.`;
  }
  const canCreate = !!(cd.order && cd.eng);
  const create = {
    orders: cOrders, engineers: cEngs, dayBtns,
    dayAppointmentStyle: segSm(cd.appointment === 'Day'), nightAppointmentStyle: segSm(cd.appointment === 'Night'),
    setDay: () => setDraft({ appointment: 'Day' }), setNight: () => setDraft({ appointment: 'Night' }),
    warn: !!warnText, warnText,
    submit: () => submitCreate(),
    submitStyle: sx({ background: canCreate ? '#15191e' : '#c4c9bf', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '12.5px', fontWeight: 600, cursor: canCreate ? 'pointer' : 'default', fontFamily: "'Archivo',sans-serif" }),
  };

  // ---- create-order modal VM ----
  const of = S.orderForm;
  const segMd = (on: boolean) => sx({ padding: '7px 13px', borderRadius: '7px', border: '1px solid ' + (on ? '#15191e' : '#dde0d9'), cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: "'Archivo',sans-serif", background: on ? '#15191e' : '#fff', color: on ? '#fff' : '#5c625c' });
  const ofInStyle = sx({ width: '100%', border: '1px solid #dde0d9', borderRadius: '9px', padding: '10px 12px', fontSize: '13px', fontFamily: "'Archivo',sans-serif", color: '#23282a', outline: 'none', background: '#fff' });
  const ofCanSubmit = !!(of.product.trim() && of.customer.trim());
  const orderForm = {
    code: of.code, product: of.product, customer: of.customer, inStyle: ofInStyle,
    onCode: (e: React.ChangeEvent<HTMLInputElement>) => setOrderForm({ code: e.target.value }),
    onProduct: (e: React.ChangeEvent<HTMLInputElement>) => setOrderForm({ product: e.target.value }),
    onCustomer: (e: React.ChangeEvent<HTMLInputElement>) => setOrderForm({ customer: e.target.value }),
    customerSuggestions: customers.map((c) => ({
      name: c, onClick: () => setOrderForm({ customer: c }),
      style: sx({ padding: '4px 10px', borderRadius: '20px', border: '1px solid ' + (of.customer === c ? '#9bb0e8' : '#e2e5de'), background: of.customer === c ? '#eef2fd' : '#fff', color: of.customer === c ? '#2756d6' : '#5c625c', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Archivo',sans-serif" }),
    })),
    plants: S.plants.map((p) => ({
      id: p.id, name: p.name, code: p.code, onClick: () => setOrderForm({ plant: p.id }),
      swatchStyle: sx({ width: '10px', height: '10px', borderRadius: '3px', background: p.color, flexShrink: 0 }),
      style: sx({ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 11px', borderRadius: '9px', cursor: 'pointer', border: '1px solid ' + (of.plant === p.id ? '#9bb0e8' : '#e2e5de'), background: of.plant === p.id ? '#eef2fd' : '#fff' }),
    })),
    priorities: (['High', 'Med', 'Low'] as Priority[]).map((p) => ({ label: p, onClick: () => setOrderForm({ priority: p }), style: segMd(of.priority === p) })),
    canSubmit: ofCanSubmit,
    submit: () => submitOrderForm(),
    submitStyle: sx({ background: ofCanSubmit ? '#15191e' : '#c4c9bf', color: '#fff', border: 'none', borderRadius: '9px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: ofCanSubmit ? 'pointer' : 'default', fontFamily: "'Archivo',sans-serif" }),
  };

  // ---- profile VM ----
  const myWeekAppointments = S.assignments.filter((a) => a.week === 0).length;
  const profile = {
    name: 'Jordan Lee', role: 'QA Planner · Operations', email: 'jordan.lee@nexsil.com', phone: '+1 (480) 555-0173', team: 'Front-end Quality, Reliability', joined: 'Joined March 2023',
    stats: [
      { label: 'APPOINTMENTS PLANNED', value: String(myWeekAppointments), sub: 'this week' },
      { label: 'OPEN ORDERS', value: String(poolOrders.length), sub: 'awaiting staffing' },
      { label: 'SITES', value: String(S.plants.length), sub: 'under coverage' },
    ],
    sites: S.plants.map((p) => ({ name: p.name, code: p.code, swatchStyle: sx({ width: '10px', height: '10px', borderRadius: '3px', background: p.color, flexShrink: 0 }) })),
    activity: S.activity.slice(0, 5).map((a) => ({ who: a.who, text: a.text, ago: a.ago, dotStyle: sx({ width: '7px', height: '7px', borderRadius: '50%', background: a.color, marginTop: '4px', flexShrink: 0 }) })),
  };

  // ---- create-engineer modal VM ----
  const ef = S.engForm;
  const certPick = (on: boolean) => ({
    style: sx({ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', border: '1px solid ' + (on ? '#9bb0e8' : '#e2e5de'), background: on ? '#eef2fd' : '#fff' }),
    boxStyle: sx({ width: '15px', height: '15px', borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#fff', background: on ? '#2756d6' : '#fff', border: '1px solid ' + (on ? '#2756d6' : '#cdd2c9') }),
    check: on ? '✓' : '',
  });
  const allDepartments = ['QA-U1', 'QA-U2', 'QA-U3'] as const;
  const allSubDepartments = ['QMS', 'EHS', 'ESD'] as const;
  const engForm = {
    name: ef.name, role: ef.role, department: ef.department, subDepartments: ef.subDepartments, inStyle: ofInStyle,
    onName: (e: React.ChangeEvent<HTMLInputElement>) => setEngForm({ name: e.target.value }),
    onRole: (e: React.ChangeEvent<HTMLInputElement>) => setEngForm({ role: e.target.value }),
    statuses: (['Active', 'On leave', 'Onboarding'] as const).map((st) => ({ label: st, onClick: () => setEngForm({ status: st }), style: segMd(ef.status === st) })),
    departments: allDepartments.map((d) => ({ label: d, onClick: () => setEngForm({ department: d }), style: segMd(ef.department === d) })),
    subDepartmentOptions: allSubDepartments.map((c) => ({ code: c, name: c, onClick: () => toggleEngSubDept(c), ...certPick(ef.subDepartments.includes(c)) })),
    canSubmit: !!ef.name.trim(),
    submit: () => submitEngForm(),
    submitStyle: sx({ background: ef.name.trim() ? '#15191e' : '#c4c9bf', color: '#fff', border: 'none', borderRadius: '9px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: ef.name.trim() ? 'pointer' : 'default', fontFamily: "'Archivo',sans-serif" }),
  };

  // ---- create-site modal VM ----
  const sf = S.siteForm;
  const siteForm = {
    name: sf.name, loc: sf.loc, code: sf.code, inStyle: ofInStyle,
    onName: (e: React.ChangeEvent<HTMLInputElement>) => setSiteForm({ name: e.target.value }),
    onLoc: (e: React.ChangeEvent<HTMLInputElement>) => setSiteForm({ loc: e.target.value }),
    onCode: (e: React.ChangeEvent<HTMLInputElement>) => setSiteForm({ code: e.target.value }),
    colors: siteColors.map((col) => ({
      color: col, onClick: () => setSiteForm({ color: col }),
      style: sx({ width: '26px', height: '26px', borderRadius: '8px', background: col, cursor: 'pointer', flexShrink: 0, boxShadow: sf.color === col ? '0 0 0 2px #fff, 0 0 0 4px #15191e' : 'none' }),
    })),
    canSubmit: !!sf.name.trim(),
    submit: () => submitSiteForm(),
    submitStyle: sx({ background: sf.name.trim() ? '#15191e' : '#c4c9bf', color: '#fff', border: 'none', borderRadius: '9px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: sf.name.trim() ? 'pointer' : 'default', fontFamily: "'Archivo',sans-serif" }),
  };

  // ---- create-customer modal VM ----
  const custName = S.custForm.name.trim();
  const custExists = customers.includes(custName);
  const custColor = custPalette[customers.length % custPalette.length];
  const custCanSubmit = !!custName && !custExists;
  const customerForm = {
    name: S.custForm.name, inStyle: ofInStyle,
    onName: (e: React.ChangeEvent<HTMLInputElement>) => setCustForm({ name: e.target.value }),
    previewInitials: custName ? initials(custName) : '—',
    previewStyle: sx({ width: '40px', height: '40px', borderRadius: '11px', background: hexA(custColor, 0.14), color: custColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '13px', fontWeight: 700, flexShrink: 0 }),
    exists: custExists,
    canSubmit: custCanSubmit,
    submit: () => submitCustForm(),
    submitStyle: sx({ background: custCanSubmit ? '#15191e' : '#c4c9bf', color: '#fff', border: 'none', borderRadius: '9px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: custCanSubmit ? 'pointer' : 'default', fontFamily: "'Archivo',sans-serif" }),
  };

  // ---- leave / time-off modal VM ----
  const lf = S.leaveForm;
  const leaveCanSubmit = !!(lf.eng && lf.days.length);
  const leaveDayChip = (on: boolean, taken: boolean) =>
    sx({ flex: 1, minWidth: 0, padding: '7px 3px', borderRadius: '8px', border: '1px solid ' + (on ? '#15191e' : '#e2e5de'), background: on ? '#15191e' : taken ? '#f4f0fb' : '#fff', color: on ? '#fff' : taken ? '#7a4ddb' : '#23282a', cursor: 'pointer', textAlign: 'center', fontFamily: "'Archivo',sans-serif", fontSize: '11px', fontWeight: 700 });
  const leaveForm = {
    weekLabel, weekTag,
    engineers: S.engineers.map((e) => {
      const ac = avatarColor(e.id);
      const onSel = lf.eng === e.id;
      return {
        engId: e.id, name: e.name, role: e.role, initials: initials(e.name),
        avatarStyle: sx({ width: '26px', height: '26px', borderRadius: '7px', background: hexA(ac, 0.14), color: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', fontWeight: 600, flexShrink: 0 }),
        style: sx({ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 9px', borderRadius: '8px', cursor: 'pointer', border: '1px solid ' + (onSel ? '#9bb0e8' : '#eef1ea'), background: onSel ? '#eef2fd' : '#fff' }),
        select: () => setLeaveForm({ eng: e.id }),
      };
    }),
    days: days.map((d, i) => {
      const taken = !!lf.eng && wleave.some((l) => l.eng === lf.eng && l.day === i);
      return { label: d.label, date: d.date, on: lf.days.includes(i), taken, onClick: () => toggleLeaveDay(i), style: leaveDayChip(lf.days.includes(i), taken) };
    }),
    types: (['Vacation', 'Sick', 'Personal', 'Training'] as const).map((t) => ({ label: t, onClick: () => setLeaveForm({ type: t }), style: segMd(lf.type === t) })),
    note: lf.note, inStyle: ofInStyle,
    onNote: (e: React.ChangeEvent<HTMLInputElement>) => setLeaveForm({ note: e.target.value }),
    canSubmit: leaveCanSubmit,
    submit: () => submitLeaveForm(),
    submitStyle: sx({ background: leaveCanSubmit ? '#15191e' : '#c4c9bf', color: '#fff', border: 'none', borderRadius: '9px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: leaveCanSubmit ? 'pointer' : 'default', fontFamily: "'Archivo',sans-serif" }),
  };

  // ---- admin VMs ----
  const activeEng = S.engineers.filter((e) => e.status === 'Active').length;
  const activeSites = S.plants.filter((p) => S.activePlants[p.id]).length;
  const adminStats = [
    { label: 'ENGINEERS', value: String(S.engineers.length), sub: activeEng + ' active' },
    { label: 'FAB SITES', value: activeSites + '/' + S.plants.length, sub: 'visible on grid' },
    { label: 'OPEN ORDERS', value: String(poolOrders.length), sub: 'awaiting staffing' },
    { label: 'WEEK APPOINTMENTS', value: String(wk.length), sub: conflicts + ' with conflicts' },
  ];
  const statusStyleFor = (label: 'Active' | 'On leave' | 'Onboarding') => {
    const m = { Active: { c: '#1f8a5b', b: '#e3f5ea', bd: '#c4e6d2' }, 'On leave': { c: '#a96e08', b: '#fff3df', bd: '#f1dcb0' }, Onboarding: { c: '#5b7fd6', b: '#eef2fd', bd: '#d8e2fa' } }[label];
    return sx({ fontFamily: "'Archivo',sans-serif", fontSize: '11px', fontWeight: 600, color: m.c, background: m.b, border: '1px solid ' + m.bd, borderRadius: '20px', padding: '4px 11px', cursor: 'pointer' });
  };
  const adminEngineers = S.engineers.map((e) => {
    const ac = avatarColor(e.id);
    return {
      id: e.id, name: e.name, role: e.role, department: e.department, subDepartments: e.subDepartments, initials: initials(e.name),
      avatarStyle: sx({ width: '30px', height: '30px', borderRadius: '8px', background: hexA(ac, 0.14), color: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 600, flexShrink: 0 }),
      appointments: wk.filter((a) => a.eng === e.id).length,
      statusLabel: e.status, statusStyle: statusStyleFor(e.status), toggleStatus: () => toggleStatus(e.id),
    };
  });
  const adminSites = S.plants.map((p) => {
    const on = S.activePlants[p.id];
    return {
      name: p.name, loc: p.loc, code: p.code, swatchStyle: sx({ width: '12px', height: '12px', borderRadius: '3px', background: p.color, flexShrink: 0 }),
      appointments: wk.filter((a) => {
        const o = orderById(a.order);
        return o && o.plant === p.id;
      }).length,
      statusLabel: on ? 'Visible' : 'Hidden', statusStyle: statusStyleFor(on ? 'Active' : 'On leave'), toggle: () => togglePlant(p.id),
    };
  });
  const adminOrders = S.orders.map((o) => {
    const pl = plantById(o.plant)!;
    const pc = priorityColors(o.priority);
    const isStaffed = staffed.has(o.id);
    return {
      code: o.code, product: o.product, customer: o.customer, plantCode: pl.code, priority: o.priority,
      swatchStyle: sx({ width: '9px', height: '9px', borderRadius: '2px', background: pl.color, flexShrink: 0 }),
      priorityStyle: sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', fontWeight: 600, color: pc.c, background: pc.b, border: '1px solid ' + pc.bd, borderRadius: '5px', padding: '3px 10px', cursor: 'pointer' }),
      cyclePriority: () => cyclePriority(o.id),
      statusLabel: isStaffed ? 'Staffed' : 'Open',
      statusStyle: sx({ fontFamily: "'Archivo',sans-serif", fontSize: '10.5px', fontWeight: 600, color: isStaffed ? '#1f8a5b' : '#a96e08', background: isStaffed ? '#e3f5ea' : '#fff3df', border: '1px solid ' + (isStaffed ? '#c4e6d2' : '#f1dcb0'), borderRadius: '20px', padding: '3px 10px' }),
    };
  });

  // ---- filters VM ----
  const employeeOptions = [{ value: '', label: 'All employees' }].concat(S.engineers.map((e) => ({ value: e.id, label: e.name })));
  const customerOptions = [{ value: '', label: 'All customers' }].concat(customers.map((c) => ({ value: c, label: c })));
  const hasFilters = !!(S.filterEmp || S.filterCust) || S.plants.some((p) => !S.activePlants[p.id]);
  const selStyle = sx({ width: '100%', padding: '7px 9px', border: '1px solid #dde0d9', borderRadius: '7px', background: '#fff', fontSize: '11.5px', fontFamily: "'Archivo',sans-serif", color: '#3c423d', cursor: 'pointer', outline: 'none' });

  // ---- responsive styles ----
  const sidebarStyle: CSSProperties = isMobile
    ? { position: 'fixed', top: 0, left: 0, bottom: 0, width: '86%', maxWidth: '320px', zIndex: 80, background: '#fbfcfa', borderRight: '1px solid #d8dcd4', display: 'flex', flexDirection: 'column', boxShadow: '0 0 44px rgba(20,25,30,.28)', transform: S.sidebarOpen ? 'translateX(0)' : 'translateX(-104%)', transition: 'transform .22s ease', overflowY: 'auto' }
    : { width: '280px', flexShrink: 0, background: '#fbfcfa', borderRight: '1px solid #d8dcd4', display: 'flex', flexDirection: 'column', minHeight: 0 };
  const toolbarStyle: CSSProperties = isMobile
    ? { flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 11px', background: '#fff', borderBottom: '1px solid #e2e5de', flexWrap: 'wrap' }
    : { height: '46px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px', background: '#fff', borderBottom: '1px solid #e2e5de' };
  const detailAsideStyle: CSSProperties = isMobile
    ? { position: 'fixed', inset: 0, zIndex: 90, background: '#fff', display: 'flex', flexDirection: 'column', animation: 'fadeIn .18s ease' }
    : { width: '344px', flexShrink: 0, background: '#fff', borderLeft: '1px solid #d8dcd4', display: 'flex', flexDirection: 'column', minHeight: 0, animation: 'slideIn .18s ease' };
  const modalOverlayStyle: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(20,25,30,.45)', zIndex: 60, display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'center', padding: isMobile ? '0' : '30px', animation: 'fadeIn .14s ease' };
  const modalCardStyle: CSSProperties = isMobile
    ? { width: '100%', height: '100%', maxHeight: '100%', background: '#fff', borderRadius: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
    : { width: '680px', maxWidth: '100%', maxHeight: '90vh', background: '#fff', borderRadius: '15px', boxShadow: '0 24px 60px rgba(20,25,30,.32)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeUp .2s ease' };
  const modalColsStyle: CSSProperties = isMobile
    ? { display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, minHeight: 0 }
    : { display: 'flex', gap: 0, overflow: 'hidden', flex: 1, minHeight: 0 };
  const modalColLeftStyle: CSSProperties = isMobile
    ? { borderBottom: '1px solid #eef1ea', display: 'flex', flexDirection: 'column' }
    : { flex: 1, borderRight: '1px solid #eef1ea', display: 'flex', flexDirection: 'column', minHeight: 0 };
  const modalColRightStyle: CSSProperties = isMobile
    ? { display: 'flex', flexDirection: 'column' }
    : { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 };
  const adminMainStyle = sx({ flex: 1, overflow: 'auto', background: '#eef0ea', minHeight: 0 });
  const adminWrapStyle = sx({ maxWidth: '1080px', margin: '0 auto', padding: isMobile ? '18px 14px 50px' : '26px 28px 60px', minWidth: isMobile ? '700px' : 'auto' });
  const adminStatGridStyle = sx({ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '22px' });
  const loginWrapStyle: CSSProperties = isMobile
    ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }
    : { flex: 1, display: 'flex', minHeight: 0 };
  const loginBrandStyle: CSSProperties = isMobile
    ? { background: '#15191e', color: '#fff', padding: '22px 22px', position: 'relative', overflow: 'hidden', flexShrink: 0 }
    : { width: '46%', background: '#15191e', color: '#fff', padding: '46px 48px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' };
  const loginFormWrapStyle: CSSProperties = isMobile
    ? { flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '28px 22px 40px', background: '#f4f6f1' }
    : { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', background: '#f4f6f1' };

  return {
    isMobile, showLogin: !S.authed, showApp: S.authed, showPresence: !isMobile, showStats: !isMobile && !isMonth, showLoginExtras: !isMobile,
    loginEmail: S.loginEmail, loginPass: S.loginPass,
    onEmail: (e: React.ChangeEvent<HTMLInputElement>) => setState({ loginEmail: e.target.value }),
    onPass: (e: React.ChangeEvent<HTMLInputElement>) => setState({ loginPass: e.target.value }),
    onLoginKey: (e: React.KeyboardEvent) => { if (e.key === 'Enter') signIn(); },
    signIn, signOut,
    isSchedule: S.page === 'schedule', isAdmin: S.page === 'admin', isProfile: S.page === 'profile',
    goSchedule, goAdmin, goProfile,
    navSchedStyle: S.page === 'schedule' ? tabOn : tabOff, navAdminStyle: S.page === 'admin' ? tabOn : tabOff,
    userMenuOpen: S.userMenuOpen, toggleUserMenu,
    isPerson: S.view === 'person', isPlant: S.view === 'plant', isCustomer: S.view === 'customer',
    setPerson: () => setView('person'), setPlant: () => setView('plant'), setCustomer: () => setView('customer'),
    personTabStyle: S.view === 'person' ? tabOn : tabOff, plantTabStyle: S.view === 'plant' ? tabOn : tabOff, customerTabStyle: S.view === 'customer' ? tabOn : tabOff,
    showViewTabs: !isMonth,
    isMonth, weekScaleStyle: isMonth ? tabOff : tabOn, monthScaleStyle: isMonth ? tabOn : tabOff,
    setWeekScale: () => setScale('week'), setMonthScale: () => setScale('month'),
    monthDesktop: isMonth && !isMobile, monthMobile: isMonth && isMobile,
    monthCells, monthWeekdayHeads, monthName, monthOrders, monthScheduledCount, monthOrderCount: monthOrders.length,
    gridPerson: S.view === 'person' && !isMobile && !isMonth, gridPlant: S.view === 'plant' && !isMobile && !isMonth, gridCustomer: S.view === 'customer' && !isMobile && !isMonth,
    mobilePerson: isMobile && S.view === 'person' && !isMonth, mobileSite: isMobile && S.view === 'plant' && !isMonth, mobileCustomer: isMobile && S.view === 'customer' && !isMonth,
    showDayStrip: isMobile && !isMonth,
    awayToday, awayLabel: dayNames[selDay], showAway: isMobile && !isMonth && awayToday.length > 0,
    weekLabel, weekTag, periodLabel, periodTag, gridCols, days, daySel,
    prevWeek: () => (isMonth ? shiftMonth(-1) : shiftWeek(-1)), nextWeek: () => (isMonth ? shiftMonth(1) : shiftWeek(1)),
    profile, orderForm, orderFormOpen: S.orderFormOpen, openOrderForm, closeOrderForm,
    engForm, engFormOpen: S.engFormOpen, openEngForm, closeEngForm,
    siteForm, siteFormOpen: S.siteFormOpen, openSiteForm, closeSiteForm,
    customerForm, custFormOpen: S.custFormOpen, openCustForm, closeCustForm,
    leaveForm, leaveFormOpen: S.leaveFormOpen, openLeaveForm, closeLeaveForm,
    stats: { assignments: wk.length, conflicts, unassigned: poolOrders.length },
    conflictPillStyle: sx({ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '8px', background: conflicts ? '#fdeeee' : '#eef1ea', border: '1px solid ' + (conflicts ? '#f3cdcd' : '#e2e5de'), color: conflicts ? '#b32f2f' : '#6a706a' }),
    plants: plantsVm, pool, poolCount: pool.length, poolEmpty: pool.length === 0,
    personRows, plantRows, customerRows, mobilePersonRows, mobileSiteRows, mobileCustomerRows,
    presence, activity, detail,
    emptyWeek: S.weekOffset !== 0 && wk.length === 0 && !isMonth, copyWeek,
    toggleSidebar, closeSidebar, showSidebarBackdrop: isMobile && S.sidebarOpen,
    sidebarStyle, toolbarStyle, detailAsideStyle, modalOverlayStyle, modalCardStyle, modalColsStyle, modalColLeftStyle, modalColRightStyle,
    adminMainStyle, adminWrapStyle, adminStatGridStyle, loginWrapStyle, loginBrandStyle, loginFormWrapStyle,
    filterEmp: S.filterEmp, filterCust: S.filterCust, employeeOptions, customerOptions, hasFilters, selStyle,
    onFilterEmp: (e: React.ChangeEvent<HTMLSelectElement>) => setFilterEmp(e.target.value),
    onFilterCust: (e: React.ChangeEvent<HTMLSelectElement>) => setFilterCust(e.target.value),
    clearFilters,
    openCreate, closeCreate, createOpen: S.createOpen, create, stop: (e: React.MouseEvent) => e.stopPropagation(),
    adminStats,
    tabEngineers: S.adminTab === 'engineers', tabSites: S.adminTab === 'sites', tabOrders: S.adminTab === 'orders',
    setTabEng: () => setAdminTab('engineers'), setTabSite: () => setAdminTab('sites'), setTabOrder: () => setAdminTab('orders'),
    tabEngStyle: S.adminTab === 'engineers' ? tabOn : tabOff, tabSiteStyle: S.adminTab === 'sites' ? tabOn : tabOff, tabOrderStyle: S.adminTab === 'orders' ? tabOn : tabOff,
    adminEngineers, adminSites, adminOrders, engCount: S.engineers.length, orderCount: S.orders.length, siteCount: S.plants.length,
    addEngineer: openEngForm, addOrder: openOrderForm, addSite: openSiteForm, addCustomer: openCustForm, addLeave: openLeaveForm,
  };
}

export type VM = ReturnType<typeof useScheduler>;
