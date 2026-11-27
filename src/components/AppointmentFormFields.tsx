import { useState, useEffect, useRef, useMemo } from 'react';
import type { Assignment, Engineer } from '../types';
import { normalizeSite, sortSites } from '../types';
import {
  getHolidayForDate,
  getShutdownSitesForRange,
} from '../holidays';
import { getActiveDropdownOptions, MASTER_PLANT_SITES } from '../utils/auditOptionsHelper';
import { css } from '../ui';
import { AvailabilityDatePicker } from './AvailabilityDatePicker';

const fld = css("display:flex;flex-direction:column;width:100%;min-width:0;box-sizing:border-box;cursor:pointer");
const lbl = css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;color:#8a9088;letter-spacing:.5px;margin-bottom:6px;display:block;line-height:1;text-transform:uppercase");
const inp = css("border:1px solid #dde0d9;border-radius:8px;padding:8px 14px;min-height:42px;height:42px;font-size:12.5px;font-family:'Archivo',sans-serif;color:#23282a;outline:none;background:#fff;width:100%;min-width:0;box-sizing:border-box;cursor:pointer");


interface DateInputFieldProps {
  id: string;
  value: string;
  onChange: (isoVal: string) => void;
  style?: React.CSSProperties;
  disabled?: boolean;
  tabIndex?: number;
  hasError?: boolean;
}

function DateInputField({ id, value, onChange, style, disabled, tabIndex, hasError }: DateInputFieldProps) {
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const parseIso = (iso: string) => {
    if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [y, m, d] = iso.split('-');
      return { day: d, month: m, year: y };
    }
    return { day: '', month: '', year: '' };
  };

  const [day, setDay] = useState(() => parseIso(value).day);
  const [month, setMonth] = useState(() => parseIso(value).month);
  const [year, setYear] = useState(() => parseIso(value).year);

  // Sync state if external value changes AND user is NOT currently typing inside this container
  useEffect(() => {
    const isFocused = containerRef.current && containerRef.current.contains(document.activeElement);
    if (!isFocused) {
      const parsed = parseIso(value);
      setDay(parsed.day);
      setMonth(parsed.month);
      setYear(parsed.year);
    }
  }, [value]);

  const emitIfComplete = (dStr: string, mStr: string, yStr: string) => {
    if (!dStr && !mStr && !yStr) {
      onChange('');
      return;
    }
    const d = Number(dStr);
    const m = Number(mStr);
    const y = Number(yStr);

    const isDayComplete = dStr.length === 2 && d >= 1 && d <= 31;
    const isMonthComplete = mStr.length === 2 && m >= 1 && m <= 12;
    const isYearComplete = yStr.length === 4 && y >= 1900 && y <= 2100;

    if (isDayComplete && isMonthComplete && isYearComplete) {
      const iso = `${yStr}-${mStr.padStart(2, '0')}-${dStr.padStart(2, '0')}`;
      if (iso !== value) {
        onChange(iso);
      }
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length === 1 && Number(raw) > 3) {
      raw = '0' + raw;
    }
    const val = raw.slice(0, 2);
    setDay(val);
    emitIfComplete(val, month, year);

    if (val.length === 2) {
      monthRef.current?.focus();
      monthRef.current?.select();
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length === 1 && Number(raw) > 1) {
      raw = '0' + raw;
    }
    const val = raw.slice(0, 2);
    setMonth(val);
    emitIfComplete(day, val, year);

    if (val.length === 2) {
      yearRef.current?.focus();
      yearRef.current?.select();
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYear(val);
    emitIfComplete(day, month, val);
  };

  const handleBlur = () => {
    setTimeout(() => {
      const isFocused = containerRef.current && containerRef.current.contains(document.activeElement);
      if (!isFocused) {
        let padD = day;
        let padM = month;
        if (day.length === 1 && Number(day) >= 1) padD = day.padStart(2, '0');
        if (month.length === 1 && Number(month) >= 1) padM = month.padStart(2, '0');

        setDay(padD);
        setMonth(padM);

        const d = Number(padD);
        const m = Number(padM);
        const y = Number(year);

        if (padD && padM && year.length === 4 && d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
          const iso = `${year}-${padM}-${padD}`;
          if (iso !== value) {
            onChange(iso);
          }
        } else if (!padD && !padM && !year) {
          onChange('');
        } else {
          const parsed = parseIso(value);
          setDay(parsed.day);
          setMonth(parsed.month);
          setYear(parsed.year);
        }
      }
    }, 50);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: 'day' | 'month' | 'year'
  ) => {
    if (e.key === 'Backspace') {
      if (field === 'month' && !month) {
        dayRef.current?.focus();
      } else if (field === 'year' && !year) {
        monthRef.current?.focus();
      }
    }
  };

  return (
    <div
      id={id}
      ref={containerRef}
      style={{
        border: isFocused
          ? (hasError ? '1px solid #dc2626' : '1px solid #2756d6')
          : hasError
          ? '1px solid #ef4444'
          : '1px solid #dde0d9',
        boxShadow: isFocused
          ? (hasError ? '0 0 0 3px rgba(220, 38, 38, 0.15)' : '0 0 0 3px rgba(39, 86, 214, 0.12)')
          : hasError
          ? '0 0 0 1px rgba(239, 68, 68, 0.2)'
          : 'none',
        transition: 'border-color .15s ease, box-shadow .15s ease',
        borderRadius: '8px',
        padding: '8px 14px',
        minHeight: '42px',
        height: '42px',
        fontSize: '12.5px',
        fontFamily: "'Archivo',sans-serif",
        background: disabled ? '#f3f4f6' : hasError ? '#fff8f8' : '#fff',
        opacity: disabled ? 0.8 : 1,
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style,
      }}
      onClick={(e) => {
        if (disabled) return;
        if (e.target === containerRef.current) {
          if (!day) dayRef.current?.focus();
          else if (!month) monthRef.current?.focus();
          else yearRef.current?.focus();
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
        <input
          ref={dayRef}
          type="text"
          inputMode="numeric"
          placeholder="DD"
          maxLength={2}
          value={day}
          disabled={disabled}
          tabIndex={tabIndex}
          onChange={handleDayChange}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            handleBlur();
            if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
              setIsFocused(false);
            }
          }}
          onKeyDown={(e) => handleKeyDown(e, 'day')}
          style={css(
            `width:24px;border:none;outline:none;background:transparent;text-align:center;font-size:12.5px;font-family:'Archivo',sans-serif;font-weight:600;color:${disabled ? '#6b7280' : '#23282a'};padding:0;height:24px;line-height:24px;cursor:${disabled ? 'not-allowed' : 'pointer'}`
          )}
        />
        <span style={css('color:#8a9088;font-weight:600;user-select:none')}>/</span>
        <input
          ref={monthRef}
          type="text"
          inputMode="numeric"
          placeholder="MM"
          maxLength={2}
          value={month}
          disabled={disabled}
          onChange={handleMonthChange}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            handleBlur();
            if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
              setIsFocused(false);
            }
          }}
          onKeyDown={(e) => handleKeyDown(e, 'month')}
          style={css(
            `width:26px;border:none;outline:none;background:transparent;text-align:center;font-size:12.5px;font-family:'Archivo',sans-serif;font-weight:600;color:${disabled ? '#6b7280' : '#23282a'};padding:0;height:24px;line-height:24px;cursor:${disabled ? 'not-allowed' : 'pointer'}`
          )}
        />
        <span style={css('color:#8a9088;font-weight:600;user-select:none')}>/</span>
        <input
          ref={yearRef}
          type="text"
          inputMode="numeric"
          placeholder="YYYY"
          maxLength={4}
          value={year}
          disabled={disabled}
          onChange={handleYearChange}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            handleBlur();
            if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
              setIsFocused(false);
            }
          }}
          onKeyDown={(e) => handleKeyDown(e, 'year')}
          style={css(
            `width:40px;border:none;outline:none;background:transparent;text-align:center;font-size:12.5px;font-family:'Archivo',sans-serif;font-weight:600;color:${disabled ? '#6b7280' : '#23282a'};padding:0;height:24px;line-height:24px;cursor:${disabled ? 'not-allowed' : 'pointer'}`
          )}
        />
      </div>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a9088', pointerEvents: 'none', flexShrink: 0, marginLeft: '6px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </span>
    </div>
  );
}


export interface AppointmentFormValues {
  sectionType: 'customer' | 'internal';
  site?: string;
  site1: string;
  customer: string;
  endCustomer: string;
  purpose: string;
  targetPackage?: string;
  customerNames?: string;
  auditCategory?: string;
  auditor?: string;
  auditor1: string;
  standard?: string;
  department1: string;
  site2: string;
  area: string;
  auditor2: string;
  department2: string;
  qmsHost?: string;
  dateFrom: string;
  dateTo: string;
  warn?: boolean;
  warnText?: string;
}

