import type { VM } from '../useScheduler';
import { css, HButton } from '../ui';
import { AppointmentFormFields } from './AppointmentFormFields';

export function EditModal({ vm }: { vm: VM }) {
  if (!vm.editOpen) return null;
  const ed = vm.editDraft;
  return (
    <div onClick={vm.closeEdit} style={vm.modalOverlayStyle}>
      <div onClick={vm.stop} style={vm.modalCardStyle}>
        <div style={css('padding:16px 20px;border-bottom:1px solid #eef1ea;display:flex;align-items:center;justify-content:space-between')}>
          <div>
            <div style={css('font-size:15px;font-weight:700;letter-spacing:-.2px')}>Edit appointment</div>
            <div style={css('font-size:11.5px;color:#8a9088;margin-top:1px')}>{vm.weekLabel} - {vm.weekTag}</div>
          </div>
          <HButton onClick={vm.closeEdit} style={css('width:28px;height:28px;border:1px solid #e2e5de;background:#fff;border-radius:7px;cursor:pointer;color:#6a706a;font-size:14px')} hover={{ background: '#f1f3ee' }}>✕</HButton>
        </div>

        <div className="scrl" style={css('overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:20px')}>
          <AppointmentFormFields
            idPrefix="edit"
            values={ed}
            onChange={vm.setEditDraft}
            purposeOptions={vm.purposeOptions}
            customerDepartmentOptions={vm.customerDepartmentOptions}
            internalDepartmentOptions={vm.internalDepartmentOptions}
          />
        </div>

        <div style={css('padding:14px 18px;display:flex;justify-content:flex-end;gap:9px;border-top:1px solid #eef1ea')}>
          <HButton onClick={vm.closeEdit} style={css("background:#f4f6f1;border:1px solid #e0e3dc;color:#3c423d;border-radius:8px;padding:9px 16px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#eaede6' }}>Cancel</HButton>
          <button onClick={vm.submitEdit} style={css("background:#15191e;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}>Save changes</button>
        </div>
      </div>
    </div>
  );
}
