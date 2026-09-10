import type { VM } from '../useScheduler';
import { css, HButton } from '../ui';
import { AppointmentFormFields } from './AppointmentFormFields';

export function CreateModal({ vm }: { vm: VM }) {
  if (!vm.createOpen) return null;
  const create = vm.create;
  return (
    <div style={vm.modalOverlayStyle}>
      <div onClick={vm.stop} style={vm.modalCardStyle}>
        <div style={css('padding:16px 20px;border-bottom:1px solid #334155;display:flex;align-items:center;justify-content:space-between')}>
          <div>
            <div style={css('font-size:15px;font-weight:700;letter-spacing:-.2px;color:#f8fafc')}>New appointment</div>
            <div style={css('font-size:11.5px;color:#94a3b8;margin-top:1px')}>{vm.weekLabel} - {vm.weekTag}</div>
          </div>
          <HButton onClick={vm.closeCreate} style={css('width:28px;height:28px;border:1px solid #334155;background:#0f172a;border-radius:7px;cursor:pointer;color:#94a3b8;font-size:14px')} hover={{ background: '#334155' }}>✕</HButton>
        </div>

        <div className="scrl" style={css('overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:20px')}>
          <AppointmentFormFields
            idPrefix="create"
            values={create}
            onChange={create.onChange}
            purposeOptions={vm.purposeOptions}
            removePurposeOption={vm.removePurposeOption}
            removeCustomerOption={vm.removeCustomerOption}
            removeAuditorOption={vm.removeAuditorOption}
            removeGenericOption={vm.removeGenericOption}
            customerDepartmentOptions={vm.customerDepartmentOptions}
            internalDepartmentOptions={vm.internalDepartmentOptions}
            siteOptions={vm.siteCodeOptions}
            customerOptions={vm.customerOptions}
            auditorOptions={vm.auditorOptions}
            removedOptions={vm.removedOptions}
            assignments={vm.assignments}
            engineers={vm.engineers}
          />

          {create.warn && (
            <div style={css("font-size:12px;color:#f87171;background:#450a0a;border:1px solid #991b1b;padding:9px 14px;border-radius:8px;text-align:center;font-weight:600;font-family:'Archivo',sans-serif")}>
              ⚠️ {create.warnText}
            </div>
          )}
        </div>

        <div style={css('padding:14px 18px;display:flex;justify-content:flex-end;gap:9px;border-top:1px solid #334155')}>
          <HButton onClick={vm.closeCreate} style={css("background:#0f172a;border:1px solid #334155;color:#94a3b8;border-radius:8px;padding:9px 16px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#334155' }}>Cancel</HButton>
          <button onClick={create.submit} style={create.submitStyle}>Create appointment</button>
        </div>
      </div>
    </div>
  );
}