function MultiSiteSelect({
  id,
  value,
  onChange,
  siteOptions,
  disabledSites,
  tabIndex,
  hasError,
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  siteOptions: string[];
  disabledSites?: string[];
  tabIndex?: number;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedSites = useMemo(() => {
    return value ? sortSites(value.split(/[/,]/).map((s) => normalizeSite(s.trim())).filter(Boolean), siteOptions) : [];
  }, [value, siteOptions]);

  const sortedSiteOptions = useMemo(() => {
    return sortSites(Array.from(new Set(siteOptions.map((s) => normalizeSite(s.trim())).filter(Boolean))), siteOptions);
  }, [siteOptions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSite = (rawSite: string) => {
    const site = normalizeSite(rawSite);
    let next: string[];
    if (selectedSites.includes(site)) {
      next = selectedSites.filter((s) => s !== site);
    } else {
      next = [...selectedSites, site];
    }
    const sorted = sortSites(next, siteOptions);
    onChange(sorted.join('/'));
  };

  const displayText = selectedSites.length > 0 ? selectedSites.join('/') : 'Select site...';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <button
        id={id}
        type="button"
        tabIndex={tabIndex}
        onClick={() => setOpen(!open)}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
            setIsFocused(false);
            setOpen(false);
          }
        }}
        style={{
          border: isFocused
            ? (hasError ? '1px solid #dc2626' : '1px solid #2756d6')
            : hasError
            ? '1px solid #ef4444'
            : '1px solid #dde0d9',
          boxShadow: isFocused
            ? (hasError ? '0 0 0 3px rgba(220, 38, 38, 0.15)' : '0 0 0 3px rgba(39, 86, 214, 0.12)')
            : hasError
            ? '0 0 0 1px rgba(239, 68, 68, 0.2)'
            : 'none',
          transition: 'border-color .15s ease, box-shadow .15s ease',
          borderRadius: '8px',
          padding: '8px 14px',
          minHeight: '42px',
          height: '42px',
          fontSize: '12.5px',
          fontFamily: "'Archivo',sans-serif",
          color: selectedSites.length > 0 ? '#23282a' : '#8a9088',
          outline: 'none',
          background: hasError ? '#fff8f8' : '#fff',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
          {displayText}
        </span>
        <span style={{ fontSize: '9px', color: '#8a9088', marginLeft: '6px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: '#fff',
            border: '1px solid #dde0d9',
            borderRadius: '8px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            zIndex: 100,
            maxHeight: '200px',
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          {sortedSiteOptions.map((s) => {
            const isSel = selectedSites.includes(s);
            const isShutDown = Boolean(disabledSites && disabledSites.includes(s));
            return (
              <div
                key={s}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (!isShutDown) toggleSite(s);
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  cursor: isShutDown ? 'not-allowed' : 'pointer',
                  fontSize: '12.5px',
                  fontFamily: "'Archivo',sans-serif",
                  fontWeight: isSel ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isShutDown ? '#f8fafc' : isSel ? '#eef2fd' : '#fff',
                  color: isShutDown ? '#94a3b8' : isSel ? '#2756d6' : '#23282a',
                  transition: 'background .1s ease',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  outline: 'none',
                  opacity: isShutDown ? 0.7 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ userSelect: 'none', WebkitUserSelect: 'none', cursor: isShutDown ? 'not-allowed' : 'pointer' }}>{s}</span>
                  {isShutDown && (
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        background: '#fee2e2',
                        border: '1px solid #fca5a5',
                        color: '#dc2626',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        letterSpacing: '0.2px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Shutdown
                    </span>
                  )}
                </div>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '3px',
                    border: '1px solid ' + (isShutDown ? '#cbd5e1' : isSel ? '#2756d6' : '#cdd2c9'),
                    background: isShutDown ? '#f1f5f9' : isSel ? '#2756d6' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    color: '#fff',
                    flexShrink: 0,
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    cursor: isShutDown ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSel ? '✓' : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AutocompleteInput({
  id,
  value,
  onChange,
  placeholder,
  suggestions,
  onAddNew,
  onRemoveOption,
  tabIndex,
  hasError,
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  suggestions: string[];
  onAddNew?: (val: string) => void;
  onRemoveOption?: (val: string) => void;
  tabIndex?: number;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const rawVal = (value || '').replace(/^\$+/, '');
  const trimmedVal = rawVal.trim().toLowerCase();

  const matches = useMemo(() => {
    const unique = Array.from(new Set(suggestions.map((s) => s.replace(/^\$+/, '').trim()).filter(Boolean)));
    const filtered = unique.filter((s) => !removedItems.has(s));
    if (!trimmedVal) return filtered;
    return filtered.filter((s) => s.toLowerCase().includes(trimmedVal));
  }, [suggestions, trimmedVal, removedItems]);

  const exactMatchExists = suggestions.some(
    (s) => s.replace(/^\$+/, '').trim().toLowerCase() === trimmedVal
  );

  const handleAddNew = (newVal: string) => {
    const clean = newVal.replace(/^\$+/, '').trim();
    if (!clean) return;
    if (onAddNew) {
      onAddNew(clean);
    }
    onChange(clean);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      <div
        onClick={() => {
          inputRef.current?.focus();
          setOpen(true);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: isFocused
            ? (hasError ? '1px solid #dc2626' : '1px solid #2756d6')
            : hasError
            ? '1px solid #ef4444'
            : '1px solid #dde0d9',
          boxShadow: isFocused
            ? (hasError ? '0 0 0 3px rgba(220, 38, 38, 0.15)' : '0 0 0 3px rgba(39, 86, 214, 0.12)')
            : hasError
            ? '0 0 0 1px rgba(239, 68, 68, 0.2)'
            : 'none',
          transition: 'border-color .15s ease, box-shadow .15s ease',
          borderRadius: '8px',
          background: hasError ? '#fff8f8' : '#fff',
          width: '100%',
          minWidth: 0,
          minHeight: '42px',
          height: '42px',
          boxSizing: 'border-box',
          padding: '8px 14px',
          cursor: 'pointer',
          gap: '6px',
        }}
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          tabIndex={tabIndex}
          value={rawVal}
          onChange={(e) => {
            const cleanVal = e.target.value.replace(/^\$+/, '');
            onChange(cleanVal);
            setOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setOpen(true);
          }}
          onBlur={(e) => {
            if (ref.current && !ref.current.contains(e.relatedTarget as Node)) {
              setIsFocused(false);
              setOpen(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (rawVal.trim()) {
                handleAddNew(rawVal);
              }
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: 0,
            margin: 0,
            fontSize: '12.5px',
            fontFamily: "'Archivo',sans-serif",
            color: '#23282a',
            width: '100%',
            flex: 1,
            minWidth: 0,
            height: '24px',
            lineHeight: '24px',
            boxSizing: 'border-box',
          }}
          autoComplete="off"
        />
        {Boolean(value) && (
          <button
            type="button"
            tabIndex={-1}
            title="Clear"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              inputRef.current?.focus();
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#8a9088',
              cursor: 'pointer',
              padding: '2px 4px',
              fontSize: '11px',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#8a9088';
            }}
          >
            ✕
          </button>
        )}
        <span
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          style={{
            fontSize: '9px',
            color: '#8a9088',
            cursor: 'pointer',
            padding: '2px',
            userSelect: 'none',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {open ? '▲' : '▼'}
        </span>
      </div>
      {open && (matches.length > 0 || (rawVal.trim() && !exactMatchExists)) && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: '#fff',
            border: '1px solid #dde0d9',
            borderRadius: '8px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            zIndex: 100,
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          {matches.map((item) => (
            <div
              key={item}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(item);
                setOpen(false);
              }}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontFamily: "'Archivo',sans-serif",
                color: '#23282a',
                background: item === value ? '#f4f6f0' : 'transparent',
                fontWeight: item === value ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                transition: 'background .1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = item === value ? '#edf0e8' : '#f0f2ec')}
              onMouseLeave={(e) => (e.currentTarget.style.background = item === value ? '#f4f6f0' : 'transparent')}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {item.replace(/^\$+/, '')}
              </span>
              {onRemoveOption && (
                <button
                  type="button"
                  tabIndex={-1}
                  title={`Delete "${item.replace(/^\$+/, '')}" from saved options`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setRemovedItems((prev) => new Set(prev).add(item));
                    onRemoveOption(item);
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#8a9088',
                    cursor: 'pointer',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fee2e2';
                    e.currentTarget.style.color = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#8a9088';
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {rawVal.trim() && !exactMatchExists && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                handleAddNew(rawVal);
              }}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontFamily: "'Archivo',sans-serif",
                fontWeight: 600,
                color: '#2756d6',
                background: '#eef2fd',
                border: '1px solid #d8e2fa',
                marginTop: matches.length > 0 ? '4px' : '0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#e0e8fc')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#eef2fd')}
            >
              <span>＋ Add "{rawVal.replace(/^\$+/, '').trim()}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}



/** Generic multi-select combobox with inline tags, search filter, free-text add & option removal. */
function MultiSelectCombobox({
  id,
  value,
  onChange,
  suggestions,
  placeholder = 'Type or select...',
  addPlaceholder = 'Add...',
  emptyText = 'No options found',
  onAddNew,
  onRemoveOption,
  tabIndex,
  hasError,
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
  addPlaceholder?: string;
  emptyText?: string;
  onAddNew?: (val: string) => void;
  onRemoveOption?: (val: string) => void;
  tabIndex?: number;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItems = useMemo(() => {
    return value
      ? value.split(',').map((s) => s.replace(/^\$+/, '').trim()).filter(Boolean)
      : [];
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setInputVal('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleItem = (name: string) => {
    const cleanName = name.replace(/^\$+/, '').trim();
    if (!cleanName) return;
    const isAlreadySel = selectedItems.some((s) => s.toLowerCase() === cleanName.toLowerCase());
    const next = isAlreadySel
      ? selectedItems.filter((s) => s.toLowerCase() !== cleanName.toLowerCase())
      : [...selectedItems, cleanName];
    onChange(next.join(', '));
  };

  const removeItem = (name: string) => {
    const next = selectedItems.filter((s) => s.toLowerCase() !== name.toLowerCase());
    onChange(next.join(', '));
  };

  const addCustom = () => {
    const clean = inputVal.replace(/^\$+/, '').trim();
    if (!clean) return;
    const pieces = clean.split(',').map((s) => s.replace(/^\$+/, '').trim()).filter(Boolean);
    const toAdd = pieces.filter((p) => !selectedItems.some((sel) => sel.toLowerCase() === p.toLowerCase()));
    if (toAdd.length > 0) {
      onChange([...selectedItems, ...toAdd].join(', '));
      if (onAddNew) {
        toAdd.forEach((p) => {
          if (!suggestions.some((s) => s.toLowerCase() === p.toLowerCase())) {
            onAddNew(p);
          }
        });
      }
    }
    setInputVal('');
  };

  const filteredSuggestions = useMemo(() => {
    const q = inputVal.trim().toLowerCase();
    const unique = Array.from(new Set(suggestions.map((s) => s.replace(/^\$+/, '').trim()).filter(Boolean)))
      .filter((s) => !removedItems.has(s));
    return q ? unique.filter((s) => s.toLowerCase().includes(q)) : unique;
  }, [suggestions, inputVal, removedItems]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {/* Combobox Input Box with Tags */}
      <div
        onClick={() => {
          inputRef.current?.focus();
          setOpen(true);
        }}
        style={{
          border: isFocused
            ? (hasError ? '1px solid #dc2626' : '1px solid #2756d6')
            : hasError
            ? '1px solid #ef4444'
            : '1px solid #dde0d9',
          boxShadow: isFocused
            ? (hasError ? '0 0 0 3px rgba(220, 38, 38, 0.15)' : '0 0 0 3px rgba(39, 86, 214, 0.12)')
            : hasError
            ? '0 0 0 1px rgba(239, 68, 68, 0.2)'
            : 'none',
          transition: 'border-color .15s ease, box-shadow .15s ease',
          borderRadius: '8px',
          padding: '6px 14px',
          minHeight: '42px',
          fontSize: '12.5px',
          fontFamily: "'Archivo',sans-serif",
          background: hasError ? '#fff8f8' : '#fff',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          cursor: 'pointer',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {selectedItems.map((name) => (
          <span
            key={name}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 7px',
              borderRadius: '5px',
              background: '#eef2fd',
              border: '1px solid #d4def0',
              fontSize: '11.5px',
              fontFamily: "'Archivo',sans-serif",
              fontWeight: 600,
              color: '#2756d6',
            }}
          >
            {name.replace(/^\$+/, '')}
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeItem(name);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#2756d6',
                cursor: 'pointer',
                padding: 0,
                fontSize: '10px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              ✕
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={id}
          type="text"
          tabIndex={tabIndex}
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value.replace(/^\$+/, ''));
            setOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setOpen(true);
          }}
          onBlur={(e) => {
            if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
              setIsFocused(false);
              setOpen(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            } else if (e.key === 'Backspace' && !inputVal && selectedItems.length > 0) {
              removeItem(selectedItems[selectedItems.length - 1]);
            }
          }}
          placeholder={selectedItems.length === 0 ? placeholder : addPlaceholder}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '12.5px',
            fontFamily: "'Archivo',sans-serif",
            color: '#23282a',
            flex: 1,
            minWidth: '100px',
            padding: '2px 0',
          }}
          autoComplete="off"
        />

        {selectedItems.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            title="Clear all"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange('');
              setInputVal('');
              inputRef.current?.focus();
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#8a9088',
              cursor: 'pointer',
              padding: '2px 4px',
              fontSize: '11px',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#8a9088';
            }}
          >
            ✕
          </button>
        )}

        <span
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          style={{
            fontSize: '9px',
            color: '#8a9088',
            marginLeft: selectedItems.length === 0 ? 'auto' : '2px',
            flexShrink: 0,
            cursor: 'pointer',
            padding: '2px',
          }}
        >
          {open ? '▲' : '▼'}
        </span>
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: '#fff',
            border: '1px solid #dde0d9',
            borderRadius: '8px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            zIndex: 100,
            padding: '4px',
            maxHeight: '210px',
            overflowY: 'auto',
          }}
        >
          {inputVal.trim() && !filteredSuggestions.some((s) => s.toLowerCase() === inputVal.trim().toLowerCase()) && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                addCustom();
              }}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                color: '#2756d6',
                background: '#eef2fd',
                border: '1px solid #d4def0',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>＋ Add "{inputVal.replace(/^\$+/, '').trim()}"</span>
            </div>
          )}

          {filteredSuggestions.length === 0 && !inputVal.trim() && (
            <div style={{ padding: '8px 10px', fontSize: '12px', color: '#8a9088', fontFamily: "'Archivo',sans-serif" }}>
              {emptyText}
            </div>
          )}

          {filteredSuggestions.map((name) => {
            const isSel = selectedItems.some((s) => s.toLowerCase() === name.toLowerCase());
            return (
              <div
                key={name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  toggleItem(name.replace(/^\$+/, '').trim());
                  setInputVal('');
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontFamily: "'Archivo',sans-serif",
                  fontWeight: isSel ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isSel ? '#eef2fd' : '#fff',
                  color: isSel ? '#2756d6' : '#23282a',
                  transition: 'background .1s ease',
                  marginBottom: '2px',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  outline: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer' }}>
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      flexShrink: 0,
                      border: '1px solid ' + (isSel ? '#2756d6' : '#cdd2c9'),
                      background: isSel ? '#2756d6' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      color: '#fff',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {isSel ? '✓' : ''}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer' }}>
                    {name.replace(/^\$+/, '')}
                  </span>
                </div>

                {onRemoveOption && (
                  <button
                    type="button"
                    tabIndex={-1}
                    title={"Delete \"" + name.replace(/^\$+/, '') + "\" from saved options"}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRemovedItems((prev) => new Set(prev).add(name));
                      onRemoveOption(name);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#8a9088',
                      cursor: 'pointer',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fee2e2';
                      e.currentTarget.style.color = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#8a9088';
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Multi-select standard field — combobox with inline tags, search filter, free-text add & option removal. */
function MultiStandardSelect({
  id,
  value,
  onChange,
  suggestions,
  onAddNew,
  onRemoveOption,
  tabIndex,
  inputRef,
  hasError,
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  onAddNew?: (val: string) => void;
  onRemoveOption?: (val: string) => void;
  tabIndex?: number;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const activeInputRef = inputRef || internalInputRef;

  const sortStandardsBySuggestions = (items: string[]) => {
    const orderMap = new Map<string, number>();
    suggestions.forEach((s, idx) => orderMap.set(s.trim().toLowerCase(), idx));
    return [...items].sort((a, b) => {
      const idxA = orderMap.has(a.trim().toLowerCase()) ? orderMap.get(a.trim().toLowerCase())! : 999;
      const idxB = orderMap.has(b.trim().toLowerCase()) ? orderMap.get(b.trim().toLowerCase())! : 999;
      if (idxA !== idxB) return idxA - idxB;
      return a.localeCompare(b);
    });
  };

  const selectedStandards = useMemo(() => {
    if (!value) return [];
    const parsed = value.split(',').map((s) => s.replace(/^\$+/, '').trim()).filter(Boolean);
    const orderMap = new Map<string, number>();
    suggestions.forEach((s, idx) => orderMap.set(s.replace(/^\$+/, '').trim().toLowerCase(), idx));
    return [...parsed].sort((a, b) => {
      const idxA = orderMap.has(a.trim().toLowerCase()) ? orderMap.get(a.trim().toLowerCase())! : 999;
      const idxB = orderMap.has(b.trim().toLowerCase()) ? orderMap.get(b.trim().toLowerCase())! : 999;
      if (idxA !== idxB) return idxA - idxB;
      return a.localeCompare(b);
    });
  }, [value, suggestions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setInputVal('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleStandard = (name: string) => {
    const cleanName = name.replace(/^\$+/, '').trim();
    if (!cleanName) return;
    const isAlreadySel = selectedStandards.some((s) => s.toLowerCase() === cleanName.toLowerCase());
    const next = isAlreadySel
      ? selectedStandards.filter((s) => s.toLowerCase() !== cleanName.toLowerCase())
      : [...selectedStandards, cleanName];
    onChange(sortStandardsBySuggestions(next).join(', '));
  };

  const removeStandard = (name: string) => {
    const next = selectedStandards.filter((s) => s.toLowerCase() !== name.toLowerCase());
    onChange(sortStandardsBySuggestions(next).join(', '));
  };

  const addCustom = () => {
    const clean = inputVal.replace(/^\$+/, '').trim();
    if (!clean) return;
    const pieces = clean.split(',').map((s) => s.replace(/^\$+/, '').trim()).filter(Boolean);
    const toAdd = pieces.filter((p) => !selectedStandards.some((sel) => sel.toLowerCase() === p.toLowerCase()));
    if (toAdd.length > 0) {
      onChange(sortStandardsBySuggestions([...selectedStandards, ...toAdd]).join(', '));
      if (onAddNew) {
        toAdd.forEach((p) => {
          if (!suggestions.some((s) => s.toLowerCase() === p.toLowerCase())) {
            onAddNew(p);
          }
        });
      }
    }
    setInputVal('');
  };

  const filteredSuggestions = useMemo(() => {
    const q = inputVal.trim().toLowerCase();
    const unique = Array.from(new Set(suggestions.map((s) => s.replace(/^\$+/, '').trim()).filter(Boolean)))
      .filter((s) => !removedItems.has(s));
    return q ? unique.filter((s) => s.toLowerCase().includes(q)) : unique;
  }, [suggestions, inputVal, removedItems]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {/* Combobox Input Box with Tags */}
      <div
        onClick={() => {
          activeInputRef.current?.focus();
          setOpen(true);
        }}
        style={{
          border: isFocused
            ? (hasError ? '1px solid #dc2626' : '1px solid #2756d6')
            : hasError
            ? '1px solid #ef4444'
            : '1px solid #dde0d9',
          boxShadow: isFocused
            ? (hasError ? '0 0 0 3px rgba(220, 38, 38, 0.15)' : '0 0 0 3px rgba(39, 86, 214, 0.12)')
            : hasError
            ? '0 0 0 1px rgba(239, 68, 68, 0.2)'
            : 'none',
          transition: 'border-color .15s ease, box-shadow .15s ease',
          borderRadius: '8px',
          padding: '6px 14px',
          minHeight: '42px',
          fontSize: '12.5px',
          fontFamily: "'Archivo',sans-serif",
          background: hasError ? '#fff8f8' : '#fff',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          cursor: 'pointer',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {selectedStandards.map((name) => (
          <span
            key={name}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 7px',
              borderRadius: '5px',
              background: '#eef2fd',
              border: '1px solid #d4def0',
              fontSize: '11.5px',
              fontFamily: "'Archivo',sans-serif",
              fontWeight: 600,
              color: '#2756d6',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            {name.replace(/^\$+/, '')}
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeStandard(name);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#2756d6',
                cursor: 'pointer',
                padding: 0,
                fontSize: '10px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              ✕
            </button>
          </span>
        ))}

        <input
          ref={activeInputRef}
          id={id}
          type="text"
          tabIndex={tabIndex}
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value.replace(/^\$+/, ''));
            setOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setOpen(true);
          }}
          onBlur={(e) => {
            if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
              setIsFocused(false);
              setOpen(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            } else if (e.key === 'Backspace' && !inputVal && selectedStandards.length > 0) {
              removeStandard(selectedStandards[selectedStandards.length - 1]);
            }
          }}
          placeholder={selectedStandards.length === 0 ? "Type or select standard(s)..." : "Add standard..."}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '12.5px',
            fontFamily: "'Archivo',sans-serif",
            color: '#23282a',
            flex: 1,
            minWidth: '100px',
            padding: '2px 0',
          }}
          autoComplete="off"
        />

        {selectedStandards.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            title="Clear all standards"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange('');
              setInputVal('');
              activeInputRef.current?.focus();
            }}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#8a9088',
              cursor: 'pointer',
              padding: '2px 4px',
              fontSize: '11px',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#8a9088';
            }}
          >
            ✕
          </button>
        )}

        <span
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          style={{
            fontSize: '9px',
            color: '#8a9088',
            marginLeft: selectedStandards.length === 0 ? 'auto' : '2px',
            flexShrink: 0,
            cursor: 'pointer',
            padding: '2px',
          }}
        >
          {open ? '▲' : '▼'}
        </span>
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: '#fff',
            border: '1px solid #dde0d9',
            borderRadius: '8px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            zIndex: 100,
            padding: '4px',
            maxHeight: '210px',
            overflowY: 'auto',
          }}
        >
          {inputVal.trim() && !filteredSuggestions.some((s) => s.toLowerCase() === inputVal.trim().toLowerCase()) && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                addCustom();
              }}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                color: '#2756d6',
                background: '#eef2fd',
                border: '1px solid #d4def0',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>＋ Add "{inputVal.replace(/^\$+/, '').trim()}"</span>
            </div>
          )}

          {filteredSuggestions.length === 0 && !inputVal.trim() && (
            <div style={{ padding: '8px 10px', fontSize: '12px', color: '#8a9088', fontFamily: "'Archivo',sans-serif" }}>
              No standards found
            </div>
          )}

          {filteredSuggestions.map((name) => {
            const isSel = selectedStandards.some((s) => s.toLowerCase() === name.toLowerCase());
            return (
              <div
                key={name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  toggleStandard(name.replace(/^\$+/, '').trim());
                  setInputVal('');
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontFamily: "'Archivo',sans-serif",
                  fontWeight: isSel ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isSel ? '#eef2fd' : '#fff',
                  color: isSel ? '#2756d6' : '#23282a',
                  transition: 'background .1s ease',
                  marginBottom: '2px',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  outline: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer' }}>
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      flexShrink: 0,
                      border: '1px solid ' + (isSel ? '#2756d6' : '#cdd2c9'),
                      background: isSel ? '#2756d6' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      color: '#fff',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {isSel ? '✓' : ''}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer' }}>
                    {name.replace(/^\$+/, '')}
                  </span>
                </div>

                {onRemoveOption && (
                  <button
                    type="button"
                    tabIndex={-1}
                    title={"Delete \"" + name.replace(/^\$+/, '') + "\" from saved options"}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRemovedItems((prev) => new Set(prev).add(name));
                      onRemoveOption(name);
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#8a9088',
                      cursor: 'pointer',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fee2e2';
                      e.currentTarget.style.color = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#8a9088';
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Multi-select auditor field — combobox with inline tags, search filter, free-text add & option removal. */
function MultiAuditorSelect({
  id,
  value,
  onChange,
  suggestions,
  onAddNew,
  onRemoveOption,
  tabIndex,
  hasError,
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  onAddNew?: (val: string) => void;
  onRemoveOption?: (val: string) => void;
  tabIndex?: number;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedAuditors = useMemo(() => {
    return value
      ? value.split(',').map((s) => s.replace(/^\$+/, '').trim()).filter(Boolean)
      : [];
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setInputVal('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleAuditor = (name: string) => {
    const cleanName = name.replace(/^\$+/, '').trim();
    if (!cleanName) return;
    const isAlreadySel = selectedAuditors.some((a) => a.toLowerCase() === cleanName.toLowerCase());
    const next = isAlreadySel
      ? selectedAuditors.filter((a) => a.toLowerCase() !== cleanName.toLowerCase())
      : [...selectedAuditors, cleanName];
    onChange(next.join(', '));
  };

  const removeAuditor = (name: string) => {
    const next = selectedAuditors.filter((a) => a.toLowerCase() !== name.toLowerCase());
    onChange(next.join(', '));
  };

  const addCustom = () => {
    const clean = inputVal.replace(/^\$+/, '').trim();
    if (!clean) return;
    const pieces = clean.split(',').map((s) => s.replace(/^\$+/, '').trim()).filter(Boolean);
    const toAdd = pieces.filter((p) => !selectedAuditors.some((sel) => sel.toLowerCase() === p.toLowerCase()));
    if (toAdd.length > 0) {
      onChange([...selectedAuditors, ...toAdd].join(', '));
      if (onAddNew) {
        toAdd.forEach((p) => {
          if (!suggestions.some((s) => s.toLowerCase() === p.toLowerCase())) {
            onAddNew(p);
          }
        });
      }
    }
    setInputVal('');
    setOpen(false);
  };

  const filteredSuggestions = useMemo(() => {
    const q = inputVal.trim().toLowerCase();
    const unique = Array.from(new Set(suggestions.map((s) => s.replace(/^\$+/, '').trim()).filter(Boolean)))
      .filter((s) => !removedItems.has(s));
    return q ? unique.filter((s) => s.toLowerCase().includes(q)) : unique;
  }, [suggestions, inputVal, removedItems]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {/* Combobox Input Box with Tags */}
      <div
        onClick={() => {
          inputRef.current?.focus();
          setOpen(true);
        }}
        style={{
          border: isFocused
            ? (hasError ? '1px solid #dc2626' : '1px solid #2756d6')
            : hasError
            ? '1px solid #ef4444'
            : '1px solid #dde0d9',
          boxShadow: isFocused
            ? (hasError ? '0 0 0 3px rgba(220, 38, 38, 0.15)' : '0 0 0 3px rgba(39, 86, 214, 0.12)')
            : hasError
            ? '0 0 0 1px rgba(239, 68, 68, 0.2)'
            : 'none',
          transition: 'border-color .15s ease, box-shadow .15s ease',
          borderRadius: '8px',
          padding: '6px 14px',
          minHeight: '42px',
          fontSize: '12.5px',
          fontFamily: "'Archivo',sans-serif",
          background: hasError ? '#fff8f8' : '#fff',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          cursor: 'pointer',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {selectedAuditors.map((name) => (
          <span
            key={name}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 7px',
              borderRadius: '5px',
              background: '#eef2fd',
              border: '1px solid #d4def0',
              fontSize: '11.5px',
              fontFamily: "'Archivo',sans-serif",
              fontWeight: 600,
              color: '#2756d6',
            }}
          >
            {name.replace(/^\$+/, '')}
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeAuditor(name);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#2756d6',
                cursor: 'pointer',
                padding: 0,
                fontSize: '10px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              ✕
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={id}
          type="text"
          tabIndex={tabIndex}
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value.replace(/^\$+/, ''));
            setOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setOpen(true);
          }}
          onBlur={(e) => {
            if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
              setIsFocused(false);
              setOpen(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            } else if (e.key === 'Backspace' && !inputVal && selectedAuditors.length > 0) {
              removeAuditor(selectedAuditors[selectedAuditors.length - 1]);
            }
          }}
          placeholder={selectedAuditors.length === 0 ? "Type or select QMS host(s)..." : "Add QMS host..."}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '12.5px',
            fontFamily: "'Archivo',sans-serif",
            color: '#23282a',
            flex: 1,
            minWidth: '100px',
            padding: '2px 0',
          }}
          autoComplete="off"
        />

        <span
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          style={{
            fontSize: '9px',
            color: '#8a9088',
            marginLeft: 'auto',
            flexShrink: 0,
            cursor: 'pointer',
            padding: '2px',
          }}
        >
          {open ? '▲' : '▼'}
        </span>
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: '#fff',
            border: '1px solid #dde0d9',
            borderRadius: '8px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            zIndex: 100,
            padding: '4px',
            maxHeight: '210px',
            overflowY: 'auto',
          }}
        >
          {inputVal.trim() && !filteredSuggestions.some((s) => s.toLowerCase() === inputVal.trim().toLowerCase()) && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                addCustom();
              }}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                color: '#2756d6',
                background: '#eef2fd',
                border: '1px solid #d4def0',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>＋ Add "{inputVal.replace(/^\$+/, '').trim()}"</span>
            </div>
          )}

          {filteredSuggestions.length === 0 && !inputVal.trim() && (
            <div style={{ padding: '8px 10px', fontSize: '12px', color: '#8a9088', fontFamily: "'Archivo',sans-serif" }}>
              No QMS hosts found
            </div>
          )}

          {filteredSuggestions.map((name) => {
            const isSel = selectedAuditors.includes(name);
            return (
              <div
                key={name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  toggleAuditor(name.replace(/^\$+/, '').trim());
                  setInputVal('');
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontFamily: "'Archivo',sans-serif",
                  fontWeight: isSel ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isSel ? '#eef2fd' : '#fff',
                  color: isSel ? '#2756d6' : '#23282a',
                  transition: 'background .1s ease',
                  marginBottom: '2px',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  outline: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer' }}>
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      flexShrink: 0,
                      border: '1px solid ' + (isSel ? '#2756d6' : '#cdd2c9'),
                      background: isSel ? '#2756d6' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      color: '#fff',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {isSel ? '✓' : ''}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer' }}>
                    {name.replace(/^\$+/, '')}
                  </span>
                </div>

                {onRemoveOption && (
                  <button
                    type="button"
                    tabIndex={-1}
                    title={`Delete "${name.replace(/^\$+/, '')}" from saved options`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRemovedItems((prev) => new Set(prev).add(name));
                      onRemoveOption(name.replace(/^\$+/, '').trim());
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#8a9088',
                      cursor: 'pointer',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fee2e2';
                      e.currentTarget.style.color = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#8a9088';
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MultiAreaSelect({
  id,
  value,
  onChange,
  suggestions,
  onAddNew,
  onRemoveOption,
  tabIndex,
  hasError,
  placeholder = 'Type or select area(s)...',
  addPlaceholder = 'Add area...',
  emptyText = 'No areas found',
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  onAddNew?: (val: string) => void;
  onRemoveOption?: (val: string) => void;
  tabIndex?: number;
  hasError?: boolean;
  placeholder?: string;
  addPlaceholder?: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedAreas = useMemo(() => {
    if (!value) return [];
    const rawParts = Array.isArray(value) ? value : String(value).split(/[/,]/);
    return rawParts
      .map((s) => String(s || '').trim().replace(/^\$+/, '').trim())
      .filter(Boolean);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setInputVal('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleArea = (name: string) => {
    const cleanName = name.trim().replace(/^\$+/, '').trim();
    if (!cleanName) return;
    const isAlreadySel = selectedAreas.some((a) => a.toLowerCase() === cleanName.toLowerCase());
    const next = isAlreadySel
      ? selectedAreas.filter((a) => a.toLowerCase() !== cleanName.toLowerCase())
      : [...selectedAreas, cleanName];
    onChange(next.join(' / '));
  };

  const removeArea = (name: string) => {
    const next = selectedAreas.filter((a) => a.toLowerCase() !== name.toLowerCase());
    onChange(next.join(' / '));
  };

  const addCustom = () => {
    const clean = inputVal.trim().replace(/^\$+/, '').trim();
    if (!clean) return;
    const pieces = clean.split(/[/,]/).map((s) => s.trim().replace(/^\$+/, '').trim()).filter(Boolean);
    const toAdd = pieces.filter((p) => !selectedAreas.some((sel) => sel.toLowerCase() === p.toLowerCase()));
    if (toAdd.length > 0) {
      onChange([...selectedAreas, ...toAdd].join(' / '));
      if (onAddNew) {
        toAdd.forEach((p) => {
          if (!suggestions.some((s) => s.toLowerCase() === p.toLowerCase())) {
            onAddNew(p);
          }
        });
      }
    }
    setInputVal('');
    setOpen(false);
  };

  const filteredSuggestions = useMemo(() => {
    const q = inputVal.trim().toLowerCase();
    const unique = Array.from(new Set(suggestions.map((s) => s.trim().replace(/^\$+/, '').trim()).filter(Boolean)))
      .filter((s) => !removedItems.has(s));
    return q ? unique.filter((s) => s.toLowerCase().includes(q)) : unique;
  }, [suggestions, inputVal, removedItems]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {/* Combobox Input Box with Tags */}
      <div
        onClick={() => {
          inputRef.current?.focus();
          setOpen(true);
        }}
        style={{
          border: isFocused
            ? (hasError ? '1px solid #dc2626' : '1px solid #2756d6')
            : hasError
            ? '1px solid #ef4444'
            : '1px solid #dde0d9',
          boxShadow: isFocused
            ? (hasError ? '0 0 0 3px rgba(220, 38, 38, 0.15)' : '0 0 0 3px rgba(39, 86, 214, 0.12)')
            : hasError
            ? '0 0 0 1px rgba(239, 68, 68, 0.2)'
            : 'none',
          transition: 'border-color .15s ease, box-shadow .15s ease',
          borderRadius: '8px',
          padding: '6px 14px',
          minHeight: '42px',
          fontSize: '12.5px',
          fontFamily: "'Archivo',sans-serif",
          background: hasError ? '#fff8f8' : '#fff',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          cursor: 'pointer',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {selectedAreas.map((name) => (
          <span
            key={name}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 7px',
              borderRadius: '5px',
              background: '#eef2fd',
              border: '1px solid #d4def0',
              fontSize: '11.5px',
              fontFamily: "'Archivo',sans-serif",
              fontWeight: 600,
              color: '#2756d6',
            }}
          >
            {name.replace(/^\$+/, '')}
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeArea(name);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#2756d6',
                cursor: 'pointer',
                padding: 0,
                fontSize: '10px',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              ✕
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={id}
          type="text"
          tabIndex={tabIndex}
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value.replace(/^\$+/, ''));
            setOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setOpen(true);
          }}
          onBlur={(e) => {
            if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
              setIsFocused(false);
              setOpen(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            } else if (e.key === 'Backspace' && !inputVal && selectedAreas.length > 0) {
              removeArea(selectedAreas[selectedAreas.length - 1]);
            }
          }}
          placeholder={selectedAreas.length === 0 ? placeholder : addPlaceholder}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '12.5px',
            fontFamily: "'Archivo',sans-serif",
            color: '#23282a',
            padding: '2px 0',
            minWidth: '120px',
            flex: 1,
          }}
        />

        <span
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          style={{
            fontSize: '9px',
            color: '#8a9088',
            marginLeft: 'auto',
            flexShrink: 0,
            cursor: 'pointer',
            padding: '2px',
          }}
        >
          {open ? '▲' : '▼'}
        </span>
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: '#fff',
            border: '1px solid #dde0d9',
            borderRadius: '8px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            zIndex: 100,
            padding: '4px',
            maxHeight: '210px',
            overflowY: 'auto',
          }}
        >
          {inputVal.trim() && !filteredSuggestions.some((s) => s.toLowerCase() === inputVal.trim().toLowerCase()) && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                addCustom();
              }}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                color: '#2756d6',
                background: '#eef2fd',
                border: '1px solid #d4def0',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>＋ Add "{inputVal.replace(/^\$+/, '').trim()}"</span>
            </div>
          )}

          {filteredSuggestions.length === 0 && !inputVal.trim() && (
            <div style={{ padding: '8px 10px', fontSize: '12px', color: '#8a9088', fontFamily: "'Archivo',sans-serif" }}>
              {emptyText}
            </div>
          )}

          {filteredSuggestions.map((name) => {
            const isSel = selectedAreas.includes(name);
            return (
              <div
                key={name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  toggleArea(name.replace(/^\$+/, '').trim());
                  setInputVal('');
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontFamily: "'Archivo',sans-serif",
                  fontWeight: isSel ? 600 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isSel ? '#eef2fd' : '#fff',
                  color: isSel ? '#2756d6' : '#23282a',
                  transition: 'background .1s ease',
                  marginBottom: '2px',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  outline: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer' }}>
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '3px',
                      flexShrink: 0,
                      border: '1px solid ' + (isSel ? '#2756d6' : '#cdd2c9'),
                      background: isSel ? '#2756d6' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      color: '#fff',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {isSel ? '✓' : ''}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer' }}>
                    {name.replace(/^\$+/, '')}
                  </span>
                </div>

                {onRemoveOption && (
                  <button
                    type="button"
                    tabIndex={-1}
                    title={`Delete "${name.replace(/^\$+/, '')}" from saved options`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRemovedItems((prev) => new Set(prev).add(name));
                      onRemoveOption(name.replace(/^\$+/, '').trim());
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#8a9088',
                      cursor: 'pointer',
                      padding: '2px 5px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      lineHeight: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fee2e2';
                      e.currentTarget.style.color = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#8a9088';
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Shared Customer/Internal Audit field set used by both CreateModal and EditModal. */
export function AppointmentFormFields({
  idPrefix,
  values: v,
  onChange,
  isOpen,
  purposeOptions: _purposeOptions,
  addPurposeOption,
  removePurposeOption,
  addCustomerOption,
  removeCustomerOption,
  addEndCustomerOption,
  removeEndCustomerOption,
  addAuditorOption,
  removeAuditorOption,
  removeGenericOption,
  customerDepartmentOptions: _customerDepartmentOptions,
  internalDepartmentOptions: _internalDepartmentOptions,
  addCustomerDepartmentOption,
  removeCustomerDepartmentOption,
  addInternalDepartmentOption,
  removeInternalDepartmentOption,
  siteOptions,
  customerOptions: _customerOptions,
  endCustomerOptions: _endCustomerOptions = [],
  auditorOptions: _auditorOptions = [],
  removedOptions = [],
  assignments = [],
  engineers = [],
  editingTargetId,
  targetPackageOptions: _targetPackageOptions = [],
  customerNameOptions: _customerNameOptions = [],
  addTargetPackageOption,
  removeTargetPackageOption,
  addCustomerNameOption,
  removeCustomerNameOption,
  auditCategoryOptions: _auditCategoryOptions = [],
  addAuditCategoryOption,
  removeAuditCategoryOption,
  isDateLocked,
}: {
  idPrefix: string;
  values: AppointmentFormValues;
  onChange: (patch: Partial<AppointmentFormValues>) => void;
  isOpen?: boolean;
  purposeOptions: string[];
  addPurposeOption?: (val: string) => void;
  removePurposeOption?: (val: string) => void;
  addCustomerOption?: (val: string) => void;
  removeCustomerOption?: (val: string) => void;
  addEndCustomerOption?: (val: string) => void;
  removeEndCustomerOption?: (val: string) => void;
  addAuditorOption?: (val: string) => void;
  removeAuditorOption?: (val: string) => void;
  removeGenericOption?: (val: string) => void;
  customerDepartmentOptions: string[];
  internalDepartmentOptions: string[];
  addCustomerDepartmentOption?: (val: string) => void;
  removeCustomerDepartmentOption?: (val: string) => void;
  addInternalDepartmentOption?: (val: string) => void;
  removeInternalDepartmentOption?: (val: string) => void;
  siteOptions: string[];
  customerOptions: string[];
  endCustomerOptions?: string[];
  auditorOptions?: string[];
  removedOptions?: string[];
  assignments?: Assignment[];
  engineers?: Engineer[];
  editingTargetId?: string;
  targetPackageOptions?: string[];
  customerNameOptions?: string[];
  addTargetPackageOption?: (val: string) => void;
  removeTargetPackageOption?: (val: string) => void;
  addCustomerNameOption?: (val: string) => void;
  removeCustomerNameOption?: (val: string) => void;
  auditCategoryOptions?: string[];
  addAuditCategoryOption?: (val: string) => void;
  removeAuditCategoryOption?: (val: string) => void;
  isDateLocked?: boolean;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;

  const standardInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen !== false) {
      const timer = setTimeout(() => {
        standardInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, v.sectionType]);

  const [localAdded, setLocalAdded] = useState<Record<string, string[]>>({});
  const trackLocalAdd = (key: string, val: string) => {
    const clean = val.replace(/^\$+/, '').trim();
    if (!clean) return;
    setLocalAdded((prev) => ({
      ...prev,
      [key]: prev[key] ? Array.from(new Set([...prev[key], clean])) : [clean],
    }));
  };

  const isCustomerEHS = (v.standard || v.department1 || '').split(',').map((s) => s.trim()).includes('EHS');
  // Fixed master plant sites (UTL1, UTL2, UTL2A, UTL2B, UTL3, UTL3A, UTL3T) are always preserved
  void isCustomerEHS;
  const customerSiteOptions = siteOptions && siteOptions.length > 0
    ? Array.from(new Set([...MASTER_PLANT_SITES, ...siteOptions.map(normalizeSite)]))
    : Array.from(MASTER_PLANT_SITES);

  const isInternalEHS = (v.standard || v.department2 || '').split(',').map((s) => s.trim()).includes('EHS');
  const baseInternalSites = siteOptions && siteOptions.length > 0
    ? Array.from(new Set([...MASTER_PLANT_SITES, ...siteOptions.map(normalizeSite)]))
    : Array.from(MASTER_PLANT_SITES);
  const internalSiteOptions = isInternalEHS
    ? baseInternalSites.filter((s) => ['UTL1', 'UTL2', 'UTL3', 'U1', 'U2', 'U3'].includes(s)).map(normalizeSite)
    : baseInternalSites.map(normalizeSite);

  const removedSet = useMemo(() => new Set(removedOptions), [removedOptions]);

  const customerSuggestions = useMemo(() => {
    const base = getActiveDropdownOptions(assignments, 'customer').filter((c) => !removedSet.has(c));
    return Array.from(new Set([...base, ...(localAdded['customer'] || [])])).sort((a, b) => a.localeCompare(b));
  }, [assignments, removedSet, localAdded]);

  const endCustomerSuggestions = useMemo(() => {
    const base = getActiveDropdownOptions(assignments, 'endCustomer').filter((c) => !removedSet.has(c));
    return Array.from(new Set([...base, ...(localAdded['endCustomer'] || [])])).sort((a, b) => a.localeCompare(b));
  }, [assignments, removedSet, localAdded]);

  const targetPackageSuggestions = useMemo(() => {
    const base = getActiveDropdownOptions(assignments, 'targetPackage').filter((p) => !removedSet.has(p));
    return Array.from(new Set([...base, ...(localAdded['targetPackage'] || [])])).sort((a, b) => a.localeCompare(b));
  }, [assignments, removedSet, localAdded]);

  const customerNameSuggestions = useMemo(() => {
    const base = getActiveDropdownOptions(assignments, 'customerNames').filter((n) => !removedSet.has(n));
    return Array.from(new Set([...base, ...(localAdded['customerNames'] || [])])).sort((a, b) => a.localeCompare(b));
  }, [assignments, removedSet, localAdded]);

  const auditCategorySuggestions = useMemo(() => {
    const base = getActiveDropdownOptions(assignments, 'auditCategory').filter((c) => !removedSet.has(c));
    return Array.from(new Set([...base, ...(localAdded['auditCategory'] || [])])).sort((a, b) => a.localeCompare(b));
  }, [assignments, removedSet, localAdded]);

  const customerDepartmentSuggestions = useMemo(() => {
    const base = getActiveDropdownOptions(
      assignments.filter((a) => a.sectionType !== 'internal'),
      'department1'
    ).filter((d) => !removedSet.has(d));
    return Array.from(new Set([...base, ...(localAdded['department1'] || [])])).sort((a, b) => a.localeCompare(b));
  }, [assignments, removedSet, localAdded]);

  const internalDepartmentSuggestions = useMemo(() => {
    const base = getActiveDropdownOptions(
      assignments.filter((a) => a.sectionType === 'internal'),
      'department2'
    ).filter((d) => !removedSet.has(d));
    return Array.from(new Set([...base, ...(localAdded['department2'] || [])])).sort((a, b) => a.localeCompare(b));
  }, [assignments, removedSet, localAdded]);

  const purposeSuggestions = useMemo(() => {
    const base = getActiveDropdownOptions(assignments, 'purpose');
    return Array.from(new Set([...base, ...(_purposeOptions || []), ...(localAdded['purpose'] || [])]))
      .filter((p) => !removedSet.has(p))
      .sort((a, b) => a.localeCompare(b));
  }, [assignments, _purposeOptions, removedSet, localAdded]);

  const auditorSuggestions = useMemo(() => {
    const fromAssignments = getActiveDropdownOptions(assignments, 'qmsHost').filter((a) => !removedSet.has(a));
    const fromEngineers = (engineers || []).map((e) => (e.name || '').trim()).filter(Boolean);
    const fromOptions = (_auditorOptions || []).map((a) => (a || '').trim()).filter((a) => a && !removedSet.has(a));
    return Array.from(new Set([...fromAssignments, ...fromEngineers, ...fromOptions, ...(localAdded['auditor'] || [])])).sort((a, b) => a.localeCompare(b));
  }, [assignments, engineers, _auditorOptions, removedSet, localAdded]);

  const areaSuggestions = useMemo(() => {
    const base = getActiveDropdownOptions(assignments, 'area').filter((a) => !removedSet.has(a));
    return Array.from(new Set([...base, ...(localAdded['area'] || [])])).sort((a, b) => a.localeCompare(b));
  }, [assignments, removedSet, localAdded]);

  const isWarn = Boolean(v.warn);
  const isInternal = v.sectionType === 'internal';

  // Internal Audit field error states
  const intStd = (v.standard || v.department2 || '').trim();
  const intHost = (v.auditor || v.auditor2 || '').trim();
  const errIntDept = isWarn && isInternal && !intStd;
  const errIntSite = isWarn && isInternal && !(v.site || v.site2)?.trim();
  const errIntCategory = isWarn && isInternal && !v.auditCategory?.trim();
  const errIntArea = isWarn && isInternal && !v.area?.replace(/^[\s/]+|[\s/]+$/g, '').trim();
  const errIntHost = isWarn && isInternal && (!intHost || intHost.toLowerCase() === 'unassigned');
  const errIntFrom = isWarn && isInternal && !v.dateFrom?.trim();
  const errIntTo = isWarn && isInternal && (!v.dateTo?.trim() || (Boolean(v.dateFrom && v.dateTo) && v.dateFrom > v.dateTo));

  // Customer Audit field error states
  const custStd = (v.standard || v.department1 || '').trim();
  const custHost = (v.auditor || v.auditor1 || '').trim();
  const errCustDept = isWarn && !isInternal && !custStd;
  const errCustSite = isWarn && !isInternal && !(v.site || v.site1)?.trim();
  const errCust = isWarn && !isInternal && !v.customer?.trim();
  const errEndCust = isWarn && !isInternal && !v.endCustomer?.trim();
  const errPurpose = isWarn && !isInternal && !v.purpose?.trim();
  const errTargetPkg = isWarn && !isInternal && !v.targetPackage?.trim();
  const errCustNames = isWarn && !isInternal && !v.customerNames?.trim();
  const errCustHost = isWarn && !isInternal && (!custHost || custHost.toLowerCase() === 'unassigned');
  const errCustFrom = isWarn && !isInternal && !v.dateFrom?.trim();
  const errCustTo = isWarn && !isInternal && (!v.dateTo?.trim() || (Boolean(v.dateFrom && v.dateTo) && v.dateFrom > v.dateTo));

  // Check if date range touches a "No Customer Audits" or "Shutdown Plant" restricted day
  const dateRestrictionInfo = useMemo(() => {
    if (!v.dateFrom) return { isInternalOnly: false, hasShutdown: false, hasNoCs: false };
    const start = new Date(v.dateFrom + 'T00:00:00');
    const end = v.dateTo ? new Date(v.dateTo + 'T00:00:00') : new Date(start);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { isInternalOnly: false, hasShutdown: false, hasNoCs: false };
    }
    const cur = new Date(start);
    let hasShutdown = false;
    let hasNoCs = false;
    while (cur <= end) {
      const hol = getHolidayForDate(cur);
      if (hol?.holidayType === 'SHUTDOWN_PLANT') hasShutdown = true;
      if (hol?.holidayType === 'NO_CUSTOMER_AUDITS') hasNoCs = true;
      cur.setDate(cur.getDate() + 1);
    }
    return {
      isInternalOnly: hasShutdown || hasNoCs,
      hasShutdown,
      hasNoCs,
    };
  }, [v.dateFrom, v.dateTo]);

  const isDateInternalOnly = dateRestrictionInfo.isInternalOnly;

  // Shutdown sites across selected date range
  const shutdownInfo = useMemo(() => {
    return getShutdownSitesForRange(v.dateFrom, v.dateTo);
  }, [v.dateFrom, v.dateTo]);
  const shutdownSites = shutdownInfo.sites;

  useEffect(() => {
    const currentIntSite = v.site || v.site2 || '';
    if (v.sectionType === 'internal' && shutdownSites.length > 0 && currentIntSite) {
      const selected = currentIntSite.split(/[/,]/).map((s) => normalizeSite(s.trim())).filter(Boolean);
      const filtered = selected.filter((s) => !shutdownSites.includes(s));
      if (filtered.length !== selected.length) {
        onChange({ site: filtered.join('/'), site2: filtered.join('/') });
      }
    }
  }, [shutdownSites, v.sectionType, v.site, v.site2, onChange]);

  useEffect(() => {
    if (isDateInternalOnly && v.sectionType !== 'internal') {
      onChange({ sectionType: 'internal' });
    }
  }, [isDateInternalOnly, v.sectionType, onChange]);

  return (
    <>
      {isDateInternalOnly && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px',
          color: '#1d4ed8', fontSize: '12px', fontWeight: 500, marginBottom: '12px'
        }}>
          <span>🚫</span>
          <span>
            <strong>
              {dateRestrictionInfo.hasShutdown && dateRestrictionInfo.hasNoCs
                ? 'Shutdown Plant & No Customer Audits:'
                : dateRestrictionInfo.hasShutdown
                ? 'Shutdown Plant:'
                : 'No Customer Audits:'}
            </strong>{' '}
            {dateRestrictionInfo.hasShutdown
              ? 'The selected date range includes a Shutdown Plant date. Customer Audits are blocked; Internal Audits are permitted for non-shutdown sites.'
              : 'The selected date range includes a plant restriction day. Only Internal Audits are allowed.'}
          </span>
        </div>
      )}

      <div style={css('display:flex;gap:8px;margin-bottom:12px')}>
        <div
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (!isDateInternalOnly) {
              onChange({ sectionType: 'customer' });
            }
          }}
          title={isDateInternalOnly ? 'Customer Audits are not permitted on this date' : undefined}
          style={{
            flex: 1, padding: '9px 0', borderRadius: '8px',
            border: isDateInternalOnly
              ? '1px dashed #d4d4d8'
              : '1px solid ' + (v.sectionType === 'customer' ? '#15191e' : '#dde0d9'),
            cursor: isDateInternalOnly ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontWeight: 600, fontFamily: "'Archivo',sans-serif", textAlign: 'center',
            background: isDateInternalOnly ? '#f4f4f5' : v.sectionType === 'customer' ? '#15191e' : '#fff',
            color: isDateInternalOnly ? '#a1a1aa' : v.sectionType === 'customer' ? '#fff' : '#5c625c',
            userSelect: 'none', WebkitUserSelect: 'none', outline: 'none',
          }}
        >Customer Audit</div>
        <div
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onChange({ sectionType: 'internal' })}
          style={{
            flex: 1, padding: '9px 0', borderRadius: '8px', border: '1px solid ' + (v.sectionType === 'internal' ? '#15191e' : '#dde0d9'),
            cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: "'Archivo',sans-serif", textAlign: 'center',
            background: v.sectionType === 'internal' ? '#15191e' : '#fff',
            color: v.sectionType === 'internal' ? '#fff' : '#5c625c',
            userSelect: 'none', WebkitUserSelect: 'none', outline: 'none',
          }}
        >Internal Audit</div>
      </div>

      <div
        className="flex items-center gap-1.5 text-xs text-zinc-400 select-none py-1"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11.5px',
          color: '#8a9088',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          padding: '0 2px 2px',
          margin: '-4px 0 10px 0',
          fontFamily: "'Archivo',sans-serif",
        }}
      >
        <span
          className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 bg-zinc-100 border border-zinc-200 rounded shadow-xs font-mono"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1px 5px',
            fontSize: '10px',
            fontWeight: 600,
            fontFamily: "'IBM Plex Mono', monospace",
            color: '#5c625c',
            background: '#f4f6f1',
            border: '1px solid #dde0d9',
            borderRadius: '4px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            lineHeight: '1.3',
          }}
        >
          Tab ⇥
        </span>
        <span>Tip: Press Tab to navigate to the next field</span>
      </div>

      {v.sectionType === 'customer' && (
        <div style={css('padding:14px;border:1px solid #e8ebe4;border-radius:10px;background:#fafbf9')}>
          <div className="appointment-modal-fields" style={css('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:16px;row-gap:14px;width:100%;box-sizing:border-box')}>
            {/* ROW 1: STANDARD | SITE */}
            <div style={fld}>
              <label htmlFor={id('department1')} style={lbl}>STANDARD <span style={{ color: '#dc2626' }}>*</span></label>
              <MultiStandardSelect
                id={id('department1')}
                tabIndex={1}
                inputRef={standardInputRef}
                value={v.standard || v.department1}
                onChange={(newDept) => {
                  const currentCustSite = v.site || v.site1 || '';
                  const currentSites = currentCustSite.split('/').map((s) => s.trim()).filter(Boolean);
                  // Re-validate against the fixed customer site list
                  const validSites = currentSites.filter((s) => customerSiteOptions.includes(s));
                  onChange({ standard: newDept, department1: newDept, site: validSites.join('/'), site1: validSites.join('/') });
                }}
                suggestions={customerDepartmentSuggestions}
                onAddNew={(dept) => {
                  const clean = dept.replace(/^\$+/, '').trim();
                  trackLocalAdd('department1', clean);
                  addCustomerDepartmentOption?.(clean);
                }}
                onRemoveOption={removeCustomerDepartmentOption || removeGenericOption}
                hasError={errCustDept}
              />
            </div>

            <div style={fld}>
              <label htmlFor={id('site1')} style={lbl}>SITE <span style={{ color: '#dc2626' }}>*</span></label>
              <MultiSiteSelect
                id={id('site1')}
                tabIndex={2}
                value={v.site || v.site1}
                onChange={(site1) => onChange({ site: site1, site1 })}
                siteOptions={customerSiteOptions}
                hasError={errCustSite}
              />
            </div>

            {/* ROW 2: CUSTOMER | END CUSTOMER */}
            <div style={fld}>
              <label htmlFor={id('customer')} style={lbl}>CUSTOMER <span style={{ color: '#dc2626' }}>*</span></label>
              <AutocompleteInput
                id={id('customer')}
                tabIndex={3}
                value={v.customer}
                onChange={(customer) => onChange({ customer: customer.replace(/^\$+/, '') })}
                placeholder="Type or select customer..."
                suggestions={customerSuggestions}
                onAddNew={(newCust) => {
                  const clean = newCust.replace(/^\$+/, '').trim();
                  trackLocalAdd('customer', clean);
                  addCustomerOption?.(clean);
                }}
                onRemoveOption={removeCustomerOption}
                hasError={errCust}
              />
            </div>

            <div style={fld}>
              <label htmlFor={id('endCustomer')} style={lbl}>END CUSTOMER <span style={{ color: '#dc2626' }}>*</span></label>
              <AutocompleteInput
                id={id('endCustomer')}
                tabIndex={4}
                value={v.endCustomer}
                onChange={(endCustomer) => onChange({ endCustomer: endCustomer.replace(/^\$+/, '') })}
                placeholder="Type or select end customer..."
                suggestions={endCustomerSuggestions}
                onAddNew={(newEndCust) => {
                  const clean = newEndCust.replace(/^\$+/, '').trim();
                  trackLocalAdd('endCustomer', clean);
                  addEndCustomerOption?.(clean);
                }}
                onRemoveOption={removeEndCustomerOption || removeGenericOption}
                hasError={errEndCust}
              />
            </div>

            {/* ROW 3: PURPOSE | TARGET PACKAGE */}
            <div style={fld}>
              <label htmlFor={id('purpose')} style={lbl}>PURPOSE <span style={{ color: '#dc2626' }}>*</span></label>
              <MultiAreaSelect
                id={id('purpose')}
                tabIndex={5}
                value={v.purpose}
                onChange={(purpose) => onChange({ purpose: purpose.replace(/^\$+/, '') })}
                placeholder="Type or select purpose..."
                addPlaceholder="Add purpose..."
                emptyText="No purposes found"
                suggestions={purposeSuggestions}
                onAddNew={(newPurp) => {
                  const clean = newPurp.replace(/^\$+/, '').trim();
                  trackLocalAdd('purpose', clean);
                  addPurposeOption?.(clean);
                }}
                onRemoveOption={removePurposeOption}
                hasError={errPurpose}
              />
            </div>

            <div style={fld}>
              <label htmlFor={id('targetPackage')} style={lbl}>TARGET PACKAGE <span style={{ color: '#dc2626' }}>*</span></label>
              <MultiSelectCombobox
                id={id('targetPackage')}
                tabIndex={6}
                value={v.targetPackage || ''}
                onChange={(targetPackage) => onChange({ targetPackage })}
                placeholder="Type or select target package(s)..."
                addPlaceholder="Add target package..."
                emptyText="No target packages found"
                suggestions={targetPackageSuggestions}
                onAddNew={(newPkg) => {
                  const clean = newPkg.replace(/^\$+/, '').trim();
                  trackLocalAdd('targetPackage', clean);
                  addTargetPackageOption?.(clean);
                }}
                onRemoveOption={removeTargetPackageOption || removeGenericOption}
                hasError={errTargetPkg}
              />
            </div>

            {/* ROW 4: CUSTOMER NAME | QMS HOST */}
            <div style={fld}>
              <label htmlFor={id('customerNames')} style={lbl}>CUSTOMER NAME <span style={{ color: '#dc2626' }}>*</span></label>
              <MultiSelectCombobox
                id={id('customerNames')}
                tabIndex={7}
                value={v.customerNames || ''}
                onChange={(customerNames) => onChange({ customerNames })}
                placeholder="Type or select customer name(s)..."
                addPlaceholder="Add customer name..."
                emptyText="No customer names found"
                suggestions={customerNameSuggestions}
                onAddNew={(newCn) => {
                  const clean = newCn.replace(/^\$+/, '').trim();
                  trackLocalAdd('customerNames', clean);
                  addCustomerNameOption?.(clean);
                }}
                onRemoveOption={removeCustomerNameOption || removeGenericOption}
                hasError={errCustNames}
              />
            </div>

            <div style={fld}>
              <label htmlFor={id('auditor1')} style={lbl}>QMS HOST <span style={{ color: '#dc2626' }}>*</span></label>
              <MultiAuditorSelect
                id={id('auditor1')}
                tabIndex={8}
                value={v.auditor || v.auditor1}
                onChange={(auditor1) => onChange({ auditor: auditor1, auditor1, qmsHost: auditor1 })}
                suggestions={auditorSuggestions}
                onAddNew={(name) => {
                  const clean = name.replace(/^\$+/, '').trim();
                  trackLocalAdd('auditor', clean);
                  addAuditorOption?.(clean);
                }}
                onRemoveOption={removeAuditorOption}
                hasError={errCustHost}
              />
            </div>

            {/* ROW 5: FROM | TO */}
            <div style={fld}>
              <label htmlFor={id('dateFrom')} style={lbl}>FROM <span style={{ color: '#dc2626' }}>*</span></label>
              <DateInputField id={id('dateFrom')} tabIndex={9} value={v.dateFrom} onChange={(dateFrom) => onChange({ dateFrom })} style={inp} disabled={isDateLocked} hasError={errCustFrom} />
            </div>

            <div style={fld}>
              <label htmlFor={id('dateTo')} style={lbl}>TO <span style={{ color: '#dc2626' }}>*</span></label>
              <DateInputField id={id('dateTo')} tabIndex={10} value={v.dateTo} onChange={(dateTo) => onChange({ dateTo })} style={inp} disabled={isDateLocked} hasError={errCustTo} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              {isDateLocked ? (
                <div style={{ fontSize: '12px', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔒</span>
                  <span>Date range is locked for single-day editing. To adjust dates across the appointment, choose <strong>Edit entire appointment</strong>.</span>
                </div>
              ) : (
                <AvailabilityDatePicker
                  sectionType="customer"
                  site={v.site || v.site1}
                  auditor={v.auditor1}
                  dateFrom={v.dateFrom}
                  dateTo={v.dateTo}
                  onChange={onChange}
                  assignments={assignments}
                  engineers={engineers}
                  editingTargetId={editingTargetId}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {v.sectionType === 'internal' && (
        <div style={css('padding:14px;border:1px solid #e8ebe4;border-radius:10px;background:#fafbf9')}>
          <div className="appointment-modal-fields" style={css('display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:16px;row-gap:14px;width:100%;box-sizing:border-box')}>
            {/* 1. STANDARD */}
            <div style={fld}>
              <label htmlFor={id('department2')} style={lbl}>STANDARD <span style={{ color: '#dc2626' }}>*</span></label>
              <MultiStandardSelect
                id={id('department2')}
                tabIndex={1}
                inputRef={standardInputRef}
                value={v.standard || v.department2}
                onChange={(newDept) => {
                  const currentIntSite = v.site || v.site2 || '';
                  const currentSites = currentIntSite.split('/').map((s) => normalizeSite(s.trim())).filter(Boolean);
                  const isEHS = newDept.split(',').map((s) => s.trim()).includes('EHS');
                  const validSites = currentSites.filter((s) => !isEHS || ['UTL1', 'UTL2', 'UTL3', 'U1', 'U2', 'U3'].includes(s));
                  onChange({ standard: newDept, department2: newDept, site: validSites.join('/'), site2: validSites.join('/') });
                }}
                suggestions={internalDepartmentSuggestions}
                onAddNew={(dept) => {
                  const clean = dept.replace(/^\$+/, '').trim();
                  trackLocalAdd('department2', clean);
                  addInternalDepartmentOption?.(clean);
                }}
                onRemoveOption={removeInternalDepartmentOption || removeGenericOption}
                hasError={errIntDept}
              />
            </div>

            {/* 2. SITE */}
            <div style={fld}>
              <label htmlFor={id('site2')} style={lbl}>SITE <span style={{ color: '#dc2626' }}>*</span></label>
              <MultiSiteSelect
                id={id('site2')}
                tabIndex={2}
                value={v.site || v.site2}
                onChange={(site2) => onChange({ site: site2, site2 })}
                siteOptions={internalSiteOptions}
                disabledSites={shutdownSites}
                hasError={errIntSite}
              />
              {shutdownSites.length > 0 && (
                <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', fontWeight: 600 }}>
                  🔒 Site {shutdownSites.join(', ')} is locked due to Shutdown Plant on this date.
                </div>
              )}
            </div>

            {/* Row 2: AUDIT CATEGORY | AREA */}
            <div style={fld}>
              <label htmlFor={id('auditCategory')} style={lbl}>AUDIT CATEGORY <span style={{ color: '#dc2626' }}>*</span></label>
              <AutocompleteInput
                id={id('auditCategory')}
                tabIndex={3}
                value={v.auditCategory || ''}
                onChange={(auditCategory) => onChange({ auditCategory })}
                placeholder="Type or select audit category..."
                suggestions={auditCategorySuggestions}
                onAddNew={(cat) => {
                  const clean = cat.replace(/^\$+/, '').trim();
                  trackLocalAdd('auditCategory', clean);
                  addAuditCategoryOption?.(clean);
                }}
                onRemoveOption={removeAuditCategoryOption || removeGenericOption}
                hasError={errIntCategory}
              />
            </div>

            <div style={fld}>
              <label htmlFor={id('area')} style={lbl}>AREA <span style={{ color: '#dc2626' }}>*</span></label>
              <MultiAreaSelect
                id={id('area')}
                tabIndex={4}
                value={v.area || ''}
                onChange={(area) => onChange({ area })}
                suggestions={areaSuggestions}
                onAddNew={(newArea) => {
                  const clean = newArea.replace(/^\$+/, '').trim();
                  trackLocalAdd('area', clean);
                }}
                onRemoveOption={removeGenericOption}
                hasError={errIntArea}
              />
            </div>

            {/* Row 3: QMS HOST | (empty placeholder cell for 50/50 symmetry) */}
            <div style={fld}>
              <label htmlFor={id('auditor2')} style={lbl}>QMS HOST <span style={{ color: '#dc2626' }}>*</span></label>
              <MultiAuditorSelect
                id={id('auditor2')}
                tabIndex={5}
                value={v.auditor || v.auditor2}
                onChange={(auditor2) => onChange({ auditor: auditor2, auditor2, qmsHost: auditor2 })}
                suggestions={auditorSuggestions}
                onAddNew={(name) => {
                  const clean = name.replace(/^\$+/, '').trim();
                  trackLocalAdd('auditor', clean);
                  addAuditorOption?.(clean);
                }}
                onRemoveOption={removeAuditorOption}
                hasError={errIntHost}
              />
            </div>

            <div style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }} />

            {/* Row 4: FROM | TO */}
            <div style={fld}>
              <label htmlFor={id('dateFrom2')} style={lbl}>FROM <span style={{ color: '#dc2626' }}>*</span></label>
              <DateInputField id={id('dateFrom2')} tabIndex={6} value={v.dateFrom} onChange={(dateFrom) => onChange({ dateFrom })} style={inp} disabled={isDateLocked} hasError={errIntFrom} />
            </div>

            <div style={fld}>
              <label htmlFor={id('dateTo2')} style={lbl}>TO <span style={{ color: '#dc2626' }}>*</span></label>
              <DateInputField id={id('dateTo2')} tabIndex={7} value={v.dateTo} onChange={(dateTo) => onChange({ dateTo })} style={inp} disabled={isDateLocked} hasError={errIntTo} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              {isDateLocked ? (
                <div style={{ fontSize: '12px', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔒</span>
                  <span>Date range is locked for single-day editing. To adjust dates across the appointment, choose <strong>Edit entire appointment</strong>.</span>
                </div>
              ) : (
                <AvailabilityDatePicker
                  sectionType="internal"
                  site={v.site || v.site2}
                  auditor={v.auditor2}
                  dateFrom={v.dateFrom}
                  dateTo={v.dateTo}
                  onChange={onChange}
                  assignments={assignments}
                  engineers={engineers}
                  editingTargetId={editingTargetId}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
