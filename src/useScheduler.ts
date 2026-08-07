import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type {
  Assignment,
  CreateDraft,
  Department,
  EditDraft,
  EngineerForm,
  Order,
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
const formatAuditors = (auditorStr?: string, defaultEngName?: string) => {
  const str = (auditorStr || defaultEngName || '').trim();
  if (!str) return '';
  return str.split(',').map((s) => s.trim()).filter(Boolean).join(', ');
};

export const siteColorsOfAssignment = (a: Assignment, siteColors: Record<string, string>): string[] => {
  const siteStr = a.site1 || a.site2 || '';
  const sites = siteStr.split('/').map((s) => s.trim()).filter(Boolean);
  if (sites.length === 0) return ['#999999'];
  return sites.map((s) => siteColors[s] || '#999999');
};

export const getAccentBackground = (colors: string[]): string => {
  if (!colors || colors.length === 0) return '#999999';
  if (colors.length === 1) return colors[0];
  const stops = colors
    .map((c, i) => {
      const startPct = Math.round((i / colors.length) * 100);
      const endPct = Math.round(((i + 1) / colors.length) * 100);
      return `${c} ${startPct}%, ${c} ${endPct}%`;
    })
    .join(', ');
  return `linear-gradient(180deg, ${stops})`;
};

export const getAccentStyle = (colors: string[], borderPx = 3): CSSProperties => {
  if (!colors || colors.length === 0) return { borderLeft: `${borderPx}px solid #999999` };
  if (colors.length === 1) return { borderLeft: `${borderPx}px solid ${colors[0]}` };
  const stops = colors
    .map((c, i) => {
      const startPct = Math.round((i / colors.length) * 100);
      const endPct = Math.round(((i + 1) / colors.length) * 100);
      return `${c} ${startPct}%, ${c} ${endPct}%`;
    })
    .join(', ');
  return {
    borderLeft: `${borderPx}px solid transparent`,
    borderImage: `linear-gradient(180deg, ${stops}) 1`,
  };
};

interface MonthChip {
  code: string;
  purpose: string;
  engName: string;
  color?: string;
  colors?: string[];
  countTxt: string;
  dotStyle: CSSProperties;
  style: CSSProperties;
  isInternal: boolean;
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

const idNumber = (id: string): number => {
  const m = /(\d+)$/.exec(id || '');
  return m ? parseInt(m[1], 10) : 0;
};

export function useScheduler() {
  const [state, setRaw] = useState<State>(initialState);
  const [loading, setLoading] = useState(true);
  const ids = useRef({ id: 100 });

  const updateMaxId = useCallback((stateObj: State) => {
    const allIds: string[] = [
      ...stateObj.assignments.map((a) => a.id),
      ...stateObj.orders.map((o) => o.id),
      ...stateObj.engineers.map((e) => e.id),
      ...Object.values(stateObj.comments || {}).flat().map((c: any) => c?.id || ''),
    ];
    const maxIdNum = allIds.reduce((max, id) => Math.max(max, idNumber(id)), 0);
    if (maxIdNum >= ids.current.id) {
      ids.current.id = maxIdNum + 1;
    }
  }, []);

  useEffect(() => {
    updateMaxId(state);
  }, []);

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
    const hasLocalSnapshot = typeof window !== 'undefined' && !!localStorage.getItem('calendar_qa_snapshot');

    api.fetchState()
      .then((data) => {
        setRaw((s) => {
          const removedSet = new Set(s.removedOptions || []);
          const customerOptions = (s.customerOptions && s.customerOptions.length ? s.customerOptions : (data.customerOptions || [])).filter((c) => !removedSet.has(c));

          const serverAssignments = data.assignments || [];
          const serverOrders = data.orders || [];
          const serverEngineers = data.engineers || [];
          const serverComments = data.comments || {};

          let mergedAssignments = s.assignments;
          let mergedOrders = s.orders;
          let mergedEngineers = s.engineers;
          let mergedComments = s.comments;

          if (!hasLocalSnapshot) {
            mergedAssignments = serverAssignments.length ? serverAssignments : s.assignments;
            mergedOrders = serverOrders.length ? serverOrders : s.orders;
            mergedEngineers = serverEngineers.length ? serverEngineers : s.engineers;
            mergedComments = Object.keys(serverComments).length ? serverComments : s.comments;
          } else {
            const localAssignIds = new Set(s.assignments.map((x) => x.id));
            const newServerAssigns = serverAssignments.filter((x) => !localAssignIds.has(x.id));
            if (newServerAssigns.length > 0) {
              mergedAssignments = [...s.assignments, ...newServerAssigns];
            }

            const localOrderIds = new Set(s.orders.map((x) => x.id));
            const newServerOrders = serverOrders.filter((x) => !localOrderIds.has(x.id));
            if (newServerOrders.length > 0) {
              mergedOrders = [...s.orders, ...newServerOrders];
            }

            const localEngIds = new Set(s.engineers.map((x) => x.id));
            const newServerEngs = serverEngineers.filter((x) => !localEngIds.has(x.id));
            if (newServerEngs.length > 0) {
              mergedEngineers = [...s.engineers, ...newServerEngs];
            }
          }

          const purposeOptions = (s.purposeOptions && s.purposeOptions.length ? s.purposeOptions : (data.purposeOptions || [])).filter((c) => !removedSet.has(c));
          const customerDepartmentOptions = (s.customerDepartmentOptions && s.customerDepartmentOptions.length ? s.customerDepartmentOptions : (data.customerDepartmentOptions || [])).filter((c) => !removedSet.has(c));
          const internalDepartmentOptions = (s.internalDepartmentOptions && s.internalDepartmentOptions.length ? s.internalDepartmentOptions : (data.internalDepartmentOptions || [])).filter((c) => !removedSet.has(c));
          const siteCodeOptions = (s.siteCodeOptions && s.siteCodeOptions.length ? s.siteCodeOptions : (data.siteCodeOptions || [])).filter((c) => !removedSet.has(c));
          const siteColors = s.siteColors && Object.keys(s.siteColors).length ? s.siteColors : (data.siteColors || {});

          const mergedState = {
            ...s,
            engineers: mergedEngineers,
            plants: data.plants && data.plants.length ? data.plants : s.plants,
            activePlants: { ...s.activePlants, ...(data.activePlants || {}) },
            orders: mergedOrders,
            assignments: mergedAssignments,
            comments: mergedComments,
            activity: s.activity && s.activity.length ? s.activity : (data.activity || []),
            purposeOptions,
            customerDepartmentOptions,
            internalDepartmentOptions,
            siteCodeOptions,
            siteColors,
            customerOptions,
            removedOptions: s.removedOptions || [],
          };

          try {
            localStorage.setItem('calendar_qa_snapshot', JSON.stringify({
              engineers: mergedState.engineers,
              orders: mergedState.orders,
              assignments: mergedState.assignments,
              comments: mergedState.comments,
              activity: mergedState.activity,
              purposeOptions: mergedState.purposeOptions,
              customerDepartmentOptions: mergedState.customerDepartmentOptions,
              internalDepartmentOptions: mergedState.internalDepartmentOptions,
              siteCodeOptions: mergedState.siteCodeOptions,
              siteColors: mergedState.siteColors,
              customerOptions: mergedState.customerOptions,
              removedOptions: mergedState.removedOptions,
              activePlants: mergedState.activePlants,
              plants: mergedState.plants,
            }));
          } catch {}

          const allIds: string[] = [
            ...mergedState.assignments.map((a) => a.id),
            ...mergedState.orders.map((o) => o.id),
            ...mergedState.engineers.map((e) => e.id),
            ...Object.values(mergedState.comments).flat().map((c: any) => c.id),
          ];

          const maxIdNum = allIds.reduce((max, id) => Math.max(max, idNumber(id)), 0);

          if (maxIdNum >= ids.current.id) {
            ids.current.id = maxIdNum + 1;
          }

          return mergedState;
        });
      })
      .catch((err) => {
        console.warn('API load failed, using local data:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Save local state snapshot to localStorage whenever persistent state changes
  useEffect(() => {
    if (loading) return;
    try {
      const snapshot = {
        engineers: state.engineers,
        orders: state.orders,
        assignments: state.assignments,
        comments: state.comments,
        activity: state.activity,
        purposeOptions: state.purposeOptions,
        customerDepartmentOptions: state.customerDepartmentOptions,
        internalDepartmentOptions: state.internalDepartmentOptions,
        siteCodeOptions: state.siteCodeOptions,
        siteColors: state.siteColors,
        customerOptions: state.customerOptions,
        removedOptions: state.removedOptions,
        activePlants: state.activePlants,
        plants: state.plants,
      };
      localStorage.setItem('calendar_qa_snapshot', JSON.stringify(snapshot));
    } catch (e) {
      console.warn('Failed to save state snapshot:', e);
    }
  }, [
    loading,
    state.engineers,
    state.orders,
    state.assignments,
    state.comments,
    state.activity,
    state.purposeOptions,
    state.customerDepartmentOptions,
    state.internalDepartmentOptions,
    state.siteCodeOptions,
    state.siteColors,
    state.customerOptions,
    state.removedOptions,
    state.activePlants,
    state.plants,
  ]);

  const S = state;

  // ---- pure-ish helpers ----
  const hexA = (h: string, a: number) => {
    const n = parseInt(h.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  const engById = (id: string) => S.engineers.find((e) => e.id === id);
  const orderById = (id: string) => S.orders.find((o) => o.id === id);
  const plantById = (id: string) => S.plants.find((p) => p.id === id) || { id: '', name: id || 'Unknown', loc: '', code: (id || '?').slice(0, 3).toUpperCase(), color: S.siteColors[id] || '#999', active: true };
  const initials = (name: string) =>
    name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const siteToDept = (site: string): Department => (site.startsWith('U3') ? 'U3' : site.startsWith('U2') ? 'U2' : 'U1');
  /** "CS" for Customer appointments, "IA" for Internal Audit. */
  const apptAbbr = (a: Assignment) => (a.site2 || a.auditor2 || a.department2 || a.area ? 'IA' : 'CS');
  /** Returns Customer name with CS prefix for Customer Audit or Area/topic with IA prefix for Internal Audit. */
  const apptTitle = (a: Assignment) => {
    const isInternal = !!(a.site2 || a.auditor2 || a.department2 || a.area);
    const prefix = isInternal ? 'IA' : 'CS';
    if (isInternal) return prefix + ' · ' + (a.area || 'Internal Audit');
    const o = orderById(a.order);
    return prefix + ' · ' + (a.customer || (o ? o.customer : '') || 'Customer Audit');
  };
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
  // Single predicate shared by the week calendar, month grid, and the dimming used in the
  // Person/Plant/Site/Timetable chip builders, so every surface honors the sidebar filters
  // identically. Reads the assignment's own site/customer/department where it has one
  // (matching the denormalized model), falling back to the order's for older/incomplete data.
  const matchesFilters = (a: Assignment, o: Order) => {
    if (S.filterEmp.length > 0) {
      const e = engById(a.eng);
      const apptAuditorStr = [a.auditor1 || '', a.auditor2 || '', e ? e.name : '', a.eng || ''].join(',');
      const apptAuditors = apptAuditorStr.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const matchesEmp = S.filterEmp.some((filterVal) => {
        const f = filterVal.toLowerCase();
        const matchingEng = S.engineers.find((eng) => eng.id === filterVal);
        const engName = matchingEng ? matchingEng.name.toLowerCase() : '';
        return apptAuditors.includes(f) || (engName && apptAuditors.includes(engName));
      });
      if (!matchesEmp) return false;
    }

    if (S.filterCompany.length > 0) {
      const apptCustomerStr = a.customer || o.customer || '';
      const apptCustomers = apptCustomerStr.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const matchesCompany = S.filterCompany.some((filterVal) => {
        const f = filterVal.toLowerCase();
        return apptCustomers.includes(f) || apptCustomerStr.toLowerCase() === f;
      });
      if (!matchesCompany) return false;
    }

    if (S.filterSite.length > 0) {
      const apptSiteStr = a.site1 || a.site2 || o.plant || '';
      const apptSites = apptSiteStr.split('/').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const matchesSite = S.filterSite.some((filterVal) => {
        const f = filterVal.toLowerCase();
        return apptSites.includes(f);
      });
      if (!matchesSite) return false;
    }

    if (S.filterAuditTopic.length > 0) {
      const deptStr = a.department1 || a.department2 || '';
      const depts = deptStr.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const matchesTopic = S.filterAuditTopic.some((filterVal) => {
        const f = filterVal.toLowerCase();
        return depts.includes(f) || deptStr.toLowerCase() === f;
      });
      if (!matchesTopic) return false;
    }

    if (S.filterAuditType.length > 0) {
      const purposeStr = a.purpose || o.purpose || '';
      const purposes = purposeStr.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const matchesType = S.filterAuditType.some((filterVal) => {
        const f = filterVal.toLowerCase();
        return purposes.includes(f) || purposeStr.toLowerCase() === f;
      });
      if (!matchesType) return false;
    }

    if (S.filterApptType.length > 0 && !S.filterApptType.includes(apptAbbr(a))) return false;
    return true;
  };
  const chipDimmed = (a: Assignment) => {
    const o = orderById(a.order);
    if (!o) return false;
    if (!S.activePlants[o.plant]) return true;
    return !matchesFilters(a, o);
  };

  /** CS key = distinct (Month, Purpose, Customer, Site); IA key = distinct (Month, Area, Site). */
  const summaryCounts = (assignments: Assignment[]) => {
    const csKeys = new Set<string>();
    const iaKeys = new Set<string>();
    for (const a of assignments) {
      const o = orderById(a.order);
      if (!o) continue;
      const d = new Date(2026, 5, 29 + a.week * 7 + a.day);
      const ym = d.getFullYear() + '-' + d.getMonth();
      if (apptAbbr(a) === 'IA') {
        iaKeys.add(ym + '\u0001' + (a.area || '') + '\u0001' + (a.site2 || o.plant || ''));
      } else {
        csKeys.add(ym + '\u0001' + (a.purpose || o.purpose || '') + '\u0001' + (a.customer || o.customer || '') + '\u0001' + (a.site1 || o.plant || ''));
      }
    }
    return { cs: csKeys.size, ia: iaKeys.size };
  };
  /** Assignments (respecting sidebar filters) whose date falls within [start, end]. */
  const assignmentsInRange = (start: Date, end: Date) => {
    const out: Assignment[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const slot = dateSlot(d);
      if (slot.wd > 4) continue;
      for (const a of S.assignments) {
        if (a.week !== slot.weekOffset || a.day !== slot.wd) continue;
        const o = orderById(a.order);
        if (o && matchesFilters(a, o)) out.push(a);
      }
    }
    return out;
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
  const toggleFilterValue = (field: 'filterEmp' | 'filterSite' | 'filterCompany' | 'filterAuditType' | 'filterAuditTopic' | 'adminFilterSite' | 'adminFilterDept', value: string) =>
    setState((s) => {
      const arr = s[field] as unknown as string[];
      const nextArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      if (field === 'filterAuditTopic') {
        const hasEHS = nextArr.includes('EHS');
        const validSites = hasEHS ? ['U1', 'U2', 'U3'] : s.siteCodeOptions;
        return { filterAuditTopic: nextArr, filterSite: s.filterSite.filter((site) => validSites.includes(site)) };
      }
      return { [field]: nextArr };
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
    const a = S.assignments.find((x) => x.order === orderId && x.eng === engId && x.day === day);
    const name = a ? apptTitle(a) : (ord ? ord.customer || ord.product : 'appointment');
    if (eng) log('You', `staffed ${name} → ${eng.name.split(' ')[0]}, ${dayLabels[day]}`, '#2756d6');
  };
  const moveAssign = (aid: string, engId: string, day: number) => {
    const a = S.assignments.find((x) => x.id === aid);
    api.updateAssignment(aid, { eng: engId, day, week: S.weekOffset }).catch(() => {});
    setState((s) => ({
      assignments: s.assignments.map((x) => (x.id === aid ? { ...x, eng: engId, day, week: s.weekOffset } : x)),
      selected: aid,
    }));
    if (a) {
      const eng = engById(engId);
      if (eng) log('You', `moved ${apptTitle(a)} → ${eng.name.split(' ')[0]}, ${dayLabels[day]}`, '#2756d6');
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
      try {
        localStorage.setItem('calendar_qa_comments', JSON.stringify(comments));
      } catch {}
      return { assignments: s.assignments.filter((x) => !siblingSet.has(x.id)), comments, selected: null };
    });
    log('You', `removed ${apptTitle(a)} appointment`, '#2756d6');
  };
  const duplicate = (aid: string) => {
    const a = S.assignments.find((x) => x.id === aid);
    if (!a) return;
    const nd = a.day < 4 ? a.day + 1 : a.day - 1;
    const id = 'a' + ids.current.id++;
    const clone = { ...a, id, day: nd };
    api.createAssignment(clone).catch(() => {});
    setState((s) => ({ assignments: s.assignments.concat([clone]), selected: id }));
    log('You', `duplicated ${apptTitle(a)} → ${dayLabels[nd]}`, '#2756d6');
  };
  const addComment = () => {
    const aid = S.selected;
    const t = S.draft.trim();
    if (!aid || !t) return;
    const comment = { id: 'c' + ids.current.id++, who: 'You', initials: 'YO', text: t, ago: 'just now', color: '#2756d6' };
    api.createComment(aid, comment).catch(() => {});
    setState((s) => {
      const list = (s.comments[aid] || []).concat([comment]);
      const nextComments = { ...s.comments, [aid]: list };
      try {
        localStorage.setItem('calendar_qa_comments', JSON.stringify(nextComments));
      } catch {}
      return { comments: nextComments, draft: '' };
    });
    const a = S.assignments.find((x) => x.id === aid);
    if (a) {
      log('You', `noted on ${apptTitle(a)}`, '#2756d6');
    }
  };
  const removeComment = (aid: string, commentId: string) => {
    api.deleteComment(commentId).catch(() => {});
    setState((s) => {
      const nextComments = {
        ...s.comments,
        [aid]: (s.comments[aid] || []).filter((c) => c.id !== commentId),
      };
      try {
        localStorage.setItem('calendar_qa_comments', JSON.stringify(nextComments));
      } catch {}
      return { comments: nextComments };
    });
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
  const openCreateWithDate = (dateIso?: string) => {
    const d = dateIso || '';
    setState({
      createOpen: true,
      userMenuOpen: false,
      dayDialog: null,
      createDraft: {
        order: '', eng: '', day: 0,
        dateFrom: d, dateTo: d,
        sectionType: 'customer', purpose: '', department1: '', site1: '', customer: '', endCustomer: '', auditor1: '', department2: '', site2: '', area: '', auditor2: ''
      },
    });
  };
  const closeCreate = () => setState({ createOpen: false });
  const setDraft = (patch: Partial<CreateDraft>) =>
    setState((s) => ({ createDraft: { ...s.createDraft, ...patch } }));
  const submitCreate = () => {
    const d = S.createDraft;
    const todayISO = fmtISO(new Date());
    const dateFrom = d.dateFrom || todayISO;
    const dateTo = d.dateTo || dateFrom;

    // Multi-auditor: parse comma-separated; use primary name for engineer record
    const auditorRaw = (d.sectionType === 'customer' ? d.auditor1 : d.auditor2) || '';
    const auditorPrimary = auditorRaw.split(',')[0].trim() || 'Unassigned';
    const existingEng = S.engineers.find((e) => e.name.toLowerCase() === auditorPrimary.toLowerCase());
    const engId = existingEng ? existingEng.id : 'e' + ids.current.id++;
    const newAssignments: Assignment[] = [];
    const orderId = 'o' + ids.current.id++;
    const start = new Date(dateFrom + 'T00:00:00');
    const end = new Date(dateTo + 'T00:00:00');
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
          purpose: d.sectionType === 'customer' ? d.purpose : '',
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
      customer: d.customer || '', product: d.endCustomer || d.area || '',
      plant: d.sectionType === 'internal' ? (d.department2 || d.site2 || '') : (d.site1 || ''), purpose: d.purpose || '',
    };
    const newEngineer = { id: engId, name: auditorPrimary, role: 'QA', department: siteToDept(d.sectionType === 'internal' ? d.site2 : d.site1), subDepartments: [] };
    api.createOrder(newOrder).catch(() => {});
    if (!existingEng) api.createEngineer(newEngineer).catch(() => {});
    const newCustomer = d.sectionType === 'customer' && d.customer ? d.customer.trim() : '';
    const newPurpose = d.purpose ? d.purpose.trim() : '';
    const existingMasterSet = new Set(
      (S.auditorOptions || [])
        .concat(S.engineers.map((e) => e.name))
        .map((n) => n.trim().toLowerCase())
    );
    // Only single unique custom names that do NOT yet exist in the database trigger creation of a new entry
    const newAuditorNames = auditorRaw
      .split(',')
      .map((n) => n.trim())
      .filter((n) => Boolean(n) && n !== 'Unassigned' && !existingMasterSet.has(n.toLowerCase()));

    if (newCustomer) {
      api.saveOption('customer_name', newCustomer).catch(() => {});
    }
    if (newPurpose) {
      api.saveOption('purpose', newPurpose).catch(() => {});
    }
    newAuditorNames.forEach((n) => { api.saveOption('auditor', n).catch(() => {}); });
    newAssignments.forEach((a) => api.createAssignment(a).catch(() => {}));
    setState((s) => ({
      orders: s.orders.concat([newOrder]),
      engineers: existingEng ? s.engineers : s.engineers.concat([newEngineer]),
      assignments: s.assignments.concat(newAssignments),
      customerOptions: newCustomer && !s.customerOptions.includes(newCustomer) ? [...s.customerOptions, newCustomer] : s.customerOptions,
      purposeOptions: newPurpose && !s.purposeOptions.includes(newPurpose) ? [...s.purposeOptions, newPurpose] : s.purposeOptions,
      auditorOptions: (() => {
        let opts = s.auditorOptions || [];
        for (const n of newAuditorNames) {
          if (!opts.includes(n)) opts = [...opts, n];
        }
        return opts;
      })(),
      selected: newAssignments[newAssignments.length - 1].id,
      createOpen: false,
    }));
    const prefix = d.sectionType === 'internal' ? 'IA' : 'CS';
    const name = d.sectionType === 'internal' ? (d.area || 'Internal Audit') : (d.customer || 'Customer Audit');
    log('You', `created ${prefix} · ${name}`, '#2756d6');
  };

  // ---- edit modal ----
  const openEdit = (aid: string) => {
    const a = S.assignments.find((x) => x.id === aid);
    if (!a) return;
    const isInternal = !!(a.site2 || a.auditor2 || a.department2 || a.area);
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
        dateFrom: fmtISO(fromDate),
        dateTo: fmtISO(toDate),
        site1: a.site1 || '',
        customer: a.customer || '',
        endCustomer: a.endCustomer || '',
        purpose: a.purpose || '',
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
    const target = S.assignments.find((x) => x.id === d.targetId);
    if (!target) return;
    const dateFrom = d.dateFrom || fmtISO(new Date());
    const dateTo = d.dateTo || dateFrom;
    const start = new Date(dateFrom + 'T00:00:00');
    const end = new Date(dateTo + 'T00:00:00');
    const slots: { weekOffset: number; wd: number }[] = [];
    for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
      const slot = dateSlot(cur);
      if (slot.wd < 5) slots.push(slot);
    }
    if (slots.length === 0) return;
    const oldAuditorName = (target.auditor1 || target.auditor2 || S.engineers.find((e) => e.id === target.eng)?.name || '').trim();
    const newAuditorRaw = ((d.sectionType === 'customer' ? d.auditor1 : d.auditor2) || '').trim();
    // Primary auditor = first name in comma-separated list; used for engineer record
    const newAuditorPrimary = newAuditorRaw.split(',')[0].trim();
    const newAuditorName = newAuditorRaw; // full raw string (stored in assignment as-is)
    let finalEngId = target.eng;
    let updatedEngineers = S.engineers;

    if (newAuditorPrimary) {
      const existingMatchingEng = S.engineers.find((e) => e.name.toLowerCase() === newAuditorPrimary.toLowerCase());
      if (existingMatchingEng) {
        finalEngId = existingMatchingEng.id;
      } else {
        const currentEng = S.engineers.find((e) => e.id === target.eng);
        const otherApptsUsingCurrentEng = S.assignments.filter(
          (a) => a.id !== d.targetId && (a.eng === target.eng || a.auditor1 === currentEng?.name || a.auditor2 === currentEng?.name)
        );

        if (currentEng && currentEng.name !== newAuditorPrimary && otherApptsUsingCurrentEng.length === 0) {
          const updatedEng = { ...currentEng, name: newAuditorPrimary };
          api.updateEngineer(target.eng, updatedEng).catch(() => {});
          updatedEngineers = S.engineers.map((e) => (e.id === target.eng ? updatedEng : e));
        } else {
          const newEngId = 'e' + ids.current.id++;
          const newEng = {
            id: newEngId,
            name: newAuditorPrimary,
            role: 'QA',
            department: siteToDept(d.sectionType === 'internal' ? d.site2 : d.site1),
            subDepartments: [],
          };
          api.createEngineer(newEng).catch(() => {});
          finalEngId = newEngId;
          updatedEngineers = S.engineers.concat([newEng]);
        }
      }
    }

    const fields = {
      site1: d.sectionType === 'customer' ? d.site1 : '',
      customer: d.sectionType === 'customer' ? d.customer : '',
      endCustomer: d.sectionType === 'customer' ? d.endCustomer : '',
      auditor1: d.sectionType === 'customer' ? d.auditor1 : '',
      purpose: d.sectionType === 'customer' ? d.purpose : '',
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
      eng: finalEngId, order: target.order,
      day: slot.wd, week: slot.weekOffset,
      ...fields,
    }));
    const droppedIds = reuseIds.slice(slots.length);

    updated.forEach((a, i) => {
      if (i < siblings.length) api.updateAssignment(a.id, { eng: a.eng, day: a.day, week: a.week, ...fields }).catch(() => {});
      else api.createAssignment(a).catch(() => {});
    });
    droppedIds.forEach((id) => api.deleteAssignment(id).catch(() => {}));

    const oldCustomer = target.customer || '';
    const newCustomer = d.sectionType === 'customer' && d.customer ? d.customer.trim() : '';
    const oldPurpose = target.purpose || '';
    const newPurpose = d.purpose ? d.purpose.trim() : '';

    if (newCustomer) {
      api.saveOption('customer_name', newCustomer).catch(() => {});
    }
    if (newPurpose) {
      api.saveOption('purpose', newPurpose).catch(() => {});
    }

    const droppedSet = new Set(droppedIds);
    setState((s) => {
      const comments = droppedSet.size
        ? Object.fromEntries(Object.entries(s.comments).filter(([aid]) => !droppedSet.has(aid)))
        : s.comments;

      const nextAssignments = others.concat(updated);

      let nextCustomerOptions = s.customerOptions;
      if (newCustomer && !nextCustomerOptions.includes(newCustomer)) {
        nextCustomerOptions = [...nextCustomerOptions, newCustomer];
      }
      if (oldCustomer && oldCustomer !== newCustomer) {
        const isOldCustomerStillUsed = nextAssignments.some((a) => a.customer === oldCustomer);
        if (!isOldCustomerStillUsed) {
          nextCustomerOptions = nextCustomerOptions.filter((c) => c !== oldCustomer);
          api.deleteOption('customer_name', oldCustomer).catch(() => {});
        }
      }

      let nextPurposeOptions = s.purposeOptions;
      if (newPurpose && !nextPurposeOptions.includes(newPurpose)) {
        nextPurposeOptions = [...nextPurposeOptions, newPurpose];
      }
      if (oldPurpose && oldPurpose !== newPurpose) {
        const isOldPurposeStillUsed = nextAssignments.some((a) => a.purpose === oldPurpose);
        if (!isOldPurposeStillUsed) {
          nextPurposeOptions = nextPurposeOptions.filter((p) => p !== oldPurpose);
          api.deleteOption('purpose', oldPurpose).catch(() => {});
        }
      }

      const existingMasterSet = new Set(
        (s.auditorOptions || [])
          .concat(updatedEngineers.map((e) => e.name))
          .map((n) => n.trim().toLowerCase())
      );
      let nextAuditorOptions = s.auditorOptions || [];
      // Only single unique custom names that do NOT yet exist in the database trigger creation of a new entry
      const newAuditorIndividuals = newAuditorRaw
        .split(',')
        .map((n) => n.trim())
        .filter((n) => Boolean(n) && n !== 'Unassigned' && !existingMasterSet.has(n.toLowerCase()));
      for (const n of newAuditorIndividuals) {
        if (!nextAuditorOptions.some((opt) => opt.toLowerCase() === n.toLowerCase())) {
          nextAuditorOptions = [...nextAuditorOptions, n];
          api.saveOption('auditor', n).catch(() => {});
        }
      }
      if (oldAuditorName && oldAuditorName !== newAuditorName) {
        const isOldAuditorStillUsedInAssignments = nextAssignments.some(
          (a) => a.auditor1 === oldAuditorName || a.auditor2 === oldAuditorName
        );
        const isOldAuditorStillUsedInEngineers = updatedEngineers.some(
          (e) => e.name === oldAuditorName && nextAssignments.some((a) => a.eng === e.id)
        );

        if (!isOldAuditorStillUsedInAssignments && !isOldAuditorStillUsedInEngineers) {
          nextAuditorOptions = nextAuditorOptions.filter((a) => a !== oldAuditorName);
          api.deleteOption('auditor', oldAuditorName).catch(() => {});

          const oldEng = updatedEngineers.find((e) => e.name === oldAuditorName);
          if (oldEng && oldEng.id !== finalEngId) {
            const hasOtherAppts = nextAssignments.some((a) => a.eng === oldEng.id);
            if (!hasOtherAppts) {
              updatedEngineers = updatedEngineers.filter((e) => e.id !== oldEng.id);
              api.deleteEngineer(oldEng.id).catch(() => {});
            }
          }
        }
      }

      return {
        assignments: nextAssignments,
        comments,
        engineers: updatedEngineers,
        customerOptions: nextCustomerOptions,
        purposeOptions: nextPurposeOptions,
        auditorOptions: nextAuditorOptions,
      };
    });
    const prefix = d.sectionType === 'internal' ? 'IA' : 'CS';
    const name = d.sectionType === 'internal' ? (d.area || 'Internal Audit') : (d.customer || 'Customer Audit');
    log('You', `edited ${prefix} · ${name}`, '#2756d6');
    setState({ editOpen: false });
  };

  // ---- admin ----
  const toggleUserMenu = () => setState((s) => ({ userMenuOpen: !s.userMenuOpen }));
  const setAdminTab = (t: State['adminTab']) => setState({ adminTab: t });
  // ---- create-engineer modal ----
  const openEngForm = () =>
    setState({ engFormOpen: true, engEditingId: null, userMenuOpen: false, sidebarOpen: false, engForm: { name: '', role: '', department: (S.siteCodeOptions[0] || 'U1') as Department, subDepartments: [] } });
  const openEditEngForm = (id: string) => {
    const e = S.engineers.find((eng) => eng.id === id);
    if (!e) return;
    setState({
      engFormOpen: true,
      engEditingId: id,
      userMenuOpen: false,
      sidebarOpen: false,
      engForm: { name: e.name, role: e.role || '', department: (e.department || 'U1') as Department, subDepartments: [...e.subDepartments] },
    });
  };
  const closeEngForm = () => setState({ engFormOpen: false, engEditingId: null });
  const setEngForm = (patch: Partial<EngineerForm>) => setState((s) => ({ engForm: { ...s.engForm, ...patch } }));
  const toggleEngSubDept = (c: SubDepartment) =>
    setState((s) => {
      const has = s.engForm.subDepartments.includes(c);
      return { engForm: { ...s.engForm, subDepartments: has ? s.engForm.subDepartments.filter((x) => x !== c) : s.engForm.subDepartments.concat([c]) } };
    });
  const submitEngForm = () => {
    const f = S.engForm;
    const newName = f.name.trim();
    if (!newName) return;
    if (S.engEditingId) {
      const id = S.engEditingId;
      const existing = S.engineers.find((e) => e.id === id);
      const oldName = existing?.name || '';
      const updatedEng = { id, name: newName, role: existing?.role || 'QA Engineer', department: f.department, subDepartments: f.subDepartments.slice() };
      api.updateEngineer(id, updatedEng).catch(() => {});

      if (oldName && oldName !== newName) {
        api.saveOption('auditor', newName).catch(() => {});
        api.deleteOption('auditor', oldName).catch(() => {});
      }

      setState((s) => {
        const nextAssignments = oldName && oldName !== newName
          ? s.assignments.map((a) => {
              if (a.eng === id || a.auditor1 === oldName || a.auditor2 === oldName) {
                const patch = {
                  auditor1: a.auditor1 === oldName ? newName : a.auditor1,
                  auditor2: a.auditor2 === oldName ? newName : a.auditor2,
                };
                api.updateAssignment(a.id, patch).catch(() => {});
                return { ...a, ...patch };
              }
              return a;
            })
          : s.assignments;

        let nextAuditorOptions = s.auditorOptions || [];
        if (!nextAuditorOptions.includes(newName)) {
          nextAuditorOptions = [...nextAuditorOptions, newName];
        }
        if (oldName && oldName !== newName) {
          nextAuditorOptions = nextAuditorOptions.filter((a) => a !== oldName);
        }

        return {
          engineers: s.engineers.map((e) => (e.id === id ? { ...e, ...updatedEng } : e)),
          assignments: nextAssignments,
          auditorOptions: nextAuditorOptions,
          engFormOpen: false,
          engEditingId: null,
        };
      });
      log('You', `updated auditor ${newName.split(' ')[0]}`, '#2756d6');
    } else {
      const id = 'e' + ids.current.id++;
      const newEng = { id, name: newName, role: 'QA Engineer', department: f.department, subDepartments: f.subDepartments.slice() };
      api.createEngineer(newEng).catch(() => {});
      api.saveOption('auditor', newName).catch(() => {});
      setState((s) => ({
        engineers: s.engineers.concat([newEng]),
        auditorOptions: !(s.auditorOptions || []).includes(newName) ? [...(s.auditorOptions || []), newName] : (s.auditorOptions || []),
        engFormOpen: false,
        engEditingId: null,
      }));
      log('You', `added ${newName.split(' ')[0]}`, '#2756d6');
    }
  };
  const removeEngineer = (id: string) => {
    const eng = S.engineers.find((e) => e.id === id);
    if (!eng) return;
    const linkedAppts = S.assignments.filter((a) => a.eng === id || a.auditor1 === eng.name || a.auditor2 === eng.name);
    if (linkedAppts.length > 0) {
      alert(`Cannot remove auditor "${eng.name}" because they are currently assigned to ${linkedAppts.length} active appointment(s). Please reassign or update those appointments first.`);
      return;
    }
    api.deleteEngineer(id).catch(() => {});
    setState((s) => ({ engineers: s.engineers.filter((e) => e.id !== id) }));
  };

  // ---- appointment option lists (Purpose / Department / Site) ----
  type OptionListField = 'purposeOptions' | 'customerDepartmentOptions' | 'internalDepartmentOptions' | 'siteCodeOptions' | 'customerOptions' | 'auditorOptions';
  const fieldToCategory: Record<OptionListField, string> = {
    purposeOptions: 'purpose',
    customerDepartmentOptions: 'customer_department',
    internalDepartmentOptions: 'internal_department',
    siteCodeOptions: 'site_code',
    customerOptions: 'customer_name',
    auditorOptions: 'auditor',
  };

  const addOption = (field: OptionListField, value: string, meta = '') => {
    const v = value.trim();
    if (!v) return;
    const category = fieldToCategory[field];
    if (category) api.saveOption(category, v, meta).catch(() => {});
    setState((s) => (s[field].includes(v) ? {} : { [field]: [...s[field], v] }));
  };

  const removeOption = (field: OptionListField, value: string, force = false) => {
    const v = value.trim();
    if (!v) return;

    if (!force) {
      let linkedCount = 0;
      if (field === 'customerOptions') {
        linkedCount = S.assignments.filter((a) => a.customer === v).length;
      } else if (field === 'purposeOptions') {
        linkedCount = S.assignments.filter((a) => a.purpose === v).length;
      } else if (field === 'auditorOptions') {
        linkedCount = S.assignments.filter((a) => a.auditor1 === v || a.auditor2 === v || (engById(a.eng)?.name === v)).length;
      } else if (field === 'customerDepartmentOptions') {
        linkedCount = S.assignments.filter((a) => a.department1 === v).length;
      } else if (field === 'internalDepartmentOptions') {
        linkedCount = S.assignments.filter((a) => a.department2 === v).length;
      } else if (field === 'siteCodeOptions') {
        linkedCount = S.assignments.filter((a) => (a.site1 && a.site1.split('/').includes(v)) || (a.site2 && a.site2.split('/').includes(v))).length;
      }

      if (linkedCount > 0) {
        alert(`Cannot remove option "${v}" because it is currently linked to ${linkedCount} active appointment(s). Please update or delete those appointments first.`);
        return;
      }
    }

    const category = fieldToCategory[field];
    if (category) api.deleteOption(category, v).catch(() => {});
    setState((s) => {
      const fieldList = (s[field] || []).filter((x) => x !== v);
      const removedOptions = (s.removedOptions || []).includes(v) ? (s.removedOptions || []) : [...(s.removedOptions || []), v];
      return {
        [field]: fieldList,
        removedOptions,
      };
    });
  };

  const removeGenericOption = (value: string) => {
    const v = value.trim();
    if (!v) return;
    api.deleteOption('customer_name', v).catch(() => {});
    api.deleteOption('purpose', v).catch(() => {});
    api.deleteOption('auditor', v).catch(() => {});
    setState((s) => {
      const removedOptions = (s.removedOptions || []).includes(v) ? (s.removedOptions || []) : [...(s.removedOptions || []), v];
      return {
        customerOptions: (s.customerOptions || []).filter((x) => x !== v),
        purposeOptions: (s.purposeOptions || []).filter((x) => x !== v),
        auditorOptions: (s.auditorOptions || []).filter((x) => x !== v),
        customerDepartmentOptions: (s.customerDepartmentOptions || []).filter((x) => x !== v),
        internalDepartmentOptions: (s.internalDepartmentOptions || []).filter((x) => x !== v),
        siteCodeOptions: (s.siteCodeOptions || []).filter((x) => x !== v),
        removedOptions,
      };
    });
  };

  const setSiteColor = (site: string, color: string) => {
    api.saveOption('site_code', site, color).catch(() => {});
    setState((s) => ({ siteColors: { ...s.siteColors, [site]: color } }));
  };

  const removeSiteCodeOption = (v: string) => {
    removeOption('siteCodeOptions', v);
    setState((s) => {
      const siteColors = { ...s.siteColors };
      delete siteColors[v];
      return { siteColors };
    });
  };

  // ---- chip builders ----
  const buildChip = (a: Assignment) => {
    const dim = chipDimmed(a);
    const sel = S.selected === a.id;
    const colors = siteColorsOfAssignment(a, S.siteColors);
    const accentStyle = getAccentStyle(colors, 3);
    const base: CSSProperties = {
      display: 'block', padding: '7px 9px', borderRadius: '6px', background: '#fff', cursor: 'grab', position: 'relative',
      border: '1px solid #e3e6e0', ...accentStyle,
      boxShadow: sel ? '0 0 0 2px ' + hexA(colors[0] || '#999', 0.55) : '0 1px 1px rgba(20,25,30,.05)',
      opacity: dim ? 0.32 : 1, filter: dim ? 'grayscale(.5)' : 'none', transition: 'box-shadow .12s',
    };
    const isInternal = !!(a.site2 || a.auditor2 || a.department2 || a.area);
    const auditorName = formatAuditors(isInternal ? a.auditor2 : a.auditor1);
    const mainName = isInternal ? (a.area || '') : (a.customer || '');
    const site = (isInternal ? a.site2 : a.site1) || '';
    const nameWithSite = site ? (mainName ? `${mainName} - ${site}` : site) : mainName;
    const chipPurpose = a.purpose ? (auditorName ? `${a.purpose} - ${auditorName}` : a.purpose) : auditorName;
    return {
      aid: a.id, code: apptAbbr(a) + (nameWithSite ? ' · ' + nameWithSite : ''), purpose: chipPurpose, style: base,
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
    const colors = accent ? [accent] : siteColorsOfAssignment(a, S.siteColors);
    const accentStyle = getAccentStyle(colors, 3);
    const isInternal = !!(a.site2 || a.auditor2 || a.department2 || a.area);
    const auditorName = formatAuditors(isInternal ? a.auditor2 : a.auditor1);
    const mainName = isInternal ? (a.area || '') : (a.customer || '');
    const site = (isInternal ? a.site2 : a.site1) || '';
    const nameWithSite = site ? (mainName ? `${mainName} - ${site}` : site) : mainName;
    const chipPurpose = a.purpose ? (auditorName ? `${a.purpose} - ${auditorName}` : a.purpose) : auditorName;
    return {
      aid: a.id, name: e ? e.name : '?', initials: e ? initials(e.name) : '??', code: apptAbbr(a) + (nameWithSite ? ' · ' + nameWithSite : ''), purpose: chipPurpose, plantCode: pl ? pl.code : '?',
      style: sx({ display: 'flex', alignItems: 'center', gap: '7px', padding: '5px 7px', background: '#fff', border: '1px solid #e8ebe4', ...accentStyle, borderRadius: '6px', cursor: 'pointer', opacity: dim ? 0.32 : 1, filter: dim ? 'grayscale(.5)' : 'none' }),
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

  // ======================= MONTH & YEAR SCALE =======================
  const isMonth = S.timeScale === 'month';
  const isYear = S.timeScale === 'year';
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const mb = monthBaseDate();
  const mYear = mb.getFullYear();
  const mMon = mb.getMonth();
  const monthName = monthNames[mMon] + ' ' + mYear;
  const firstWd = mb.getDay();
  const daysInMonth = new Date(mYear, mMon + 1, 0).getDate();
  const monthWeekdayHeads = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const blankCellStyle = (): CSSProperties => ({ background: '#f8f9f6', borderRight: '1px solid #e6e9e2', borderTop: '1px solid #e6e9e2', minHeight: isMobile ? '52px' : '112px' });
  const monthCells: MonthCell[] = [];
  for (let i = 0; i < firstWd; i++) monthCells.push({ blank: true, style: blankCellStyle() });
  const monthOrderAgg: Record<string, { appointments: number; days: Record<number, 1>; engs: Record<string, 1> }> = {};
  for (let dn = 1; dn <= daysInMonth; dn++) {
    const date = new Date(mYear, mMon, dn);
    const slot = dateSlot(date);
    const weekend = slot.wd > 4;
    const all = weekend ? [] : S.assignments.filter((a) => a.week === slot.weekOffset && a.day === slot.wd);
    const appointments = all.filter((a) => {
      const o = orderById(a.order);
      return !!o && matchesFilters(a, o);
    });
    all.forEach((a) => {
      const o = orderById(a.order);
      if (!o || !matchesFilters(a, o)) return;
      const g = monthOrderAgg[o.id] || (monthOrderAgg[o.id] = { appointments: 0, days: {}, engs: {} });
      g.appointments++;
      g.days[dn] = 1;
      g.engs[a.eng] = 1;
    });
    const chips: MonthChip[] = appointments.slice(0, 3).map((a) => {
      const o = orderById(a.order)!;
      const pl = plantById(o.plant);
      const isInternal = !!(a.site2 || a.auditor2 || a.department2 || a.area);
      const mainName = isInternal ? (a.area || '') : (a.customer || '');
      const site = (isInternal ? a.site2 : a.site1) || '';
      const nameWithSite = site ? (mainName ? `${mainName} - ${site}` : site) : mainName;
      const auditorName = formatAuditors(isInternal ? a.auditor2 : a.auditor1);
      const chipPurpose = a.purpose ? (auditorName ? `${a.purpose} - ${auditorName}` : a.purpose) : auditorName;
      const colors = siteColorsOfAssignment(a, S.siteColors);
      const color = colors[0] || (pl ? pl.color : '#999');
      return {
        code: apptAbbr(a) + (nameWithSite ? ' · ' + nameWithSite : ''), purpose: chipPurpose, engName: auditorName, color, colors,
        isInternal,
        countTxt: '',
        dotStyle: sx({ width: '3px', height: '14px', borderRadius: '2px', background: color, flexShrink: 0 }),
        style: sx({ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: '#23282a', fontWeight: 600, minHeight: '18px', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
      };
    });
    const more = appointments.length - chips.length;
    const isToday = mYear + '-' + mMon + '-' + dn === todayStr;
    const isSelected = !weekend && !!S.dayDialog && S.dayDialog.weekOffset === slot.weekOffset && S.dayDialog.day === slot.wd;
    monthCells.push({
      blank: false, dateNum: String(dn), countTxt: appointments.length ? String(appointments.length) : '',
      chips, more, moreTxt: more > 0 ? '+' + more + ' more' : '',
      onClick: weekend ? () => {} : () => openDayDialog(slot.weekOffset, slot.wd),
      style: sx({ position: 'relative', background: isSelected ? '#D1E3FF' : weekend ? '#f8f9f6' : '#fff', borderRight: '1px solid #e6e9e2', borderTop: '1px solid #e6e9e2', minHeight: isMobile ? '52px' : '112px', padding: isMobile ? '5px' : '6px 8px', cursor: weekend ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', gap: isMobile ? '2px' : '4px', overflow: 'hidden' }),
      numStyle: sx({ fontFamily: "'IBM Plex Mono',monospace", fontSize: isMobile ? '11px' : '12px', fontWeight: isToday ? 700 : 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px', borderRadius: '50%', background: isToday ? '#15191e' : 'transparent', color: isToday ? '#fff' : '#9aa097' }),
      countDotStyle: sx({ display: 'none' }),
    });
  }
  while (monthCells.length % 7 !== 0) monthCells.push({ blank: true, style: blankCellStyle() });
  const monthOrders = S.orders
    .filter((o) => {
      if (S.filterCompany.length > 0 && !S.filterCompany.includes(o.customer)) return false;
      if (S.filterSite.length > 0 && !S.filterSite.includes(o.plant)) return false;
      if (S.filterAuditTopic.length > 0 && !S.assignments.some((a) => a.order === o.id && S.filterAuditTopic.includes(a.department1 || a.department2 || ''))) return false;
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

  // Jump to specific Month View from Year View
  const jumpToMonth = (targetYear: number, monthIndex: number) => {
    const targetMonthOffset = (targetYear - 2026) * 12 + (monthIndex - 5);
    setState({
      monthOffset: targetMonthOffset,
      timeScale: 'month',
      selected: null,
      sidebarOpen: false,
    });
  };

  // Compute 12-month data for Year View
  const yearMonths = useMemo(() => {
    const monthsData = [];
    const year = mYear;

    for (let m = 0; m < 12; m++) {
      const firstDay = new Date(year, m, 1);
      const daysCount = new Date(year, m + 1, 0).getDate();
      const firstWd = (firstDay.getDay() + 6) % 7; // Mon = 0, Sun = 6

      const csKeys = new Set<string>();
      const iaKeys = new Set<string>();
      const days = [];

      for (let i = 0; i < firstWd; i++) {
        days.push({ blank: true });
      }

      for (let dn = 1; dn <= daysCount; dn++) {
        const date = new Date(year, m, dn);
        const slot = dateSlot(date);
        const weekend = slot.wd > 4;

        const matchingAppts = weekend ? [] : S.assignments.filter((a) => {
          if (a.week !== slot.weekOffset || a.day !== slot.wd) return false;
          const o = orderById(a.order);
          return !!o && matchesFilters(a, o);
        });

        let custCountOnDay = 0;
        let intCountOnDay = 0;

        for (const a of matchingAppts) {
          const o = orderById(a.order)!;
          if (apptAbbr(a) === 'IA') {
            iaKeys.add((a.area || '') + '\u0001' + (a.site2 || o.plant || ''));
            intCountOnDay++;
          } else {
            csKeys.add((a.purpose || o.purpose || '') + '\u0001' + (a.customer || o.customer || '') + '\u0001' + (a.site1 || o.plant || ''));
            custCountOnDay++;
          }
        }

        const isToday = year + '-' + m + '-' + dn === todayStr;

        days.push({
          blank: false,
          dayNum: dn,
          dateISO: fmtISO(date),
          isToday,
          isWeekend: weekend,
          hasAppts: matchingAppts.length > 0,
          customerApptsCount: custCountOnDay,
          internalApptsCount: intCountOnDay,
          totalApptsCount: matchingAppts.length,
          colors: matchingAppts.flatMap((a) => siteColorsOfAssignment(a, S.siteColors)).slice(0, 3),
        });
      }

      const customerAppts = csKeys.size;
      const internalAppts = iaKeys.size;
      const totalAppts = customerAppts + internalAppts;

      monthsData.push({
        monthIndex: m,
        monthName: monthNames[m],
        year,
        totalAppts,
        customerAppts,
        internalAppts,
        days,
      });
    }

    return monthsData;
  }, [mYear, S.assignments, S.siteColors, S.filterEmp, S.filterSite, S.filterCompany, S.filterAuditType, S.filterAuditTopic, S.filterApptType]);

  const periodLabel = isYear ? `Year ${mYear}` : isMonth ? monthName : weekLabel;
  const periodTag = isYear
    ? (mYear === today.getFullYear() ? 'THIS YEAR' : (mYear - today.getFullYear() > 0 ? '+' : '') + (mYear - today.getFullYear()) + ' YR')
    : isMonth
    ? ((S.monthOffset || 0) === todayMonthOffset ? 'THIS MONTH' : (S.monthOffset - todayMonthOffset > 0 ? '+' : '') + (S.monthOffset - todayMonthOffset) + ' MO')
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

  const weekSummary = summaryCounts(wk.filter((a) => {
    const o = orderById(a.order);
    return o ? matchesFilters(a, o) : false;
  }));
  const monthSummary = summaryCounts(assignmentsInRange(new Date(mYear, mMon, 1), new Date(mYear, mMon + 1, 0)));
  const yearSummary = summaryCounts(assignmentsInRange(new Date(mYear, 0, 1), new Date(mYear, 11, 31)));
  const weekCustomers = weekSummary.cs;
  const weekInternals = weekSummary.ia;
  const monthCustomers = monthSummary.cs;
  const monthInternals = monthSummary.ia;
  const yearCustomers = yearSummary.cs;
  const yearInternals = yearSummary.ia;

  const isSearch = S.timeScale === 'search';
  const setSearchQuery = (q: string) => setState({ searchQuery: q });
  const setSearchScale = () => setState({ timeScale: 'search', selected: null, sidebarOpen: false, dayDialog: null });

  // ---- shared appointment chip fields (used by Day popup and Search results) ----
  const apptChipFields = (a: Assignment) => {
    const o = orderById(a.order)!;
    const e = engById(a.eng);
    const pl = plantById(o.plant);
    const isInternal = !!(a.site2 || a.auditor2 || a.department2 || a.area);
    const mainName = isInternal ? (a.area || 'Internal Audit') : (a.customer || o.customer || 'Customer Audit');
    const site = (isInternal ? a.site2 : a.site1) || '';
    const nameWithSite = site ? `${mainName} - ${site}` : mainName;
    const auditorName = formatAuditors(isInternal ? a.auditor2 : a.auditor1, e?.name);
    const chipPurpose = a.purpose ? (auditorName ? `${a.purpose} - ${auditorName}` : a.purpose) : auditorName;
    const colors = siteColorsOfAssignment(a, S.siteColors);
    const color = colors[0] || (pl ? pl.color : '#999');
    const notesList = (S.comments[a.id] || []).map((m) => ({
      id: m.id,
      who: m.who,
      initials: m.initials,
      text: m.text,
      ago: m.ago,
      color: m.color,
      avatarStyle: sx({ width: '22px', height: '22px', borderRadius: '50%', background: m.color || '#2756d6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9.5px', fontWeight: 600, flexShrink: 0 }),
      onDelete: () => removeComment(a.id, m.id),
    }));
    const onAddNote = (text: string) => {
      if (!text.trim()) return;
      const comment = { id: 'c' + ids.current.id++, who: 'You', initials: 'YO', text: text.trim(), ago: 'just now', color: '#2756d6' };
      api.createComment(a.id, comment).catch(() => {});
      setState((s) => {
        const list = (s.comments[a.id] || []).concat([comment]);
        const nextComments = { ...s.comments, [a.id]: list };
        try {
          localStorage.setItem('calendar_qa_comments', JSON.stringify(nextComments));
        } catch {}
        return { comments: nextComments };
      });
    };
    return {
      id: a.id,
      code: apptAbbr(a) + (nameWithSite ? ' · ' + nameWithSite : ''),
      purpose: chipPurpose,
      engName: auditorName,
      color, colors, isInternal,
      site,
      customer: a.customer || '',
      endCustomer: a.endCustomer || '',
      area: a.area || '',
      auditor: (isInternal ? a.auditor2 : a.auditor1) || '',
      auditor1: a.auditor1 || '',
      auditor2: a.auditor2 || '',
      department: (isInternal ? a.department2 : a.department1) || '',
      department1: a.department1 || '',
      department2: a.department2 || '',
      apptPurpose: a.purpose || '',
      major: a.major,
      minor: a.minor,
      ofi: a.ofi,
      request: a.request,
      utl1: a.utl1,
      utl2: a.utl2,
      utl3: a.utl3,
      notes: notesList,
      onAddNote,
    };
  };

  // ---- search results (chronological, grouped by date) ----
  const searchResults = useMemo(() => {
    const q = (S.searchQuery || '').toLowerCase().trim();
    type SearchGroup = {
      dateLabel: string;
      dateISO: string;
      items: (ReturnType<typeof apptChipFields> & { weekOffset: number; day: number; onView: () => void; onEdit: () => void; onDelete: () => void })[];
    };
    const groups: SearchGroup[] = [];
    const grouped: Record<string, SearchGroup> = {};

    const allFiltered = S.assignments.filter((a) => {
      const o = orderById(a.order);
      if (!o) return false;
      if (!matchesFilters(a, o)) return false;
      if (!q) return true;
      const e = engById(a.eng);
      const isInternal = !!(a.site2 || a.auditor2 || a.department2 || a.area);
      const haystack = [
        isInternal ? 'IA' : 'CS',
        a.customer || o.customer || '',
        a.endCustomer || '',
        a.area || '',
        a.purpose || o.purpose || '',
        a.site1 || a.site2 || o.plant || '',
        a.auditor1 || '', a.auditor2 || '',
        e ? e.name : '',
        a.department1 || '', a.department2 || '',
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });

    // Sort by date (oldest first)
    const sorted = [...allFiltered].sort((a, b) => {
      const da = a.week * 5 + a.day;
      const db = b.week * 5 + b.day;
      return da - db;
    });

    for (const a of sorted) {
      const base = new Date(2026, 5, 29 + a.week * 7);
      base.setDate(base.getDate() + a.day);
      const iso = fmtISO(base);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const label = `${base.getDate()} ${months[base.getMonth()]} ${base.getFullYear()}`;

      if (!grouped[iso]) {
        grouped[iso] = { dateLabel: label, dateISO: iso, items: [] };
        groups.push(grouped[iso]);
      }
      grouped[iso].items.push({
        ...apptChipFields(a),
        weekOffset: a.week, day: a.day,
        onView: () => select(a.id),
        onEdit: () => openEdit(a.id),
        onDelete: () => removeAssign(a.id),
      });
    }
    return groups;
  }, [S.assignments, S.searchQuery, S.comments, S.filterEmp, S.filterSite, S.filterCompany, S.filterAuditType, S.filterAuditTopic, S.filterApptType, S.siteColors]);



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
      const chips = wk.filter((a) => {
        if (a.eng !== e.id || a.day !== day) return false;
        const o = orderById(a.order);
        return !!o && matchesFilters(a, o);
      }).map((a) => buildChip(a));
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
          return !!o && o.customer === topic && a.day === day && matchesFilters(a, o);
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
          return !!o && o.plant === p.id && a.day === day && matchesFilters(a, o);
        })
        .map((a) => buildPersonChip(a, p.color));
      return { chips, empty: chips.length === 0, style: cellShell };
    });
    return { name: p.name, loc: p.loc, cells };
  }), ...customerAuditRows];

  const siteNames = [...new Set(S.engineers.map((e) => e.department))];
  const siteRows = siteNames.map((dn) => {
    const engs = S.engineers.filter((e) => e.department === dn);
    const cells = [0, 1, 2, 3, 4].map((day) => {
      const chips = wk.filter((a) => {
        if (!engs.some((e) => e.id === a.eng) || a.day !== day) return false;
        const o = orderById(a.order);
        return !!o && matchesFilters(a, o);
      }).map((a) => buildPersonChip(a, S.siteColors[dn]));
      return { chips, empty: chips.length === 0, style: cellShell };
    });
    return {
      name: dn, engCount: engs.length, engNames: engs.map((e) => e.name.split(' ')[0]),
      color: S.siteColors[dn] || '#999', cells,
    };
  });

  const mobilePersonRows = personRows.map((r) => ({ engId: r.engId, name: r.name, role: r.role, department: r.department, subDepartments: r.subDepartments, initials: r.initials, avatarStyle: r.avatarStyle, onNameClick: r.onNameClick, cell: r.cells[selDay] }));
  const mobileSiteRows = plantRows.map((r) => ({ name: r.name, loc: r.loc, cell: r.cells[selDay] }));
  const mobileSiteDeptRows = siteRows.map((r) => ({ name: r.name, engCount: r.engCount, color: r.color, cell: r.cells[selDay] }));

  // ---- week calendar (Google Calendar-style all-day events per day column) ----
  const weekFiltered = wk.filter((a) => {
    const o = orderById(a.order);
    return !!o && matchesFilters(a, o);
  });
  const weekCalendarChips = weekFiltered.map((a) => {
    const ord = orderById(a.order);
    const eng = engById(a.eng);
    const pl = ord ? plantById(ord.plant) : null;
    const sel = S.selected === a.id;
    const colors = siteColorsOfAssignment(a, S.siteColors);
    const color = colors[0] || (pl ? pl.color : '#999');
    const isInternal = !!(a.site2 || a.auditor2 || a.department2 || a.area);
    const mainName = isInternal ? (a.area || '') : (a.customer || (ord ? ord.customer : ''));
    const site = (isInternal ? a.site2 : a.site1) || '';
    const nameWithSite = site ? `${mainName} - ${site}` : mainName;
    const auditorName = formatAuditors(isInternal ? a.auditor2 : a.auditor1, eng?.name);
    const chipPurpose = a.purpose ? (auditorName ? `${a.purpose} - ${auditorName}` : a.purpose) : auditorName;
    return { ...a, _customer: apptAbbr(a) + ' · ' + (nameWithSite || 'Audit'), _purpose: chipPurpose, _auditor: auditorName, _qa: eng ? eng.name : '', _color: color, _colors: colors, _sel: sel, _onClick: () => openDayDialog(a.week, a.day), _ord: ord, _eng: eng, _isInternal: isInternal };
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
      auditor1: c._auditor, color: c._color, colors: c._colors, selected: sel,
      area: c.area || '', auditor2: c.auditor2 || '', isInternal: c._isInternal,
      onClick: () => openDayDialog(c.week, c.day),
    };
  });
  const weekCalendarDays = [0, 1, 2, 3, 4].map((day) => {
    const mergedIds = new Set(weekMergedSpans.flatMap((s) => s.ids));
    const chips = weekCalendarChips.filter((c) => c.day === day && !mergedIds.has(c.id)).map((c) => ({
      id: c.id, site1: c.site1 || '', customer: c._customer, purpose: c._purpose,
      auditor1: c._auditor, qa: c._qa, color: c._color, colors: c._colors, onClick: c._onClick, selected: c._sel,
      area: c.area || '', auditor2: c.auditor2 || '', isInternal: c._isInternal,
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
        .filter((a) => {
          if (a.eng !== timetableOpenEngId || a.day !== day) return false;
          const o = orderById(a.order);
          return !!o && matchesFilters(a, o);
        })
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
    who: a.who, text: a.text.replace(/NEW-\d+/g, 'appointment'), ago: a.ago,
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
    const isInternal = !!(selA.site2 || selA.auditor2 || selA.department2 || selA.area);
    const siblings = S.assignments.filter((x) => x.eng === selA.eng && x.order === selA.order);
    const minWeek = Math.min(...siblings.map((x) => x.week));
    const maxWeek = Math.max(...siblings.map((x) => x.week));
    const minDay = Math.min(...siblings.filter((x) => x.week === minWeek).map((x) => x.day));
    const maxDay = Math.max(...siblings.filter((x) => x.week === maxWeek).map((x) => x.day));
    const fromDate = new Date(2026, 5, 29 + minWeek * 7 + minDay);
    const toDate = new Date(2026, 5, 29 + maxWeek * 7 + maxDay);
    const dateFromStr = fmtDate(fromDate);
    const dateToStr = fmtDate(toDate);
    const durationDays = siblings.length;
    const dateRangeLabel = dateFromStr === dateToStr
      ? `${dateFromStr} (${durationDays} ${durationDays === 1 ? 'day' : 'days'})`
      : `${dateFromStr} - ${dateToStr} (${durationDays} ${durationDays === 1 ? 'day' : 'days'})`;

    return {
      aid: selA.id, isInternal, orderCode: ord?.code || '', product: selA.endCustomer || selA.area || '', customer: selA.customer || '', plantName: pl ? pl.name + ' - ' + pl.loc : '',
      engName: eng ? eng.name : '', engRole: eng ? eng.role : '', engInitials: eng ? initials(eng.name) : '', dayName: dayNames[selA.day],
      avatarStyle: sx({ width: '34px', height: '34px', borderRadius: '9px', background: '#f1f3ee', color: '#5c625c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', fontWeight: 600, flexShrink: 0 }),
      department: eng ? eng.department : '', subDepartments: eng ? eng.subDepartments : [],
      comments, commentCount: comments.length, noComments: comments.length === 0, draft: S.draft,
      onDraft: (e: React.ChangeEvent<HTMLInputElement>) => setState({ draft: e.target.value }),
      onKey: (e: React.KeyboardEvent) => { if (e.key === 'Enter') addComment(); },
      addComment: () => addComment(), remove: () => removeAssign(selA.id), duplicate: () => duplicate(selA.id), close: () => setState({ selected: null }),
      onEdit: () => { closeSidebar(); openEdit(selA.id); },
      site1: selA.site1 || '', endCustomer: selA.endCustomer || '',
      auditor1: selA.auditor1 || '', site2: selA.site2 || '', area: selA.area || '', auditor2: selA.auditor2 || '',
      department1: selA.department1 || '', department2: selA.department2 || '',
      purpose: selA.purpose || '',
      dateRangeLabel, durationDays,
      major: selA.major ?? 0, minor: selA.minor ?? 0, ofi: selA.ofi ?? 0, request: selA.request ?? 0,
      utl1: selA.utl1 ?? 0, utl2: selA.utl2 ?? 0, utl3: selA.utl3 ?? 0,
    };
  }
  const selA = S.assignments.find((a) => a.id === S.selected);
  if (selA) detail = buildDetail(selA);

  // ---- create modal VM ----
  const cd = S.createDraft;
  const create = {
    sectionType: cd.sectionType,
    purpose: cd.purpose, department1: cd.department1, site1: cd.site1, customer: cd.customer, endCustomer: cd.endCustomer, auditor1: cd.auditor1,
    department2: cd.department2, site2: cd.site2, area: cd.area, auditor2: cd.auditor2,
    dateFrom: cd.dateFrom ?? '', dateTo: cd.dateTo ?? '',
    onChange: setDraft,
    warn: false, warnText: '',
    submit: () => submitCreate(),
    submitStyle: sx({ background: '#15191e', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Archivo',sans-serif" }),
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
  const engForm = {
    name: ef.name, role: ef.role, department: ef.department, subDepartments: ef.subDepartments, inStyle: ofInStyle,
    onName: (e: React.ChangeEvent<HTMLInputElement>) => setEngForm({ name: e.target.value }),
    onRole: (e: React.ChangeEvent<HTMLInputElement>) => setEngForm({ role: e.target.value }),
    departments: S.siteCodeOptions.map((d) => ({ label: d, onClick: () => setEngForm({ department: d as Department }), style: segMd(ef.department === d) })),
    subDepartmentOptions: [
      ...S.internalDepartmentOptions.map((c) => ({ code: c, name: c, group: 'Internal Audit' as const, onClick: () => toggleEngSubDept(c as SubDepartment), ...certPick(ef.subDepartments.includes(c as SubDepartment)) })),
      ...S.customerDepartmentOptions.map((c) => ({ code: c, name: c, group: 'Customer' as const, onClick: () => toggleEngSubDept(c as SubDepartment), ...certPick(ef.subDepartments.includes(c as SubDepartment)) })),
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
  const adminDeptOptions = [...new Set([...S.internalDepartmentOptions, ...S.customerDepartmentOptions])];
  const toggleAdminFilterSite = (v: string) => toggleFilterValue('adminFilterSite', v);
  const toggleAdminFilterDept = (v: string) => toggleFilterValue('adminFilterDept', v);
  const adminEngineers = S.engineers
    .filter((e) => {
      if (S.adminFilterSite.length > 0 && !S.adminFilterSite.includes(e.department)) return false;
      if (S.adminFilterDept.length > 0 && !e.subDepartments.some((d) => S.adminFilterDept.includes(d))) return false;
      return true;
    })
    .map((e) => {
      return {
        id: e.id, name: e.name, role: e.role, department: e.department, subDepartments: e.subDepartments, initials: initials(e.name),
        avatarStyle: sx({ width: '30px', height: '30px', borderRadius: '8px', background: '#f1f3ee', color: '#5c625c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 600, flexShrink: 0 }),
        appointments: wk.filter((a) => a.eng === e.id).length,
        onDelete: () => removeEngineer(e.id),
      };
    });
  // ---- filters VM ----
  const removedSet = useMemo(() => new Set(S.removedOptions || []), [S.removedOptions]);

  const computedCustomerOptions = useMemo(() => {
    const active = S.assignments.map((a) => a.customer).filter((c): c is string => Boolean(c) && !removedSet.has(c as string));
    return Array.from(new Set([...(S.customerOptions || []), ...active]))
      .filter((c) => !removedSet.has(c))
      .sort();
  }, [S.assignments, S.customerOptions, removedSet]);

  const computedPurposeOptions = useMemo(() => {
    const active = S.assignments.map((a) => a.purpose).filter((p): p is string => Boolean(p) && !removedSet.has(p as string));
    return Array.from(new Set([...(S.purposeOptions || []), ...active]))
      .filter((p) => !removedSet.has(p))
      .sort();
  }, [S.assignments, S.purposeOptions, removedSet]);

  const computedAuditorOptions = useMemo(() => {
    const fromEng = S.engineers.map((e) => e.name).filter((s): s is string => Boolean(s) && !removedSet.has(s as string));
    const fromAssign1 = S.assignments.flatMap((a) => (a.auditor1 || '').split(',').map((s) => s.trim())).filter((s): s is string => Boolean(s) && !removedSet.has(s as string));
    const fromAssign2 = S.assignments.flatMap((a) => (a.auditor2 || '').split(',').map((s) => s.trim())).filter((s): s is string => Boolean(s) && !removedSet.has(s as string));
    return Array.from(new Set([...(S.auditorOptions || []), ...fromEng, ...fromAssign1, ...fromAssign2]))
      .filter((s) => !removedSet.has(s))
      .sort();
  }, [S.engineers, S.assignments, S.auditorOptions, removedSet]);

  // ---- search autocomplete suggestions (filter-driven & appointment card data connected) ----
  const searchSuggestions = useMemo(() => {
    const activeAssignments = S.assignments.filter((a) => {
      const o = orderById(a.order);
      return !!o && matchesFilters(a, o);
    });

    const suggestionsMap = new Map<string, { label: string; category: string }>();

    const addSuggestion = (text: string, category: string) => {
      const clean = text.trim();
      if (!clean) return;
      const key = clean.toLowerCase();
      if (!suggestionsMap.has(key)) {
        suggestionsMap.set(key, { label: clean, category });
      }
    };

    // 1. Classification Types
    addSuggestion('CS', 'Type');
    addSuggestion('IA', 'Type');

    // 2. Filter Criteria options
    computedAuditorOptions.forEach((name) => addSuggestion(name, 'Auditor'));
    computedCustomerOptions.forEach((c) => addSuggestion(c, 'Customer'));
    computedPurposeOptions.forEach((p) => addSuggestion(p, 'Purpose'));
    S.siteCodeOptions.forEach((s) => addSuggestion(s, 'Site'));
    S.customerDepartmentOptions.forEach((d) => addSuggestion(d, 'Department'));
    S.internalDepartmentOptions.forEach((d) => addSuggestion(d, 'Department'));

    // 3. Appointment Card attributes
    for (const a of activeAssignments) {
      const o = orderById(a.order)!;
      const e = engById(a.eng);

      if (a.customer) addSuggestion(a.customer, 'Customer');
      if (o.customer) addSuggestion(o.customer, 'Customer');
      if (a.endCustomer) addSuggestion(a.endCustomer, 'End Customer');

      if (a.site1) a.site1.split('/').forEach((s) => addSuggestion(s, 'Site'));
      if (a.site2) a.site2.split('/').forEach((s) => addSuggestion(s, 'Site'));
      if (o.plant) addSuggestion(o.plant, 'Plant');

      if (a.area) addSuggestion(a.area, 'Area');
      if (a.purpose) addSuggestion(a.purpose, 'Purpose');
      if (o.purpose) addSuggestion(o.purpose, 'Purpose');

      if (a.department1) addSuggestion(a.department1, 'Department');
      if (a.department2) addSuggestion(a.department2, 'Department');

      if (e && e.name) addSuggestion(e.name, 'Auditor');
      if (a.auditor1) a.auditor1.split(',').forEach((s) => addSuggestion(s, 'Auditor'));
      if (a.auditor2) a.auditor2.split(',').forEach((s) => addSuggestion(s, 'Auditor'));
    }

    return Array.from(suggestionsMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [
    S.assignments, S.engineers, S.orders, S.siteCodeOptions, S.customerDepartmentOptions, S.internalDepartmentOptions,
    computedAuditorOptions, computedCustomerOptions, computedPurposeOptions,
    S.filterEmp, S.filterSite, S.filterCompany, S.filterAuditType, S.filterAuditTopic, S.filterApptType
  ]);

  const employeeOptions = useMemo(() => {
    const filterOptions = S.engineers
      .filter((e) => !['unassigned', '111', 'ant', 'bird'].includes(e.name.toLowerCase()))
      .map((e) => ({ value: e.id, label: e.name }));
    const engNames = new Set(S.engineers.map((e) => e.name));
    const extraAuditors = computedAuditorOptions
      .filter((name) => !engNames.has(name))
      .map((name) => ({ value: name, label: name }));
    return [{ value: '', label: 'All employees' }, ...filterOptions, ...extraAuditors];
  }, [S.engineers, computedAuditorOptions]);

  const availableSiteCodes = S.filterAuditTopic.includes('EHS')
    ? S.siteCodeOptions.filter((s) => ['U1', 'U2', 'U3'].includes(s))
    : S.siteCodeOptions;
  const siteOptions = [{ value: '', label: 'All sites' }, ...availableSiteCodes.map((s) => ({ value: s, label: s }))];
  const siteColorList = S.siteCodeOptions.map((s) => ({ site: s, color: S.siteColors[s] || '#999' }));
  // filter dropdowns share the same admin-managed lists as the appointment form
  // (Manage > Options), so adding/removing an option there updates both. When the
  // Type filter narrows to just one type, the Department/Purpose dropdowns narrow
  // to match (Purpose has no internal-audit equivalent, so it empties for IA-only).
  const typeIsCS = S.filterApptType.length === 1 && S.filterApptType[0] === 'CS';
  const typeIsIA = S.filterApptType.length === 1 && S.filterApptType[0] === 'IA';
  const customerTopicOptions = typeIsIA ? [] : S.customerDepartmentOptions;
  const internalTopicOptions = typeIsCS ? [] : S.internalDepartmentOptions;

  const companyNames = computedCustomerOptions;
  const auditTypes = typeIsIA ? [] : computedPurposeOptions;
  const apptTypeOptions = [{ value: 'CS', label: 'Customer (CS)' }, { value: 'IA', label: 'Internal Audit (IA)' }];
  const hasFilters = !!(S.filterEmp.length || S.filterSite.length || S.filterCompany.length || S.filterAuditType.length || S.filterAuditTopic.length || S.filterApptType.length) || S.plants.some((p) => !S.activePlants[p.id]);

  // ---- day dialog VM ----
  const dayDialogOpen = S.dayDialog !== null;
  const dayDialogDateISO = dayDialogOpen
    ? (() => {
        const base = new Date(2026, 5, 29 + S.dayDialog!.weekOffset * 7);
        base.setDate(base.getDate() + S.dayDialog!.day);
        return fmtISO(base);
      })()
    : '';
  const dayDialogDate = dayDialogOpen
    ? (() => {
        const base = new Date(2026, 5, 29 + S.dayDialog!.weekOffset * 7);
        base.setDate(base.getDate() + S.dayDialog!.day);
        return fmtDate(base);
      })()
    : '';
  const dayDialogAssignments = dayDialogOpen
    ? S.assignments.filter((a) => {
        if (a.week !== S.dayDialog!.weekOffset || a.day !== S.dayDialog!.day) return false;
        const o = orderById(a.order);
        return !!o && matchesFilters(a, o);
      })
    : [];
  const dayDialogChips = dayDialogAssignments.map((a) => {
    const e = engById(a.eng);
    if (!e) return null;
    return {
      ...apptChipFields(a),
      onView: () => select(a.id),
      onEdit: () => { closeDayDialog(); openEdit(a.id); },
      onDelete: () => removeAssign(a.id),
      onClick: () => select(a.id),
    };
  }).filter(Boolean) as (ReturnType<typeof apptChipFields> & {
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onClick: () => void;
  })[];
  const dayDialogInfo = dayDialogOpen
    ? { label: S.dayDialog!.day >= 0 && S.dayDialog!.day < 5 ? dayNames[S.dayDialog!.day] : '', date: dayDialogDate }
    : null;

  // ---- responsive styles ----
  const sidebarStyle: CSSProperties = isMobile
    ? { position: 'fixed', top: 0, left: 0, bottom: 0, width: '86%', maxWidth: '320px', zIndex: 80, background: '#fbfcfa', borderRight: '1px solid #d8dcd4', display: 'flex', flexDirection: 'column', boxShadow: '0 0 44px rgba(20,25,30,.28)', transform: S.sidebarOpen ? 'translateX(0)' : 'translateX(-104%)', transition: 'transform .22s ease', overflowY: 'auto' }
    : { width: '280px', flexShrink: 0, background: '#fbfcfa', borderRight: '1px solid #d8dcd4', display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' };
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
    isMonth, isYear,
    timeScale: S.timeScale,
    weekScaleStyle: S.timeScale === 'week' ? tabOn : tabOff,
    monthScaleStyle: S.timeScale === 'month' ? tabOn : tabOff,
    yearScaleStyle: S.timeScale === 'year' ? tabOn : tabOff,
    setWeekScale: () => setScale('week'),
    setMonthScale: () => setScale('month'),
    setYearScale: () => setScale('year'),
    jumpToMonth,
    yearMonths,
    yearYear: mYear,
    monthDesktop: isMonth && !isMobile, monthMobile: isMonth && isMobile,
    monthCells, monthWeekdayHeads, monthName, monthOrders, monthScheduledCount, monthOrderCount: monthOrders.length,
    isSearch, searchQuery: S.searchQuery, setSearchQuery, setSearchScale, searchResults, searchSuggestions,
    searchScaleStyle: S.timeScale === 'search' ? tabOn : tabOff,
    gridPerson: S.view === 'person' && !isMobile && S.timeScale === 'week',
    gridPlant: S.view === 'plant' && !isMobile && S.timeScale === 'week',
    gridSiteDept: S.view === 'site' && !isMobile && S.timeScale === 'week',
    showWeekCalendar: !isMobile && S.timeScale === 'week',
    mobilePerson: isMobile && S.view === 'person' && S.timeScale === 'week',
    mobileSite: isMobile && S.view === 'plant' && S.timeScale === 'week',
    mobileSiteDept: isMobile && S.view === 'site' && S.timeScale === 'week',
    showDayStrip: isMobile && S.timeScale === 'week',
    weekLabel, weekTag, periodLabel, periodTag, gridCols, days, daySel,
    prevWeek: () => (S.timeScale === 'year' ? shiftMonth(-12) : S.timeScale === 'month' ? shiftMonth(-1) : shiftWeek(-1)),
    nextWeek: () => (S.timeScale === 'year' ? shiftMonth(12) : S.timeScale === 'month' ? shiftMonth(1) : shiftWeek(1)),
    profile,
    engForm, engFormOpen: S.engFormOpen, engEditingId: S.engEditingId, openEngForm, openEditEngineer: openEditEngForm, closeEngForm,
    assignments: S.assignments, engineers: S.engineers,
    stats: {
      assignments: isYear ? yearSummary.cs + yearSummary.ia : isMonth ? monthScheduledCount : wk.length,
      weekCustomers,
      monthCustomers,
      yearCustomers,
      weekInternals,
      monthInternals,
      yearInternals,
      yearCustomerAuditsTotal: yearMonths.reduce((acc: number, m: any) => acc + m.customerAppts, 0),
      yearInternalAuditsTotal: yearMonths.reduce((acc: number, m: any) => acc + m.internalAppts, 0),
    },
    plants: plantsVm,
    personRows, plantRows, siteRows, mobilePersonRows, mobileSiteRows, mobileSiteDeptRows,
    weekCalendarDays, weekMergedSpans,
    showTimetable, timetableRows, timetableGridCols, timetableEngName: timetableEng?.name || '',
    closeTimetable, mobileTimetableRows,
    presence, activity, detail,
    emptyWeek: S.timeScale === 'week' && S.weekOffset !== todayWeekOffset && wk.length === 0, copyWeek,
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
    dayDialogOpen, dayDialogDate, dayDialogDateISO, dayDialogChips, dayDialogInfo, closeDayDialog,
    openCreate, openCreateWithDate, closeCreate, createOpen: S.createOpen, create, stop: (e: React.MouseEvent) => e.stopPropagation(),
    editOpen: S.editOpen, editDraft: S.editDraft, setEditDraft, closeEdit, submitEdit,
    adminStats,
    tabEngineers: S.adminTab === 'engineers', tabOptions: S.adminTab === 'options',
    setTabEng: () => setAdminTab('engineers'), setTabOptions: () => setAdminTab('options'),
    tabEngStyle: S.adminTab === 'engineers' ? tabOn : tabOff,
    tabOptionsStyle: S.adminTab === 'options' ? tabOn : tabOff,
    adminEngineers, engCount: S.engineers.length,
    adminFilterSite: S.adminFilterSite, adminFilterDept: S.adminFilterDept, adminDeptOptions,
    toggleAdminFilterSite, toggleAdminFilterDept,
    addEngineer: openEngForm,
    summaryPeriods, summaryRows, summaryCells, utlRows, utlCells, summaryYear: S.summaryYear,
    setSummaryYear: (y: number) => setState({ summaryYear: y }),
    purposeOptions: computedPurposeOptions,
    masterPurposeOptions: S.purposeOptions,
    customerDepartmentOptions: S.customerDepartmentOptions,
    internalDepartmentOptions: S.internalDepartmentOptions,
    addPurposeOption: (v: string) => addOption('purposeOptions', v),
    removePurposeOption: (v: string) => removeOption('purposeOptions', v),
    addCustomerDepartmentOption: (v: string) => addOption('customerDepartmentOptions', v),
    removeCustomerDepartmentOption: (v: string) => removeOption('customerDepartmentOptions', v),
    addInternalDepartmentOption: (v: string) => addOption('internalDepartmentOptions', v),
    removeInternalDepartmentOption: (v: string) => removeOption('internalDepartmentOptions', v),
    siteCodeOptions: S.siteCodeOptions,
    customerOptions: computedCustomerOptions,
    masterCustomerOptions: S.customerOptions,
    auditorOptions: computedAuditorOptions,
    masterAuditorOptions: S.auditorOptions,
    addAuditorOption: (v: string) => addOption('auditorOptions', v),
    removeAuditorOption: (v: string) => removeOption('auditorOptions', v),
    siteColorList, siteColors: S.siteColors, setSiteColor,
    addSiteCodeOption: (v: string) => addOption('siteCodeOptions', v),
    removeSiteCodeOption,
    addCustomerOption: (v: string) => addOption('customerOptions', v),
    removeCustomerOption: (v: string) => removeOption('customerOptions', v),
    removedOptions: S.removedOptions || [], removeGenericOption,
  };
}

export type VM = ReturnType<typeof useScheduler>;
