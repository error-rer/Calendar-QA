import type { VM } from '../useScheduler';
import { css, HButton, HInput } from '../ui';

export function LeaveModal({ vm }: { vm: VM }) {
  if (!vm.leaveFormOpen) return null;
  const f = vm.leaveForm;
  return (
    <div onClick={vm.closeLeaveForm} style={vm.modalOverlayStyle}>
      <div onClick={vm.stop} style={vm.modalCardStyle}>
        <div style={css('padding:16px 20px;border-bottom:1px solid #eef1ea;display:flex;align-items:center;justify-content:space-between')}>
          <div>
            <div style={css('font-size:15px;font-weight:700;letter-spacing:-.2px')}>Request leave</div>
            <div style={css('font-size:11.5px;color:#8a9088;margin-top:1px')}>{f.weekLabel} · {f.weekTag} — marks who's unavailable.</div>
          </div>
          <HButton onClick={vm.closeLeaveForm} style={css('width:28px;height:28px;border:1px solid #e2e5de;background:#fff;border-radius:7px;cursor:pointer;color:#6a706a;font-size:14px')} hover={{ background: '#f1f3ee' }}>✕</HButton>
        </div>

        <div className="scrl" style={css('flex:1;overflow-y:auto;padding:18px 20px;display:flex;flex-direction:column;gap:16px')}>
          <div>
            <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:8px')}>Engineer</label>
            <div className="scrl" style={css('display:flex;flex-direction:column;gap:5px;max-height:208px;overflow-y:auto')}>
              {f.engineers.map((e) => (
                <div key={e.engId} onClick={e.select} style={e.style}>
                  <div style={e.avatarStyle}>{e.initials}</div>
                  <div style={css('min-width:0;flex:1')}>
                    <div style={css('font-size:12px;font-weight:600;color:#23282a')}>{e.name}</div>
                    <div style={css('font-size:10px;color:#8a9088')}>{e.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:8px')}>Days off <span style={css('color:#a6aca2;font-weight:400')}>· this week</span></label>
            <div style={css('display:flex;gap:6px')}>
              {f.days.map((d, i) => (
                <button key={i} onClick={d.onClick} style={d.style}>
                  <div>{d.label}</div>
                  <div style={css("font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:500;opacity:.7;margin-top:1px")}>{d.taken ? 'booked' : d.date}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:8px')}>Type</label>
            <div style={css('display:flex;gap:7px;flex-wrap:wrap')}>
              {f.types.map((t, i) => (
                <button key={i} onClick={t.onClick} style={t.style}>{t.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:6px')}>Note <span style={css('color:#a6aca2;font-weight:400')}>· optional</span></label>
            <HInput value={f.note} onChange={f.onNote} placeholder="e.g. back Monday" style={f.inStyle} focus={{ borderColor: '#9bb0e8' }} />
          </div>
        </div>

        <div style={css('padding:14px 20px;border-top:1px solid #eef1ea;display:flex;justify-content:flex-end;gap:9px')}>
          <HButton onClick={vm.closeLeaveForm} style={css("background:#f4f6f1;border:1px solid #e0e3dc;color:#3c423d;border-radius:9px;padding:10px 16px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#eaede6' }}>Cancel</HButton>
          <button onClick={f.submit} style={f.submitStyle}>Add leave</button>
        </div>
      </div>
    </div>
  );
}
