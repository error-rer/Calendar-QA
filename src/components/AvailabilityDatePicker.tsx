import { useState, useEffect, useMemo, useRef } from 'react';
import type { Assignment, Engineer } from '../types';
import { css, HButton } from '../ui';
import { getHolidayForDate, getHolidayStyle, isOfficialHoliday } from '../holidays';

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

export interface BookedDetail {
  site: string;
  customer: string;
  endCustomer: string;
  purpose: string;
  area: string;
  auditor: string;
  isInternal: boolean;
  tooltipText: string;
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

  // Month navigation view state
  const initialDate = useMemo(() => parseISO(dateFrom) || getTodayMidnight(), [dateFrom]);
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  // Ref to track last auto-jumped dateFrom to prevent infinite re-render loops
  const lastHandledDateFromRef = useRef<string>(dateFrom);

  // Status notice (e.g. when jumping to next available)
  const [notice, setNotice] = useState<string | null>(null);

  // Auto-jump calendar view when dateFrom changes externally
  useEffect(() => {
    if (dateFrom && dateFrom !== lastHandledDateFromRef.current) {
      lastHandledDateFromRef.current = dateFrom;
      const pStart = parseISO(dateFrom);
      if (pStart) {
        const y = pStart.getFullYear();
        const m = pStart.getMonth();
        setViewYear((prevY) => (prevY !== y ? y : prevY));
        setViewMonth((prevM) => (prevM !== m ? m : prevM));
      }
    } else if (!dateFrom) {
      lastHandledDateFromRef.current = '';
    }
  }, [dateFrom]);

