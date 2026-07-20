import type { VM } from '../useScheduler';
import { css, HButton, HInput } from '../ui';

export function DetailPanel({ vm }: { vm: VM }) {
  const detail = vm.detail;
  if (!detail) return null;
  return (
    <aside className="scrl" style={vm.detailAsideStyle}>
      <div style={css('padding:14px 16px;border-bottom:1px solid #e7eae3;display:flex;align-items:flex-start;gap:10px')}>
        <div style={css('flex:1;min-width:0')}>
          <div style={css('display:flex;align-items:center;gap:8px')}>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600;color:#15191e")}>{detail.orderCode}</span>
          </div>
          <div style={css('font-size:12.5px;color:#3c423d;font-weight:500;margin-top:3px')}>{detail.product}</div>
          <div style={css('font-size:11px;color:#8a9088;margin-top:1px')}>{detail.customer}  -  {detail.plantName}</div>
          {detail.site1 && <div style={css('font-size:11px;color:#5b7fd6;margin-top:2px')}>Site: {detail.site1}{detail.site2 ? ` / ${detail.site2}` : ''}</div>}
          {detail.endCustomer && <div style={css('font-size:11px;color:#5b7fd6')}>End customer: {detail.endCustomer}</div>}
          {detail.area && <div style={css('font-size:11px;color:#5b7fd6')}>Area: {detail.area}</div>}
          {detail.auditor1 && <div style={css('font-size:11px;color:#5b7fd6')}>Auditor: {detail.auditor1}{detail.auditor2 ? ` / ${detail.auditor2}` : ''}</div>}
          <div style={css('display:flex;gap:8px;margin-top:4px')}>
            {!!detail.major && <span style={css('font-size:10px;color:#b32f2f;font-weight:600')}>Major: {detail.major}</span>}
            {!!detail.minor && <span style={css('font-size:10px;color:#c2620c;font-weight:600')}>Minor: {detail.minor}</span>}
            {!!detail.ofi && <span style={css('font-size:10px;color:#5b7fd6;font-weight:600')}>OFI: {detail.ofi}</span>}
            {!!detail.request && <span style={css('font-size:10px;color:#1f8a5b;font-weight:600')}>Request: {detail.request}</span>}
            {!!detail.utl1 && <span style={css('font-size:10px;color:#8a5bbf;font-weight:600')}>UTL1: {detail.utl1}</span>}
            {!!detail.utl2 && <span style={css('font-size:10px;color:#8a5bbf;font-weight:600')}>UTL2: {detail.utl2}</span>}
            {!!detail.utl3 && <span style={css('font-size:10px;color:#8a5bbf;font-weight:600')}>UTL3: {detail.utl3}</span>}
          </div>
        </div>
        <HButton onClick={detail.close} style={css('width:28px;height:28px;border:1px solid #e2e5de;background:#fff;border-radius:6px;cursor:pointer;color:#6a706a;font-size:14px;flex-shrink:0')} hover={{ background: '#f1f3ee' }}>✕</HButton>
      </div>

      <div className="scrl" style={css('flex:1;overflow-y:auto;padding:15px 16px;display:flex;flex-direction:column;gap:16px')}>
        <div>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#9aa097;letter-spacing:.5px;margin-bottom:9px")}>ASSIGNED QA</div>
          <div style={css('display:flex;align-items:center;gap:10px')}>
            <div style={detail.avatarStyle}>{detail.engInitials}</div>
            <div>
              <div style={css('font-size:13px;font-weight:600;color:#23282a')}>{detail.engName}</div>
              <div style={css('font-size:11px;color:#8a9088')}>{detail.engRole}  -  {detail.dayName}</div>
            </div>
          </div>
          <div style={css('display:flex;flex-wrap:wrap;gap:6px;margin-top:9px')}>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#3c423d;background:#eef3ee;border:1px solid #dde6dd;border-radius:5px;padding:2px 7px")}>{detail.department}</span>
            {detail.subDepartments.map((sd, i) => (
              <span key={i} style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#5b7fd6;background:#eef2fd;border:1px solid #d8e2fa;border-radius:4px;padding:2px 7px")}>{sd}</span>
            ))}
          </div>
        </div>

        <div>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#9aa097;letter-spacing:.5px;margin-bottom:9px")}>NOTES  -  {detail.commentCount}</div>
          <div style={css('display:flex;flex-direction:column;gap:11px;margin-bottom:11px')}>
            {detail.comments.map((m, i) => (
              <div key={i} style={css('display:flex;gap:8px;align-items:flex-start')}>
                <div style={m.avatarStyle}>{m.initials}</div>
                <div style={css('min-width:0;flex:1')}>
                  <div style={css('display:flex;align-items:baseline;gap:6px')}>
                    <span style={css('font-size:11.5px;font-weight:600;color:#23282a')}>{m.who}</span>
                    <span style={css("font-size:9.5px;color:#a6aca2;font-family:'IBM Plex Mono',monospace")}>{m.ago}</span>
                    <span style={css('flex:1')} />
                    <span onClick={m.onDelete} style={css('font-size:11px;color:#bcc1b8;cursor:pointer;line-height:1')} title="Delete note">✕</span>
                  </div>
                  <div style={css('font-size:11.5px;color:#3c423d;line-height:1.35;margin-top:1px')}>{m.text}</div>
                </div>
              </div>
            ))}
            {detail.noComments && <div style={css('font-size:11px;color:#a6aca2;font-style:italic')}>No notes yet.</div>}
          </div>
          <div style={css('display:flex;gap:7px')}>
            <HInput
              value={detail.draft}
              onChange={detail.onDraft}
              onKeyDown={detail.onKey}
              placeholder="Add a note…"
              style={css("flex:1;border:1px solid #dde0d9;border-radius:7px;padding:8px 10px;font-size:11.5px;font-family:'Archivo',sans-serif;color:#23282a;outline:none")}
              focus={{ borderColor: '#9bb0e8' }}
            />
            <button onClick={detail.addComment} style={css('background:#15191e;color:#fff;border:none;border-radius:7px;padding:0 13px;font-size:12px;font-weight:600;cursor:pointer')}>Post</button>
          </div>
        </div>
      </div>

      <div style={css('padding:12px 16px;border-top:1px solid #e7eae3;display:flex;gap:8px')}>
        <HButton onClick={detail.onEdit} style={css("flex:1;background:#f4f6f1;border:1px solid #e0e3dc;color:#3c423d;border-radius:8px;padding:9px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#eaede6' }}>Edit</HButton>
        <HButton onClick={detail.remove} style={css("flex:1;background:#fdeeee;border:1px solid #f3cdcd;color:#b32f2f;border-radius:8px;padding:9px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#fae2e2' }}>Remove appointment</HButton>
      </div>
    </aside>
  );
}
