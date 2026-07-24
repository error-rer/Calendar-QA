import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type {
  Assignment,
  CreateDraft,
  Department,
  EditDraft,
  EngineerForm,
  State,
  SubDepartment,
} from './types';
import {
  dayLabels,
  dayNames,
  initialState,
} from './data';
import { api } from './api';

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
  const [loading, setLoading] = useState(true);
  const ids = useRef({ id: 100 });

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

  useEffect(() => {
    api.fetchState()
      .then((data) => {
        setRaw((s) => {
          // customerOptions isn't persisted server-side (like the other Options-tab
          // lists) — backfill it from historical customer names on every order/
          // assignment so previously-used customers still show up as suggestions.
          const historicalCustomers = new Set([
            ...data.orders.map((o) => o.customer).filter((c): c is string => Boolean(c)),
            ...data.assignments.map((a) => a.customer).filter((c): c is string => Boolean(c)),
          ]);
          const customerOptions = [...new Set([...s.customerOptions, ...historicalCustomers])];
          return {
            ...s,
            engineers: data.engineers,
            plants: data.plants,
            activePlants: { ...s.activePlants, ...data.activePlants },
            orders: data.orders,
            assignments: data.assignments,
            comments: data.comments,
            activity: data.activity,
            customerOptions,
          };
        });
      })
      .catch((err) => {
        console.warn('API load failed, using local data:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const S = state;

  // ---- pure-ish helpers ----
  const hexA = (h: string, a: number) => {
    const n = parseInt(h.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  const engById = (id: string) => S.engineers.find((e) => e.id === id);
  const orderById = (id: string) => S.orders.find((o) => o.id === id);
  // red for U1, green shades for U2 family, blue shades for U3 family
  const siteCodeColor: Record<string, string> = { U1: '#c0392b', U2: '#2e7d32', U2A: '#66bb6a', U2B: '#1b5e20', U3: '#1e5fa8', U3A: '#4a90d9', U3T: '#123f73' };
  const plantById = (id: string) => S.plants.find((p) => p.id === id) || { id: '', name: id || 'Unknown', loc: '', code: (id || '?').slice(0, 3).toUpperCase(), color: siteCodeColor[id] || '#999', active: true };
  const initials = (name: string) =>
    name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const siteToDept = (site: string): Department => (site.startsWith('U3') ? 'U3' : site.startsWith('U2') ? 'U2' : 'U1');
  /** Leading color-bar color for an appointment, keyed by its own site (site1 for Customer, site2 for Internal Audit). */
  const siteColorOf = (a: Assignment) => siteCodeColor[a.site1 || a.site2 || ''] || undefined;
  /** "CS" for Customer appointments, "IA" for Internal Audit. */
  const apptAbbr = (a: Assignment) => (a.site2 || a.auditor2 || a.department2 ? 'IA' : 'CS');
  const fmtDate = (d: Date) => {
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    return m + ' ' + d.getDate();
  };
  const fmtISO = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const weekAssignments = () => S.assignments.filter((a) => {
    if (a.week !== S.weekOffset) return false;
    if (!orderById(a.order) || !engById(a.eng)) return false;
    return true;
  });
  const monthBaseDate = () => new Date(2026, 5 + (S.monthOffset || 0), 1);
  /** Map an absolute date onto the seeded scheduling grid (week offset + weekday index). */
  const dateSlot = (d: Date) => {
    const base = new Date(2026, 5, 29);
    const diff = Math.round((d.getTime() - base.getTime()) / 86400000);
    return { weekOffset: Math.floor(diff / 7), wd: (d.getDay() + 6) % 7 };
  };
  const today = new Date();
  const todayWeekOffset = dateSlot(today).weekOffset;
  const todayMonthOffset = (today.getFullYear() - 2026) * 12 + (today.getMonth() - 5);
  const todayStr = today.getFullYear() + '-' + today.getMonth() + '-' + today.getDate();
  const chipDimmed = (a: Assignment) => {
    const o = orderById(a.order);
    if (!o) return false;
    if (!S.activePlants[o.plant]) return true;
    if (S.filterEmp.length > 0 && !S.filterEmp.includes(a.eng)) return true;
    if (S.filterCompany.length > 0 && !S.filterCompany.includes(o.customer)) return true;
    if (S.filterAuditTopic.length > 0 && !S.filterAuditTopic.some((t) => o.customer === t || o.plant === t)) return true;
    if (S.filterAuditType.length > 0 && !S.filterAuditType.includes(o.purpose)) return true;
    if (S.filterApptType.length > 0 && !S.filterApptType.includes(apptAbbr(a))) return true;
    return false;
  };

  const log = (who: string, text: string, color: string) => {
    api.logActivity({ id: 'act' + ids.current.id++, who, text, ago: 'just now', color }).catch(() => {});
    setState((s) => ({
      activity: [{ who, text, ago: 'just now', color }].concat(s.activity).slice(0, 9),
    }));
  };

  // ---- auth / nav ----
  const signIn = () => setState({ authed: true, weekOffset: todayWeekOffset, monthOffset: todayMonthOffset });
  const signOut = () => setState({ authed: false, userMenuOpen: false, selected: null });
  const goSchedule = () => setState({ page: 'schedule', userMenuOpen: false });
  const goAdmin = () => setState({ page: 'admin', userMenuOpen: false, selected: null });
  const goProfile = () => setState({ page: 'profile', userMenuOpen: false, selected: null, sidebarOpen: false });
  const goSummary = () => setState({ page: 'summary', userMenuOpen: false, selected: null, sidebarOpen: false });
  const setScale = (sc: State['timeScale']) =>
    setState((s) => {
      const patch: Partial<State> = { timeScale: sc, selected: null, sidebarOpen: false };
      if (sc === 'month') {
        // show the month containing the week currently being viewed
        const weekMonday = new Date(2026, 5, 29 + s.weekOffset * 7);
        patch.monthOffset = (weekMonday.getFullYear() - 2026) * 12 + (weekMonday.getMonth() - 5);
      } else if (sc === 'week') {
        if (s.monthSelectedDate) {
          // a specific date was clicked in Month view — jump to its week
          patch.weekOffset = s.monthSelectedDate.weekOffset;
        } else {
          // no date selected — jump to the week containing the first day of the month currently being viewed
          const monthFirst = new Date(2026, 5 + (s.monthOffset || 0), 1);
          const base = new Date(2026, 5, 29);
          const diff = Math.round((monthFirst.getTime() - base.getTime()) / 86400000);
          patch.weekOffset = Math.floor(diff / 7);
        }
      }
      return patch;
    });
  const togglePlant = (pid: string) => {
    api.togglePlant(pid).catch(() => {});
    setState((s) => ({ activePlants: { ...s.activePlants, [pid]: !s.activePlants[pid] } }));
  };
  const shiftWeek = (n: number) => setState((s) => ({ weekOffset: s.weekOffset + n, selected: null }));
  const shiftMonth = (n: number) => setState((s) => ({ monthOffset: (s.monthOffset || 0) + n, selected: null }));
  const setSelectedDay = (i: number) => setState({ selectedDay: i });
  const toggleSidebar = () => setState((s) => ({ sidebarOpen: !s.sidebarOpen }));
  const closeSidebar = () => setState({ sidebarOpen: false });
  const toggleFilterValue = (field: 'filterEmp' | 'filterSite' | 'filterCompany' | 'filterAuditType' | 'filterAuditTopic', value: string) =>
    setState((s) => {
      const arr = s[field] as unknown as string[];
      return { [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  // narrowing the Type filter can hide some Department/Purpose options (see
  // customerTopicOptions/internalTopicOptions/auditTypes below) — drop any
  // selected values that are no longer visible so a hidden filter can't keep
  // silently narrowing results.
  const toggleFilterApptType = (value: string) =>
    setState((s) => {
      const next = s.filterApptType.includes(value) ? s.filterApptType.filter((v) => v !== value) : [...s.filterApptType, value];
      const nextIsCS = next.length === 1 && next[0] === 'CS';
      const nextIsIA = next.length === 1 && next[0] === 'IA';
      const visibleDepts = [...(nextIsIA ? [] : s.customerDepartmentOptions), ...(nextIsCS ? [] : s.internalDepartmentOptions)];
      const visiblePurposes = nextIsIA ? [] : s.purposeOptions;
      return {
        filterApptType: next,
        filterAuditTopic: s.filterAuditTopic.filter((v) => visibleDepts.includes(v)),
        filterAuditType: s.filterAuditType.filter((v) => visiblePurposes.includes(v)),
      };
    });
  const openTimetable = (engId: string) => setState({ timetableOpenEng: engId, selected: null });
  const closeTimetable = () => setState({ timetableOpenEng: null });
  const clearFilters = () =>
    setState({ filterEmp: [], filterSite: [], filterCompany: [], filterAuditType: [], filterAuditTopic: [], filterApptType: [], activePlants: Object.fromEntries(S.plants.map((p) => [p.id, true])) });
  const openDayDialog = (weekOffset: number, day: number) => setState({ dayDialog: { weekOffset, day }, monthSelectedDate: { weekOffset, day } });
  const closeDayDialog = () => setState({ dayDialog: null });

  const copyWeek = () => {
    const off = S.weekOffset;
    const clones = S.assignments
      .filter((a) => a.week === todayWeekOffset)
      .map((a) => ({ ...a, id: 'a' + ids.current.id++, week: off }));
    clones.forEach((c) => api.createAssignment(c).catch(() => {}));
    setState((s) => ({ assignments: s.assignments.concat(clones) }));
    log('You', 'copied current week\'s plan', '#2756d6');
  };

  // ---- schedule mutations ----
  const select = (aid: string) => setState({ selected: aid, draft: '' });
  const createAssign = (orderId: string, engId: string, day: number) => {
    const id = 'a' + ids.current.id++;
    const week = S.weekOffset;
    api.createAssignment({ id, eng: engId, order: orderId, day, week }).catch(() => {});
    setState((s) => ({
      assignments: s.assignments.concat([{ id, eng: engId, order: orderId, day, week: s.weekOffset }]),
      selected: id,
    }));
    const ord = orderById(orderId);
    const eng = engById(engId);
    if (ord && eng) log('You', `staffed ${ord.code} → ${eng.name.split(' ')[0]}, ${dayLabels[day]}`, '#2756d6');
  };
  const moveAssign = (aid: string, engId: string, day: number) => {
    const a = S.assignments.find((x) => x.id === aid);
    api.updateAssignment(aid, { eng: engId, day, week: S.weekOffset }).catch(() => {});
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
  const removeAssign = (aid: string) => {
    const a = S.assignments.find((x) => x.id === aid);
    if (!a) return;
    // a multi-day appointment is several sibling assignments (same order + eng,
    // one per day) — remove the whole span, not just the one day that was clicked.
    const siblingIds = S.assignments.filter((x) => x.eng === a.eng && x.order === a.order).map((x) => x.id);
    siblingIds.forEach((id) => api.deleteAssignment(id).catch(() => {}));
    setState((s) => {
      const siblingSet = new Set(siblingIds);
      const comments = Object.fromEntries(Object.entries(s.comments).filter(([cid]) => !siblingSet.has(cid)));
      return { assignments: s.assignments.filter((x) => !siblingSet.has(x.id)), comments, selected: null };
    });
    const ord = orderById(a.order);
    if (ord) log('You', `removed ${ord.code} appointment`, '#2756d6');
  };
  const duplicate = (aid: string) => {
    const a = S.assignments.find((x) => x.id === aid);
    if (!a) return;
    const nd = a.day < 4 ? a.day + 1 : a.day - 1;
    const id = 'a' + ids.current.id++;
    const clone = { ...a, id, day: nd };
    api.createAssignment(clone).catch(() => {});
    setState((s) => ({ assignments: s.assignments.concat([clone]), selected: id }));
    const ord = orderById(a.order);
    if (ord) log('You', `duplicated ${ord.code} → ${dayLabels[nd]}`, '#2756d6');
  };
  const addComment = () => {
    const aid = S.selected;
    const t = S.draft.trim();
    if (!aid || !t) return;
    const comment = { id: 'c' + ids.current.id++, who: 'You', initials: 'YO', text: t, ago: 'just now', color: '#2756d6' };
    api.createComment(aid, comment).catch(() => {});
    setState((s) => {
      const list = (s.comments[aid] || []).concat([comment]);
      return { comments: { ...s.comments, [aid]: list }, draft: '' };
    });
    const a = S.assignments.find((x) => x.id === aid);
    if (a) {
      const ord = orderById(a.order);
      if (ord) log('You', `noted on ${ord.code}`, '#2756d6');
    }
  };
  const removeComment = (aid: string, commentId: string) => {
    api.deleteComment(commentId).catch(() => {});
    setState((s) => ({
      comments: { ...s.comments, [aid]: (s.comments[aid] || []).filter((c) => c.id !== commentId) },
    }));
  };

  // ---- create modal ----
  const openCreate = () => {
    setState({
      createOpen: true,
      userMenuOpen: false,
      sidebarOpen: false,
      createDraft: { order: '', eng: '', day: 0, dateFrom: '', dateTo: '', sectionType: 'customer', purpose: '', department1: '', site1: '', customer: '', endCustomer: '', auditor1: '', department2: '', site2: '', area: '', auditor2: '' },
    });
  };
  const openCreateAt = (engId: string, day: number) => {
    setState({ createOpen: true, userMenuOpen: false, createDraft: { order: '', eng: engId, day, dateFrom: '', dateTo: '', sectionType: 'customer', purpose: '', department1: '', site1: '', customer: '', endCustomer: '', auditor1: '', department2: '', site2: '', area: '', auditor2: '' } });
  };
  const closeCreate = () => setState({ createOpen: false });
  const setDraft = (patch: Partial<CreateDraft>) =>
    setState((s) => ({ createDraft: { ...s.createDraft, ...patch } }));
  const submitCreate = () => {
    const d = S.createDraft;
    if (!d.dateFrom || !d.dateTo) return;
    if (d.sectionType === 'customer') {
      if (!d.site1 || !d.customer || !d.auditor1) return;
    } else {
      if (!d.site2 || !d.area || !d.auditor2) return;
    }
    const auditorName = d.auditor1 || d.auditor2 || 'bird';
    const existingEng = S.engineers.find((e) => e.name.toLowerCase() === auditorName.toLowerCase());
    const engId = existingEng ? existingEng.id : 'e' + ids.current.id++;
    const newAssignments: Assignment[] = [];
    const orderId = 'o' + ids.current.id++;
    const start = new Date(d.dateFrom + 'T00:00:00');
    const end = new Date(d.dateTo + 'T00:00:00');
    for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
      const slot = dateSlot(cur);
      if (slot.wd < 5) {
        newAssignments.push({
          id: 'a' + ids.current.id++,
          eng: engId, order: orderId, day: slot.wd, week: slot.weekOffset,
          site1: d.sectionType === 'customer' ? d.site1 : '',
          customer: d.sectionType === 'customer' ? d.customer : '',
          endCustomer: d.sectionType === 'customer' ? d.endCustomer : '',
          auditor1: d.sectionType === 'customer' ? d.auditor1 : '',
          site2: d.sectionType === 'internal' ? d.site2 : '',
          area: d.sectionType === 'internal' ? d.area : '',
          auditor2: d.sectionType === 'internal' ? d.auditor2 : '',
          department1: d.sectionType === 'customer' ? d.department1 : '',
          department2: d.sectionType === 'internal' ? d.department2 : '',
        });
      }
    }
    if (newAssignments.length === 0) return;
    const newOrder = {
      id: orderId, code: 'NEW-' + String(S.orders.length + 1).padStart(3, '0'),
      customer: d.customer, product: d.endCustomer || d.area,
      plant: d.sectionType === 'internal' ? d.department2 : d.site1, purpose: d.purpose || (d.sectionType === 'internal' ? d.area : 'data-entry'),
    };
    const newEngineer = { id: engId, name: auditorName, role: 'QA', department: siteToDept(d.sectionType === 'internal' ? d.site2 : d.site1), subDepartments: [] };
    api.createOrder(newOrder).catch(() => {});
    if (!existingEng) api.createEngineer(newEngineer).catch(() => {});
    newAssignments.forEach((a) => api.createAssignment(a).catch(() => {}));
    setState((s) => ({
      orders: s.orders.concat([newOrder]),
      engineers: existingEng ? s.engineers : s.engineers.concat([newEngineer]),
      assignments: s.assignments.concat(newAssignments),
      customerOptions: d.sectionType === 'customer' && d.customer && !s.customerOptions.includes(d.customer)
        ? [...s.customerOptions, d.customer] : s.customerOptions,
      selected: newAssignments[newAssignments.length - 1].id,
      createOpen: false,
    }));
  };

  // ---- edit modal ----
  const openEdit = (aid: string) => {
    const a = S.assignments.find((x) => x.id === aid);
    if (!a) return;
    const o = orderById(a.order);
    const isInternal = !!(a.site2 || a.auditor2 || a.department2);
    // find all sibling assignments (same order + eng) for the full date range
    const siblings = S.assignments.filter((x) => x.eng === a.eng && x.order === a.order);
    const minWeek = Math.min(...siblings.map((x) => x.week));
    const maxWeek = Math.max(...siblings.map((x) => x.week));
    const minDay = Math.min(...siblings.filter((x) => x.week === minWeek).map((x) => x.day));
    const maxDay = Math.max(...siblings.filter((x) => x.week === maxWeek).map((x) => x.day));
    const fromDate = new Date(2026, 5, 29 + minWeek * 7 + minDay);
    const toDate = new Date(2026, 5, 29 + maxWeek * 7 + maxDay);
    setState({
      editOpen: true,
      editDraft: {
        targetId: aid,
        sectionType: isInternal ? 'internal' : 'customer',
        dateFrom: fmtISO(fromDate), dateTo: fmtISO(toDate),
        site1: a.site1 || '',
        customer: a.customer || (o ? o.customer : ''),
        endCustomer: a.endCustomer || '',
        purpose: o ? o.purpose : '',
        auditor1: a.auditor1 || '',
        department1: a.department1 || '',
        site2: a.site2 || '',
        area: a.area || '',
        auditor2: a.auditor2 || '',
        department2: a.department2 || '',
      },
    });
  };
  const closeEdit = () => setState({ editOpen: false });
  const setEditDraft = (patch: Partial<EditDraft>) =>
    setState((s) => ({ editDraft: { ...s.editDraft, ...patch } }));
  const submitEdit = () => {
    const d = S.editDraft;
    if (!d.dateFrom || !d.dateTo) return;
    const target = S.assignments.find((x) => x.id === d.targetId);
    if (!target) return;
    const start = new Date(d.dateFrom + 'T00:00:00');
    const end = new Date(d.dateTo + 'T00:00:00');
    const slots: { weekOffset: number; wd: number }[] = [];
    for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
      const slot = dateSlot(cur);
      if (slot.wd < 5) slots.push(slot);
    }
    if (slots.length === 0) return;
    const fields = {
      site1: d.sectionType === 'customer' ? d.site1 : '',
      customer: d.sectionType === 'customer' ? d.customer : '',
      endCustomer: d.sectionType === 'customer' ? d.endCustomer : '',
      auditor1: d.sectionType === 'customer' ? d.auditor1 : '',
      site2: d.sectionType === 'internal' ? d.site2 : '',
      area: d.sectionType === 'internal' ? d.area : '',
      auditor2: d.sectionType === 'internal' ? d.auditor2 : '',
      department1: d.sectionType === 'customer' ? d.department1 : '',
      department2: d.sectionType === 'internal' ? d.department2 : '',
    };
    // replace every sibling assignment (same order + eng, i.e. the days that make up
    // this appointment's span) with one entry per slot in the new date range, instead
    // of leaving the old day-records in place and piling new ones on top of them.
    const siblings = S.assignments
      .filter((x) => x.eng === target.eng && x.order === target.order)
      .sort((a, b) => (a.week - b.week) || (a.day - b.day));
    const siblingIds = new Set(siblings.map((x) => x.id));
    const others = S.assignments.filter((x) => !siblingIds.has(x.id));
    const reuseIds = [d.targetId, ...siblings.filter((x) => x.id !== d.targetId).map((x) => x.id)];
    const updated: Assignment[] = slots.map((slot, i) => ({
      id: reuseIds[i] || 'a' + ids.current.id++,
      eng: target.eng, order: target.order,
      day: slot.wd, week: slot.weekOffset,
      ...fields,
    }));
    const droppedIds = reuseIds.slice(slots.length);

    updated.forEach((a, i) => {
      if (i < siblings.length) api.updateAssignment(a.id, { day: a.day, week: a.week, ...fields }).catch(() => {});
      else api.createAssignment(a).catch(() => {});
    });
    droppedIds.forEach((id) => api.deleteAssignment(id).catch(() => {}));

    const droppedSet = new Set(droppedIds);
    setState((s) => {
      const comments = droppedSet.size
        ? Object.fromEntries(Object.entries(s.comments).filter(([aid]) => !droppedSet.has(aid)))
        : s.comments;
      const customerOptions = d.sectionType === 'customer' && d.customer && !s.customerOptions.includes(d.customer)
        ? [...s.customerOptions, d.customer] : s.customerOptions;
      return { assignments: others.concat(updated), comments, customerOptions };
    });
    const ord = orderById(target.order);
    if (ord) log('You', `edited ${ord.code}`, '#2756d6');
    setState({ editOpen: false });
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
    const newEng = { id, name: f.name.trim(), role: f.role.trim() || 'QA Engineer', department: f.department, subDepartments: f.subDepartments.slice() };
    api.createEngineer(newEng).catch(() => {});
    setState((s) => ({
      engineers: s.engineers.concat([newEng]),
      engFormOpen: false,
    }));
    log('You', `added ${f.name.trim().split(' ')[0]}`, '#2756d6');
  };
  const removeEngineer = (id: string) => {
    if (!confirm('Remove this auditor and their appointments?')) return;
    api.deleteEngineer(id).catch(() => {});
    setState((s) => {
      const droppedIds = new Set(s.assignments.filter((a) => a.eng === id).map((a) => a.id));
      const comments = Object.fromEntries(Object.entries(s.comments).filter(([aid]) => !droppedIds.has(aid)));
      return { engineers: s.engineers.filter((e) => e.id !== id), assignments: s.assignments.filter((a) => a.eng !== id), comments };
    });
  };

  // ---- appointment option lists (Purpose / Department) ----
  type OptionListField = 'purposeOptions' | 'customerDepartmentOptions' | 'internalDepartmentOptions' | 'siteCodeOptions' | 'customerOptions';
  const addOption = (field: OptionListField, value: string) => {
    const v = value.trim();
    if (!v) return;
    setState((s) => (s[field].includes(v) ? {} : { [field]: [...s[field], v] }));
  };
  const removeOption = (field: OptionListField, value: string) =>
    setState((s) => ({ [field]: s[field].filter((x) => x !== value) }));

  // ---- chip builders ----
  const buildChip = (a: Assignment) => {
    const ord = orderById(a.order);
    const pl = ord ? plantById(ord.plant) : null;
    const dim = chipDimmed(a);
    const sel = S.selected === a.id;
    const color = siteColorOf(a) || (pl ? pl.color : '#999');
    const base: CSSProperties = {
      display: 'block', padding: '7px 9px', borderRadius: '6px', background: '#fff', cursor: 'grab', position: 'relative',
      border: '1px solid #e3e6e0', borderLeft: '3px solid ' + color,
      boxShadow: sel ? '0 0 0 2px ' + hexA(color, 0.55) : '0 1px 1px rgba(20,25,30,.05)',
      opacity: dim ? 0.32 : 1, filter: dim ? 'grayscale(.5)' : 'none', transition: 'box-shadow .12s',
    };
    return {
      aid: a.id, code: (ord ? apptAbbr(a) + ' · ' + ord.customer : '?'), purpose: ord ? ord.purpose : '', style: base,
      onClick: () => select(a.id),
      onDragStart: (e: React.DragEvent) => { e.stopPropagation(); setState({ drag: { kind: 'assign', id: a.id } }); },
      onDragEnd: () => setState({ drag: null, overCell: null }),
    };
  };

  const buildPersonChip = (a: Assignment, accent?: string) => {
    const e = engById(a.eng);
    const ord = orderById(a.order);
    const pl = ord ? plantById(ord.plant) : null;
    const dim = chipDimmed(a);
    const color = accent || siteColorOf(a) || (pl ? pl.color : '#999');
    return {
      aid: a.id, name: e ? e.name : '?', initials: e ? initials(e.name) : '??', code: (ord ? apptAbbr(a) + ' · ' + ord.customer : '?'), purpose: ord ? ord.purpose : '', plantCode: pl ? pl.code : '?',
      style: sx({ display: 'flex', alignItems: 'center', gap: '7px', padding: '5px 7px', background: '#fff', border: '1px solid #e8ebe4', borderLeft: '3px solid ' + color, borderRadius: '6px', cursor: 'pointer', opacity: dim ? 0.32 : 1, filter: dim ? 'grayscale(.5)' : 'none' }),
      avatarStyle: sx({ width: '22px', height: '22px', borderRadius: '6px', background: '#f1f3ee', color: '#5c625c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 600, flexShrink: 0 }),
      onClick: () => select(a.id),
    };
  };

  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // ======================= VIEW MODEL =======================
  const isMobile = (S.vw || 1440) < 860;
  const selDay = S.selectedDay || 0;

  const tabOn = sx({ padding: '6px 13px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: "'Archivo',sans-serif", background: '#15191e', color: '#fff', whiteSpace: 'nowrap' });
  const tabOff = sx({ padding: '6px 13px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: "'Archivo',sans-serif", background: 'transparent', color: '#5c625c', whiteSpace: 'nowrap' });

  const wk = weekAssignments();
  const poolOrders = S.orders.filter((o) => !wk.some((a) => a.order === o.id));
  const baseDate = new Date(2026, 5, 29);
  const days = weekDayLabels.map((lbl, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + S.weekOffset * 7 + i);
    return {
      label: lbl, date: fmtDate(d),
    };
  });
  const weekLabel = days[0].date + ' – ' + days[4].date;
  const weekTag = S.weekOffset === todayWeekOffset ? 'CURRENT WEEK' : S.weekOffset > todayWeekOffset ? '+' + (S.weekOffset - todayWeekOffset) + ' WK AHEAD' : Math.abs(S.weekOffset - todayWeekOffset) + ' WK BACK';
  const gridCols = '220px repeat(5, minmax(168px, 1fr))';

  // ======================= MONTH SCALE =======================
  const isMonth = S.timeScale === 'month';
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const mb = monthBaseDate();
  const mYear = mb.getFullYear();
  const mMon = mb.getMonth();
  const monthName = monthNames[mMon] + ' ' + mYear;
  const firstWd = mb.getDay();
  const daysInMonth = new Date(mYear, mMon + 1, 0).getDate();
  const monthWeekdayHeads = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const blankCellStyle = (): CSSProperties => ({ background: '#f8f9f6', border: '1px solid #e6e9e2', minHeight: isMobile ? '52px' : '112px' });
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
    const appointments = all.filter((a) => {
      const o = orderById(a.order);
      if (!o) return false;
      if (S.filterCompany.length > 0 && !S.filterCompany.includes(o.customer)) return false;
      if (S.filterSite.length > 0 && !S.filterSite.includes(o.plant)) return false;
      if (S.filterEmp.length > 0 && !S.filterEmp.includes(a.eng)) return false;
      if (S.filterAuditTopic.length > 0 && !S.filterAuditTopic.some((t) => o.customer === t || o.plant === t)) return false;
      if (S.filterAuditType.length > 0 && !S.filterAuditType.includes(o.purpose)) return false;
      if (S.filterApptType.length > 0 && !S.filterApptType.includes(apptAbbr(a))) return false;
      return true;
    });
    all.forEach((a) => {
      const o = orderById(a.order);
      if (!o) return;
      if (S.filterCompany.length > 0 && !S.filterCompany.includes(o.customer)) return;
      if (S.filterSite.length > 0 && !S.filterSite.includes(o.plant)) return;
      if (S.filterEmp.length > 0 && !S.filterEmp.includes(a.eng)) return;
      if (S.filterAuditTopic.length > 0 && !S.filterAuditTopic.some((t) => o.customer === t || o.plant === t)) return;
      if (S.filterAuditType.length > 0 && !S.filterAuditType.includes(o.purpose)) return;
      if (S.filterApptType.length > 0 && !S.filterApptType.includes(apptAbbr(a))) return;
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
      const pl = plantById(o.plant);
      const custName = a.customer || o.customer || o.product;
      return {
        code: apptAbbr(a) + ' · ' + custName, purpose: o.purpose, engName: e ? e.name.split(' ')[0] : '',
        countTxt: '',
        dotStyle: sx({ width: '3px', height: '14px', borderRadius: '2px', background: siteColorOf(a) || pl.color, flexShrink: 0 }),
        style: sx({ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: '#23282a', fontWeight: 600, minHeight: '18px', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
      };
    });
    const more = appointments.length - chips.length;
    const isToday = mYear + '-' + mMon + '-' + dn === todayStr;
    monthCells.push({
      blank: false, dateNum: String(dn), countTxt: appointments.length ? String(appointments.length) : '',
      chips, more, moreTxt: more > 0 ? '+' + more + ' more' : '',
      onClick: weekend ? () => {} : () => openDayDialog(slot.weekOffset, slot.wd),
      style: sx({ position: 'relative', background: weekend ? '#f8f9f6' : '#fff', border: '1px solid #e6e9e2', minHeight: isMobile ? '52px' : '112px', padding: isMobile ? '5px' : '6px 8px', cursor: weekend ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', gap: isMobile ? '2px' : '4px', overflow: 'hidden' }),
      numStyle: sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: isMobile ? '11px' : '12px', fontWeight: isToday ? 700 : 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px', borderRadius: '50%', background: isToday ? '#15191e' : 'transparent', color: isToday ? '#fff' : '#9aa097' }),
      countDotStyle: sx({ display: 'none' }),
    });
  }
  while (monthCells.length % 7 !== 0) monthCells.push({ blank: true, style: blankCellStyle() });
  const monthOrders = S.orders
    .filter((o) => {
      if (S.filterCompany.length > 0 && !S.filterCompany.includes(o.customer)) return false;
      if (S.filterSite.length > 0 && !S.filterSite.includes(o.plant)) return false;
      if (S.filterAuditTopic.length > 0 && !S.filterAuditTopic.some((t) => o.customer === t || o.plant === t)) return false;
      if (S.filterAuditType.length > 0 && !S.filterAuditType.includes(o.purpose)) return false;
      return true;
    })
    .map((o) => {
      const pl = plantById(o.plant)!;
      const g = monthOrderAgg[o.id];
      const appointments = g ? g.appointments : 0;
      const days = g ? Object.keys(g.days).length : 0;
      const engs = g ? Object.keys(g.engs).length : 0;
      return {
        orderId: o.id, code: o.code, product: o.product, customer: o.customer, plantCode: pl.code,
        scheduled: appointments > 0, appointments, days, engs,
        appointmentsTxt: appointments + (appointments === 1 ? ' appointment' : ' appointments'), daysTxt: days + (days === 1 ? ' day' : ' days'),
        statusLabel: appointments > 0 ? 'Scheduled' : 'Not scheduled',
        statusStyle: sx({ fontFamily: "'Archivo',sans-serif", fontSize: '10px', fontWeight: 600, color: appointments > 0 ? '#1f8a5b' : '#9a7a3a', background: appointments > 0 ? '#e3f5ea' : '#fff3df', border: '1px solid ' + (appointments > 0 ? '#c4e6d2' : '#f1dcb0'), borderRadius: '20px', padding: '2px 9px' }),
        cardStyle: sx({ background: '#fff', border: '1px solid ' + (appointments > 0 ? '#e4e7e0' : '#eceee8'), borderRadius: '11px', padding: '13px 14px', opacity: appointments > 0 ? 1 : 0.66 }),
      };
    })
    .sort((a, b) => Number(b.scheduled) - Number(a.scheduled) || b.appointments - a.appointments);
  const monthScheduledCount = monthOrders.filter((o) => o.scheduled).length;
  const periodLabel = isMonth ? monthName : weekLabel;
  const periodTag = isMonth
    ? (S.monthOffset || 0) === todayMonthOffset ? 'THIS MONTH' : (S.monthOffset - todayMonthOffset > 0 ? '+' : '') + (S.monthOffset - todayMonthOffset) + ' MO'
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

  const weekCustomers = [...new Set(wk.map((a) => orderById(a.order)).filter(Boolean).map((o) => o!.customer).filter(Boolean))].length;
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
            if (d.kind === 'order') createAssign(d.id, e.id, day);
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
  const customerAuditTopics = ['ESD Audit', 'QS Audit'] as const;
  const customerAuditRows = customerAuditTopics.map((topic) => {
    const cells = [0, 1, 2, 3, 4].map((day) => {
      const chips = wk
        .filter((a) => {
          const o = orderById(a.order);
          return o && o.customer === topic && a.day === day;
        })
        .map((a) => buildPersonChip(a));
      return { chips, empty: chips.length === 0, style: cellShell };
    });
    return { name: topic, loc: '', cells };
  });
  const plantRows = [...S.plants.map((p) => {
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
  }), ...customerAuditRows];

  const siteColorMap: Record<string, string> = { U1: '#2f6df0', U2: '#c2620c', U3: '#0f9d8c' };
  const siteNames = [...new Set(S.engineers.map((e) => e.department))];
  const siteRows = siteNames.map((dn) => {
    const engs = S.engineers.filter((e) => e.department === dn);
    const cells = [0, 1, 2, 3, 4].map((day) => {
      const chips = wk.filter((a) => engs.some((e) => e.id === a.eng) && a.day === day).map((a) => buildPersonChip(a, siteColorMap[dn]));
      return { chips, empty: chips.length === 0, style: cellShell };
    });
    return {
      name: dn, engCount: engs.length, engNames: engs.map((e) => e.name.split(' ')[0]),
      color: siteColorMap[dn] || '#999', cells,
    };
  });

  const mobilePersonRows = personRows.map((r) => ({ engId: r.engId, name: r.name, role: r.role, department: r.department, subDepartments: r.subDepartments, initials: r.initials, avatarStyle: r.avatarStyle, onNameClick: r.onNameClick, cell: r.cells[selDay] }));
  const mobileSiteRows = plantRows.map((r) => ({ name: r.name, loc: r.loc, cell: r.cells[selDay] }));
  const mobileSiteDeptRows = siteRows.map((r) => ({ name: r.name, engCount: r.engCount, color: r.color, cell: r.cells[selDay] }));

  // ---- week calendar (Google Calendar-style all-day events per day column) ----
  const weekFiltered = wk.filter((a) => {
    const o = orderById(a.order);
    if (!o) return false;
    if (S.filterCompany.length > 0 && !S.filterCompany.includes(o.customer)) return false;
    if (S.filterSite.length > 0 && !S.filterSite.includes(o.plant)) return false;
    if (S.filterEmp.length > 0 && !S.filterEmp.includes(a.eng)) return false;
    if (S.filterAuditTopic.length > 0 && !S.filterAuditTopic.some((t) => o.customer === t || o.plant === t)) return false;
    if (S.filterAuditType.length > 0 && !S.filterAuditType.includes(o.purpose)) return false;
    if (S.filterApptType.length > 0 && !S.filterApptType.includes(apptAbbr(a))) return false;
    return true;
  });
  const weekCalendarChips = weekFiltered.map((a) => {
    const ord = orderById(a.order);
    const eng = engById(a.eng);
    const pl = ord ? plantById(ord.plant) : null;
    const sel = S.selected === a.id;
    const color = siteColorOf(a) || (pl ? pl.color : '#999');
    const isInternal = !!(a.site2 || a.auditor2 || a.department2);
    const custName = isInternal ? (a.area || '') : (a.customer || (ord ? ord.customer : ''));
    return { ...a, _customer: apptAbbr(a) + ' · ' + custName, _purpose: ord ? ord.purpose : '', _auditor: a.auditor1 || (eng ? eng.name : ''), _qa: eng ? eng.name : '', _color: color, _sel: sel, _onClick: () => select(a.id), _ord: ord, _eng: eng };
  });
  // group consecutive same-order same-eng assignments into merged spans
  const sorted = [...weekCalendarChips].sort((a, b) => {
    if (a.order !== b.order) return a.order < b.order ? -1 : 1;
    if (a.eng !== b.eng) return a.eng < b.eng ? -1 : 1;
    return a.day - b.day;
  });
  const groups: { ids: string[]; startDay: number; endDay: number; chip: typeof weekCalendarChips[number] }[] = [];
  let current: typeof groups[number] | null = null;
  for (const c of sorted) {
    if (current && c.order === current.chip.order && c.eng === current.chip.eng && c.day === current.endDay + 1) {
      current.ids.push(c.id);
      current.endDay = c.day;
    } else {
      current = { ids: [c.id], startDay: c.day, endDay: c.day, chip: c };
      groups.push(current);
    }
  }
  // assign grid rows greedily to avoid overlap
  const colNextRow = [0, 0, 0, 0, 0];
  const weekMergedSpans = groups.map((g) => {
    const row = Math.max(...Array.from({ length: g.endDay - g.startDay + 1 }, (_, i) => colNextRow[g.startDay + i]));
    for (let d = g.startDay; d <= g.endDay; d++) colNextRow[d] = row + 1;
    const c = g.chip;
    const sel = S.selected === c.id || g.ids.some((id) => S.selected === id);
    return {
      ids: g.ids, startDay: g.startDay, span: g.endDay - g.startDay + 1, gridRow: row,
      id: c.id, site1: c.site1 || '', customer: c._customer, purpose: c._purpose,
      auditor1: c._auditor, color: c._color, selected: sel,
      area: c.area || '', auditor2: c.auditor2 || '',
      onClick: () => select(c.id),
    };
  });
  const weekCalendarDays = [0, 1, 2, 3, 4].map((day) => {
    const mergedIds = new Set(weekMergedSpans.flatMap((s) => s.ids));
    const chips = weekCalendarChips.filter((c) => c.day === day && !mergedIds.has(c.id)).map((c) => ({
      id: c.id, site1: c.site1 || '', customer: c._customer, purpose: c._purpose,
      auditor1: c._auditor, qa: c._qa, color: c._color, onClick: c._onClick, selected: c._sel,
      area: c.area || '', auditor2: c.auditor2 || '',
    }));
    return { day, chips, count: chips.length };
  });

  // ---- timetable (per-employee calendar view, opened by clicking a name) ----
  const timeSlots: { id: string; label: string; hours: string; min: string; max: string }[] = [];
  for (let h = 0; h < 24; h += 2) {
    const from = String(h).padStart(2, '0') + ':00';
    const to = String(h + 2).padStart(2, '0') + ':00';
    timeSlots.push({ id: from, label: from + ' – ' + to, hours: from + ' – ' + to, min: from, max: to });
  }

  const timetableOpenEngId = S.timetableOpenEng;
  const timetableEng = timetableOpenEngId ? engById(timetableOpenEngId) : null;
  const showTimetable = !!timetableOpenEngId && !!timetableEng;
  const timetableRows = timeSlots.map((sl) => {
    const cells = [0, 1, 2, 3, 4].map((day) => {
      const chips = timetableOpenEngId ? wk
        .filter((a) => a.eng === timetableOpenEngId && a.day === day)
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
    const comments = (S.comments[selA.id] || []).map((m) => ({
      who: m.who, initials: m.initials, text: m.text, ago: m.ago,
      avatarStyle: sx({ width: '24px', height: '24px', borderRadius: '7px', background: '#f1f3ee', color: '#5c625c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 600, flexShrink: 0 }),
      onDelete: () => removeComment(selA.id, m.id),
    }));
    return {
      aid: selA.id, orderCode: ord.code, product: ord.product, customer: ord.customer, plantName: pl.name + ' - ' + pl.loc,
      engName: eng.name, engRole: eng.role, engInitials: initials(eng.name), dayName: dayNames[selA.day],
      avatarStyle: sx({ width: '34px', height: '34px', borderRadius: '9px', background: '#f1f3ee', color: '#5c625c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', fontWeight: 600, flexShrink: 0 }),
      department: eng.department, subDepartments: eng.subDepartments,
      comments, commentCount: comments.length, noComments: comments.length === 0, draft: S.draft,
      onDraft: (e: React.ChangeEvent<HTMLInputElement>) => setState({ draft: e.target.value }),
      onKey: (e: React.KeyboardEvent) => { if (e.key === 'Enter') addComment(); },
      addComment: () => addComment(), remove: () => removeAssign(selA.id), duplicate: () => duplicate(selA.id), close: () => setState({ selected: null }),
      onEdit: () => { closeSidebar(); openEdit(selA.id); },
      site1: selA.site1, customerLabel: selA.customer, endCustomer: selA.endCustomer,
      auditor1: selA.auditor1, site2: selA.site2, area: selA.area, auditor2: selA.auditor2,
      department1: selA.department1, department2: selA.department2,
      major: selA.major ?? 0, minor: selA.minor ?? 0, ofi: selA.ofi ?? 0, request: selA.request ?? 0,
      utl1: selA.utl1 ?? 0, utl2: selA.utl2 ?? 0, utl3: selA.utl3 ?? 0,
    };
  }
  const selA = wk.find((a) => a.id === S.selected);
  if (selA) detail = buildDetail(selA);

  // ---- create modal VM ----
  const cd = S.createDraft;
  const canCreate = cd.sectionType === 'customer'
    ? !!(cd.site1 && cd.customer && cd.auditor1 && cd.dateFrom && cd.dateTo)
    : !!(cd.site2 && cd.area && cd.auditor2 && cd.dateFrom && cd.dateTo);
  const create = {
    sectionType: cd.sectionType,
    purpose: cd.purpose, department1: cd.department1, site1: cd.site1, customer: cd.customer, endCustomer: cd.endCustomer, auditor1: cd.auditor1,
    department2: cd.department2, site2: cd.site2, area: cd.area, auditor2: cd.auditor2,
    dateFrom: cd.dateFrom ?? '', dateTo: cd.dateTo ?? '',
    onChange: setDraft,
    warn: false, warnText: '',
    submit: () => submitCreate(),
    submitStyle: sx({ background: canCreate ? '#15191e' : '#c4c9bf', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '12.5px', fontWeight: 600, cursor: canCreate ? 'pointer' : 'default', fontFamily: "'Archivo',sans-serif" }),
  };

  // ---- profile VM ----
  const myWeekAppointments = S.assignments.filter((a) => a.week === todayWeekOffset).length;
  const profile = {
    name: 'Jordan Lee', role: 'QA Planner - Operations', email: 'jordan.lee@nexsil.com', phone: '+1 (480) 555-0173', team: 'Front-end Quality, Reliability', joined: 'Joined March 2023',
    stats: [
      { label: 'APPOINTMENTS PLANNED', value: String(myWeekAppointments), sub: 'this week' },
      { label: 'OPEN ORDERS', value: String(poolOrders.length), sub: 'awaiting staffing' },
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

  // ---- summary data ----
  const mondayNearJune29 = (year: number) => {
    const d = new Date(year, 5, 29);
    const day = d.getDay();
    const monOffset = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + monOffset);
    return d;
  };
  const baseDateSummary = mondayNearJune29(S.summaryYear);
  const monthByWeekDay = (week: number, day: number) => {
    const d = new Date(baseDateSummary);
    d.setDate(baseDateSummary.getDate() + week * 7 + day);
    return d;
  };
  const monthlySums: { major: number; minor: number; ofi: number; total: number; utl1: number; utl2: number; utl3: number; utlTotal: number }[] = Array.from({ length: 12 }, () => ({ major: 0, minor: 0, ofi: 0, total: 0, utl1: 0, utl2: 0, utl3: 0, utlTotal: 0 }));
  for (const a of S.assignments) {
    const d = monthByWeekDay(a.week, a.day);
    if (d.getFullYear() !== S.summaryYear) continue;
    monthlySums[d.getMonth()].major += a.major || 0;
    monthlySums[d.getMonth()].minor += a.minor || 0;
    monthlySums[d.getMonth()].ofi += a.ofi || 0;
    monthlySums[d.getMonth()].total += (a.major || 0) + (a.minor || 0) + (a.ofi || 0) + (a.request || 0);
    monthlySums[d.getMonth()].utl1 += a.utl1 || 0;
    monthlySums[d.getMonth()].utl2 += a.utl2 || 0;
    monthlySums[d.getMonth()].utl3 += a.utl3 || 0;
    monthlySums[d.getMonth()].utlTotal += (a.utl1 || 0) + (a.utl2 || 0) + (a.utl3 || 0);
  }
  const sumMonths = (indices: number[]) => indices.reduce((s, i) => ({ major: s.major + monthlySums[i].major, minor: s.minor + monthlySums[i].minor, ofi: s.ofi + monthlySums[i].ofi, total: s.total + monthlySums[i].total }), { major: 0, minor: 0, ofi: 0, total: 0 });
  const sumUtlMonths = (indices: number[]) => indices.reduce((s, i) => ({ utl1: s.utl1 + monthlySums[i].utl1, utl2: s.utl2 + monthlySums[i].utl2, utl3: s.utl3 + monthlySums[i].utl3, total: s.total + monthlySums[i].utlTotal }), { utl1: 0, utl2: 0, utl3: 0, total: 0 });
  const summaryPeriods: { key: string; label: string; indices: number[] }[] = [
    { key: 'jan', label: 'Jan', indices: [0] },
    { key: 'feb', label: 'Feb', indices: [1] },
    { key: 'mar', label: 'Mar', indices: [2] },
    { key: 'apr', label: 'Apr', indices: [3] },
    { key: 'may', label: 'May', indices: [4] },
    { key: 'jun', label: 'Jun', indices: [5] },
    { key: 'jul', label: 'Jul', indices: [6] },
    { key: 'aug', label: 'Aug', indices: [7] },
    { key: 'sep', label: 'Sep', indices: [8] },
    { key: 'oct', label: 'Oct', indices: [9] },
    { key: 'nov', label: 'Nov', indices: [10] },
    { key: 'dec', label: 'Dec', indices: [11] },
  ];
  const summaryRows = ['Major', 'Minor', 'OFI', 'Total'] as const;
  const summaryCells = summaryPeriods.map((p) => sumMonths(p.indices));
  const utlRows = ['UTL1', 'UTL2', 'UTL3', 'Total'] as const;
  const utlCells = summaryPeriods.map((p) => sumUtlMonths(p.indices));

  // ---- admin VMs ----
  const activeSites = S.plants.filter((p) => S.activePlants[p.id]).length;
  const adminStats = [
    { label: 'QA', value: String(S.engineers.length), sub: S.engineers.length + ' total' },
    { label: 'INTERNAL', value: activeSites + '/' + S.plants.length, sub: 'visible on grid' },
    { label: 'OPEN ORDERS', value: String(poolOrders.length), sub: 'awaiting staffing' },
    { label: 'WEEK APPOINTMENTS', value: String(wk.length), sub: 'this week' },
  ];
  const adminEngineers = S.engineers.map((e) => {
    return {
      id: e.id, name: e.name, role: e.role, department: e.department, subDepartments: e.subDepartments, initials: initials(e.name),
      avatarStyle: sx({ width: '30px', height: '30px', borderRadius: '8px', background: '#f1f3ee', color: '#5c625c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 600, flexShrink: 0 }),
      appointments: wk.filter((a) => a.eng === e.id).length,
      onDelete: () => removeEngineer(e.id),
    };
  });
  // ---- filters VM ----
  const employeeOptions = [{ value: '', label: 'All employees' }].concat(S.engineers.filter((e) => !['unassigned', '111', 'ant', 'bird'].includes(e.name.toLowerCase())).map((e) => ({ value: e.id, label: e.name })));
  const siteOptions = [{ value: '', label: 'All sites' }, ...S.siteCodeOptions.map((s) => ({ value: s, label: s }))];
  // filter dropdowns share the same admin-managed lists as the appointment form
  // (Manage > Options), so adding/removing an option there updates both. When the
  // Type filter narrows to just one type, the Department/Purpose dropdowns narrow
  // to match (Purpose has no internal-audit equivalent, so it empties for IA-only).
  const typeIsCS = S.filterApptType.length === 1 && S.filterApptType[0] === 'CS';
  const typeIsIA = S.filterApptType.length === 1 && S.filterApptType[0] === 'IA';
  const customerTopicOptions = typeIsIA ? [] : S.customerDepartmentOptions;
  const internalTopicOptions = typeIsCS ? [] : S.internalDepartmentOptions;
  const companyNames = [...new Set([
    ...S.orders.map((o) => o.customer).filter((c): c is string => Boolean(c)),
    ...S.assignments.map((a) => a.customer).filter((c): c is string => Boolean(c)),
  ])].sort();
  const auditTypes = typeIsIA ? [] : S.purposeOptions;
  const apptTypeOptions = [{ value: 'CS', label: 'Customer (CS)' }, { value: 'IA', label: 'Internal Audit (IA)' }];
  const hasFilters = !!(S.filterEmp.length || S.filterSite.length || S.filterCompany.length || S.filterAuditType.length || S.filterAuditTopic.length || S.filterApptType.length) || S.plants.some((p) => !S.activePlants[p.id]);

  // ---- day dialog VM ----
  const dayDialogOpen = S.dayDialog !== null;
  const dayDialogDate = dayDialogOpen
    ? (() => {
        const base = new Date(2026, 5, 29 + S.dayDialog!.weekOffset * 7);
        base.setDate(base.getDate() + S.dayDialog!.day);
        return fmtDate(base);
      })()
    : '';
  const dayDialogAssignments = dayDialogOpen
    ? S.assignments.filter((a) => a.week === S.dayDialog!.weekOffset && a.day === S.dayDialog!.day)
    : [];
  const dayDialogChips = dayDialogAssignments.map((a) => {
    const o = orderById(a.order);
    const e = engById(a.eng);
    if (!o || !e) return null;
    const pl = plantById(o.plant);
    return {
      id: a.id, code: apptAbbr(a) + ' · ' + (a.customer || o.customer), purpose: o.purpose, engName: e.name,
      color: siteColorOf(a) || (pl ? pl.color : '#999'),
    };
  }).filter(Boolean) as { id: string; code: string; purpose: string; engName: string; color: string }[];
  const dayDialogInfo = dayDialogOpen
    ? { label: S.dayDialog!.day >= 0 && S.dayDialog!.day < 5 ? dayNames[S.dayDialog!.day] : '', date: dayDialogDate }
    : null;

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
    loading,
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
    isPerson: S.view === 'person', isPlant: S.view === 'plant', isSiteDept: S.view === 'site',
    isMonth, weekScaleStyle: isMonth ? tabOff : tabOn, monthScaleStyle: isMonth ? tabOn : tabOff,
    setWeekScale: () => setScale('week'), setMonthScale: () => setScale('month'),
    monthDesktop: isMonth && !isMobile, monthMobile: isMonth && isMobile,
    monthCells, monthWeekdayHeads, monthName, monthOrders, monthScheduledCount, monthOrderCount: monthOrders.length,
    gridPerson: S.view === 'person' && !isMobile && !isMonth, gridPlant: S.view === 'plant' && !isMobile && !isMonth, gridSiteDept: S.view === 'site' && !isMobile && !isMonth,
    showWeekCalendar: !isMobile && !isMonth,
    mobilePerson: isMobile && S.view === 'person' && !isMonth, mobileSite: isMobile && S.view === 'plant' && !isMonth, mobileSiteDept: isMobile && S.view === 'site' && !isMonth,
    showDayStrip: isMobile && !isMonth,
    weekLabel, weekTag, periodLabel, periodTag, gridCols, days, daySel,
    prevWeek: () => (isMonth ? shiftMonth(-1) : shiftWeek(-1)), nextWeek: () => (isMonth ? shiftMonth(1) : shiftWeek(1)),
    profile,
    engForm, engFormOpen: S.engFormOpen, openEngForm, closeEngForm,
    stats: { assignments: wk.length, weekCustomers, monthCustomers, weekInternals, monthInternals },
    plants: plantsVm,
    personRows, plantRows, siteRows, mobilePersonRows, mobileSiteRows, mobileSiteDeptRows,
    weekCalendarDays, weekMergedSpans,
    showTimetable, timetableRows, timetableGridCols, timetableEngName: timetableEng?.name || '',
    closeTimetable, mobileTimetableRows,
    presence, activity, detail,
    emptyWeek: S.weekOffset !== todayWeekOffset && wk.length === 0 && !isMonth, copyWeek,
    toggleSidebar, closeSidebar, showSidebarBackdrop: isMobile && S.sidebarOpen,
    sidebarStyle, toolbarStyle, detailAsideStyle, modalOverlayStyle, modalCardStyle, modalColsStyle, modalColLeftStyle, modalColRightStyle,
    adminMainStyle, adminWrapStyle, adminStatGridStyle, loginWrapStyle, loginBrandStyle, loginFormWrapStyle,
    filterEmp: S.filterEmp, filterSite: S.filterSite, filterCompany: S.filterCompany, filterAuditType: S.filterAuditType, filterAuditTopic: S.filterAuditTopic, filterApptType: S.filterApptType,
    employeeOptions, siteOptions, customerTopicOptions, internalTopicOptions, companyNames, auditTypes, apptTypeOptions, hasFilters,
    toggleFilterEmp: (v: string) => toggleFilterValue('filterEmp', v),
    toggleFilterSite: (v: string) => toggleFilterValue('filterSite', v),
    toggleFilterCompany: (v: string) => toggleFilterValue('filterCompany', v),
    toggleFilterAuditType: (v: string) => toggleFilterValue('filterAuditType', v),
    toggleFilterAuditTopic: (v: string) => toggleFilterValue('filterAuditTopic', v),
    toggleFilterApptType,
    clearFilters,
    dayDialogOpen, dayDialogDate, dayDialogChips, dayDialogInfo, closeDayDialog,
    openCreate, closeCreate, createOpen: S.createOpen, create, stop: (e: React.MouseEvent) => e.stopPropagation(),
    editOpen: S.editOpen, editDraft: S.editDraft, setEditDraft, closeEdit, submitEdit,
    adminStats,
    tabEngineers: S.adminTab === 'engineers', tabOptions: S.adminTab === 'options',
    setTabEng: () => setAdminTab('engineers'), setTabOptions: () => setAdminTab('options'),
    tabEngStyle: S.adminTab === 'engineers' ? tabOn : tabOff,
    tabOptionsStyle: S.adminTab === 'options' ? tabOn : tabOff,
    adminEngineers, engCount: S.engineers.length,
    addEngineer: openEngForm,
    summaryPeriods, summaryRows, summaryCells, utlRows, utlCells, summaryYear: S.summaryYear,
    setSummaryYear: (y: number) => setState({ summaryYear: y }),
    purposeOptions: S.purposeOptions, customerDepartmentOptions: S.customerDepartmentOptions, internalDepartmentOptions: S.internalDepartmentOptions,
    addPurposeOption: (v: string) => addOption('purposeOptions', v), removePurposeOption: (v: string) => removeOption('purposeOptions', v),
    addCustomerDepartmentOption: (v: string) => addOption('customerDepartmentOptions', v), removeCustomerDepartmentOption: (v: string) => removeOption('customerDepartmentOptions', v),
    addInternalDepartmentOption: (v: string) => addOption('internalDepartmentOptions', v), removeInternalDepartmentOption: (v: string) => removeOption('internalDepartmentOptions', v),
    siteCodeOptions: S.siteCodeOptions, customerOptions: S.customerOptions,
    addSiteCodeOption: (v: string) => addOption('siteCodeOptions', v), removeSiteCodeOption: (v: string) => removeOption('siteCodeOptions', v),
    addCustomerOption: (v: string) => addOption('customerOptions', v), removeCustomerOption: (v: string) => removeOption('customerOptions', v),
  };
}

export type VM = ReturnType<typeof useScheduler>;