  // State for hovered booked date cell to render rich custom floating tooltip popover
  const [hoveredBookedIso, setHoveredBookedIso] = useState<string | null>(null);
  const [hoveredCellRect, setHoveredCellRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Compute busy dates for the currently selected Site + Auditor
  const { bookedDatesSet, bookedDetailsMap } = useMemo(() => {
    const set = new Set<string>();
    const details = new Map<string, BookedDetail[]>();

    const siteTokens = site.split('/').flatMap((s) => s.split(',')).map((s) => s.trim().toLowerCase()).filter(Boolean);
    const auditorTokens = auditor.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

    if (siteTokens.length === 0 && auditorTokens.length === 0) {
      return { bookedDatesSet: set, bookedDetailsMap: details };
    }

    // Map engineer IDs to names (preserving original casing)
    const engMap = new Map<string, string>();
    for (const e of engineers) {
      engMap.set(e.id, e.name);
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

      // Extract site tokens of assignment a
      const aSiteStr = (a.site1 || a.site2 || '');
      const aSiteTokens = aSiteStr.split('/').flatMap((s) => s.split(',')).map((s) => s.trim().toLowerCase()).filter(Boolean);

      // Extract auditor tokens of assignment a
      const aEngName = (engMap.get(a.eng) || '').trim().toLowerCase();
      const aAuditor1Tokens = (a.auditor1 || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const aAuditor2Tokens = (a.auditor2 || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const aAuditorTokens = Array.from(new Set([aEngName, ...aAuditor1Tokens, ...aAuditor2Tokens].filter(Boolean)));

      // Evaluate site and auditor matches
      let siteMatch = true;
      if (siteTokens.length > 0) {
        siteMatch = aSiteTokens.length === 0 || siteTokens.some((st) => aSiteTokens.includes(st));
      }

      let auditorMatch = true;
      if (auditorTokens.length > 0) {
        auditorMatch = auditorTokens.some((at) => aAuditorTokens.includes(at));
      }

      // If both match (or single match when only one criteria specified)
      if (siteMatch && auditorMatch) {
        const dayOffset = a.week * 7 + a.day;
        const assignDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + dayOffset);
        const iso = fmtISO(assignDate);
        set.add(iso);

        const isIA = a.sectionType === 'internal' || (!a.sectionType && (!!a.area || !!a.site2));
        const displaySite = (a.site1 || a.site2 || site || '').trim();
        const displayCustomer = (a.customer || '').trim();
        const displayEndCustomer = (a.endCustomer || '').trim();
        const displayPurpose = (a.purpose || '').trim();
        const displayArea = (a.area || '').trim();
        const rawEngName = engMap.get(a.eng) || '';
        const displayAuditor = (a.auditor1 || a.auditor2 || rawEngName || auditor || '').trim();

        let tooltipText = '';
        if (isIA) {
          // IA (Internal Audit): ⚠️ Booked: [Site] - [Area] - [Auditor] (Strictly NO Purpose)
          const parts = [displaySite, displayArea, displayAuditor].filter((v) => v && String(v).trim() !== '');
          tooltipText = parts.length > 0 ? `⚠️ Booked: ${parts.join(' - ')}` : '⚠️ Booked date';
        } else {
          // CS (Customer Audit): ⚠️ Booked: [Site] - [Customer] - [Purpose] - [Auditor]
          const parts = [displaySite, displayCustomer, displayPurpose, displayAuditor].filter((v) => v && String(v).trim() !== '');
          tooltipText = parts.length > 0 ? `⚠️ Booked: ${parts.join(' - ')}` : '⚠️ Booked date';
        }

        const detailItem: BookedDetail = {
          site: displaySite,
          customer: displayCustomer,
          endCustomer: displayEndCustomer,
          purpose: displayPurpose,
          area: displayArea,
          auditor: displayAuditor,
          isInternal: isIA,
          tooltipText,
        };

        const existingList = details.get(iso) || [];
        if (!existingList.some((item) => item.tooltipText === tooltipText)) {
          existingList.push(detailItem);
        }
        details.set(iso, existingList);
      }
    }

    return { bookedDatesSet: set, bookedDetailsMap: details };
  }, [site, auditor, assignments, engineers, editingTargetId]);

  // Derived selected range directly from props
  const selectedRange = useMemo(() => {
    if (!dateFrom) return null;
    const s = parseISO(dateFrom);
    const e = parseISO(_dateTo) || s;
    if (!s) return null;

    const start = s <= (e || s) ? s : (e || s);
    const end = s <= (e || s) ? (e || s) : s;

    const dates: Date[] = [];
    const curr = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const final = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    while (curr <= final) {
      if (!isWeekend(curr) && !getHolidayForDate(curr)) {
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
  }, [dateFrom, _dateTo]);

  // Check if current selection has any booked date conflict
  const hasConflict = useMemo(() => {
    if (!selectedRange) return false;
    return selectedRange.dates.some((d) => bookedDatesSet.has(fmtISO(d)));
  }, [selectedRange, bookedDatesSet]);

  // Handle Date Click reading directly from props
  const handleSelectDate = (d: Date) => {
    if (isWeekend(d) || getHolidayForDate(d)) return;
    const clickedISO = fmtISO(d);

    const currentFrom = dateFrom || '';
    const currentTo = _dateTo || currentFrom || '';

    // If single date is selected and user clicks that same single date -> Deselect to empty
    if (currentFrom && currentFrom === currentTo && currentFrom === clickedISO) {
      lastHandledDateFromRef.current = '';
      onChange({ dateFrom: '', dateTo: '' });
      return;
    }

    // If a multi-day range is currently selected:
    if (currentFrom && currentTo && currentFrom !== currentTo) {
      // If clicking already selected end date -> select that date as single date
      if (clickedISO === currentTo) {
        lastHandledDateFromRef.current = clickedISO;
        onChange({ dateFrom: clickedISO, dateTo: clickedISO });
        return;
      }
      // If clicking already selected start date -> select that date as single date
      if (clickedISO === currentFrom) {
        lastHandledDateFromRef.current = clickedISO;
        onChange({ dateFrom: clickedISO, dateTo: clickedISO });
        return;
      }
      // Clicking any other date -> start new selection on clickedISO
      lastHandledDateFromRef.current = clickedISO;
      onChange({ dateFrom: clickedISO, dateTo: clickedISO });
      return;
    }

    // If single date is currently selected (or no date selected):
    if (!currentFrom) {
      lastHandledDateFromRef.current = clickedISO;
      onChange({ dateFrom: clickedISO, dateTo: clickedISO });
    } else {
      if (clickedISO < currentFrom) {
        lastHandledDateFromRef.current = clickedISO;
        onChange({ dateFrom: clickedISO, dateTo: clickedISO });
      } else {
        lastHandledDateFromRef.current = currentFrom;
        onChange({ dateFrom: currentFrom, dateTo: clickedISO });
      }
    }
  };

  // Jump to next available slot from today
  const handleJumpNextAvailable = () => {
    const today = getTodayMidnight();
    const todayISO = fmtISO(today);
    lastHandledDateFromRef.current = todayISO;
    setViewYear((prevY) => (prevY !== today.getFullYear() ? today.getFullYear() : prevY));
    setViewMonth((prevM) => (prevM !== today.getMonth() ? today.getMonth() : prevM));
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
    <div style={css('border:1px solid #334155;border-radius:12px;background:#1e293b;padding:14px;display:flex;flex-direction:column;gap:12px;margin-top:6px')}>
      {/* Top Controls Header */}
      <div style={css('display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid #334155;padding-bottom:10px')}>
        <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:700;color:#f8fafc;letter-spacing:.4px")}>
          DATE SELECTION
        </div>
      </div>

      {/* Month Header & Jump Button */}
      <div style={css('display:flex;align-items:center;justify-content:space-between;gap:8px')}>
        <div style={css('display:flex;align-items:center;gap:8px')}>
          <HButton
            type="button"
            onClick={handlePrevMonth}
            style={css('width:28px;height:28px;border:1px solid #334155;background:#0f172a;border-radius:6px;cursor:pointer;color:#f8fafc;font-size:13px;display:flex;align-items:center;justify-content:center')}
            hover={{ background: '#334155' }}
          >
            ‹
          </HButton>
          <span style={css('font-size:13.5px;font-weight:700;color:#f8fafc;min-width:110px')}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <HButton
            type="button"
            onClick={handleNextMonth}
            style={css('width:28px;height:28px;border:1px solid #334155;background:#0f172a;border-radius:6px;cursor:pointer;color:#f8fafc;font-size:13px;display:flex;align-items:center;justify-content:center')}
            hover={{ background: '#334155' }}
          >
            ›
          </HButton>
        </div>

        <HButton
          type="button"
          onClick={handleJumpNextAvailable}
          style={css("background:#1e3a8a;border:1px solid #2563eb;color:#93c5fd;border-radius:7px;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif;display:flex;align-items:center;gap:4px")}
          hover={{ background: '#1d4ed8' }}
        >
          ⚡ Jump to next available
        </HButton>
      </div>

      {notice && (
        <div style={css('font-size:11px;color:#34d399;background:#064e3b;border:1px solid #059669;border-radius:6px;padding:6px 10px;animation:fadeIn .15s ease')}>
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
                i >= 5 ? 'color:#64748b;' : 'color:#94a3b8;'
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
          const holiday = getHolidayForDate(day);
          const isDark = typeof document !== 'undefined' && document.body.classList.contains('dark-mode');
          const holStyle = holiday ? getHolidayStyle(holiday, isDark) : null;
          const isBooked = bookedDatesSet.has(iso);

          // Check if day is part of current selected range
          const inSelected = selectedRange
            ? selectedRange.dates.some((d) => isSameDay(d, day))
            : false;
          const isStart = dateFrom ? iso === dateFrom : false;
          const isEnd = _dateTo ? iso === _dateTo : isStart;

          let cellStyle = 'background:#064e3b;color:#34d399;border:1px solid #059669;font-weight:600;border-radius:6px;cursor:pointer;';
          let tooltip: string | undefined = undefined;

          if (businessDaysOnly && wkend) {
            cellStyle = 'background:#0f172a;color:#475569;border:1px solid #1e293b;cursor:default;';
            tooltip = 'Weekend (business days only)';
          } else if (holiday && holStyle) {
            cellStyle = `background:${holStyle.bg};color:${holStyle.textColor};border:1px solid ${holStyle.borderColor};font-weight:600;border-radius:6px;cursor:default;opacity:0.9;`;
            tooltip = `${holiday.name}${holiday.subtitle ? ` (${holiday.subtitle})` : ''}: ${fmtDisplay(day)}${isOfficialHoliday(holiday) ? ' (Holiday)' : ''}`;
          } else if (inSelected) {
            const borderRadius = isStart && isEnd ? '7px' : isStart ? '7px 0 0 7px' : isEnd ? '0 7px 7px 0' : '0';
            cellStyle = `background:#2563eb;color:#fff;border:1px solid #3b82f6;font-weight:700;border-radius:${borderRadius};cursor:pointer;`;
            tooltip = undefined;
          } else if (isBooked) {
            cellStyle = 'background:#450a0a;color:#f87171;border:1px solid #991b1b;cursor:pointer;font-weight:600;border-radius:6px;';
            tooltip = undefined;
          } else {
            cellStyle = 'background:#064e3b;color:#34d399;border:1px solid #059669;font-weight:600;border-radius:6px;cursor:pointer;';
            tooltip = `Click to select date: ${fmtDisplay(day)}`;
          }

          return (
            <div
              key={iso}
              title={tooltip}
              onClick={() => handleSelectDate(day)}
              onMouseEnter={(e) => {
                if (isBooked) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredCellRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
                  setHoveredBookedIso(iso);
                }
              }}
              onMouseLeave={() => {
                if (hoveredBookedIso === iso) {
                  setHoveredBookedIso(null);
                  setHoveredCellRect(null);
                }
              }}
              style={css(
                `height:34px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;font-size:12px;font-family:'Archivo',sans-serif;user-select:none;transition:all .12s ease;${cellStyle}`
              )}
            >
              <span>{day.getDate()}</span>
              {isBooked && (
                <span
                  style={{
                    width: inSelected ? '6px' : '5px',
                    height: inSelected ? '6px' : '5px',
                    borderRadius: '50%',
                    background: inSelected ? '#ef4444' : '#f87171',
                    border: inSelected ? '1px solid #fff' : 'none',
                    position: 'absolute',
                    top: '3px',
                    right: '3px',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Hover Tooltip Anchored directly to Hovered Cell */}
      {hoveredBookedIso && hoveredCellRect && (bookedDetailsMap.get(hoveredBookedIso)?.length ?? 0) > 0 && (() => {
        const items = bookedDetailsMap.get(hoveredBookedIso) || [];
        const isNearTop = hoveredCellRect.top < 140;
        const tooltipTop = isNearTop ? hoveredCellRect.top + hoveredCellRect.height + 8 : hoveredCellRect.top - 8;
        const tooltipLeft = hoveredCellRect.left + hoveredCellRect.width / 2;

        return (
          <div
            style={{
              position: 'fixed',
              top: `${tooltipTop}px`,
              left: `${tooltipLeft}px`,
              transform: isNearTop ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
              zIndex: 9999,
              pointerEvents: 'none',
              background: '#1e293b',
              border: '1px solid #334155',
              borderLeft: '4px solid #f59e0b',
              borderRadius: '8px',
              padding: '10px 14px',
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              minWidth: '280px',
              maxWidth: '420px',
              overflow: 'hidden',
              scrollbarWidth: 'none',
              animation: 'fadeIn .12s ease',
            }}
          >
            {/* Header with warning icon and amber uppercase title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #334155', paddingBottom: '7px', marginBottom: '7px' }}>
              <span style={{ fontSize: '15px', color: '#f59e0b', flexShrink: 0 }}>⚠️</span>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', letterSpacing: '.5px', fontFamily: "'IBM Plex Mono',monospace" }}>
                BOOKED DATE DETAILS ({items.length} {items.length === 1 ? 'EVENT' : 'EVENTS'})
              </div>
            </div>

            {/* Stacked list of items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: '#f8fafc',
                    lineHeight: '1.4',
                    wordBreak: 'break-word',
                    fontFamily: "'Archivo',sans-serif",
                    paddingBottom: i < items.length - 1 ? '7px' : '0',
                    borderBottom: i < items.length - 1 ? '1px solid #334155' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      background: item.isInternal ? 'rgba(16, 185, 129, 0.25)' : 'rgba(37, 99, 235, 0.25)',
                      color: item.isInternal ? '#34d399' : '#60a5fa',
                      fontWeight: 700,
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      flexShrink: 0,
                      lineHeight: 1,
                    }}
                  >
                    {item.isInternal ? 'IA' : 'CS'}
                  </span>
                  <span>{item.tooltipText.replace(/^⚠️\s*Booked:\s*/, '')}</span>
                </div>
              ))}
            </div>

            {/* Bottom/Top Pointing Arrow / Caret */}
            <div
              style={
                isNearTop
                  ? {
                      position: 'absolute',
                      top: '-7px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '7px solid transparent',
                      borderRight: '7px solid transparent',
                      borderBottom: '7px solid #1e293b',
                    }
                  : {
                      position: 'absolute',
                      bottom: '-7px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '7px solid transparent',
                      borderRight: '7px solid transparent',
                      borderTop: '7px solid #1e293b',
                    }
              }
            />
          </div>
        );
      })()}

      {/* Range Display & Confirm Bar */}
      <div style={css('display:flex;align-items:center;justify-content:space-between;gap:10px;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:9px 12px')}>
        <div style={css('line-height:1.2')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#94a3b8;letter-spacing:.4px")}>SELECTED RANGE</div>
          <div style={css('font-size:12px;font-weight:700;color:#f8fafc;margin-top:2px')}>
            {selectedRange
              ? `${fmtDisplay(selectedRange.start)}${isSameDay(selectedRange.start, selectedRange.end) ? '' : ' – ' + fmtDisplay(selectedRange.end)} (${selectedRange.dates.length} ${businessDaysOnly ? 'business ' : ''}${selectedRange.dates.length === 1 ? 'day' : 'days'})`
              : 'No date selected'}
          </div>
        </div>
      </div>

      {hasConflict && (
        <div style={css('display:flex;align-items:center;gap:7px;font-size:11.5px;color:#f87171;background:#450a0a;border:1px solid #991b1b;border-radius:8px;padding:8px 12px')}>
          <span style={{ fontSize: '13px' }}>⚠️</span>
          <span>
            <strong>Booking Notice:</strong> Selected date range includes existing booking(s) for the selected Site/Auditor. You can still proceed if intended.
          </span>
        </div>
      )}

      {/* Legend Key */}
      <div style={css('display:flex;align-items:center;gap:14px;flex-wrap:wrap;border-top:1px solid #334155;padding-top:8px')}>
        <div style={css('display:flex;align-items:center;gap:5px')}>
          <span style={css('width:10px;height:10px;border-radius:3px;background:#064e3b;border:1px solid #059669')} />
          <span style={css('font-size:10.5px;color:#94a3b8')}>Available</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:5px')}>
          <span style={css('width:10px;height:10px;border-radius:3px;background:#2563eb')} />
          <span style={css('font-size:10.5px;color:#94a3b8')}>Selected</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:5px')}>
          <span style={css('width:10px;height:10px;border-radius:3px;background:#450a0a;border:1px solid #991b1b')} />
          <span style={css('font-size:10.5px;color:#f87171;font-weight:600')}>Booked</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:5px')}>
          <span style={css('width:10px;height:10px;border-radius:3px;background:#0f172a;border:1px solid #1e293b')} />
          <span style={css('font-size:10.5px;color:#94a3b8')}>Weekend</span>
        </div>
      </div>
    </div>
  );
}
