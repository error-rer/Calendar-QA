import { useState, useEffect, useRef, useMemo } from 'react';
import type { Assignment, Engineer } from '../types';
import { css } from '../ui';
import { AvailabilityDatePicker } from './AvailabilityDatePicker';

const fld = css("display:flex;flex-direction:column;gap:4px");
const lbl = css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#9aa097;letter-spacing:.5px");
const inp = css("border:1px solid #dde0d9;border-radius:8px;padding:8px 10px;font-size:12.5px;font-family:'Archivo',sans-serif;color:#23282a;outline:none;background:#fff;width:100%;box-sizing:border-box");
const sel = inp;

interface DateInputFieldProps {
  id: string;
  value: string;
  onChange: (isoVal: string) => void;
  style?: React.CSSProperties;
}

function DateInputField({ id, value, onChange, style }: DateInputFieldProps) {
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        boxSizing: 'border-box',
        cursor: 'text',
      }}
      onClick={(e) => {
        if (e.target === containerRef.current) {
          if (!day) dayRef.current?.focus();
          else if (!month) monthRef.current?.focus();
          else yearRef.current?.focus();
        }
      }}
    >
      <input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        placeholder="DD"
        maxLength={2}
        value={day}
        onChange={handleDayChange}
        onBlur={handleBlur}
        onKeyDown={(e) => handleKeyDown(e, 'day')}
        style={css(
          'width:22px;border:none;outline:none;background:transparent;text-align:center;font-size:12.5px;font-family:\'Archivo\',sans-serif;font-weight:600;color:#23282a;padding:0'
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
        onChange={handleMonthChange}
        onBlur={handleBlur}
        onKeyDown={(e) => handleKeyDown(e, 'month')}
        style={css(
          'width:24px;border:none;outline:none;background:transparent;text-align:center;font-size:12.5px;font-family:\'Archivo\',sans-serif;font-weight:600;color:#23282a;padding:0'
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
        onChange={handleYearChange}
        onBlur={handleBlur}
        onKeyDown={(e) => handleKeyDown(e, 'year')}
        style={css(
          'width:38px;border:none;outline:none;background:transparent;text-align:center;font-size:12.5px;font-family:\'Archivo\',sans-serif;font-weight:600;color:#23282a;padding:0'
        )}
      />
    </div>
  );
}

export interface AppointmentFormValues {
  sectionType: 'customer' | 'internal';
  site1: string;
  customer: string;
  endCustomer: string;
  purpose: string;
  auditor1: string;
  department1: string;
  site2: string;
  area: string;
  auditor2: string;
  department2: string;
  dateFrom: string;
  dateTo: string;
}

function MultiSiteSelect({
  id,
  value,
  onChange,
  siteOptions,
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  siteOptions: string[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedSites = value ? value.split('/').map((s) => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSite = (site: string) => {
    let next: string[];
    if (selectedSites.includes(site)) {
      next = selectedSites.filter((s) => s !== site);
    } else {
      next = [...selectedSites, site];
    }
    onChange(next.join('/'));
  };

  const displayText = selectedSites.length > 0 ? selectedSites.join('/') : 'Select site...';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          border: '1px solid #dde0d9',
          borderRadius: '8px',
          padding: '8px 10px',
          fontSize: '12.5px',
          fontFamily: "'Archivo',sans-serif",
          color: selectedSites.length > 0 ? '#23282a' : '#8a9088',
          outline: 'none',
          background: '#fff',
          width: '100%',
          boxSizing: 'border-box',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {displayText}
        </span>
        <span style={{ fontSize: '9px', color: '#8a9088', marginLeft: '6px', flexShrink: 0 }}>
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
          {siteOptions.map((s) => {
            const isSel = selectedSites.includes(s);
            return (
              <div
                key={s}
                onClick={() => toggleSite(s)}
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
                }}
              >
                <span>{s}</span>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '3px',
                    border: '1px solid ' + (isSel ? '#2756d6' : '#cdd2c9'),
                    background: isSel ? '#2756d6' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    color: '#fff',
                    flexShrink: 0,
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
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  suggestions: string[];
  onAddNew?: (val: string) => void;
  onRemoveOption?: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const rawVal = value || '';
  const trimmedVal = rawVal.trim().toLowerCase();

  const matches = useMemo(() => {
    const unique = Array.from(new Set(suggestions.map((s) => s.trim()).filter(Boolean)));
    const filtered = unique.filter((s) => !removedItems.has(s));
    if (!trimmedVal) return filtered;
    return filtered.filter((s) => s.toLowerCase().includes(trimmedVal));
  }, [suggestions, trimmedVal, removedItems]);

  const exactMatchExists = suggestions.some(
    (s) => s.trim().toLowerCase() === trimmedVal
  );

  const handleAddNew = (newVal: string) => {
    const clean = newVal.trim();
    if (!clean) return;
    if (onAddNew && !exactMatchExists) {
      onAddNew(clean);
    }
    onChange(clean);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        style={inp}
        autoComplete="off"
      />
      {open && (matches.length > 0 || (onAddNew && rawVal.trim() && !exactMatchExists)) && (
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                transition: 'background .1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f2ec')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {item}
              </span>
              {onRemoveOption && (
                <button
                  type="button"
                  title={`Delete "${item}" from saved options`}
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

          {onAddNew && rawVal.trim() && !exactMatchExists && (
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
              <span>＋ Add "{rawVal.trim()}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Multi-select auditor field — checkboxes + free-text add, serialized as comma-separated string. */
function MultiAuditorSelect({
  id,
  value,
  onChange,
  suggestions,
  onAddNew,
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  onAddNew?: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedAuditors = value
    ? value.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

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
    const next = selectedAuditors.includes(name)
      ? selectedAuditors.filter((a) => a !== name)
      : [...selectedAuditors, name];
    onChange(next.join(', '));
  };

  const addCustom = () => {
    const clean = inputVal.trim();
    if (!clean) return;
    if (!selectedAuditors.includes(clean)) {
      onChange([...selectedAuditors, clean].join(', '));
      if (onAddNew && !suggestions.some((s) => s.toLowerCase() === clean.toLowerCase())) {
        onAddNew(clean);
      }
    }
    setInputVal('');
    inputRef.current?.focus();
  };

  const filteredSuggestions = useMemo(() => {
    const q = inputVal.trim().toLowerCase();
    const unique = Array.from(new Set(suggestions.map((s) => s.trim()).filter(Boolean)));
    return q ? unique.filter((s) => s.toLowerCase().includes(q)) : unique;
  }, [suggestions, inputVal]);

  const displayText = selectedAuditors.length > 0
    ? selectedAuditors.join(', ')
    : 'Select auditor(s)...';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger button */}
      <button
        id={id}
        type="button"
        onClick={() => { setOpen(!open); setTimeout(() => inputRef.current?.focus(), 60); }}
        style={{
          border: '1px solid #dde0d9', borderRadius: '8px', padding: '8px 10px',
          fontSize: '12.5px', fontFamily: "'Archivo',sans-serif",
          color: selectedAuditors.length > 0 ? '#23282a' : '#8a9088',
          outline: 'none', background: '#fff', width: '100%',
          boxSizing: 'border-box', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left',
        } as React.CSSProperties}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {displayText}
        </span>
        <span style={{ fontSize: '9px', color: '#8a9088', marginLeft: '6px', flexShrink: 0 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Selected chips shown below when >1 selected */}
      {selectedAuditors.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '5px' }}>
          {selectedAuditors.map((name) => (
            <span key={name} style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '2px 7px', borderRadius: '5px',
              background: '#eef2fd', border: '1px solid #d4def0',
              fontSize: '11px', fontFamily: "'Archivo',sans-serif",
              fontWeight: 600, color: '#2756d6',
            }}>
              {name}
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); toggleAuditor(name); }}
                style={{ border: 'none', background: 'transparent', color: '#2756d6', cursor: 'pointer', padding: 0, fontSize: '10px', lineHeight: 1, display: 'flex', alignItems: 'center' }}
              >✕</button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
          background: '#fff', border: '1px solid #dde0d9', borderRadius: '8px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)', zIndex: 100, padding: '6px',
        }}>
          {/* Search/add input */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '6px' }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search or type new name…"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
              style={{
                flex: 1, border: '1px solid #dde0d9', borderRadius: '6px',
                padding: '6px 8px', fontSize: '12px',
                fontFamily: "'Archivo',sans-serif", outline: 'none', color: '#23282a',
              }}
              autoComplete="off"
            />
            {inputVal.trim() && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addCustom(); }}
                style={{
                  border: '1px solid #d4def0', background: '#eef2fd', color: '#2756d6',
                  borderRadius: '6px', padding: '5px 9px', fontSize: '11px', fontWeight: 700,
                  fontFamily: "'Archivo',sans-serif", cursor: 'pointer', flexShrink: 0,
                } as React.CSSProperties}
              >＋ Add</button>
            )}
          </div>

          {/* Checkbox list */}
          <div style={{ maxHeight: '190px', overflowY: 'auto' }}>
            {filteredSuggestions.length === 0 && (
              <div style={{ padding: '8px 10px', fontSize: '12px', color: '#8a9088', fontFamily: "'Archivo',sans-serif" }}>
                {inputVal.trim() ? `Press Enter or "＋ Add" to save "${inputVal.trim()}"` : 'No auditors found'}
              </div>
            )}
            {filteredSuggestions.map((name) => {
              const isSel = selectedAuditors.includes(name);
              return (
                <div
                  key={name}
                  onClick={() => toggleAuditor(name)}
                  style={{
                    padding: '7px 10px', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '12.5px', fontFamily: "'Archivo',sans-serif",
                    fontWeight: isSel ? 600 : 400,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: isSel ? '#eef2fd' : '#fff',
                    color: isSel ? '#2756d6' : '#23282a',
                    transition: 'background .1s ease',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{name}</span>
                  <span style={{
                    width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0,
                    border: '1px solid ' + (isSel ? '#2756d6' : '#cdd2c9'),
                    background: isSel ? '#2756d6' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', color: '#fff',
                  }}>{isSel ? '✓' : ''}</span>
                </div>
              );
            })}
          </div>
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
  purposeOptions,
  removePurposeOption,
  removeCustomerOption,
  removeAuditorOption,
  removeGenericOption,
  customerDepartmentOptions,
  internalDepartmentOptions,
  siteOptions,
  customerOptions,
  auditorOptions = [],
  removedOptions = [],
  assignments = [],
  engineers = [],
  editingTargetId,
}: {
  idPrefix: string;
  values: AppointmentFormValues;
  onChange: (patch: Partial<AppointmentFormValues>) => void;
  purposeOptions: string[];
  removePurposeOption?: (val: string) => void;
  removeCustomerOption?: (val: string) => void;
  removeAuditorOption?: (val: string) => void;
  removeGenericOption?: (val: string) => void;
  customerDepartmentOptions: string[];
  internalDepartmentOptions: string[];
  siteOptions: string[];
  customerOptions: string[];
  auditorOptions?: string[];
  removedOptions?: string[];
  assignments?: Assignment[];
  engineers?: Engineer[];
  editingTargetId?: string;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;

  const isCustomerEHS = v.department1 === 'EHS';
  // Customer site is always restricted to these 5 fixed values (EHS filtering no longer applies)
  void isCustomerEHS; // retained for future use
  const customerSiteOptions = ['U1', 'U2A', 'U2B', 'U3A', 'U3T'];

  const isInternalEHS = v.department2 === 'EHS';
  const internalSiteOptions = isInternalEHS
    ? siteOptions.filter((s) => ['U1', 'U2', 'U3'].includes(s))
    : siteOptions;

  const removedSet = useMemo(() => new Set(removedOptions), [removedOptions]);

  const customerSuggestions = useMemo(() => {
    const activeAssignments = editingTargetId
      ? assignments.filter((a) => a.id !== editingTargetId)
      : assignments;
    const fromAssign = activeAssignments.map((a) => a.customer).filter((s): s is string => Boolean(s));
    return Array.from(new Set([...customerOptions, ...fromAssign]))
      .filter((s) => !removedSet.has(s))
      .sort();
  }, [assignments, customerOptions, editingTargetId, removedSet]);

  const endCustomerSuggestions = useMemo(() => {
    const fromAssign = assignments.map((a) => a.endCustomer).filter((s): s is string => Boolean(s));
    return Array.from(new Set(fromAssign))
      .filter((s) => !removedSet.has(s))
      .sort();
  }, [assignments, removedSet]);

  const purposeSuggestions = useMemo(() => {
    const activeAssignments = editingTargetId
      ? assignments.filter((a) => a.id !== editingTargetId)
      : assignments;
    const fromAssign = activeAssignments.map((a) => a.purpose).filter((s): s is string => Boolean(s));
    return Array.from(new Set([...purposeOptions, ...fromAssign]))
      .filter((s) => !removedSet.has(s))
      .sort();
  }, [assignments, purposeOptions, editingTargetId, removedSet]);

  const auditorSuggestions = useMemo(() => {
    const fromEng = engineers.map((e) => e.name).filter((s): s is string => Boolean(s));
    const fromAssign1 = assignments.map((a) => a.auditor1).filter((s): s is string => Boolean(s));
    const fromAssign2 = assignments.map((a) => a.auditor2).filter((s): s is string => Boolean(s));
    return Array.from(new Set([...auditorOptions, ...fromEng, ...fromAssign1, ...fromAssign2]))
      .filter((s) => !removedSet.has(s))
      .sort();
  }, [auditorOptions, engineers, assignments, removedSet]);

  const areaSuggestions = useMemo(() => {
    const fromAssign = assignments.map((a) => a.area).filter((s): s is string => Boolean(s));
    return Array.from(new Set(fromAssign))
      .filter((s) => !removedSet.has(s))
      .sort();
  }, [assignments, removedSet]);

  return (
    <>
      <div style={css('display:flex;gap:8px;margin-bottom:4px')}>
        <div onClick={() => onChange({ sectionType: 'customer' })} style={{
          flex: 1, padding: '9px 0', borderRadius: '8px', border: '1px solid ' + (v.sectionType === 'customer' ? '#15191e' : '#dde0d9'),
          cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: "'Archivo',sans-serif", textAlign: 'center',
          background: v.sectionType === 'customer' ? '#15191e' : '#fff',
          color: v.sectionType === 'customer' ? '#fff' : '#5c625c',
        }}>Customer</div>
        <div onClick={() => onChange({ sectionType: 'internal' })} style={{
          flex: 1, padding: '9px 0', borderRadius: '8px', border: '1px solid ' + (v.sectionType === 'internal' ? '#15191e' : '#dde0d9'),
          cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: "'Archivo',sans-serif", textAlign: 'center',
          background: v.sectionType === 'internal' ? '#15191e' : '#fff',
          color: v.sectionType === 'internal' ? '#fff' : '#5c625c',
        }}>Internal Audit</div>
      </div>

      {v.sectionType === 'customer' && (
        <div style={css('padding:14px;border:1px solid #e8ebe4;border-radius:10px;background:#fafbf9')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#6a706a;letter-spacing:.5px;margin-bottom:12px")}>CUSTOMER</div>
          <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:14px')}>
            {/* 1. DEPARTMENT */}
            <div style={fld}>
              <label htmlFor={id('department1')} style={lbl}>DEPARTMENT</label>
              <select
                id={id('department1')}
                value={v.department1}
                onChange={(e) => {
                  const newDept = e.target.value;
                  const currentSites = v.site1.split('/').map((s) => s.trim()).filter(Boolean);
                  // Re-validate against the fixed customer site list
                  const validSites = currentSites.filter((s) => customerSiteOptions.includes(s));
                  onChange({ department1: newDept, site1: validSites.join('/') });
                }}
                style={sel}
              >
                <option value="">Select department...</option>
                {customerDepartmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* 2. SITE */}
            <div style={fld}>
              <label htmlFor={id('site1')} style={lbl}>SITE</label>
              <MultiSiteSelect
                id={id('site1')}
                value={v.site1}
                onChange={(site1) => onChange({ site1 })}
                siteOptions={customerSiteOptions}
              />
            </div>

            {/* 3. CUSTOMER */}
            <div style={fld}>
              <label htmlFor={id('customer')} style={lbl}>CUSTOMER</label>
              <AutocompleteInput
                id={id('customer')}
                value={v.customer}
                onChange={(customer) => onChange({ customer })}
                placeholder="Type customer name..."
                suggestions={customerSuggestions}
                onRemoveOption={removeCustomerOption}
              />
            </div>

            {/* 4. END CUSTOMER */}
            <div style={fld}>
              <label htmlFor={id('endCustomer')} style={lbl}>END CUSTOMER</label>
              <AutocompleteInput
                id={id('endCustomer')}
                value={v.endCustomer}
                onChange={(endCustomer) => onChange({ endCustomer })}
                placeholder="Type end customer..."
                suggestions={endCustomerSuggestions}
                onRemoveOption={removeGenericOption}
              />
            </div>

            {/* 5. PURPOSE */}
            <div style={fld}>
              <label htmlFor={id('purpose')} style={lbl}>PURPOSE</label>
              <AutocompleteInput
                id={id('purpose')}
                value={v.purpose}
                onChange={(purpose) => onChange({ purpose })}
                placeholder="Type or select purpose..."
                suggestions={purposeSuggestions}
                onRemoveOption={removePurposeOption}
              />
            </div>

            {/* 6. AUDITOR */}
            <div style={fld}>
              <label htmlFor={id('auditor1')} style={lbl}>AUDITOR</label>
              <MultiAuditorSelect
                id={id('auditor1')}
                value={v.auditor1}
                onChange={(auditor1) => onChange({ auditor1 })}
                suggestions={auditorSuggestions}
                onAddNew={(_name) => { if (removeAuditorOption) { /* addAuditor handled by save */ } }}
              />
            </div>

            {/* 7. FROM */}
            <div style={fld}>
              <label htmlFor={id('dateFrom')} style={lbl}>FROM</label>
              <DateInputField id={id('dateFrom')} value={v.dateFrom} onChange={(dateFrom) => onChange({ dateFrom })} style={inp} />
            </div>

            {/* 8. TO */}
            <div style={fld}>
              <label htmlFor={id('dateTo')} style={lbl}>TO</label>
              <DateInputField id={id('dateTo')} value={v.dateTo} onChange={(dateTo) => onChange({ dateTo })} style={inp} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <AvailabilityDatePicker
                sectionType="customer"
                site={v.site1}
                auditor={v.auditor1}
                dateFrom={v.dateFrom}
                dateTo={v.dateTo}
                onChange={onChange}
                assignments={assignments}
                engineers={engineers}
                editingTargetId={editingTargetId}
              />
            </div>
          </div>
        </div>
      )}

      {v.sectionType === 'internal' && (
        <div style={css('padding:14px;border:1px solid #e8ebe4;border-radius:10px;background:#fafbf9')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#6a706a;letter-spacing:.5px;margin-bottom:12px")}>INTERNAL AUDIT</div>
          <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:14px')}>
            {/* 1. DEPARTMENT */}
            <div style={fld}>
              <label htmlFor={id('department2')} style={lbl}>DEPARTMENT</label>
              <select
                id={id('department2')}
                value={v.department2}
                onChange={(e) => {
                  const newDept = e.target.value;
                  const currentSites = v.site2.split('/').map((s) => s.trim()).filter(Boolean);
                  const validSites = currentSites.filter((s) => !newDept || newDept !== 'EHS' || ['U1', 'U2', 'U3'].includes(s));
                  onChange({ department2: newDept, site2: validSites.join('/') });
                }}
                style={sel}
              >
                <option value="">Select department...</option>
                {internalDepartmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* 2. SITE */}
            <div style={fld}>
              <label htmlFor={id('site2')} style={lbl}>SITE</label>
              <MultiSiteSelect
                id={id('site2')}
                value={v.site2}
                onChange={(site2) => onChange({ site2 })}
                siteOptions={internalSiteOptions}
              />
            </div>

            {/* 3. AREA */}
            <div style={fld}>
              <label htmlFor={id('area')} style={lbl}>AREA</label>
              <AutocompleteInput
                id={id('area')}
                value={v.area}
                onChange={(area) => onChange({ area })}
                placeholder="Type area..."
                suggestions={areaSuggestions}
                onRemoveOption={removeGenericOption}
              />
            </div>

            {/* 4. AUDITOR */}
            <div style={fld}>
              <label htmlFor={id('auditor2')} style={lbl}>AUDITOR</label>
              <MultiAuditorSelect
                id={id('auditor2')}
                value={v.auditor2}
                onChange={(auditor2) => onChange({ auditor2 })}
                suggestions={auditorSuggestions}
                onAddNew={(_name) => { if (removeAuditorOption) { /* addAuditor handled by save */ } }}
              />
            </div>

            {/* 5. FROM */}
            <div style={fld}>
              <label htmlFor={id('dateFrom2')} style={lbl}>FROM</label>
              <DateInputField id={id('dateFrom2')} value={v.dateFrom} onChange={(dateFrom) => onChange({ dateFrom })} style={inp} />
            </div>

            {/* 6. TO */}
            <div style={fld}>
              <label htmlFor={id('dateTo2')} style={lbl}>TO</label>
              <DateInputField id={id('dateTo2')} value={v.dateTo} onChange={(dateTo) => onChange({ dateTo })} style={inp} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <AvailabilityDatePicker
                sectionType="internal"
                site={v.site2}
                auditor={v.auditor2}
                dateFrom={v.dateFrom}
                dateTo={v.dateTo}
                onChange={onChange}
                assignments={assignments}
                engineers={engineers}
                editingTargetId={editingTargetId}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
