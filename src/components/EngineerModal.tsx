import type { VM } from '../useScheduler';
import { css, HButton, HInput } from '../ui';

export function EngineerModal({ vm }: { vm: VM }) {
  if (!vm.engFormOpen) return null;
  const f = vm.engForm;
  const internalOpts = f.subDepartmentOptions.filter((o) => o.group === 'Internal Audit');
  const customerOpts = f.subDepartmentOptions.filter((o) => o.group === 'Customer');
  return (
    <div onClick={vm.closeEngForm} style={vm.modalOverlayStyle}>
      <div onClick={vm.stop} style={vm.modalCardStyle}>
        <div style={css('padding:16px 20px;border-bottom:1px solid #eef1ea;display:flex;align-items:center;justify-content:space-between')}>
          <div>
            <div style={css('font-size:15px;font-weight:700;letter-spacing:-.2px')}>New Employee</div>
            <div style={css('font-size:11.5px;color:#8a9088;margin-top:1px')}>Adds an employee to the roster and schedule.</div>
          </div>
          <HButton onClick={vm.closeEngForm} style={css('width:28px;height:28px;border:1px solid #e2e5de;background:#fff;border-radius:7px;cursor:pointer;color:#6a706a;font-size:14px')} hover={{ background: '#f1f3ee' }}>✕</HButton>
        </div>

        <div className="scrl" style={css('flex:1;overflow-y:auto;padding:18px 20px;display:flex;flex-direction:column;gap:16px')}>
          <div style={css('display:flex;gap:14px;flex-wrap:wrap')}>
            <div style={css('flex:1;min-width:160px')}>
              <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:6px')}>Name</label>
              <HInput value={f.name} onChange={f.onName} placeholder="e.g. Kai Mori" style={f.inStyle} focus={{ borderColor: '#9bb0e8' }} />
            </div>
            <div style={css('flex:1;min-width:160px')}>
              <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:6px')}>Role <span style={css('color:#a6aca2;font-weight:400')}>· optional</span></label>
              <HInput value={f.role} onChange={f.onRole} placeholder="e.g. Reliability Engineer" style={f.inStyle} focus={{ borderColor: '#9bb0e8' }} />
            </div>
          </div>

          <div>
            <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:8px')}>Site</label>
            <div style={css('display:flex;gap:7px')}>
              {f.departments.map((d, i) => (
                <button key={i} onClick={d.onClick} style={d.style}>{d.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:8px')}>Department</label>
            <div style={css('display:flex;flex-direction:column;gap:12px')}>
              <div>
                <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;color:#9aa097;letter-spacing:.5px;margin-bottom:5px")}>INTERNAL AUDIT</div>
                <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:7px')}>
                  {internalOpts.map((c) => (
                    <div key={c.code} onClick={c.onClick} style={c.style}>
                      <span style={c.boxStyle}>{c.check}</span>
                      <span style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#5b7fd6")}>{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;color:#9aa097;letter-spacing:.5px;margin-bottom:5px")}>CUSTOMER</div>
                <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:7px')}>
                  {customerOpts.map((c) => (
                    <div key={c.code} onClick={c.onClick} style={c.style}>
                      <span style={c.boxStyle}>{c.check}</span>
                      <span style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#5b7fd6")}>{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={css('padding:14px 20px;border-top:1px solid #eef1ea;display:flex;justify-content:flex-end;gap:9px')}>
          <HButton onClick={vm.closeEngForm} style={css("background:#f4f6f1;border:1px solid #e0e3dc;color:#3c423d;border-radius:9px;padding:10px 16px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#eaede6' }}>Cancel</HButton>
          <button onClick={f.submit} style={f.submitStyle}>Create Employee</button>
        </div>
      </div>
    </div>
  );
}
