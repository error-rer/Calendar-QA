import type { VM } from '../useScheduler';
import { css, HButton } from '../ui';

export function CreateModal({ vm }: { vm: VM }) {
  if (!vm.createOpen) return null;
  const create = vm.create;
  return (
    <div onClick={vm.closeCreate} style={vm.modalOverlayStyle}>
      <div onClick={vm.stop} style={vm.modalCardStyle}>
        <div style={css('padding:16px 20px;border-bottom:1px solid #eef1ea;display:flex;align-items:center;justify-content:space-between')}>
          <div>
            <div style={css('font-size:15px;font-weight:700;letter-spacing:-.2px')}>New appointment</div>
            <div style={css('font-size:11.5px;color:#8a9088;margin-top:1px')}>{vm.weekLabel} · {vm.weekTag}</div>
          </div>
          <HButton onClick={vm.closeCreate} style={css('width:28px;height:28px;border:1px solid #e2e5de;background:#fff;border-radius:7px;cursor:pointer;color:#6a706a;font-size:14px')} hover={{ background: '#f1f3ee' }}>✕</HButton>
        </div>

        <div className="scrl" style={vm.modalColsStyle}>
          <div style={vm.modalColLeftStyle}>
            <div style={css("padding:13px 16px 9px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#9aa097;letter-spacing:.5px")}>CUSTOMER ORDER</div>
            <div className="scrl" style={css('overflow-y:auto;padding:0 12px 12px;display:flex;flex-direction:column;gap:6px')}>
              {create.orders.map((o) => (
                <div key={o.orderId} onClick={o.select} style={o.style}>
                  <div style={css('display:flex;align-items:center;gap:7px')}>
                    <span style={o.dotStyle} />
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:11.5px;font-weight:600;color:#15191e")}>{o.code}</span>
                    <span style={o.priorityStyle}>{o.priority}</span>
                    <span style={css('flex:1')} />
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:9px;color:#aab0a6")}>{o.plantCode}</span>
                  </div>
                  <div style={css('font-size:11px;color:#3c423d;margin-top:3px')}>{o.product} · {o.customer}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={vm.modalColRightStyle}>
            <div style={css("padding:13px 16px 9px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#9aa097;letter-spacing:.5px")}>QA</div>
            <div className="scrl" style={css('overflow-y:auto;padding:0 12px 12px;display:flex;flex-direction:column;gap:5px')}>
              {create.engineers.map((e) => (
                <div key={e.engId} onClick={e.select} style={e.style}>
                  <div style={e.avatarStyle}>{e.initials}</div>
                  <div style={css('min-width:0;flex:1')}>
                    <div style={css('font-size:12px;font-weight:600;color:#23282a')}>{e.name}</div>
                    <div style={css('font-size:10px;color:#8a9088')}>{e.role}</div>
                  </div>
                  <span style={e.flagStyle}>{e.flag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={css('padding:14px 18px;border-top:1px solid #eef1ea;display:flex;gap:22px;align-items:center;flex-wrap:wrap')}>
          <div>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;color:#9aa097;letter-spacing:.5px;margin-bottom:6px")}>DAY</div>
            <div style={css('display:flex;background:#f1f3ee;border:1px solid #e0e3dc;border-radius:8px;padding:2px;gap:2px')}>
              {create.dayBtns.map((d, i) => (
                <button key={i} onClick={d.select} style={d.style}>{d.label}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;color:#9aa097;letter-spacing:.5px;margin-bottom:6px")}>TIME</div>
            <input type="time" value={create.apptTime} onChange={create.onApptTime} style={css("border:1px solid #dde0d9;border-radius:8px;padding:6px 10px;font-size:12px;font-family:'Archivo',sans-serif;color:#23282a;outline:none;background:#fff;min-width:110px")} />
          </div>
        </div>

        <div style={css('padding:14px 18px;display:flex;justify-content:flex-end;gap:9px')}>
          <HButton onClick={vm.closeCreate} style={css("background:#f4f6f1;border:1px solid #e0e3dc;color:#3c423d;border-radius:8px;padding:9px 16px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#eaede6' }}>Cancel</HButton>
          <button onClick={create.submit} style={create.submitStyle}>Create appointment</button>
        </div>
      </div>
    </div>
  );
}
