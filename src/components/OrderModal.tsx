import type { VM } from '../useScheduler';
import { css, HButton, HInput } from '../ui';

export function OrderModal({ vm }: { vm: VM }) {
  if (!vm.orderFormOpen) return null;
  const f = vm.orderForm;
  return (
    <div onClick={vm.closeOrderForm} style={vm.modalOverlayStyle}>
      <div onClick={vm.stop} style={vm.modalCardStyle}>
        <div style={css('padding:16px 20px;border-bottom:1px solid #eef1ea;display:flex;align-items:center;justify-content:space-between')}>
          <div>
            <div style={css('font-size:15px;font-weight:700;letter-spacing:-.2px')}>New customer order</div>
            <div style={css('font-size:11.5px;color:#8a9088;margin-top:1px')}>Opens an order into the unstaffed pool.</div>
          </div>
          <HButton onClick={vm.closeOrderForm} style={css('width:28px;height:28px;border:1px solid #e2e5de;background:#fff;border-radius:7px;cursor:pointer;color:#6a706a;font-size:14px')} hover={{ background: '#f1f3ee' }}>✕</HButton>
        </div>

        <div className="scrl" style={css('flex:1;overflow-y:auto;padding:18px 20px;display:flex;flex-direction:column;gap:16px')}>
          <div style={css('display:flex;gap:14px;flex-wrap:wrap')}>
            <div style={css('flex:1;min-width:140px')}>
              <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:6px')}>Order code <span style={css('color:#a6aca2;font-weight:400')}>· optional</span></label>
              <HInput value={f.code} onChange={f.onCode} placeholder="auto-generate" style={f.inStyle} focus={{ borderColor: '#9bb0e8' }} />
            </div>
            <div style={css('flex:2;min-width:200px')}>
              <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:6px')}>Product / lot</label>
              <HInput value={f.product} onChange={f.onProduct} placeholder="e.g. Automotive MCU qual" style={f.inStyle} focus={{ borderColor: '#9bb0e8' }} />
            </div>
          </div>

          <div>
            <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:6px')}>Customer</label>
            <HInput value={f.customer} onChange={f.onCustomer} placeholder="Customer name" style={f.inStyle} focus={{ borderColor: '#9bb0e8' }} />
            <div style={css('display:flex;gap:6px;flex-wrap:wrap;margin-top:8px')}>
              {f.customerSuggestions.map((c, i) => (
                <button key={i} onClick={c.onClick} style={c.style}>{c.name}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:8px')}>Fab site</label>
            <div style={css('display:grid;grid-template-columns:repeat(2,1fr);gap:8px')}>
              {f.plants.map((p) => (
                <div key={p.id} onClick={p.onClick} style={p.style}>
                  <span style={p.swatchStyle} />
                  <div style={css('min-width:0')}>
                    <div style={css('font-size:12px;font-weight:600;color:#23282a')}>{p.name}</div>
                    <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#8a9088")}>{p.code}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={css('display:flex;gap:22px;flex-wrap:wrap')}>
            <div>
              <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:8px')}>Priority</label>
              <div style={css('display:flex;gap:7px')}>
                {f.priorities.map((p, i) => (
                  <button key={i} onClick={p.onClick} style={p.style}>{p.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:8px')}>Required certifications</label>
            <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:7px')}>
              {f.reqOptions.map((c) => (
                <div key={c.code} onClick={c.onClick} style={c.style}>
                  <span style={c.boxStyle}>{c.check}</span>
                  <div style={css('min-width:0')}>
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#5b7fd6")}>{c.code}</span> <span style={css('font-size:11.5px;color:#3c423d')}>{c.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={css('padding:14px 20px;border-top:1px solid #eef1ea;display:flex;justify-content:flex-end;gap:9px')}>
          <HButton onClick={vm.closeOrderForm} style={css("background:#f4f6f1;border:1px solid #e0e3dc;color:#3c423d;border-radius:9px;padding:10px 16px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#eaede6' }}>Cancel</HButton>
          <button onClick={f.submit} style={f.submitStyle}>Create order</button>
        </div>
      </div>
    </div>
  );
}
