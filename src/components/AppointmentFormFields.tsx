import { css } from '../ui';

const fld = css("display:flex;flex-direction:column;gap:4px");
const lbl = css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#9aa097;letter-spacing:.5px");
const inp = css("border:1px solid #dde0d9;border-radius:8px;padding:8px 10px;font-size:12.5px;font-family:'Archivo',sans-serif;color:#23282a;outline:none;background:#fff;width:100%;box-sizing:border-box");
const sel = inp;

export const SITE_OPTIONS = ['U1', 'U2', 'U2A', 'U2B', 'U3', 'U3A', 'U3T'];

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

/** Shared Customer/Internal Audit field set used by both CreateModal and EditModal. */
export function AppointmentFormFields({
  idPrefix,
  values: v,
  onChange,
  purposeOptions,
  customerDepartmentOptions,
  internalDepartmentOptions,
}: {
  idPrefix: string;
  values: AppointmentFormValues;
  onChange: (patch: Partial<AppointmentFormValues>) => void;
  purposeOptions: string[];
  customerDepartmentOptions: string[];
  internalDepartmentOptions: string[];
}) {
  const id = (name: string) => `${idPrefix}-${name}`;
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
            <div style={fld}>
              <label htmlFor={id('site1')} style={lbl}>SITE</label>
              <select id={id('site1')} value={v.site1} onChange={(e) => onChange({ site1: e.target.value })} style={sel}>
                <option value="">Select site...</option>
                {SITE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={fld}>
              <label htmlFor={id('customer')} style={lbl}>CUSTOMER</label>
              <input id={id('customer')} value={v.customer} onChange={(e) => onChange({ customer: e.target.value })} placeholder="Type customer name..." style={inp} />
            </div>
            <div style={fld}>
              <label htmlFor={id('endCustomer')} style={lbl}>END CUSTOMER</label>
              <input id={id('endCustomer')} value={v.endCustomer} onChange={(e) => onChange({ endCustomer: e.target.value })} placeholder="Type end customer..." style={inp} />
            </div>
            <div style={fld}>
              <label htmlFor={id('purpose')} style={lbl}>PURPOSE</label>
              <select id={id('purpose')} value={v.purpose} onChange={(e) => onChange({ purpose: e.target.value })} style={sel}>
                <option value="">Select purpose...</option>
                {purposeOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={fld}>
              <label htmlFor={id('auditor1')} style={lbl}>AUDITOR</label>
              <input id={id('auditor1')} value={v.auditor1} onChange={(e) => onChange({ auditor1: e.target.value })} placeholder="Type auditor name..." style={inp} />
            </div>
            <div style={fld}>
              <label htmlFor={id('department1')} style={lbl}>DEPARTMENT</label>
              <select id={id('department1')} value={v.department1} onChange={(e) => onChange({ department1: e.target.value })} style={sel}>
                <option value="">Select department...</option>
                {customerDepartmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={fld}>
              <label htmlFor={id('dateFrom')} style={lbl}>FROM</label>
              <input id={id('dateFrom')} type="date" value={v.dateFrom} onChange={(e) => onChange({ dateFrom: e.target.value })} style={inp} />
            </div>
            <div style={fld}>
              <label htmlFor={id('dateTo')} style={lbl}>TO</label>
              <input id={id('dateTo')} type="date" value={v.dateTo} onChange={(e) => onChange({ dateTo: e.target.value })} style={inp} />
            </div>
          </div>
        </div>
      )}

      {v.sectionType === 'internal' && (
        <div style={css('padding:14px;border:1px solid #e8ebe4;border-radius:10px;background:#fafbf9')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#6a706a;letter-spacing:.5px;margin-bottom:12px")}>INTERNAL AUDIT</div>
          <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:14px')}>
            <div style={fld}>
              <label htmlFor={id('site2')} style={lbl}>SITE</label>
              <select id={id('site2')} value={v.site2} onChange={(e) => onChange({ site2: e.target.value })} style={sel}>
                <option value="">Select site...</option>
                {SITE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={fld}>
              <label htmlFor={id('area')} style={lbl}>AREA</label>
              <input id={id('area')} value={v.area} onChange={(e) => onChange({ area: e.target.value })} placeholder="Type area..." style={inp} />
            </div>
            <div style={fld}>
              <label htmlFor={id('auditor2')} style={lbl}>AUDITOR</label>
              <input id={id('auditor2')} value={v.auditor2} onChange={(e) => onChange({ auditor2: e.target.value })} placeholder="Type auditor name..." style={inp} />
            </div>
            <div style={fld}>
              <label htmlFor={id('department2')} style={lbl}>DEPARTMENT</label>
              <select id={id('department2')} value={v.department2} onChange={(e) => onChange({ department2: e.target.value })} style={sel}>
                <option value="">Select department...</option>
                {internalDepartmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={fld}>
              <label htmlFor={id('dateFrom2')} style={lbl}>FROM</label>
              <input id={id('dateFrom2')} type="date" value={v.dateFrom} onChange={(e) => onChange({ dateFrom: e.target.value })} style={inp} />
            </div>
            <div style={fld}>
              <label htmlFor={id('dateTo2')} style={lbl}>TO</label>
              <input id={id('dateTo2')} type="date" value={v.dateTo} onChange={(e) => onChange({ dateTo: e.target.value })} style={inp} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
