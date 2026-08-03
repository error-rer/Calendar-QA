import { useState, useEffect, useMemo, useRef } from 'react';
import type { Assignment, Engineer } from '../types';
import { css, HButton } from '../ui';

export interface AvailabilityDatePickerProps {
  sectionType: 'customer' | 'internal';
  site: string;
  auditor: string;
  dateFrom: string;
  dateTo: string;
  onChange: (patch: { dateFrom: string; dateTo: string }) => void;
  assignments?: Assignment[];
  engineers?: Engineer[];
  editingTargetId?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function fmtISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISO(s: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtDisplay(d: Date): string {
  const m = MONTH_NAMES[d.getMonth()].slice(0, 3);
  return `${m} ${d.getDate()}, ${d.getFullYear()}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isWeekend(d: Date): boolean {
  const w = d.getDay();
  return w === 0 || w === 6; // 0 = Sun, 6 = Sat
}

function getTodayMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function AvailabilityDatePicker({
  site,
  auditor,
  dateFrom,
  dateTo: _dateTo,
  onChange,
  assignments = [],
  engineers = [],
  editingTargetId,
}: AvailabilityDatePickerProps) {
  // Business Days state (enforced Mon-Fri weekdays only)
  const businessDaysOnly = true;

  // Month navigation view
  const initialDate = useMemo(() => parseISO(dateFrom) || getTodayMidnight(), [dateFrom]);
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  // Interactive selection state using stable ISO string representations
  const [selectedFromISO, setSelectedFromISO] = useState<string>(dateFrom || '');
  const [selectedToISO, setSelectedToISO] = useState<string>(_dateTo || dateFrom || '');
  const isInternalChangeRef = useRef(false);

  // Status notice (e.g. when jumping to next available)
  const [notice, setNotice] = useState<string | null>(null);

  // Sync state & jump calendar view if dateFrom or dateTo changes EXTERNALLY
  useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    if (dateFrom !== selectedFromISO || _dateTo !== selectedToISO) {
      setSelectedFromISO(dateFrom || '');
      setSelectedToISO(_dateTo || dateFrom || '');

      const pStart = parseISO(dateFrom);
      if (pStart) {
        const y = pStart.getFullYear();
        const m = pStart.getMonth();
        setViewYear((prevY) => (prevY !== y ? y : prevY));
        setViewMonth((prevM) => (prevM !== m ? m : prevM));
      }
    }
  }, [dateFrom, _dateTo, selectedFromISO, selectedToISO]);

  // Compute busy dates for the currently selected Site + Auditor
  const { bookedDatesSet, bookedDetailsMap } = useMemo(() => {
    const set = new Set<string>();
    const details = new Map<string, { site: string; auditor: string; title: string }>();

    if (!site.trim() || !auditor.trim()) {
      return { bookedDatesSet: set, bookedDetailsMap: details };
    }

    const normSite = site.trim().toLowerCase();
    const normAuditor = auditor.trim().toLowerCase();

    // Map engineer IDs to names
    const engMap = new Map<string, string>();
    for (const e of engineers) {
      engMap.set(e.id, e.name.toLowerCase());
    }

    // Exclude current editing appointment and its multi-day siblings
    let excludeOrder = '';
    let excludeEng = '';
    if (editingTargetId) {
      const target = assignments.find((a) => a.id === editingTargetId);
      if (target) {
        excludeOrder = target.order;
        excludeEng = target.eng;
      }
    }

    const baseDate = new Date(2026, 5, 29); // June 29, 2026 is Monday of week 0

    for (const a of assignments) {
      if (editingTargetId && (a.id === editingTargetId || (a.order === excludeOrder && a.eng === excludeEng))) {
        continue;
      }

      const aSite = (a.site1 || a.site2 || '').trim().toLowerCase();
      const engName = (engMap.get(a.eng) || '').trim().toLowerCase();
      const aAuditor1 = (a.auditor1 || '').trim().toLowerCase();
      const aAuditor2 = (a.auditor2 || '').trim().toLowerCase();

      // Check if site and auditor match the selection
      const siteMatch = aSite === normSite || !aSite;
      const auditorMatch =
        engName === normAuditor ||
        aAuditor1 === normAuditor ||
        aAuditor2 === normAuditor;

      if (siteMatch && auditorMatch) {
        // Calculate date for this assignment row (week + day)
        const dayOffset = a.week * 7 + a.day;
        const assignDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + dayOffset);
        const iso = fmtISO(assignDate);
        set.add(iso);

        const title = a.area || a.customer || a.purpose || 'Existing appointment';
        const displayAuditor = a.auditor1 || a.auditor2 || engMap.get(a.eng) || auditor;
        const displaySite = a.site1 || a.site2 || site;

        details.set(iso, { site: displaySite, auditor: displayAuditor, title });
      }
    }

    return { bookedDatesSet: set, bookedDetailsMap: details };
  }, [site, auditor, assignments, engineers, editingTargetId]);

  // Computed selected range
  const selectedRange = useMemo(() => {
    if (!selectedFromISO) return null;
    const s = parseISO(selectedFromISO);
    const e = parseISO(selectedToISO) || s;
    if (!s) return null;

    const start = s <= (e || s) ? s : (e || s);
    const end = s <= (e || s) ? (e || s) : s;

    const dates: Date[] = [];
    const curr = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const final = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    while (curr <= final) {
      if (!isWeekend(curr)) {
        dates.push(new Date(curr.getTime()));
      }
      curr.setDate(curr.getDate() + 1);
    }

    if (dates.length === 0) return null;
    return {
      start: dates[0],
      end: dates[dates.length - 1],
      dates,
    };
  }, [selectedFromISO, selectedToISO]);

  // Handle Date Click with Selection & Deselection Toggle
  const handleSelectDate = (d: Date) => {
    if (isWeekend(d)) return;
    const clickedISO = fmtISO(d);

    isInternalChangeRef.current = true;

    // Deselect Toggle: If clicking an already selected start date
    if (selectedFromISO && selectedFromISO === clickedISO) {
      if (!selectedToISO || selectedToISO === clickedISO) {
        setSelectedFromISO('');
        setSelectedToISO('');
        onChange({ dateFrom: '', dateTo: '' });
        return;
      }
    }
    // Deselect Toggle: If clicking an already selected end date
    if (selectedToISO && selectedToISO === clickedISO && selectedFromISO !== clickedISO) {
      setSelectedToISO(selectedFromISO);
      onChange({ dateFrom: selectedFromISO, dateTo: selectedFromISO });
      return;
    }

    // 1st Click / Range Selection:
    if (!selectedFromISO || (selectedFromISO && selectedToISO && selectedFromISO !== selectedToISO)) {
      setSelectedFromISO(clickedISO);
      setSelectedToISO(clickedISO);
      onChange({ dateFrom: clickedISO, dateTo: clickedISO });
    } else {
      if (clickedISO < selectedFromISO) {
        setSelectedFromISO(clickedISO);
        setSelectedToISO(clickedISO);
        onChange({ dateFrom: clickedISO, dateTo: clickedISO });
      } else {
        setSelectedToISO(clickedISO);
        onChange({ dateFrom: selectedFromISO, dateTo: clickedISO });
      }
    }
  };

  // Jump to next available slot from today
  const handleJumpNextAvailable = () => {
    const today = getTodayMidnight();
    const todayISO = fmtISO(today);
    isInternalChangeRef.current = true;
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedFromISO(todayISO);
    setSelectedToISO(todayISO);
    onChange({ dateFrom: todayISO, dateTo: todayISO });
    setNotice(`Selected today: ${fmtDisplay(today)}`);
    setTimeout(() => setNotice(null), 3500);
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Generate grid days for viewMonth
  const gridDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);

    const startOffset = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(viewYear, viewMonth, i));
    }
    return days;
  }, [viewYear, viewMonth]);

  return (
    <div style={css('border:1px solid #e2e5de;border-radius:12px;background:#fff;padding:14px;display:flex;flex-direction:column;gap:12px;margin-top:6px')}>
      {/* Top Controls Header */}
      <div style={css('display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid #eef1ea;padding-bottom:10px')}>
        <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:700;color:#23282a;letter-spacing:.4px")}>
          DATE SELECTION
        </div>
      </div>

      {/* Month Header & Jump Button */}
      <div style={css('display:flex;align-items:center;justify-content:space-between;gap:8px')}>
        <div style={css('display:flex;align-items:center;gap:8px')}>
          <HButton
            type="button"
            onClick={handlePrevMonth}
            style={css('width:28px;height:28px;border:1px solid #dde0d9;background:#fff;border-radius:6px;cursor:pointer;color:#3c423d;font-size:13px;display:flex;align-items:center;justify-content:center')}
            hover={{ background: '#f1f3ee' }}
          >
            ‹
          </HButton>
          <span style={css('font-size:13.5px;font-weight:700;color:#23282a;min-width:110px')}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <HButton
            type="button"
            onClick={handleNextMonth}
            style={css('width:28px;height:28px;border:1px solid #dde0d9;background:#fff;border-radius:6px;cursor:pointer;color:#3c423d;font-size:13px;display:flex;align-items:center;justify-content:center')}
            hover={{ background: '#f1f3ee' }}
          >
            ›
          </HButton>
        </div>

        <HButton
          type="button"
          onClick={handleJumpNextAvailable}
          style={css("background:#eef2fd;border:1px solid #d8e2fa;color:#2756d6;border-radius:7px;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif;display:flex;align-items:center;gap:4px")}
          hover={{ background: '#e0e8fc' }}
        >
          ⚡ Jump to next available
        </HButton>
      </div>

      {notice && (
        <div style={css('font-size:11px;color:#1f8a5b;background:#eefdf4;border:1px solid #ccebe2;border-radius:6px;padding:6px 10px;animation:fadeIn .15s ease')}>
          {notice}
        </div>
      )}

      {/* Weekday Headers */}
      <div style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center')}>
        {WEEKDAY_NAMES.map((w, i) => (
          <div
            key={w}
            style={css(
              `font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;padding:4px 0;${
                i >= 5 ? 'color:#a6aca2;' : 'color:#8a9088;'
              }`
            )}
          >
            {w}
          </div>
        ))}
      </div>

      {/* Month Calendar Grid */}
      <div style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:4px')}>
        {gridDays.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} style={css('height:34px')} />;
          }

          const iso = fmtISO(day);
          const wkend = isWeekend(day);
          const isBooked = bookedDatesSet.has(iso);
          const blocking = bookedDetailsMap.get(iso);

          // Check if day is part of current selected range
          const inSelected = selectedRange
            ? selectedRange.dates.some((d) => isSameDay(d, day))
            : false;
          const isStart = selectedFromISO ? iso === selectedFromISO : false;
          const isEnd = selectedToISO ? iso === selectedToISO : false;

          let cellStyle = 'background:#fafbf9;color:#23282a;border:1px solid #eef1ea;cursor:pointer;';
          let tooltip = inSelected
            ? `Selected: ${fmtDisplay(day)} (Click again to deselect)`
            : `Click to select date: ${fmtDisplay(day)}`;

          if (businessDaysOnly && wkend) {
            cellStyle = 'background:#f4f6f1;color:#a6aca2;border:1px solid #e8ebe4;cursor:not-allowed;';
            tooltip = 'Weekend (business days only)';
          } else if (inSelected) {
            const borderRadius = isStart && isEnd ? '7px' : isStart ? '7px 0 0 7px' : isEnd ? '0 7px 7px 0' : '0';
            cellStyle = `background:#15191e;color:#fff;border:1px solid #15191e;font-weight:700;border-radius:${borderRadius};cursor:pointer;`;
          } else if (isBooked) {
            cellStyle = 'background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;cursor:pointer;font-weight:600;border-radius:6px;';
            tooltip = blocking ? `Booked: ${blocking.site} — ${blocking.auditor} (${blocking.title})` : 'Booked date';
          } else {
            cellStyle = 'background:#eefbf4;color:#15803d;border:1px solid #bbf7d0;font-weight:600;border-radius:6px;cursor:pointer;';
          }

          return (
            <div
              key={iso}
              title={tooltip}
              onClick={() => handleSelectDate(day)}
              style={css(
                `height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;font-size:12px;font-family:'Archivo',sans-serif;user-select:none;transition:all .12s ease;${cellStyle}`
              )}
            >
              <span>{day.getDate()}</span>
            </div>
          );
        })}
      </div>

      {/* Range Display & Confirm Bar */}
      <div style={css('display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fafbf9;border:1px solid #eef1ea;border-radius:8px;padding:9px 12px')}>
        <div style={css('line-height:1.2')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#8a9088;letter-spacing:.4px")}>SELECTED RANGE</div>
          <div style={css('font-size:12px;font-weight:700;color:#23282a;margin-top:2px')}>
            {selectedRange
              ? `${fmtDisplay(selectedRange.start)}${isSameDay(selectedRange.start, selectedRange.end) ? '' : ' – ' + fmtDisplay(selectedRange.end)} (${selectedRange.dates.length} ${businessDaysOnly ? 'business ' : ''}${selectedRange.dates.length === 1 ? 'day' : 'days'})`
              : 'No date selected'}
          </div>
        </div>
      </div>

      {/* Legend Key */}
      <div style={css('display:flex;align-items:center;gap:14px;flex-wrap:wrap;border-top:1px solid #eef1ea;padding-top:8px')}>
        <div style={css('display:flex;align-items:center;gap:5px')}>
          <span style={css('width:10px;height:10px;border-radius:3px;background:#eefbf4;border:1px solid #bbf7d0')} />
          <span style={css('font-size:10.5px;color:#5c625c')}>Available</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:5px')}>
          <span style={css('width:10px;height:10px;border-radius:3px;background:#15191e')} />
          <span style={css('font-size:10.5px;color:#5c625c')}>Selected</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:5px')}>
          <span style={css('width:10px;height:10px;border-radius:3px;background:#fef2f2;border:1px solid #fca5a5')} />
          <span style={css('font-size:10.5px;color:#5c625c')}>Booked</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:5px')}>
          <span style={css('width:10px;height:10px;border-radius:3px;background:#f4f6f1;border:1px solid #e8ebe4')} />
          <span style={css('font-size:10.5px;color:#5c625c')}>Weekend</span>
        </div>
      </div>
    </div>
  );
}
