import { useState, useMemo, useEffect } from 'react';
import type { VM } from '../useScheduler';
import type { CustomHolidayType, CustomHoliday } from '../holidays';
import {
  getHolidayForDate,
  getEffectivePublicHolidaysForYear,
  SHUTDOWN_SITE_OPTIONS,
} from '../holidays';
import { css } from '../ui';

const WEEKDAY_MINI = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const EMPTY_CUSTOM_HOLIDAYS: Record<string, CustomHoliday> = {};

const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_TH = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type FilterCategory = 'ALL' | 'PUBLIC_HOLIDAY' | 'SHUTDOWN_PLANT' | 'NO_CUSTOMER_AUDITS';

interface UnifiedRuleItem {
  id: string;
  date: string; // 'YYYY-MM-DD'
  fullDate: string; // e.g. '01 Jan 2026'
  dayOfWeek: string; // e.g. 'Thursday'
  dayOfWeekTh: string; // e.g. 'วันพฤหัสบดี'
  type: CustomHolidayType;
  name: string;
  lockedSites?: string[];
  isBuiltin: boolean;
  isCustom: boolean;
  isSubstitute?: boolean;
}

export function HolidaysPanel({ vm }: { vm: VM }) {
  const today = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(() => today.getFullYear());

  // Sidebar Filter & Search
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('ALL');
  const [ruleSearch, setRuleSearch] = useState('');

  // Modal State for date/range configuration
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFromDate, setModalFromDate] = useState('');
  const [modalToDate, setModalToDate] = useState('');
  const [modalType, setModalType] = useState<CustomHolidayType>('NO_CUSTOMER_AUDITS');
  const [modalNote, setModalNote] = useState('');
  const [modalLockedSites, setModalLockedSites] = useState<string[]>([]);
  const [isRangeMode, setIsRangeMode] = useState(false);

  // Add / Edit Public Holiday Dialog State
  const [editHolidayModalOpen, setEditHolidayModalOpen] = useState(false);
  const [editHolidayData, setEditHolidayData] = useState<{
    oldDate: string;
    date: string;
    name: string;
    isNew: boolean;
  }>({ oldDate: '', date: '', name: '', isNew: false });


  const customHolidays = vm.customHolidays || EMPTY_CUSTOM_HOLIDAYS;

  // Year Navigation Handlers & Direct Input
  const prevYear = () => setSelectedYear((y) => Math.max(2000, y - 1));
  const nextYear = () => setSelectedYear((y) => Math.min(2100, y + 1));
  const [yearInput, setYearInput] = useState<string>(() => String(selectedYear));

  useEffect(() => {
    setYearInput(String(selectedYear));
  }, [selectedYear]);

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYearInput(val);
  };

  const handleYearCommit = () => {
    const num = parseInt(yearInput, 10);
    if (!isNaN(num) && num >= 2000 && num <= 2100 && yearInput.length === 4) {
      if (num !== selectedYear) {
        setSelectedYear(num);
      }
    } else {
      setYearInput(String(selectedYear));
    }
  };

  const handleYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleYearCommit();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setYearInput(String(selectedYear));
      (e.target as HTMLInputElement).blur();
    }
  };

  // Open configuration modal for a specific calendar cell
  const handleDayClick = (dateStr: string, dateObj: Date) => {
    const hol = getHolidayForDate(dateObj, customHolidays);
    const existing = customHolidays[dateStr];

    setModalFromDate(dateStr);
    setModalToDate(dateStr);
    setIsRangeMode(false);

    if (hol) {
      setModalType(hol.holidayType || 'PUBLIC_HOLIDAY');
      setModalNote(hol.note || (hol.holidayType === 'SHUTDOWN_PLANT' ? '' : hol.name || ''));
      if (hol.holidayType === 'SHUTDOWN_PLANT') {
        setModalLockedSites(hol.lockedSites && hol.lockedSites.length > 0 ? [...hol.lockedSites] : [...SHUTDOWN_SITE_OPTIONS]);
      } else {
        setModalLockedSites([]);
      }
    } else if (existing) {
      setModalType(existing.type);
      setModalNote(existing.note || '');
      if (existing.type === 'SHUTDOWN_PLANT') {
        setModalLockedSites(existing.lockedSites && existing.lockedSites.length > 0 ? [...existing.lockedSites] : [...SHUTDOWN_SITE_OPTIONS]);
      } else {
        setModalLockedSites([]);
      }
    } else {
      setModalType('NO_CUSTOMER_AUDITS');
      setModalNote('');
      setModalLockedSites([]);
    }
    setModalOpen(true);
  };

  // Open modal for custom range creation
  const handleOpenRangeModal = () => {
    const defaultMonth = selectedYear === today.getFullYear() ? today.getMonth() : 0;
    const defaultDate = `${selectedYear}-${String(defaultMonth + 1).padStart(2, '0')}-01`;
    setModalFromDate(defaultDate);
    setModalToDate(defaultDate);
    setIsRangeMode(true);
    setModalType('NO_CUSTOMER_AUDITS');
    setModalNote('');
    setModalLockedSites([]);
    setModalOpen(true);
  };

  // Handle saving holiday / restriction rule
  const handleSave = async () => {
    if (!modalFromDate) return;
    if (modalType === 'SHUTDOWN_PLANT' && modalLockedSites.length === 0) return;
    const from = modalFromDate;
    const to = isRangeMode && modalToDate ? modalToDate : from;
    const lockedSites = modalType === 'SHUTDOWN_PLANT' ? modalLockedSites : undefined;

    if (from === to) {
      await vm.saveHolidayRule(from, modalType, modalNote.trim(), { lockedSites });
    } else {
      const dates: string[] = [];
      const cur = new Date(from + 'T00:00:00');
      const end = new Date(to + 'T00:00:00');
      if (cur > end) {
        dates.push(from);
      } else {
        while (cur <= end) {
          const y = cur.getFullYear();
          const m = String(cur.getMonth() + 1).padStart(2, '0');
          const d = String(cur.getDate()).padStart(2, '0');
          dates.push(`${y}-${m}-${d}`);
          cur.setDate(cur.getDate() + 1);
        }
      }
      await vm.saveHolidayRangeRules(dates, modalType, modalNote.trim(), { lockedSites });
    }
    setModalOpen(false);
  };

  // Handle removing holiday / resetting date to normal working day
  const handleDelete = async () => {
    if (!modalFromDate) return;
    const from = modalFromDate;
    const to = isRangeMode && modalToDate ? modalToDate : from;

    if (from === to) {
      await vm.deleteHolidayRule(from);
    } else {
      const dates: string[] = [];
      const cur = new Date(from + 'T00:00:00');
      const end = new Date(to + 'T00:00:00');
      while (cur <= end) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        cur.setDate(cur.getDate() + 1);
      }
      await vm.deleteHolidayRangeRules(dates);
    }
    setModalOpen(false);
  };

  // Effective Public Holidays for Selected Year
  const effectivePublicHolidays = useMemo(() => {
    return getEffectivePublicHolidaysForYear(selectedYear, customHolidays);
  }, [selectedYear, customHolidays]);

  // Statistics for Current Year
  const yearStats = useMemo(() => {
    let shutdownCount = 0;
    let noCsCount = 0;

    for (const [dateKey, itemVal] of Object.entries(customHolidays)) {
      const item = itemVal as CustomHoliday;
      if (dateKey.startsWith(`${selectedYear}-`)) {
        if (item.type === 'SHUTDOWN_PLANT') shutdownCount++;
        else if (item.type === 'NO_CUSTOMER_AUDITS') noCsCount++;
      }
    }

    return {
      publicHolidaysCount: effectivePublicHolidays.length,
      shutdownCount,
      noCsCount,
    };
  }, [selectedYear, customHolidays, effectivePublicHolidays.length]);

  // --------------------------------------------------------------------------
  // Unified Rule Items for Left Sidebar
  // --------------------------------------------------------------------------
  const allYearRules = useMemo(() => {
    const rules: UnifiedRuleItem[] = [];

    // 1. Add all effective public holidays for the year
    for (const h of effectivePublicHolidays) {
      rules.push({
        id: `${h.date}-PUBLIC_HOLIDAY`,
        date: h.date,
        fullDate: h.dateFormattedEn,
        dayOfWeek: h.dayOfWeek,
        dayOfWeekTh: h.dayOfWeekTh,
        type: 'PUBLIC_HOLIDAY',
        name: h.name,
        isBuiltin: h.isBuiltin,
        isCustom: h.isCustom,
        isSubstitute: h.isSubstitute,
      });
    }

    // 2. Add Shutdown Plant & No Customer Audits & Working Day overrides
    for (const [dateStr, itemVal] of Object.entries(customHolidays)) {
      const item = itemVal as CustomHoliday;
      if (dateStr.startsWith(`${selectedYear}-`)) {
        if (item.type === 'SHUTDOWN_PLANT' || item.type === 'NO_CUSTOMER_AUDITS' || item.type === 'WORKING_DAY') {
          const parts = dateStr.split('-');
          const dt = parts.length === 3 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) : new Date(dateStr + 'T00:00:00');
          const d = dt.getDate();
          const m = dt.getMonth();
          const dayIdx = dt.getDay();

          const lockedSites = item.lockedSites && item.lockedSites.length > 0 ? item.lockedSites : (item.type === 'SHUTDOWN_PLANT' ? [...SHUTDOWN_SITE_OPTIONS] : undefined);
          const sitesStr = lockedSites && lockedSites.length >= SHUTDOWN_SITE_OPTIONS.length ? 'All Sites' : lockedSites?.join(', ') || 'All Sites';
          const ruleName = item.type === 'WORKING_DAY'
            ? 'Overridden to Normal Day (Holiday Removed)'
            : item.type === 'SHUTDOWN_PLANT'
            ? (item.note ? `${item.note} · ${sitesStr}` : `Shutdown Plant · ${sitesStr}`)
            : item.note || 'No Customer Audits';

          rules.push({
            id: `${dateStr}-${item.type}`,
            date: dateStr,
            fullDate: `${String(d).padStart(2, '0')} ${MONTHS_EN[m]} ${selectedYear}`,
            dayOfWeek: DAYS_EN[dayIdx],
            dayOfWeekTh: DAYS_TH[dayIdx],
            type: item.type,
            name: ruleName,
            lockedSites: item.type === 'SHUTDOWN_PLANT' ? lockedSites : undefined,
            isBuiltin: item.type === 'WORKING_DAY',
            isCustom: true,
          });
        }
      }
    }

    return rules.sort((a, b) => a.date.localeCompare(b.date));
  }, [effectivePublicHolidays, customHolidays, selectedYear]);

  // Filtered Rules for Left Sidebar
  const filteredRules = useMemo(() => {
    let list = allYearRules;

    if (filterCategory === 'PUBLIC_HOLIDAY') {
      list = list.filter((r) => r.type === 'PUBLIC_HOLIDAY' || r.type === 'WORKING_DAY');
    } else if (filterCategory === 'SHUTDOWN_PLANT') {
      list = list.filter((r) => r.type === 'SHUTDOWN_PLANT');
    } else if (filterCategory === 'NO_CUSTOMER_AUDITS') {
      list = list.filter((r) => r.type === 'NO_CUSTOMER_AUDITS');
    }

    if (ruleSearch.trim()) {
      const q = ruleSearch.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.date.includes(q) ||
          r.fullDate.toLowerCase().includes(q) ||
          r.dayOfWeek.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allYearRules, filterCategory, ruleSearch]);

  // Counts for sidebar tabs
  const categoryCounts = useMemo(() => {
    return {
      all: allYearRules.length,
      publicHolidays: allYearRules.filter((r) => r.type === 'PUBLIC_HOLIDAY' || r.type === 'WORKING_DAY').length,
      shutdown: allYearRules.filter((r) => r.type === 'SHUTDOWN_PLANT').length,
      noCs: allYearRules.filter((r) => r.type === 'NO_CUSTOMER_AUDITS').length,
    };
  }, [allYearRules]);

  // Delete Rule Handler
  const handleDeleteRule = async (rule: UnifiedRuleItem) => {
    if (
      window.confirm(
        `Are you sure you want to remove rule for "${rule.name}" (${rule.fullDate})?`
      )
    ) {
      await vm.deleteHolidayRule(rule.date);
    }
  };

  // Edit Public Holiday Dialog Handler
  const handleOpenEditRule = (rule: UnifiedRuleItem) => {
    if (rule.type === 'PUBLIC_HOLIDAY') {
      setEditHolidayData({ oldDate: rule.date, date: rule.date, name: rule.name, isNew: false });
      setEditHolidayModalOpen(true);
    } else {
      const parts = rule.date.split('-');
      const dt = parts.length === 3 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) : new Date(rule.date + 'T00:00:00');
      handleDayClick(rule.date, dt);
    }
  };

  const handleSaveEditHoliday = async () => {
    if (!editHolidayData.date.trim() || !editHolidayData.name.trim()) return;
    if (editHolidayData.isNew) {
      await vm.saveHolidayRule(editHolidayData.date.trim(), 'PUBLIC_HOLIDAY', editHolidayData.name.trim());
    } else {
      await vm.updatePublicHoliday(editHolidayData.oldDate, editHolidayData.date.trim(), editHolidayData.name.trim());
    }
    setEditHolidayModalOpen(false);
  };

  // --------------------------------------------------------------------------
  // 12-Month Year Calendar Data (Strictly Rule-Only, Zero Audits)
  // --------------------------------------------------------------------------
  const yearMonthsData = useMemo(() => {
    return Array.from({ length: 12 }, (_, mIdx) => {
      const daysInMonth = new Date(selectedYear, mIdx + 1, 0).getDate();
      const firstDay = new Date(selectedYear, mIdx, 1);
      const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday=0

      const days: Array<{
        blank: boolean;
        dateStr: string;
        dayNum: number;
        dateObj: Date;
        isToday: boolean;
        isWeekend: boolean;
        hol: ReturnType<typeof getHolidayForDate>;
      }> = [];

      for (let i = 0; i < firstDayOfWeek; i++) {
        days.push({
          blank: true,
          dateStr: '',
          dayNum: 0,
          dateObj: new Date(),
          isToday: false,
          isWeekend: false,
          hol: null,
        });
      }

      let rulesInMonthCount = 0;

      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(selectedYear, mIdx, d);
        const y = dateObj.getFullYear();
        const m = String(mIdx + 1).padStart(2, '0');
        const day = String(d).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;

        const dow = dateObj.getDay();
        const isWeekend = dow === 0 || dow === 6;
        const isToday = today.getFullYear() === y && today.getMonth() === mIdx && today.getDate() === d;
        const hol = getHolidayForDate(dateObj, customHolidays);

        if (hol) {
          rulesInMonthCount++;
        }

        days.push({
          blank: false,
          dateStr,
          dayNum: d,
          dateObj,
          isToday,
          isWeekend,
          hol,
        });
      }

      return {
        monthIndex: mIdx,
        monthName: MONTHS_FULL[mIdx],
        days,
        rulesCount: rulesInMonthCount,
      };
    });
  }, [selectedYear, customHolidays, today]);

  return (
    <div style={css('display:flex;flex-direction:column;gap:20px;padding-bottom:40px')}>
      {/* 1. Header Card & Summary Cards */}
      <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;padding:18px 22px;box-shadow:0 1px 3px rgba(0,0,0,0.02)')}>
        <div style={css('display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px')}>
          <div>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#8a9088;text-transform:uppercase;letter-spacing:0.5px")}>
              Holiday & Restriction Management
            </div>
            <div style={css("font-size:20px;font-weight:800;color:#15191e;margin-top:2px;font-family:'Archivo',sans-serif")}>
              Calendar Restrictions
            </div>
            <div style={css('font-size:12.5px;color:#64748b;margin-top:2px')}>
              Configure statutory public holidays, plant shutdowns, and No Customer Audit days. Backed by Cloudflare D1.
            </div>
          </div>

          <div style={css('display:flex;align-items:center;gap:10px;flex-wrap:wrap')}>
            <button className="tap"
              onClick={handleOpenRangeModal}
              style={css("display:inline-flex;align-items:center;gap:6px;background:#2756d6;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:12.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer;transition:background .15s")}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#1e44b0')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#2756d6')}
            >
              <span>＋</span>
              <span>Add Date Range Rule</span>
            </button>
          </div>
        </div>

        {/* 3 Simplified Summary Cards */}
        <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:16px;padding-top:16px;border-top:1px solid #f1f3ee')}>
          {/* Card 1: Public Holidays (Simplified: Title + Day Count only) */}
          <div
            onClick={() => setFilterCategory('PUBLIC_HOLIDAY')}
            style={{
              background: '#f8fafc',
              border: '1.5px solid ' + (filterCategory === 'PUBLIC_HOLIDAY' ? '#2563eb' : '#cbd5e1'),
              borderRadius: '10px',
              padding: '14px 18px',
              cursor: 'pointer',
              transition: 'all .15s ease',
            }}
            onMouseEnter={(e) => {
              if (filterCategory !== 'PUBLIC_HOLIDAY') {
                e.currentTarget.style.borderColor = '#94a3b8';
                e.currentTarget.style.background = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (filterCategory !== 'PUBLIC_HOLIDAY') {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = '#f8fafc';
              }
            }}
            title="Filter rules list by Public Holidays"
          >
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.4px")}>
              Public Holidays ({selectedYear})
            </div>
            <div style={css("font-size:24px;font-weight:800;color:#1e293b;margin-top:4px;font-family:'Archivo',sans-serif")}>
              {yearStats.publicHolidaysCount} <span style={css('font-size:13px;font-weight:500;color:#64748b')}>days</span>
            </div>
          </div>

          {/* Card 2: Shutdown Plant (Simplified) */}
          <div
            onClick={() => setFilterCategory('SHUTDOWN_PLANT')}
            style={{
              background: '#eff6ff',
              border: '1.5px solid ' + (filterCategory === 'SHUTDOWN_PLANT' ? '#2563eb' : '#bfdbfe'),
              borderRadius: '10px',
              padding: '14px 18px',
              cursor: 'pointer',
              transition: 'all .15s ease',
            }}
            onMouseEnter={(e) => {
              if (filterCategory !== 'SHUTDOWN_PLANT') {
                e.currentTarget.style.borderColor = '#93c5fd';
                e.currentTarget.style.background = '#e0f2fe';
              }
            }}
            onMouseLeave={(e) => {
              if (filterCategory !== 'SHUTDOWN_PLANT') {
                e.currentTarget.style.borderColor = '#bfdbfe';
                e.currentTarget.style.background = '#eff6ff';
              }
            }}
            title="Filter rules list by Shutdown Plant"
          >
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.4px")}>
              Shutdown Plant
            </div>
            <div style={css("font-size:24px;font-weight:800;color:#1d4ed8;margin-top:4px;font-family:'Archivo',sans-serif")}>
              {yearStats.shutdownCount} <span style={css('font-size:13px;font-weight:500;color:#60a5fa')}>days</span>
            </div>
          </div>

          {/* Card 3: No Customer Audits (Simplified) */}
          <div
            onClick={() => setFilterCategory('NO_CUSTOMER_AUDITS')}
            style={{
              background: '#eff6ff',
              border: '1.5px solid ' + (filterCategory === 'NO_CUSTOMER_AUDITS' ? '#2563eb' : '#bfdbfe'),
              borderRadius: '10px',
              padding: '14px 18px',
              cursor: 'pointer',
              transition: 'all .15s ease',
            }}
            onMouseEnter={(e) => {
              if (filterCategory !== 'NO_CUSTOMER_AUDITS') {
                e.currentTarget.style.borderColor = '#93c5fd';
                e.currentTarget.style.background = '#e0f2fe';
              }
            }}
            onMouseLeave={(e) => {
              if (filterCategory !== 'NO_CUSTOMER_AUDITS') {
                e.currentTarget.style.borderColor = '#bfdbfe';
                e.currentTarget.style.background = '#eff6ff';
              }
            }}
            title="Filter rules list by No Customer Audits"
          >
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.4px")}>
              No Customer Audits
            </div>
            <div style={css("font-size:24px;font-weight:800;color:#1d4ed8;margin-top:4px;font-family:'Archivo',sans-serif")}>
              {yearStats.noCsCount} <span style={css('font-size:13px;font-weight:500;color:#60a5fa')}>days</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Legend Bar */}
      <div style={css('display:flex;align-items:center;gap:16px;flex-wrap:wrap;background:#fff;border:1px solid #e2e5de;border-radius:10px;padding:10px 18px;font-size:12px')}>
        <span style={css('font-weight:700;color:#475569')}>Legend:</span>
        <div style={css('display:flex;align-items:center;gap:6px')}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F3F4F6', border: '1px solid #D1D5DB' }} />
          <span style={css('color:#374151')}>Public Holiday (Gray — Blocks CS & IA)</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:6px')}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#eff6ff', border: '1px solid #bfdbfe' }} />
          <span style={css('color:#1d4ed8;font-weight:600')}>Shutdown Plant (Blue — CS blocked, IA restricted to non-shutdown sites)</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:6px')}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#eff6ff', border: '1px solid #bfdbfe' }} />
          <span style={css('color:#1d4ed8;font-weight:600')}>No Customer Audits (Blue — CS blocked, IA allowed)</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:6px')}>
          <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ffffff', border: '1px solid #cbd5e1' }} />
          <span style={css('color:#64748b')}>Normal Working Day (White — Full CS & IA)</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SPLIT-COLUMN LAYOUT (LEFT SIDEBAR + RIGHT 12-MONTH YEAR CALENDAR)      */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(330px, 380px) minmax(0, 1fr)',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* ======================================================================= */}
        {/* LEFT PANEL: CONFIGURED CALENDAR RULES SIDEBAR                          */}
        {/* ======================================================================= */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e5de',
            borderRadius: '14px',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            position: 'sticky',
            top: '20px',
            maxHeight: 'calc(100vh - 40px)',
          }}
        >
          {/* Sidebar Header */}
          <div>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#8a9088;text-transform:uppercase;letter-spacing:0.5px")}>
              Calendar Rules · {selectedYear}
            </div>
            <div style={css("font-size:16px;font-weight:800;color:#15191e;font-family:'Archivo',sans-serif;margin-top:1px")}>
              Configured Rules
            </div>
          </div>

          {/* Filter Tabs / Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button
              type="button"
              className="tap"
              onClick={() => setFilterCategory('ALL')}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: "'Archivo',sans-serif",
                background: filterCategory === 'ALL' ? '#15191e' : '#f1f5f9',
                color: filterCategory === 'ALL' ? '#ffffff' : '#475569',
                transition: 'all .12s',
              }}
            >
              All ({categoryCounts.all})
            </button>

            <button
              type="button"
              className="tap"
              onClick={() => setFilterCategory('PUBLIC_HOLIDAY')}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: "'Archivo',sans-serif",
                background: filterCategory === 'PUBLIC_HOLIDAY' ? '#334155' : '#f1f5f9',
                color: filterCategory === 'PUBLIC_HOLIDAY' ? '#ffffff' : '#475569',
                transition: 'all .12s',
              }}
            >
              Public Holidays ({categoryCounts.publicHolidays})
            </button>

            <button
              type="button"
              className="tap"
              onClick={() => setFilterCategory('SHUTDOWN_PLANT')}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: "'Archivo',sans-serif",
                background: filterCategory === 'SHUTDOWN_PLANT' ? '#2563eb' : '#eff6ff',
                color: filterCategory === 'SHUTDOWN_PLANT' ? '#ffffff' : '#1d4ed8',
                transition: 'all .12s',
              }}
            >
              Shutdown Plant ({categoryCounts.shutdown})
            </button>

            <button
              type="button"
              className="tap"
              onClick={() => setFilterCategory('NO_CUSTOMER_AUDITS')}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: "'Archivo',sans-serif",
                background: filterCategory === 'NO_CUSTOMER_AUDITS' ? '#2563eb' : '#eff6ff',
                color: filterCategory === 'NO_CUSTOMER_AUDITS' ? '#ffffff' : '#1d4ed8',
                transition: 'all .12s',
              }}
            >
              No Customer Audits ({categoryCounts.noCs})
            </button>
          </div>

          {/* Search Input Bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                color: '#94a3b8',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={ruleSearch}
              onChange={(e) => setRuleSearch(e.target.value)}
              placeholder="Search rules by name or date..."
              style={css("width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;padding:7px 28px 7px 32px;font-size:12px;font-family:'Archivo',sans-serif;color:#1e293b;outline:none")}
            />
            {ruleSearch && (
              <button className="tap-hit"
                type="button"
                onClick={() => setRuleSearch('')}
                style={css('position:absolute;right:8px;top:50%;transform:translateY(-50%);border:none;background:transparent;color:#94a3b8;cursor:pointer;font-size:12px;padding:2px')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Scrollable Rules List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '2px',
            }}
          >
            {filteredRules.length === 0 ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                No rules found matching "{ruleSearch || filterCategory}".
              </div>
            ) : (
              filteredRules.map((r) => {
                const isBlue = r.type === 'SHUTDOWN_PLANT' || r.type === 'NO_CUSTOMER_AUDITS';
                const isWorkingDay = r.type === 'WORKING_DAY';

                const badgeBg = isWorkingDay ? '#f8fafc' : isBlue ? '#eff6ff' : '#f1f5f9';
                const badgeBorder = isWorkingDay ? '#cbd5e1' : isBlue ? '#93c5fd' : '#cbd5e1';
                const badgeColor = isWorkingDay ? '#64748b' : isBlue ? '#1d4ed8' : '#334155';
                const shutdownSitesStr = r.lockedSites && r.lockedSites.length > 0
                  ? (r.lockedSites.length >= SHUTDOWN_SITE_OPTIONS.length ? 'All Sites' : r.lockedSites.join(', '))
                  : 'All Sites';
                const badgeLabel =
                  r.type === 'PUBLIC_HOLIDAY'
                    ? 'Public Holiday'
                    : r.type === 'SHUTDOWN_PLANT'
                    ? `Shutdown Plant · ${shutdownSitesStr}`
                    : r.type === 'NO_CUSTOMER_AUDITS'
                    ? 'No Customer Audits'
                    : 'Overridden (Normal)';

                return (
                  <div
                    key={r.id}
                    onClick={() => handleOpenEditRule(r)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '9px',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all .12s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#cbd5e1';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    title={`Click to edit rule for ${r.date}`}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      {/* 1) Full Date (Day, Month, Year) & Category Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                            {r.fullDate}
                          </span>
                          <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                            {r.dayOfWeek}
                          </span>
                        </div>

                        {/* 2) Rule category badge/tag */}
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            background: badgeBg,
                            border: `1px solid ${badgeBorder}`,
                            color: badgeColor,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {badgeLabel}
                        </span>
                      </div>

                      {/* 3) Holiday occasion / description text */}
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b', marginTop: '3px', wordBreak: 'break-word' }}>
                        {r.name}
                        {r.isSubstitute && (
                          <span style={{ fontSize: '10.5px', fontWeight: 500, color: '#64748b', marginLeft: '5px' }}>
                            (Shift E & E1)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 4) Delete ("×") Button */}
                    <button className="tap-hit"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRule(r);
                      }}
                      style={css('border:none;background:transparent;color:#94a3b8;cursor:pointer;padding:3px 5px;border-radius:4px;font-size:14px;line-height:1;margin-left:4px')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fee2e2';
                        e.currentTarget.style.color = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                      }}
                      title={isWorkingDay ? `Restore default holiday on ${r.date}` : `Delete rule for ${r.date}`}
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT PANEL: INTERACTIVE YEAR VIEW CALENDAR (12 MONTHS)                 */}
        {/* ======================================================================= */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e5de',
            borderRadius: '14px',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Year View Navigation Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#2563eb;letter-spacing:0.5px")}>
                YEAR VIEW CALENDAR · {selectedYear}
              </div>
              <div style={css("font-size:13px;font-weight:600;color:#5c625c;margin-top:1px")}>
                Click any date to configure rules
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button className="tap-square"
                type="button"
                onClick={prevYear}
                style={css("width:32px;height:32px;border:1px solid #dde0d9;background:#fff;border-radius:7px;cursor:pointer;font-size:14px;color:#475569;display:flex;align-items:center;justify-content:center;transition:background .12s")}
                title="Previous Year"
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
              >
                ◀
              </button>
              <button className="tap-square"
                type="button"
                onClick={nextYear}
                style={css("width:32px;height:32px;border:1px solid #dde0d9;background:#fff;border-radius:7px;cursor:pointer;font-size:14px;color:#475569;display:flex;align-items:center;justify-content:center;transition:background .12s")}
                title="Next Year"
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
              >
                ▶
              </button>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={yearInput}
                onChange={handleYearInputChange}
                onBlur={handleYearCommit}
                onKeyDown={handleYearKeyDown}
                style={css("width:64px;height:32px;border:1px solid #dde0d9;background:#fff;border-radius:7px;font-family:'Archivo',sans-serif;font-size:14px;font-weight:700;color:#15191e;text-align:center;outline:none;box-sizing:border-box;transition:border-color .15s,box-shadow .15s")}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.15)';
                  e.currentTarget.select();
                }}
                onBlurCapture={(e) => {
                  e.currentTarget.style.borderColor = '#dde0d9';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title="Type a 4-digit year (2000–2100) and press Enter"
                aria-label="Year"
              />
            </div>
          </div>

          {/* 12-Month Year View Grid (Strictly Rule-Only, Zero Audits) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '14px',
            }}
          >
            {yearMonthsData.map((m) => {
              const isCurrentMonth = today.getFullYear() === selectedYear && today.getMonth() === m.monthIndex;

              return (
                <div
                  key={m.monthIndex}
                  style={{
                    background: '#ffffff',
                    border: isCurrentMonth
                      ? '1.5px solid #93c5fd'
                      : '1px solid #e4e7e0',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  }}
                >
                  {/* Month Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f3ee', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                        {m.monthName}
                      </span>
                      {isCurrentMonth && (
                        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 700, background: '#eef2fd', color: '#2756d6', border: '1px solid #d8e2fa', padding: '1px 5px', borderRadius: '4px' }}>
                          NOW
                        </span>
                      )}
                    </div>

                    {/* Rule count tag (Rule-only condition: strictly NO audits, NO "22 Appts") */}
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono',monospace",
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: m.rulesCount > 0 ? '#f1f5f9' : '#fafafa',
                        color: m.rulesCount > 0 ? '#334155' : '#94a3b8',
                        border: `1px solid ${m.rulesCount > 0 ? '#cbd5e1' : '#e2e8f0'}`,
                      }}
                    >
                      {m.rulesCount > 0 ? `${m.rulesCount} ${m.rulesCount === 1 ? 'Rule' : 'Rules'}` : 'Clear'}
                    </span>
                  </div>

                  {/* Mini Weekday Headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', textAlign: 'center' }}>
                    {WEEKDAY_MINI.map((w, idx) => (
                      <div
                        key={`${m.monthIndex}-head-${idx}`}
                        style={{
                          fontFamily: "'IBM Plex Mono',monospace",
                          fontSize: '9px',
                          fontWeight: 700,
                          color: idx >= 5 ? '#b0b5ab' : '#8a9088',
                        }}
                      >
                        {w}
                      </div>
                    ))}
                  </div>

                  {/* Mini Calendar Days Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
                    {m.days.map((d, dIdx) => {
                      if (d.blank) {
                        return <div key={`blank-${m.monthIndex}-${dIdx}`} style={{ height: '24px' }} />;
                      }

                      const { hol, isToday, isWeekend, dateStr, dayNum, dateObj } = d;

                      let cellBg = 'transparent';
                      let cellBorder = 'transparent';
                      let cellColor = isWeekend ? '#94a3b8' : '#1e293b';
                      let fontWeight = 500;

                      if (hol) {
                        fontWeight = 700;
                        if (hol.holidayType === 'PUBLIC_HOLIDAY') {
                          cellBg = '#f3f4f6';
                          cellBorder = '#d1d5db';
                          cellColor = '#374151';
                        } else if (hol.holidayType === 'SHUTDOWN_PLANT' || hol.holidayType === 'NO_CUSTOMER_AUDITS') {
                          cellBg = '#eff6ff';
                          cellBorder = '#bfdbfe';
                          cellColor = '#1d4ed8';
                        }
                      }

                      return (
                        <div
                          key={dateStr}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDayClick(dateStr, dateObj);
                          }}
                          style={{
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: "'IBM Plex Mono',monospace",
                            fontSize: '10.5px',
                            fontWeight,
                            background: cellBg,
                            border: isToday ? '1.5px solid #2563eb' : `1px solid ${cellBorder}`,
                            borderRadius: '4px',
                            color: isToday ? '#2563eb' : cellColor,
                            cursor: 'pointer',
                            transition: 'all .1s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.filter = 'brightness(0.92)';
                            if (!hol && !isToday) {
                              e.currentTarget.style.background = '#f1f5f9';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.filter = 'none';
                            if (!hol && !isToday) {
                              e.currentTarget.style.background = cellBg;
                              e.currentTarget.style.borderColor = cellBorder;
                            }
                          }}
                          title={
                            hol
                              ? `${dateStr}: ${hol.name} (${hol.holidayType})`
                              : `${dateStr}: Click to set rule`
                          }
                        >
                          {dayNum}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ADD / EDIT PUBLIC HOLIDAY SUB-MODAL                                    */}
      {/* ========================================================================= */}
      {editHolidayModalOpen && (
        <div style={css('position:fixed;inset:0;background:rgba(15,23,42,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:10000')}>
          <div style={css('background:#fff;border-radius:14px;padding:22px;max-width:440px;width:90%;box-shadow:0 16px 36px rgba(0,0,0,0.2);display:flex;flex-direction:column;gap:14px')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                {editHolidayData.isNew ? '＋ Add Public Holiday' : '✏️ Edit Public Holiday'}
              </div>
              <button className="tap"
                type="button"
                onClick={() => setEditHolidayModalOpen(false)}
                style={css('width:28px;height:28px;border:1px solid #e2e8f0;background:#fff;border-radius:7px;cursor:pointer;color:#64748b;font-size:14px')}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
                HOLIDAY DATE
              </label>
              <input
                type="date"
                value={editHolidayData.date}
                onChange={(e) => setEditHolidayData({ ...editHolidayData, date: e.target.value })}
                style={css("width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:7px;padding:8px 10px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#1e293b;outline:none")}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>
                HOLIDAY NAME / DESCRIPTION
              </label>
              <input
                type="text"
                value={editHolidayData.name}
                onChange={(e) => setEditHolidayData({ ...editHolidayData, name: e.target.value })}
                placeholder="e.g. Makha Bucha Day, Company Sports Day, Special Holiday..."
                style={css("width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:7px;padding:8px 12px;font-size:13px;font-family:'Archivo',sans-serif;color:#1e293b;outline:none")}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px', paddingTop: '12px', borderTop: '1px solid #f1f3ee' }}>
              <button className="tap"
                type="button"
                onClick={() => setEditHolidayModalOpen(false)}
                style={css("background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}
              >
                Cancel
              </button>
              <button className="tap"
                type="button"
                onClick={handleSaveEditHoliday}
                style={css("background:#2563eb;color:#fff;border:none;padding:7px 18px;border-radius:8px;font-size:12.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}
              >
                Save Holiday
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* 6. SINGLE DATE / DATE RANGE RESTRICTION CONFIGURATION MODAL               */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div style={css('position:fixed;inset:0;background:rgba(15,23,42,0.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9999')}>
          <div style={css('background:#fff;border-radius:14px;padding:24px;max-width:480px;width:92%;box-shadow:0 12px 30px rgba(0,0,0,0.15);display:flex;flex-direction:column;gap:18px')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>
                  Configure Calendar Status
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Apply holiday, shutdown, or audit restriction to date
                </div>
              </div>
              <button className="tap"
                type="button"
                onClick={() => setModalOpen(false)}
                style={css('width:28px;height:28px;border:1px solid #e2e8f0;background:#fff;border-radius:7px;cursor:pointer;color:#64748b;font-size:14px')}
              >
                ✕
              </button>
            </div>

            {/* Date Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  {isRangeMode ? 'DATE RANGE' : 'DATE'}
                </label>
                <button className="tap"
                  type="button"
                  onClick={() => setIsRangeMode(!isRangeMode)}
                  style={css("background:transparent;border:none;color:#2756d6;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
                >
                  {isRangeMode ? 'Switch to Single Date' : 'Switch to Date Range'}
                </button>
              </div>

              {isRangeMode ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '3px' }}>From</label>
                    <input
                      type="date"
                      value={modalFromDate}
                      onChange={(e) => setModalFromDate(e.target.value)}
                      style={css("width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:7px;padding:7px 10px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#1e293b;outline:none")}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '3px' }}>To</label>
                    <input
                      type="date"
                      value={modalToDate}
                      onChange={(e) => setModalToDate(e.target.value)}
                      style={css("width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:7px;padding:7px 10px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#1e293b;outline:none")}
                    />
                  </div>
                </div>
              ) : (
                <input
                  type="date"
                  value={modalFromDate}
                  onChange={(e) => {
                    setModalFromDate(e.target.value);
                    setModalToDate(e.target.value);
                  }}
                  style={css("width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:7px;padding:7px 10px;font-size:13px;font-family:'IBM Plex Mono',monospace;color:#1e293b;outline:none")}
                />
              )}
            </div>

            {/* Type Selector (3 Options) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                STATUS / RESTRICTION TYPE
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* 1. Public Holiday */}
                <div
                  onClick={() => setModalType('PUBLIC_HOLIDAY')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid ' + (modalType === 'PUBLIC_HOLIDAY' ? '#64748b' : '#e2e8f0'),
                    background: modalType === 'PUBLIC_HOLIDAY' ? '#f1f5f9' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    transition: 'all .12s',
                  }}
                >
                  <input
                    type="radio"
                    name="holidayType"
                    checked={modalType === 'PUBLIC_HOLIDAY'}
                    onChange={() => setModalType('PUBLIC_HOLIDAY')}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                      🔘 Public / General Holiday (Gray)
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>
                      Styled in Gray. Disabled/locked in Schedule — blocks both CS and IA appointments.
                    </div>
                  </div>
                </div>

                {/* 2. Shutdown Plant */}
                <div
                  onClick={() => setModalType('SHUTDOWN_PLANT')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid ' + (modalType === 'SHUTDOWN_PLANT' ? '#2563eb' : '#e2e8f0'),
                    background: modalType === 'SHUTDOWN_PLANT' ? '#eff6ff' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    transition: 'all .12s',
                  }}
                >
                  <input
                    type="radio"
                    name="holidayType"
                    checked={modalType === 'SHUTDOWN_PLANT'}
                    onChange={() => setModalType('SHUTDOWN_PLANT')}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1d4ed8' }}>
                      🔷 Shutdown Plant (Blue)
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>
                      Styled in Blue with "Shutdown Plant" label. Blocks Customer Audits (CS); allows Internal Audits (IA) for non-shutdown sites.
                    </div>
                  </div>
                </div>

                {/* Shutdown Plant: Site selection */}
                {modalType === 'SHUTDOWN_PLANT' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', margin: '4px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                        AFFECTED SITES (SHUTDOWN)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (modalLockedSites.length === SHUTDOWN_SITE_OPTIONS.length) {
                            setModalLockedSites([]);
                          } else {
                            setModalLockedSites([...SHUTDOWN_SITE_OPTIONS]);
                          }
                        }}
                        style={css("background:transparent;border:none;color:#2563eb;font-size:11px;font-weight:700;cursor:pointer;font-family:'Archivo',sans-serif")}
                      >
                        {modalLockedSites.length === SHUTDOWN_SITE_OPTIONS.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))', gap: '8px' }}>
                      {SHUTDOWN_SITE_OPTIONS.map((site) => {
                        const isChecked = modalLockedSites.includes(site);
                        return (
                          <label
                            key={site}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 8px',
                              borderRadius: '6px',
                              background: isChecked ? '#dbeafe' : '#ffffff',
                              border: '1px solid ' + (isChecked ? '#93c5fd' : '#cbd5e1'),
                              cursor: 'pointer',
                              fontSize: '11.5px',
                              fontWeight: isChecked ? 700 : 500,
                              color: isChecked ? '#1d4ed8' : '#334155',
                              userSelect: 'none',
                              transition: 'all .1s',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setModalLockedSites((prev) => [...prev, site]);
                                } else {
                                  setModalLockedSites((prev) => prev.filter((s) => s !== site));
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            <span>{site}</span>
                          </label>
                        );
                      })}
                    </div>
                    {modalLockedSites.length === 0 && (
                      <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>
                        ⚠️ Please select at least one site, or choose "Select All".
                      </div>
                    )}
                  </div>
                )}

                {/* 3. No Customer Audits */}
                <div
                  onClick={() => setModalType('NO_CUSTOMER_AUDITS')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid ' + (modalType === 'NO_CUSTOMER_AUDITS' ? '#2563eb' : '#e2e8f0'),
                    background: modalType === 'NO_CUSTOMER_AUDITS' ? '#eff6ff' : '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    transition: 'all .12s',
                  }}
                >
                  <input
                    type="radio"
                    name="holidayType"
                    checked={modalType === 'NO_CUSTOMER_AUDITS'}
                    onChange={() => setModalType('NO_CUSTOMER_AUDITS')}
                    style={{ marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1d4ed8' }}>
                      🔷 No Customer Audits (Blue)
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '1px' }}>
                      Styled in Blue with "No Customer Audits" label. Blocks Customer Audits (CS), strictly restricted to Internal Audits (IA) only. Remains Blue when IA card is added.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Note / Holiday Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                HOLIDAY NAME / NOTE (OPTIONAL)
              </label>
              <input
                type="text"
                value={modalNote}
                onChange={(e) => setModalNote(e.target.value)}
                placeholder="e.g., Annual Maintenance, Songkran Festival, Facility Shut Down..."
                style={css("width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:7px;padding:8px 12px;font-size:12.5px;font-family:'Archivo',sans-serif;color:#1e293b;outline:none")}
              />
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', paddingTop: '14px', borderTop: '1px solid #f1f3ee' }}>
              {customHolidays[modalFromDate] || (modalFromDate && getHolidayForDate(new Date(modalFromDate + 'T00:00:00'), customHolidays)) ? (
                <button className="tap"
                  type="button"
                  onClick={handleDelete}
                  style={css("background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}
                  title="Remove holiday/restriction and reset this date to a normal working day"
                >
                  Reset to Normal Day
                </button>
              ) : (
                <div />
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="tap"
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={css("background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;padding:8px 16px;border-radius:8px;font-size:12.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}
                >
                  Cancel
                </button>
                <button className="tap"
                  type="button"
                  onClick={handleSave}
                  disabled={modalType === 'SHUTDOWN_PLANT' && modalLockedSites.length === 0}
                  style={{
                    ...css("background:#2756d6;color:#fff;border:none;padding:8px 18px;border-radius:8px;font-size:12.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer"),
                    ...(modalType === 'SHUTDOWN_PLANT' && modalLockedSites.length === 0 ? { opacity: 0.5, cursor: 'not-allowed', background: '#94a3b8' } : {}),
                  }}
                  title={modalType === 'SHUTDOWN_PLANT' && modalLockedSites.length === 0 ? 'Please select at least 1 site for Shutdown Plant' : 'Save Status'}
                >
                  Save Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
