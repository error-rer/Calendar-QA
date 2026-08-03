import { useState, useEffect, useRef, useMemo } from 'react';
import type { Assignment, Engineer } from '../types';
import { css } from '../ui';
import { AvailabilityDatePicker } from './AvailabilityDatePicker';

const fld = css("display:flex;flex-direction:column;gap:4px");
const lbl = css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#9aa097;letter-spacing:.5px");
const inp = css("border:1px solid #dde0d9;border-radius:8px;padding:8px 10px;font-size:12.5px;font-family:'Archivo',sans-serif;color:#23282a;outline:none;background:#fff;width:100%;box-sizing:border-box");
const sel = inp;

function isoToDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function displayToIso(val: string): string | null {
  const trimmed = val.trim();
  if (!trimmed) return '';
  // Match DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmYMatch = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/.exec(trimmed);
  if (dmYMatch) {
    const [, dStr, mStr, yStr] = dmYMatch;
    const day = Number(dStr);
    const month = Number(mStr);
    const year = Number(yStr);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  // Match YYYY-MM-DD
  const ymdMatch = /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/.exec(trimmed);
  if (ymdMatch) {
    const [, yStr, mStr, dStr] = ymdMatch;
    const year = Number(yStr);
    const month = Number(mStr);
    const day = Number(dStr);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  return null;
}

interface DateInputFieldProps {
  id: string;
  value: string;
  onChange: (isoVal: string) => void;
  style?: React.CSSProperties;
}

function DateInputField({ id, value, onChange, style }: DateInputFieldProps) {
  const [text, setText] = useState(() => isoToDisplay(value));

  useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setText(newVal);
    const parsed = displayToIso(newVal);
    if (parsed !== null) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = displayToIso(text);
    if (parsed !== null) {
      setText(isoToDisplay(parsed));
      onChange(parsed);
    } else if (!text.trim()) {
      onChange('');
    } else {
      setText(isoToDisplay(value));
    }
  };

  return (
    <input
      id={id}
      type="text"
      placeholder="DD/MM/YYYY"
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      style={style}
    />
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
}: {
  id: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  suggestions: string[];
}) {
  const [open, setOpen] = useState(false);
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

  const trimmedVal = (value || '').trim().toLowerCase();
  const matches = useMemo(() => {
    const unique = Array.from(new Set(suggestions.map((s) => s.trim()).filter(Boolean)));
    if (!trimmedVal) return unique.slice(0, 8);
    return unique.filter((s) => s.toLowerCase().includes(trimmedVal)).slice(0, 8);
  }, [suggestions, trimmedVal]);

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
      {open && matches.length > 0 && (
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
                transition: 'background .1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f2ec')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {item}
            </div>
          ))}
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
  customerDepartmentOptions,
  internalDepartmentOptions,
  siteOptions,
  customerOptions,
  assignments = [],
  engineers = [],
  editingTargetId,
}: {
  idPrefix: string;
  values: AppointmentFormValues;
  onChange: (patch: Partial<AppointmentFormValues>) => void;
  purposeOptions: string[];
  customerDepartmentOptions: string[];
  internalDepartmentOptions: string[];
  siteOptions: string[];
  customerOptions: string[];
  assignments?: Assignment[];
  engineers?: Engineer[];
  editingTargetId?: string;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;

  const isCustomerEHS = v.department1 === 'EHS';
  const customerSiteOptions = isCustomerEHS
    ? siteOptions.filter((s) => ['U1', 'U2', 'U3'].includes(s))
    : siteOptions;

  const isInternalEHS = v.department2 === 'EHS';
  const internalSiteOptions = isInternalEHS
    ? siteOptions.filter((s) => ['U1', 'U2', 'U3'].includes(s))
    : siteOptions;

  const customerSuggestions = useMemo(() => {
    const fromAssign = assignments.map((a) => a.customer).filter((s): s is string => Boolean(s));
    return Array.from(new Set([...customerOptions, ...fromAssign])).sort();
  }, [assignments, customerOptions]);

  const endCustomerSuggestions = useMemo(() => {
    const fromAssign = assignments.map((a) => a.endCustomer).filter((s): s is string => Boolean(s));
    return Array.from(new Set(fromAssign)).sort();
  }, [assignments]);

  const auditorSuggestions = useMemo(() => {
    const fromEng = engineers.map((e) => e.name).filter((s): s is string => Boolean(s));
    const fromAssign1 = assignments.map((a) => a.auditor1).filter((s): s is string => Boolean(s));
    const fromAssign2 = assignments.map((a) => a.auditor2).filter((s): s is string => Boolean(s));
    return Array.from(new Set([...fromEng, ...fromAssign1, ...fromAssign2])).sort();
  }, [engineers, assignments]);

  const areaSuggestions = useMemo(() => {
    const fromAssign = assignments.map((a) => a.area).filter((s): s is string => Boolean(s));
    return Array.from(new Set(fromAssign)).sort();
  }, [assignments]);

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
                  const validSites = currentSites.filter((s) => !newDept || newDept !== 'EHS' || ['U1', 'U2', 'U3'].includes(s));
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
              />
            </div>

            {/* 5. PURPOSE */}
            <div style={fld}>
              <label htmlFor={id('purpose')} style={lbl}>PURPOSE</label>
              <select id={id('purpose')} value={v.purpose} onChange={(e) => onChange({ purpose: e.target.value })} style={sel}>
                <option value="">Select purpose...</option>
                {purposeOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* 6. AUDITOR */}
            <div style={fld}>
              <label htmlFor={id('auditor1')} style={lbl}>AUDITOR</label>
              <AutocompleteInput
                id={id('auditor1')}
                value={v.auditor1}
                onChange={(auditor1) => onChange({ auditor1 })}
                placeholder="Type auditor name..."
                suggestions={auditorSuggestions}
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
              />
            </div>

            {/* 4. AUDITOR */}
            <div style={fld}>
              <label htmlFor={id('auditor2')} style={lbl}>AUDITOR</label>
              <AutocompleteInput
                id={id('auditor2')}
                value={v.auditor2}
                onChange={(auditor2) => onChange({ auditor2 })}
                placeholder="Type auditor name..."
                suggestions={auditorSuggestions}
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
