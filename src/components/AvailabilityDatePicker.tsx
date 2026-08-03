import { useState, useEffect, useMemo, useCallback } from 'react';
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

/** Compute slot range starting from startDate for given duration in days. */
function computeSlotRange(
  startDate: Date,
  duration: number,
  businessDaysOnly: boolean
): { dates: Date[]; start: Date; end: Date; validStart: boolean } {
  if (businessDaysOnly && isWeekend(startDate)) {
    return { dates: [startDate], start: startDate, end: startDate, validStart: false };
  }

  const dates: Date[] = [];
  let curr = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  if (!businessDaysOnly) {
    for (let i = 0; i < duration; i++) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
  } else {
    let count = 0;
    let safety = 0;
    while (count < duration && safety < 100) {
      safety++;
      if (!isWeekend(curr)) {
        dates.push(new Date(curr));
        count++;
      }
      if (count < duration) {
        curr.setDate(curr.getDate() + 1);
      }
    }
  }

  return {
    dates,
    start: dates[0] || startDate,
    end: dates[dates.length - 1] || startDate,
    validStart: true,
  };
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
  // Duration & Business Days state
  const [duration, setDuration] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState<string>('4');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [businessDaysOnly, setBusinessDaysOnly] = useState<boolean>(true);

  const activeDuration = isCustom ? (parseInt(customInput, 10) || 1) : (duration ?? 1);

  // Month navigation view
  const initialDate = useMemo(() => parseISO(dateFrom) || getTodayMidnight(), [dateFrom]);
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  // Interactive selection state
  const [selectedStart, setSelectedStart] = useState<Date | null>(() => parseISO(dateFrom));
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Status notice (e.g. when jumping to next available)
  const [notice, setNotice] = useState<string | null>(null);

  // Sync selectedStart if dateFrom changes externally
  useEffect(() => {
    const parsed = parseISO(dateFrom);
    if (parsed) {
      setSelectedStart(parsed);
    }
  }, [dateFrom]);

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

  // Check validity of a candidate start date
  const checkStartAvailability = useCallback(
    (candidate: Date) => {
      const candidateMidnight = new Date(candidate.getFullYear(), candidate.getMonth(), candidate.getDate());

      if (businessDaysOnly && isWeekend(candidateMidnight)) {
        return { available: false, spill: false, reason: 'Weekend' };
      }

      const activeDuration = isCustom ? (parseInt(customInput, 10) || 1) : (duration ?? 1);
      const computed = computeSlotRange(candidateMidnight, activeDuration, businessDaysOnly);

      if (!computed.validStart) {
        return { available: false, spill: false, reason: 'Invalid start date' };
      }

      const candidateISO = fmtISO(candidateMidnight);
      const isStartBooked = bookedDatesSet.has(candidateISO);

      let hasBookedInRange = false;
      for (const d of computed.dates) {
        if (bookedDatesSet.has(fmtISO(d))) {
          hasBookedInRange = true;
          break;
        }
      }

      if (hasBookedInRange) {
        return {
          available: true,
          spill: !isStartBooked,
          reason: isStartBooked ? 'Booked date' : 'Range overlaps existing appointment',
          range: computed,
        };
      }

      return {
        available: true,
        spill: false,
        range: computed,
      };
    },
    [businessDaysOnly, duration, isCustom, customInput, bookedDatesSet]
  );

  // Computed selected range
  const selectedRange = useMemo(() => {
    if (!selectedStart) return null;
    const activeDuration = isCustom ? (parseInt(customInput, 10) || 1) : (duration ?? 1);
    return computeSlotRange(selectedStart, activeDuration, businessDaysOnly);
  }, [selectedStart, duration, isCustom, customInput, businessDaysOnly]);

  // Auto-sync selectedRange to parent form
  useEffect(() => {
    if (selectedRange) {
      const fromISO = fmtISO(selectedRange.start);
      const toISO = fmtISO(selectedRange.end);
      if (fromISO !== dateFrom || toISO !== _dateTo) {
        onChange({ dateFrom: fromISO, dateTo: toISO });
      }
    }
  }, [selectedRange, dateFrom, _dateTo, onChange]);

  // Computed hover preview range
  const hoverRange = useMemo(() => {
    if (!hoveredDate) return null;
    const activeDuration = isCustom ? (parseInt(customInput, 10) || 1) : (duration ?? 1);
    const check = checkStartAvailability(hoveredDate);
    if (!check.available && !check.spill) return null;
    return computeSlotRange(hoveredDate, activeDuration, businessDaysOnly);
  }, [hoveredDate, duration, isCustom, customInput, businessDaysOnly, checkStartAvailability]);

  // Jump to next available slot from today
  const handleJumpNextAvailable = () => {
    const today = getTodayMidnight();
    let found: { start: Date; end: Date } | null = null;
    for (let i = 0; i < 365; i++) {
      const cand = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const check = checkStartAvailability(cand);
      if (check.available && check.range) {
        found = { start: check.range.start, end: check.range.end };
        break;
      }
    }

    if (found) {
      setViewYear(found.start.getFullYear());
      setViewMonth(found.start.getMonth());
      setSelectedStart(found.start);
      onChange({ dateFrom: fmtISO(found.start), dateTo: fmtISO(found.end) });
      setNotice(`Jumped to next available slot: ${fmtDisplay(found.start)}`);
      setTimeout(() => setNotice(null), 3500);
    } else {
      setNotice('No available slots found within the next 12 months.');
      setTimeout(() => setNotice(null), 3500);
    }
  };

  // Select a start date
  const handleSelectDate = (d: Date) => {
    if (businessDaysOnly && isWeekend(d)) return;
    const check = checkStartAvailability(d);

    setSelectedStart(d);
    if (check.range) {
      onChange({ dateFrom: fmtISO(check.range.start), dateTo: fmtISO(check.range.end) });
    }
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

    // Mon = 0, Sun = 6
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
      {/* Top Controls: Duration & Business Days Toggle */}
      <div style={css('display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid #eef1ea;padding-bottom:10px')}>
        <div style={css('display:flex;align-items:center;gap:6px')}>
          <span style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#8a9088;letter-spacing:.4px")}>DURATION:</span>
          {[1, 2, 3, 5].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => { setDuration(d); setIsCustom(false); }}
              style={css(
                `padding:4px 9px;border-radius:6px;font-size:11.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif;${
                  !isCustom && duration === d
                    ? 'background:#15191e;color:#fff;border:1px solid #15191e;'
                    : 'background:#f4f6f1;color:#5c625c;border:1px solid #e0e3dc;'
                }`
              )}
            >
              {d} {d === 1 ? 'day' : 'days'}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsCustom(true)}
            style={css(
              `padding:4px 9px;border-radius:6px;font-size:11.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif;${
                isCustom
                  ? 'background:#15191e;color:#fff;border:1px solid #15191e;'
                  : 'background:#f4f6f1;color:#5c625c;border:1px solid #e0e3dc;'
              }`
            )}
          >
            Custom
          </button>
          {isCustom && (
            <input
              type="number"
              min="1"
              max="30"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              style={css("width:48px;padding:3px 6px;border:1px solid #15191e;border-radius:5px;font-size:11.5px;font-family:'Archivo',sans-serif;outline:none")}
            />
          )}
        </div>

        <label style={css('display:flex;align-items:center;gap:6px;cursor:pointer;font-size:11.5px;font-weight:500;color:#3c423d')}>
          <input
            type="checkbox"
            checked={businessDaysOnly}
            onChange={(e) => setBusinessDaysOnly(e.target.checked)}
            style={css('accent-color:#15191e;cursor:pointer')}
          />
          Business days only
        </label>
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
          const isStart = selectedStart ? isSameDay(selectedStart, day) : false;
          const isEnd = selectedRange ? isSameDay(selectedRange.end, day) : false;

          // Check hover preview range
          const inHover = hoverRange
            ? hoverRange.dates.some((d) => isSameDay(d, day))
            : false;

          // Check start availability
          const check = checkStartAvailability(day);

          let cellStyle = 'background:#fafbf9;color:#23282a;border:1px solid #eef1ea;cursor:pointer;';
          let tooltip = check.available ? `Click to select ${activeDuration}-day slot from ${fmtDisplay(day)}` : (check.reason || '');

          if (businessDaysOnly && wkend) {
            cellStyle = 'background:#f4f6f1;color:#a6aca2;border:1px solid #e8ebe4;cursor:not-allowed;';
            tooltip = 'Weekend (business days only)';
          } else if (inSelected) {
            const borderRadius = isStart && isEnd ? '7px' : isStart ? '7px 0 0 7px' : isEnd ? '0 7px 7px 0' : '0';
            cellStyle = `background:#15191e;color:#fff;border:1px solid #15191e;font-weight:700;border-radius:${borderRadius};cursor:pointer;`;
          } else if (inHover) {
            cellStyle = 'background:#3b82f6;color:#fff;border:1px solid #2563eb;font-weight:600;border-radius:6px;cursor:pointer;';
          } else if (isBooked) {
            cellStyle = 'background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;cursor:pointer;font-weight:600;border-radius:6px;';
            tooltip = blocking ? `Booked: ${blocking.site} — ${blocking.auditor} (${blocking.title}) — Click to select duplicate slot` : 'Booked date — Click to select duplicate slot';
          } else if (check.available) {
            cellStyle = 'background:#eefbf4;color:#15803d;border:1px solid #bbf7d0;font-weight:600;border-radius:6px;cursor:pointer;';
          } else if (check.spill) {
            cellStyle = 'background:#fffbeb;color:#b45309;border:1px solid #fde68a;font-weight:500;border-radius:6px;cursor:pointer;';
            tooltip = 'Range spills into booked date';
          }

          return (
            <div
              key={iso}
              title={tooltip}
              onClick={() => handleSelectDate(day)}
              onMouseEnter={() => setHoveredDate(day)}
              onMouseLeave={() => setHoveredDate(null)}
              style={css(
                `height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;font-size:12px;font-family:'Archivo',sans-serif;user-select:none;transition:all .12s ease;${cellStyle}`
              )}
            >
              <span>{day.getDate()}</span>
              {check.spill && !inSelected && !isBooked && (
                <span style={css('position:absolute;bottom:2px;width:4px;height:4px;border-radius:50%;background:#d97706')} />
              )}
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
              ? `${fmtDisplay(selectedRange.start)} – ${fmtDisplay(selectedRange.end)} (${activeDuration} ${businessDaysOnly ? 'business ' : ''}${activeDuration === 1 ? 'day' : 'days'})`
              : 'No date range selected'}
          </div>
        </div>

        {selectedRange && (
          <div style={css("font-size:11px;font-weight:600;color:#15803d;background:#eefbf4;border:1px solid #bbf7d0;border-radius:6px;padding:4px 9px;display:flex;align-items:center;gap:4px")}>
            ✓ Saved automatically
          </div>
        )}
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
