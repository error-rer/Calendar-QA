import type { VM } from '../useScheduler';
import { css, HButton, HInput } from '../ui';

export function CustomerModal({ vm }: { vm: VM }) {
  if (!vm.custFormOpen) return null;
  const f = vm.customerForm;
  return (
    <div onClick={vm.closeCustForm} style={vm.modalOverlayStyle}>
      <div onClick={vm.stop} style={vm.modalCardStyle}>
        <div style={css('padding:16px 20px;border-bottom:1px solid #eef1ea;display:flex;align-items:center;justify-content:space-between')}>
          <div>
            <div style={css('font-size:15px;font-weight:700;letter-spacing:-.2px')}>New customer</div>
            <div style={css('font-size:11.5px;color:#8a9088;margin-top:1px')}>Adds a customer you can file orders against.</div>
          </div>
          <HButton onClick={vm.closeCustForm} style={css('width:28px;height:28px;border:1px solid #e2e5de;background:#fff;border-radius:7px;cursor:pointer;color:#6a706a;font-size:14px')} hover={{ background: '#f1f3ee' }}>✕</HButton>
        </div>

        <div className="scrl" style={css('flex:1;overflow-y:auto;padding:18px 20px;display:flex;flex-direction:column;gap:14px')}>
          <div style={css('display:flex;align-items:center;gap:13px')}>
            <div style={f.previewStyle}>{f.previewInitials}</div>
            <div style={css('flex:1;min-width:0')}>
              <label style={css('font-size:11px;font-weight:600;color:#5c625c;display:block;margin-bottom:6px')}>Customer name</label>
              <HInput value={f.name} onChange={f.onName} placeholder="e.g. Company A" style={f.inStyle} focus={{ borderColor: '#9bb0e8' }} />
            </div>
          </div>
          {f.exists && (
            <div style={css('font-size:11.5px;color:#9a6e08;background:#fff4e3;border:1px solid #f1dcb0;border-radius:8px;padding:9px 12px;display:flex;align-items:center;gap:7px')}>
              <span>⚠</span>That customer already exists.
            </div>
          )}
        </div>

        <div style={css('padding:14px 20px;border-top:1px solid #eef1ea;display:flex;justify-content:flex-end;gap:9px')}>
          <HButton onClick={vm.closeCustForm} style={css("background:#f4f6f1;border:1px solid #e0e3dc;color:#3c423d;border-radius:9px;padding:10px 16px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#eaede6' }}>Cancel</HButton>
          <button onClick={f.submit} style={f.submitStyle}>Create customer</button>
        </div>
      </div>
    </div>
  );
}
