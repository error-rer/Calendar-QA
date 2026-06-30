import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type {
  Assignment,
  CreateDraft,
  CustomerForm,
  EngineerForm,
  Priority,
  SiteForm,
  State,
  SubDepartment,
  TimeScale,
} from './types';
import {
  custPalette,
  dayLabels,
  dayNames,
  initialState,
  siteColors,
} from './data';

/** Identity tag that supplies a contextual CSSProperties type to a style literal. */
const sx = (o: CSSProperties): CSSProperties => o;

interface MonthChip {
  code: string;
  purpose: string;
  engName: string;
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
  const fmtDate = (d: Date) => {
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    return m + ' ' + d.getDate();
  };
  const weekAssignments = () => S.assignments.filter((a) => a.week === S.weekOffset);
  const monthBaseDate = () => new Date(2026, 5 + (S.monthOffset || 0), 1);
  /** Map an absolute date onto the seeded scheduling grid (week offset + weekday index). */
  const dateSlot = (d: Date) => {
    const base = new Date(2026, 5, 29);
    const diff = Math.round((d.getTime() - base.getTime()) / 86400000);
    return { weekOffset: Math.floor(diff / 7), wd: (d.getDay() + 6) % 7 };
  };
  /** Per-week conflict lookup (has-conflict only), memoised across the month grid. */
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
    if (S.filterCompany && o.customer !== S.filterCompany) return true;
    if (S.filterAuditTopic && o.customer !== S.filterAuditTopic && o.plant !== S.filterAuditTopic) return true;
    if (S.filterAuditType && o.purpose !== S.filterAuditType) return true;
    return false;
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
  const goSummary = () => setState({ page: 'summary', userMenuOpen: false, selected: null, sidebarOpen: false });
  const setSummaryScale = (s: TimeScale) => setState({ summaryScale: s });
  const shiftSummaryWeek = (n: number) => setState((s) => ({ summaryWeekOffset: s.summaryWeekOffset + n }));
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
  const openTimetable = (engId: string) => setState({ timetableOpenEng: engId, selected: null });
  const closeTimetable = () => setState({ timetableOpenEng: null });
  const setFilterSite = (v: string) => setState({ filterSite: v });
  const setFilterCompany = (v: string) => setState({ filterCompany: v });
  const setFilterAuditType = (v: string) => setState({ filterAuditType: v });
  const setFilterAuditTopic = (v: string) => setState({ filterAuditTopic: v });
  const clearFilters = () =>
    setState({ filterEmp: '', filterSite: '', filterCompany: '', filterAuditType: '', filterAuditTopic: '', activePlants: Object.fromEntries(S.plants.map((p) => [p.id, true])) });

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
      assignments: s.assignments.concat([{ id, eng: engId, order: orderId, day, appointment: appointment || '08:00', week: s.weekOffset }]),
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
      createDraft: { order: '', eng: '', day: s.selectedDay || 0, appointment: '08:00' },
    }));
  const openCreateAt = (engId: string, day: number) =>
    setState({ createOpen: true, userMenuOpen: false, createDraft: { order: '', eng: engId, day, appointment: '08:00' } });
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
  // ---- create-engineer modal ----
  const openEngForm = () =>
    setState({ engFormOpen: true, userMenuOpen: false, sidebarOpen: false, engForm: { name: '', role: '', department: 'U1', subDepartments: [] } });
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
      engineers: s.engineers.concat([{ id, name: f.name.trim(), role: f.role.trim() || 'QA Engineer', department: f.department, subDepartments: f.subDepartments.slice(), status: 'Active' }]),
      engFormOpen: false,
    }));
    log('You', `added ${f.name.trim().split(' ')[0]}`, '#2756d6');
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

  // ---- chip builders ----
  const buildChip = (a: Assignment) => {
    const ord = orderById(a.order)!;
    const pl = plantById(ord.plant)!;
    const dim = chipDimmed(a);
    const sel = S.selected === a.id;
    const base: CSSProperties = {
      display: 'block', padding: '7px 9px', borderRadius: '6px', background: '#fff', cursor: 'grab', position: 'relative',
      border: '1px solid #e3e6e0', borderLeft: '3px solid ' + pl.color,
      boxShadow: sel ? '0 0 0 2px ' + hexA(pl.color, 0.55) : '0 1px 1px rgba(20,25,30,.05)',
      opacity: dim ? 0.32 : 1, filter: dim ? 'grayscale(.5)' : 'none', transition: 'box-shadow .12s',
    };
    return {
      aid: a.id, code: ord.customer, purpose: ord.purpose, style: base,
      onClick: () => select(a.id),
      onDragStart: (e: React.DragEvent) => { e.stopPropagation(); setState({ drag: { kind: 'assign', id: a.id } }); },
      onDragEnd: () => setState({ drag: null, overCell: null }),
    };
  };

  const buildPersonChip = (a: Assignment, accent?: string) => {
    const e = engById(a.eng)!;
    const ord = orderById(a.order)!;
    const pl = plantById(ord.plant)!;
    const dim = chipDimmed(a);
    return {
      aid: a.id, name: e.name, initials: initials(e.name), code: ord.customer, purpose: ord.purpose, plantCode: pl.code,
      style: sx({ display: 'flex', alignItems: 'center', gap: '7px', padding: '5px 7px', background: '#fff', border: '1px solid #e8ebe4', borderLeft: '3px solid ' + (accent || pl.color), borderRadius: '6px', cursor: 'pointer', opacity: dim ? 0.32 : 1, filter: dim ? 'grayscale(.5)' : 'none' }),
      avatarStyle: sx({ width: '22px', height: '22px', borderRadius: '6px', background: '#f1f3ee', color: '#5c625c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 600, flexShrink: 0 }),
      onClick: () => select(a.id),
    };
  };

  // ======================= VIEW MODEL =======================
  const isMobile = (S.vw || 1440) < 860;
  const selDay = S.selectedDay || 0;

  const tabOn = sx({ padding: '6px 13px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: "'Archivo',sans-serif", background: '#15191e', color: '#fff', whiteSpace: 'nowrap' });
  const tabOff = sx({ padding: '6px 13px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: "'Archivo',sans-serif", background: 'transparent', color: '#5c625c', whiteSpace: 'nowrap' });

  const wk = weekAssignments();
  const baseDate = new Date(2026, 5, 29);
  const days = dayLabels.map((lbl, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + S.weekOffset * 7 + i);
    return {
      label: lbl, date: fmtDate(d),
    };
  });
  const weekLabel = days[0].date + ' – ' + days[4].date;
  const weekTag = S.weekOffset === 0 ? 'CURRENT WEEK' : S.weekOffset > 0 ? '+' + S.weekOffset + ' WK AHEAD' : Math.abs(S.weekOffset) + ' WK BACK';
  const gridCols = '220px repeat(5, minmax(168px, 1fr))';

  // ======================= MONTH SCALE =======================
  const isMonth = S.timeScale === 'month';
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
  const monthOrderAgg: Record<string, { appointments: number; days: Record<number, 1>; engs: Record<string, 1> }> = {};
  const monthCustomerSet = new Set<string>();
  const monthInternalSet = new Set<string>();
  const internalPlants = new Set(['QMS', 'EHS', 'ESD']);
  for (let dn = 1; dn <= daysInMonth; dn++) {
    const date = new Date(mYear, mMon, dn);
    const slot = dateSlot(date);
    const weekend = slot.wd > 4;
    const all = weekend ? [] : S.assignments.filter((a) => a.week === slot.weekOffset && a.day === slot.wd);
    const appointments = all.filter((a) => !chipDimmed(a));
    all.forEach((a) => {
      const o = orderById(a.order);
      if (!o) return;
      if (S.filterCompany && o.customer !== S.filterCompany) return;
      if (!S.activePlants[o.plant]) return;
      if (S.filterEmp && a.eng !== S.filterEmp) return;
      if (S.filterAuditTopic && o.customer !== S.filterAuditTopic && o.plant !== S.filterAuditTopic) return;
      if (S.filterAuditType && o.purpose !== S.filterAuditType) return;
      monthCustomerSet.add(o.customer);
      if (internalPlants.has(o.plant)) monthInternalSet.add(o.plant);
      const g = monthOrderAgg[o.id] || (monthOrderAgg[o.id] = { appointments: 0, days: {}, engs: {} });
      g.appointments++;
      g.days[dn] = 1;
      g.engs[a.eng] = 1;
    });
    const chips: MonthChip[] = appointments.slice(0, 3).map((a) => {
      const o = orderById(a.order)!;
      const e = engById(a.eng);
      return {
        code: o.customer, purpose: o.purpose, engName: e ? e.name.split(' ')[0] : '',
        countTxt: '',
        dotStyle: sx({ width: '7px', height: '7px', borderRadius: '2px', background: '#999', flexShrink: 0 }),
        style: sx({ display: 'flex', alignItems: 'center', gap: '5px', padding: '2px 5px', background: '#f6f7f4', border: '1px solid #e6e9e2', borderRadius: '5px' }),
      };
    });
    const more = appointments.length - chips.length;
    const isToday = mYear + '-' + mMon + '-' + dn === todayStr;
    const cur = slot.weekOffset === 0;
    monthCells.push({
      blank: false, dateNum: String(dn), countTxt: appointments.length ? String(appointments.length) : '',
      chips, more, moreTxt: more > 0 ? '+' + more + ' more' : '',
      onClick: weekend ? () => {} : () => drillToDay(slot.weekOffset, slot.wd),
      style: sx({ position: 'relative', background: weekend ? '#f3f5ef' : '#fff', border: '1px solid ' + (isToday ? '#15191e' : '#e6e9e2'), boxShadow: isToday ? '0 0 0 1px #15191e' : 'none', borderRadius: '9px', minHeight: isMobile ? '52px' : '112px', padding: isMobile ? '5px' : '8px 9px', cursor: weekend ? 'default' : 'pointer', opacity: weekend ? 0.6 : 1, display: 'flex', flexDirection: 'column', gap: isMobile ? '2px' : '6px', overflow: 'hidden' }),
      numStyle: sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: isMobile ? '11px' : '12px', fontWeight: isToday ? 700 : 600, color: cur ? '#15191e' : '#9aa097' }),
      countDotStyle: appointments.length
        ? sx({ minWidth: '16px', height: '16px', borderRadius: '8px', background: '#15191e', color: '#fff', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' })
        : sx({ display: 'none' }),
    });
  }
  while (monthCells.length % 7 !== 0) monthCells.push({ blank: true, style: blankCellStyle() });
  const monthOrders = S.orders
    .filter((o) => {
      if (S.filterCompany && o.customer !== S.filterCompany) return false;
      if (!S.activePlants[o.plant]) return false;
      if (S.filterAuditTopic && o.customer !== S.filterAuditTopic && o.plant !== S.filterAuditTopic) return false;
      if (S.filterAuditType && o.purpose !== S.filterAuditType) return false;
      return true;
    })
    .map((o) => {
      const pl = plantById(o.plant)!;
      const pc = priorityColors(o.priority);
      const g = monthOrderAgg[o.id];
      const appointments = g ? g.appointments : 0;
      const days = g ? Object.keys(g.days).length : 0;
      const engs = g ? Object.keys(g.engs).length : 0;
      return {
        orderId: o.id, code: o.code, product: o.product, customer: o.customer, plantCode: pl.code, priority: o.priority,
        scheduled: appointments > 0, appointments, days, engs,
        appointmentsTxt: appointments + (appointments === 1 ? ' appointment' : ' appointments'), daysTxt: days + (days === 1 ? ' day' : ' days'),
        statusLabel: appointments > 0 ? 'Scheduled' : 'Not scheduled',
        statusStyle: sx({ fontFamily: "'Archivo',sans-serif", fontSize: '10px', fontWeight: 600, color: appointments > 0 ? '#1f8a5b' : '#9a7a3a', background: appointments > 0 ? '#e3f5ea' : '#fff3df', border: '1px solid ' + (appointments > 0 ? '#c4e6d2' : '#f1dcb0'), borderRadius: '20px', padding: '2px 9px' }),
        priorityStyle: sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8.5px', fontWeight: 600, color: pc.c, background: pc.b, border: '1px solid ' + pc.bd, borderRadius: '3px', padding: '1px 5px' }),
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
    return {
      label: d.label, date: d.date,
      style: sx({ position: 'relative', flex: 1, minWidth: 0, padding: '6px 3px', borderRadius: '8px', border: '1px solid ' + (selDay === i ? '#15191e' : '#e2e5de'), background: selDay === i ? '#15191e' : '#fff', cursor: 'pointer', textAlign: 'center', fontFamily: "'Archivo',sans-serif" }),
      labelStyle: sx({ fontSize: '11px', fontWeight: 700, color: selDay === i ? '#fff' : '#23282a' }),
      dateStyle: sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', color: selDay === i ? '#aeb6c8' : '#9aa097', marginTop: '1px' }),
      onClick: () => setSelectedDay(i),
    };
  });

  const weekCustomers = [...new Set(wk.map((a) => orderById(a.order)).filter(Boolean).map((o) => o!.customer))].length;
  const weekInternals = [...new Set(wk.map((a) => orderById(a.order)).filter(Boolean).map((o) => o!.plant).filter((p) => internalPlants.has(p)))].length;
  const monthCustomers = monthCustomerSet.size;
  const monthInternals = monthInternalSet.size;

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

  const personRows = S.engineers.map((e) => {
    const cells = [0, 1, 2, 3, 4].map((day) => {
      const cellId = e.id + '-' + day;
      const chips = wk.filter((a) => a.eng === e.id && a.day === day).map((a) => buildChip(a));
      const over = S.overCell === cellId;
      return {
        cellId, chips, empty: chips.length === 0,
        style: sx({ borderBottom: '1px solid #e2e5de', borderRight: '1px solid #e2e5de', padding: '7px', minHeight: '78px', display: 'flex', flexDirection: 'column', gap: '5px', background: over ? '#e7efff' : '#fbfcfa', boxShadow: over ? 'inset 0 0 0 2px #9bb0e8' : 'none', transition: 'background .1s' }),
        hintStyle: sx({ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: over ? '#5b7fd6' : '#cdd2c9', fontSize: '15px', border: '1px dashed ' + (over ? '#9bb0e8' : '#e2e5de'), borderRadius: '6px', minHeight: '40px', cursor: 'pointer', transition: 'all .12s' }),
        onHintClick: () => openCreateAt(e.id, day),
        onDragOver: (ev: React.DragEvent) => { ev.preventDefault(); if (S.overCell !== cellId) setState({ overCell: cellId }); },
        onDragLeave: () => { if (state.overCell === cellId) setState({ overCell: null }); },
        onDrop: (ev: React.DragEvent) => {
          ev.preventDefault();
          const d = state.drag;
          if (d) {
            if (d.kind === 'order') createAssign(d.id, e.id, day, '08:00');
            else moveAssign(d.id, e.id, day);
          }
          setState({ drag: null, overCell: null });
        },
      };
    });
    return {
      engId: e.id, name: e.name, role: e.role, department: e.department, subDepartments: e.subDepartments, initials: initials(e.name),
      avatarStyle: sx({ width: '30px', height: '30px', borderRadius: '8px', background: '#f1f3ee', color: '#5c625c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 600, flexShrink: 0 }),
      nameCellStyle: sx({ borderBottom: '1px solid #e2e5de', borderRight: '1px solid #e2e5de', padding: '11px 13px', background: '#fff', position: 'sticky', left: 0, zIndex: 2, cursor: 'pointer' }),
      onNameClick: () => openTimetable(e.id),
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
        .map((a) => buildPersonChip(a, p.color));
      return { chips, empty: chips.length === 0, style: cellShell };
    });
    return { name: p.name, loc: p.loc, cells };
  });

  const customers = [...new Set([...S.orders.map((o) => o.customer), ...S.customers])];
  const customerRows = customers.map((cust) => {
    const cells = [0, 1, 2, 3, 4].map((day) => {
      const chips = wk
        .filter((a) => {
          const o = orderById(a.order);
          return o && o.customer === cust && a.day === day;
        })
        .map((a) => buildPersonChip(a));
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
      avatarStyle: sx({ width: '28px', height: '28px', borderRadius: '8px', background: '#f1f3ee', color: '#5c625c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', fontWeight: 700, flexShrink: 0 }),
      cells,
    };
  });

  const mobilePersonRows = personRows.map((r) => ({ engId: r.engId, name: r.name, role: r.role, department: r.department, subDepartments: r.subDepartments, initials: r.initials, avatarStyle: r.avatarStyle, onNameClick: r.onNameClick, cell: r.cells[selDay] }));
  const mobileSiteRows = plantRows.map((r) => ({ name: r.name, loc: r.loc, cell: r.cells[selDay] }));
  const mobileCustomerRows = customerRows.map((r) => ({ name: r.name, sub: r.sub, initials: r.initials, cell: r.cells[selDay] }));

  // ---- timetable (per-employee calendar view, opened by clicking a name) ----
  const timeSlots: { id: string; label: string; hours: string; min: string; max: string }[] = [];
  for (let h = 0; h < 24; h += 2) {
    const from = String(h).padStart(2, '0') + ':00';
    const to = String(h + 2).padStart(2, '0') + ':00';
    timeSlots.push({ id: from, label: from + ' – ' + to, hours: from + ' – ' + to, min: from, max: to });
  }

  function timeInSlot(t: string, sl: { min: string; max: string }): boolean {
    if (sl.min <= sl.max) return t >= sl.min && t < sl.max;
    return t >= sl.min || t < sl.max;
  }

  const timetableOpenEngId = S.timetableOpenEng;
  const timetableEng = timetableOpenEngId ? engById(timetableOpenEngId) : null;
  const showTimetable = !!timetableOpenEngId && !!timetableEng;
  const timetableRows = timeSlots.map((sl) => {
    const cells = [0, 1, 2, 3, 4].map((day) => {
      const chips = timetableOpenEngId ? wk
        .filter((a) => a.eng === timetableOpenEngId && a.day === day && timeInSlot(a.appointment, sl))
        .map((a) => buildChip(a)) : [];
      return { chips, empty: chips.length === 0, style: cellShell };
    });
    return { slotId: sl.id, label: sl.label, hours: sl.hours, cells };
  });
  const timetableGridCols = '200px repeat(5, minmax(168px, 1fr))';
  const mobileTimetableRows = timetableRows.map((r) => ({ slotId: r.slotId, label: r.label, hours: r.hours, cell: r.cells[selDay] }));

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
    const pc = priorityColors(ord.priority);
    const comments = (S.comments[selA.id] || []).map((m) => ({
      who: m.who, initials: m.initials, text: m.text, ago: m.ago,
      avatarStyle: sx({ width: '24px', height: '24px', borderRadius: '7px', background: '#f1f3ee', color: '#5c625c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 600, flexShrink: 0 }),
    }));
    return {
      aid: selA.id, orderCode: ord.code, product: ord.product, customer: ord.customer, priority: ord.priority, plantName: pl.name + ' · ' + pl.loc,
      priorityStyle: sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 600, color: pc.c, background: pc.b, border: '1px solid ' + pc.bd, borderRadius: '3px', padding: '2px 6px' }),
      engName: eng.name, engRole: eng.role, engInitials: initials(eng.name), dayName: dayNames[selA.day],
      apptTime: selA.appointment,
      avatarStyle: sx({ width: '34px', height: '34px', borderRadius: '9px', background: '#f1f3ee', color: '#5c625c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', fontWeight: 600, flexShrink: 0 }),
      department: eng.department, subDepartments: eng.subDepartments,
      onApptTime: (e: React.ChangeEvent<HTMLInputElement>) => setAppointment(selA.id, e.target.value),
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
  const cEngs = S.engineers.map((e) => {
    const onSel = cd.eng === e.id;
    return {
      engId: e.id, name: e.name, role: e.role, initials: initials(e.name), flag: '', flagStyle: sx({ display: 'none' }),
      avatarStyle: sx({ width: '26px', height: '26px', borderRadius: '7px', background: '#f1f3ee', color: '#5c625c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', fontWeight: 600, flexShrink: 0 }),
      style: sx({ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 9px', borderRadius: '8px', cursor: 'pointer', border: '1px solid ' + (onSel ? '#9bb0e8' : '#eef1ea'), background: onSel ? '#eef2fd' : '#fff' }),
      select: () => setDraft({ eng: e.id }),
    };
  });
  const segSm = (on: boolean) => sx({ padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11.5px', fontWeight: 600, fontFamily: "'Archivo',sans-serif", background: on ? '#15191e' : 'transparent', color: on ? '#fff' : '#6a706a' });
  const dayBtns = dayLabels.map((lbl, i) => ({ label: lbl, style: segSm(cd.day === i), select: () => setDraft({ day: i }) }));
  const canCreate = !!(cd.order && cd.eng);
  const create = {
    orders: cOrders, engineers: cEngs, dayBtns,
    apptTime: cd.appointment,
    onApptTime: (e: React.ChangeEvent<HTMLInputElement>) => setDraft({ appointment: e.target.value }),
    warn: false, warnText: '',
    submit: () => submitCreate(),
    submitStyle: sx({ background: canCreate ? '#15191e' : '#c4c9bf', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '12.5px', fontWeight: 600, cursor: canCreate ? 'pointer' : 'default', fontFamily: "'Archivo',sans-serif" }),
  };

  // ---- profile VM ----
  const myWeekAppointments = S.assignments.filter((a) => a.week === 0).length;
  const profile = {
    name: 'Jordan Lee', role: 'QA Planner · Operations', email: 'jordan.lee@nexsil.com', phone: '+1 (480) 555-0173', team: 'Front-end Quality, Reliability', joined: 'Joined March 2023',
    stats: [
      { label: 'APPOINTMENTS PLANNED', value: String(myWeekAppointments), sub: 'this week' },
      { label: 'SITES', value: String(S.plants.length), sub: 'under coverage' },
    ],
    sites: S.plants.map((p) => ({ name: p.name, code: p.code, swatchStyle: sx({ width: '10px', height: '10px', borderRadius: '3px', background: p.color, flexShrink: 0 }) })),
    activity: S.activity.slice(0, 5).map((a) => ({ who: a.who, text: a.text, ago: a.ago, dotStyle: sx({ width: '7px', height: '7px', borderRadius: '50%', background: a.color, marginTop: '4px', flexShrink: 0 }) })),
  };

  // ---- shared modal styles ----
  const segMd = (on: boolean) => sx({ padding: '7px 13px', borderRadius: '7px', border: '1px solid ' + (on ? '#15191e' : '#dde0d9'), cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: "'Archivo',sans-serif", background: on ? '#15191e' : '#fff', color: on ? '#fff' : '#5c625c' });
  const ofInStyle = sx({ width: '100%', border: '1px solid #dde0d9', borderRadius: '9px', padding: '10px 12px', fontSize: '13px', fontFamily: "'Archivo',sans-serif", color: '#23282a', outline: 'none', background: '#fff' });

  // ---- create-engineer modal VM ----
  const ef = S.engForm;
  const certPick = (on: boolean) => ({
    style: sx({ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', border: '1px solid ' + (on ? '#9bb0e8' : '#e2e5de'), background: on ? '#eef2fd' : '#fff' }),
    boxStyle: sx({ width: '15px', height: '15px', borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#fff', background: on ? '#2756d6' : '#fff', border: '1px solid ' + (on ? '#2756d6' : '#cdd2c9') }),
    check: on ? '✓' : '',
  });
  const allDepartments = ['U1', 'U2', 'U3'] as const;
  const internalAuditTopics = ['QMS', 'EHS', 'ESD'] as const;
  const customerAuditTopics = ['ESD Audit', 'QS Audit'] as const;
  const engForm = {
    name: ef.name, role: ef.role, department: ef.department, subDepartments: ef.subDepartments, inStyle: ofInStyle,
    onName: (e: React.ChangeEvent<HTMLInputElement>) => setEngForm({ name: e.target.value }),
    onRole: (e: React.ChangeEvent<HTMLInputElement>) => setEngForm({ role: e.target.value }),
    departments: allDepartments.map((d) => ({ label: d, onClick: () => setEngForm({ department: d }), style: segMd(ef.department === d) })),
    subDepartmentOptions: [
      ...internalAuditTopics.map((c) => ({ code: c, name: c, group: 'Internal Audit' as const, onClick: () => toggleEngSubDept(c), ...certPick(ef.subDepartments.includes(c as SubDepartment)) })),
      ...customerAuditTopics.map((c) => ({ code: c, name: c, group: 'Customer' as const, onClick: () => toggleEngSubDept(c as SubDepartment), ...certPick(ef.subDepartments.includes(c as SubDepartment)) })),
    ],
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

  // ---- summary data ----
  const summaryWk = S.assignments.filter((a) => a.week === S.summaryWeekOffset);
  const summaryWeekBase = new Date(2026, 5, 29 + S.summaryWeekOffset * 7);
  const summaryDays = [0, 1, 2, 3, 4].map((i) => {
    const d = new Date(summaryWeekBase);
    d.setDate(summaryWeekBase.getDate() + i);
    return fmtDate(d);
  });
  const summaryWeekLabel = summaryDays[0] + ' – ' + summaryDays[4];
  const summaryWeekTag = S.summaryWeekOffset === 0 ? 'CURRENT WEEK' : S.summaryWeekOffset > 0 ? '+' + S.summaryWeekOffset + ' WK AHEAD' : Math.abs(S.summaryWeekOffset) + ' WK BACK';
  const summaryIsWeek = S.summaryScale === 'week';
  const summaryMA = () => {
    const mb = monthBaseDate();
    const mMon = mb.getMonth();
    const mYear = mb.getFullYear();
    const daysInMonth = new Date(mYear, mMon + 1, 0).getDate();
    const result: Assignment[] = [];
    for (let dn = 1; dn <= daysInMonth; dn++) {
      const date = new Date(mYear, mMon, dn);
      const slot = dateSlot(date);
      if (slot.wd > 4) continue;
      const dayApps = S.assignments.filter((a) => a.week === slot.weekOffset && a.day === slot.wd && !chipDimmed(a));
      result.push(...dayApps);
    }
    return result;
  };
  const summaryAssignments = summaryIsWeek ? summaryWk : summaryMA();
  const summaryEmpCount = [...new Set(summaryAssignments.map((a) => a.eng))].length;
  const summaryEmpMap = new Map<string, { total: number; internal: number; customer: number; companies: Set<string> }>();
  for (const a of summaryAssignments) {
    const prev = summaryEmpMap.get(a.eng) || { total: 0, internal: 0, customer: 0, companies: new Set<string>() };
    const o = orderById(a.order);
    const isInternal = o && internalPlants.has(o.plant);
    if (o?.customer && !isInternal) prev.companies.add(o.customer);
    summaryEmpMap.set(a.eng, {
      total: prev.total + 1,
      internal: prev.internal + (isInternal ? 1 : 0),
      customer: prev.customer + (!isInternal && o?.customer ? 1 : 0),
      companies: prev.companies,
    });
  }
  const summaryEmpBreakdown = [...summaryEmpMap.entries()]
    .map(([id, counts]) => ({ id, name: S.engineers.find((e) => e.id === id)?.name || id, ...counts, companies: [...counts.companies].sort() }))
    .sort((a, b) => b.total - a.total);
  const summaryEmpTotal = summaryEmpBreakdown.reduce((s, e) => ({ total: s.total + e.total, internal: s.internal + e.internal, customer: s.customer + e.customer }), { total: 0, internal: 0, customer: 0 });
  const summaryInternalCount = [...new Set(summaryAssignments.map((a) => orderById(a.order)).filter(Boolean).map((o) => o!.plant).filter((p) => internalPlants.has(p)))].length;
  const summaryCustomerCount = [...new Set(summaryAssignments.map((a) => orderById(a.order)).filter(Boolean).map((o) => o!.customer))].length;

  // ---- admin VMs ----
  const activeEng = S.engineers.filter((e) => e.status === 'Active').length;
  const activeSites = S.plants.filter((p) => S.activePlants[p.id]).length;
  const adminStats = [
    { label: 'QA', value: String(S.engineers.length), sub: activeEng + ' active' },
    { label: 'INTERNAL', value: activeSites + '/' + S.plants.length, sub: 'visible on grid' },
    { label: 'WEEK APPOINTMENTS', value: String(wk.length), sub: 'this week' },
  ];
  const statusStyleFor = (label: 'Active' | 'On leave' | 'Onboarding') => {
    const m = { Active: { c: '#1f8a5b', b: '#e3f5ea', bd: '#c4e6d2' }, 'On leave': { c: '#a96e08', b: '#fff3df', bd: '#f1dcb0' }, Onboarding: { c: '#5b7fd6', b: '#eef2fd', bd: '#d8e2fa' } }[label];
    return sx({ fontFamily: "'Archivo',sans-serif", fontSize: '11px', fontWeight: 600, color: m.c, background: m.b, border: '1px solid ' + m.bd, borderRadius: '20px', padding: '4px 11px', cursor: 'pointer' });
  };
  const adminEngineers = S.engineers.map((e) => {
    return {
      id: e.id, name: e.name, role: e.role, department: e.department, subDepartments: e.subDepartments, initials: initials(e.name),
      avatarStyle: sx({ width: '30px', height: '30px', borderRadius: '8px', background: '#f1f3ee', color: '#5c625c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 600, flexShrink: 0 }),
      appointments: wk.filter((a) => a.eng === e.id).length,
    };
  });
  const adminSites = S.plants.map((p) => {
    const on = S.activePlants[p.id];
    return {
      name: p.name, loc: p.loc, code: p.code,
      appointments: wk.filter((a) => {
        const o = orderById(a.order);
        return o && o.plant === p.id;
      }).length,
      statusLabel: on ? 'Visible' : 'Hidden', statusStyle: statusStyleFor(on ? 'Active' : 'On leave'), toggle: () => togglePlant(p.id),
    };
  });

  // ---- filters VM ----
  const employeeOptions = [{ value: '', label: 'All employees' }].concat(S.engineers.map((e) => ({ value: e.id, label: e.name })));
  const siteOptions = [{ value: '', label: 'All sites' }, { value: 'U1', label: 'U1' }, { value: 'U2', label: 'U2' }, { value: 'U2A', label: 'U2A' }, { value: 'U2B', label: 'U2B' }, { value: 'U3', label: 'U3' }, { value: 'U3A', label: 'U3A' }, { value: 'U3T', label: 'U3T' }];
  const customerTopicOptions = ['ESD Audit', 'QS Audit'];
  const internalTopicOptions = ['QMS', 'EHS', 'ESD'];
  const companyNames = ['Company A', 'Company B', 'Company C', 'Company D', 'Company E'];
  const auditTypes = ['annual', 'end cust', 'VDA'];
  const hasFilters = !!(S.filterEmp || S.filterSite || S.filterCompany || S.filterAuditType || S.filterAuditTopic) || S.plants.some((p) => !S.activePlants[p.id]);
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
    isMobile, showLogin: !S.authed, showApp: S.authed, showPresence: !isMobile, showStats: !isMobile, showLoginExtras: !isMobile,
    loginEmail: S.loginEmail, loginPass: S.loginPass,
    onEmail: (e: React.ChangeEvent<HTMLInputElement>) => setState({ loginEmail: e.target.value }),
    onPass: (e: React.ChangeEvent<HTMLInputElement>) => setState({ loginPass: e.target.value }),
    onLoginKey: (e: React.KeyboardEvent) => { if (e.key === 'Enter') signIn(); },
    signIn, signOut,
    isSchedule: S.page === 'schedule', isAdmin: S.page === 'admin', isProfile: S.page === 'profile', isSummary: S.page === 'summary',
    goSchedule, goAdmin, goProfile, goSummary,
    navSchedStyle: S.page === 'schedule' ? tabOn : tabOff, navAdminStyle: S.page === 'admin' ? tabOn : tabOff, navSummaryStyle: S.page === 'summary' ? tabOn : tabOff,
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
    weekLabel, weekTag, periodLabel, periodTag, gridCols, days, daySel,
    prevWeek: () => (isMonth ? shiftMonth(-1) : shiftWeek(-1)), nextWeek: () => (isMonth ? shiftMonth(1) : shiftWeek(1)),
    profile,
    engForm, engFormOpen: S.engFormOpen, openEngForm, closeEngForm,
    siteForm, siteFormOpen: S.siteFormOpen, openSiteForm, closeSiteForm,
    customerForm, custFormOpen: S.custFormOpen, openCustForm, closeCustForm,
    stats: { assignments: wk.length, weekCustomers, monthCustomers, weekInternals, monthInternals },
    plants: plantsVm,
    personRows, plantRows, customerRows, mobilePersonRows, mobileSiteRows, mobileCustomerRows,
    showTimetable, timetableRows, timetableGridCols, timetableEngName: timetableEng?.name || '',
    closeTimetable, mobileTimetableRows,
    presence, activity, detail,
    emptyWeek: S.weekOffset !== 0 && wk.length === 0 && !isMonth, copyWeek,
    toggleSidebar, closeSidebar, showSidebarBackdrop: isMobile && S.sidebarOpen,
    sidebarStyle, toolbarStyle, detailAsideStyle, modalOverlayStyle, modalCardStyle, modalColsStyle, modalColLeftStyle, modalColRightStyle,
    adminMainStyle, adminWrapStyle, adminStatGridStyle, loginWrapStyle, loginBrandStyle, loginFormWrapStyle,
    filterEmp: S.filterEmp, filterSite: S.filterSite, filterCompany: S.filterCompany, filterAuditType: S.filterAuditType, filterAuditTopic: S.filterAuditTopic,
    employeeOptions, siteOptions, customerTopicOptions, internalTopicOptions, companyNames, auditTypes, hasFilters, selStyle,
    onFilterEmp: (e: React.ChangeEvent<HTMLSelectElement>) => setFilterEmp(e.target.value),
    onFilterSite: (e: React.ChangeEvent<HTMLSelectElement>) => setFilterSite(e.target.value),
    onFilterCompany: (e: React.ChangeEvent<HTMLSelectElement>) => setFilterCompany(e.target.value),
    onFilterAuditType: (e: React.ChangeEvent<HTMLSelectElement>) => setFilterAuditType(e.target.value),
    onFilterAuditTopic: (e: React.ChangeEvent<HTMLSelectElement>) => setFilterAuditTopic(e.target.value),
    clearFilters,
    openCreate, closeCreate, createOpen: S.createOpen, create, stop: (e: React.MouseEvent) => e.stopPropagation(),
    adminStats,
    tabEngineers: S.adminTab === 'engineers', tabSites: S.adminTab === 'sites',
    setTabEng: () => setAdminTab('engineers'), setTabSite: () => setAdminTab('sites'),
    tabEngStyle: S.adminTab === 'engineers' ? tabOn : tabOff, tabSiteStyle: S.adminTab === 'sites' ? tabOn : tabOff,
    adminEngineers, adminSites, engCount: S.engineers.length, siteCount: S.plants.length,
    addEngineer: openEngForm, addSite: openSiteForm, addCustomer: openCustForm,
    summaryScale: S.summaryScale, summaryIsWeek, setSummaryWeek: () => setSummaryScale('week'), setSummaryMonth: () => setSummaryScale('month'),
    summaryWeekStyle: S.summaryScale === 'week' ? tabOn : tabOff, summaryMonthStyle: S.summaryScale === 'month' ? tabOn : tabOff,
    summaryWeekLabel, summaryWeekTag, summaryWeekOffset: S.summaryWeekOffset,
    prevSummaryWeek: () => shiftSummaryWeek(-1), nextSummaryWeek: () => shiftSummaryWeek(1),
    summaryEmpCount, summaryEmpBreakdown, summaryEmpTotal, summaryInternalCount, summaryCustomerCount, summaryAssignTotal: summaryAssignments.length,
  };
}

export type VM = ReturnType<typeof useScheduler>;
