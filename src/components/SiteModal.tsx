import type { VM } from '../useScheduler';
import { css, HButton, HInput } from '../ui';

export function SiteModal({ vm }: { vm: VM }) {
  if (!vm.siteFormOpen) return null;
  const f = vm.siteForm;
  return (
    <div onClick={vm.closeSiteForm} style={vm.modalOverlayStyle}>
      <div onClick={vm.stop} style={vm.modalCardStyle}>
        <div style={css('padding:16px 20px;border-bottom:1px solid #eef1ea;display:flex;align-items:center;justify-content:space-between')}>
          <div>
            <div style={css('font-size:15px;font-weight:700;letter-spacing:-.2px')}>New fab site</div>
            <div style={css('font-size:11.5px;color:#8a9088;margin-top:1px')}>Adds a fab / assembly site to the schedule and filters.</div>
          </div>
          <HButton onClick={vm.closeSiteForm} style={css('width:28px;height:28px;border:1px solid #e2e5de;background:#fff;border-radius:7px;cursor:pointer;color:#6a706a;font-size:14px')} hover={{ background: '#f1f3ee' }}>✕</HButton>
        </div>

        <div className="scrl" style={css('flex:1;overflow-y:auto;padding:18px 20px;display:flex;flex-direction:column;gap:16px')}>
          <div style={css('display:flex;gap:14px;flex-wrap:wrap')}>
            <div style={css('flex:2;min-width:180px')}>
              <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:6px')}>Site name</label>
              <HInput value={f.name} onChange={f.onName} placeholder="e.g. Fab 30" style={f.inStyle} focus={{ borderColor: '#9bb0e8' }} />
            </div>
            <div style={css('flex:1;min-width:120px')}>
              <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:6px')}>Code <span style={css('color:#a6aca2;font-weight:400')}>· optional</span></label>
              <HInput value={f.code} onChange={f.onCode} placeholder="auto" style={f.inStyle} focus={{ borderColor: '#9bb0e8' }} />
            </div>
          </div>

          <div>
            <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:6px')}>Location <span style={css('color:#a6aca2;font-weight:400')}>· optional</span></label>
            <HInput value={f.loc} onChange={f.onLoc} placeholder="City, Region" style={f.inStyle} focus={{ borderColor: '#9bb0e8' }} />
          </div>

          <div>
            <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:8px')}>Swatch colour</label>
            <div style={css('display:flex;gap:10px;flex-wrap:wrap')}>
              {f.colors.map((c, i) => (
                <div key={i} onClick={c.onClick} style={c.style} />
              ))}
            </div>
          </div>
        </div>

        <div style={css('padding:14px 20px;border-top:1px solid #eef1ea;display:flex;justify-content:flex-end;gap:9px')}>
          <HButton onClick={vm.closeSiteForm} style={css("background:#f4f6f1;border:1px solid #e0e3dc;color:#3c423d;border-radius:9px;padding:10px 16px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#eaede6' }}>Cancel</HButton>
          <button onClick={f.submit} style={f.submitStyle}>Create site</button>
        </div>
      </div>
    </div>
  );
}
