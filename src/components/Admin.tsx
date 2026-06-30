import type { VM } from '../useScheduler';
import { css, HButton } from '../ui';

const engGrid = 'display:grid;grid-template-columns:minmax(180px,1.4fr) 2fr 80px;gap:0';
const siteGrid = 'display:grid;grid-template-columns:1.4fr 1.4fr 90px 80px 120px;gap:0';

export function Admin({ vm }: { vm: VM }) {
  return (
    <main className="scrl" style={vm.adminMainStyle}>
      <div style={vm.adminWrapStyle}>
        <div style={css('margin-bottom:20px')}>
          <div style={css('font-size:20px;font-weight:700;letter-spacing:-.3px')}>Manage workspace</div>
          <div style={css('font-size:13px;color:#7a807a;margin-top:3px')}>QA, internal sites, and customer orders. Changes apply to the live schedule.</div>
        </div>

        <div style={vm.adminStatGridStyle}>
          {vm.adminStats.map((s, i) => (
            <div key={i} style={css('background:#fff;border:1px solid #e2e5de;border-radius:11px;padding:14px 16px')}>
              <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#9aa097;letter-spacing:.5px")}>{s.label}</div>
              <div style={css('font-size:25px;font-weight:700;letter-spacing:-.5px;margin-top:5px')}>{s.value}</div>
              <div style={css('font-size:11px;color:#8a9088;margin-top:1px')}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={css('display:flex;background:#fff;border:1px solid #e0e3dc;border-radius:9px;padding:2px;gap:2px;width:max-content;margin-bottom:16px')}>
          <button onClick={vm.setTabEng} style={vm.tabEngStyle}>Engineers</button>
          <button onClick={vm.setTabSite} style={vm.tabSiteStyle}>Internal</button>
        </div>

        {vm.tabEngineers && <EngineersTable vm={vm} />}
        {vm.tabSites && <SitesTable vm={vm} />}
      </div>
    </main>
  );
}

function EngineersTable({ vm }: { vm: VM }) {
  return (
    <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;overflow:hidden')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #eef1ea')}>
        <div style={css('font-size:13px;font-weight:700')}>Employee <span style={css('color:#9aa097;font-weight:500')}>· {vm.engCount}</span></div>
        <HButton onClick={vm.addEngineer} style={css("background:#15191e;color:#fff;border:none;border-radius:7px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#23282e' }}>+ New Employee</HButton>
      </div>
      <div style={css(engGrid + ";padding:9px 18px;border-bottom:1px solid #eef1ea;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#9aa097;letter-spacing:.5px")}>
        <div>Employee</div><div>DEPT + SUB-DEPT</div><div style={css('text-align:center')}>APPOINTMENTS</div>
      </div>
      {vm.adminEngineers.map((e) => (
        <div key={e.id} style={css(engGrid + ';padding:12px 18px;border-bottom:1px solid #f2f4ee;align-items:center')}>
          <div style={css('display:flex;align-items:center;gap:10px;min-width:0')}>
            <div style={e.avatarStyle}>{e.initials}</div>
            <div style={css('min-width:0')}>
              <div style={css('font-size:12.5px;font-weight:600;color:#23282a')}>{e.name}</div>
              <div style={css('font-size:10.5px;color:#8a9088')}>{e.department}{e.subDepartments.length > 0 ? ' — ' + e.subDepartments.join(', ') : ''}</div>
            </div>
          </div>
          <div style={css("text-align:center;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#3c423d")}>{e.appointments}</div>
        </div>
      ))}
    </div>
  );
}

function SitesTable({ vm }: { vm: VM }) {
  return (
    <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;overflow:hidden')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #eef1ea')}>
        <div style={css('font-size:13px;font-weight:700')}>Internal sites <span style={css('color:#9aa097;font-weight:500')}>· {vm.siteCount}</span></div>
        <HButton onClick={vm.addSite} style={css("background:#15191e;color:#fff;border:none;border-radius:7px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#23282e' }}>+ New internal</HButton>
      </div>
      <div style={css(siteGrid + ";padding:9px 18px;border-bottom:1px solid #eef1ea;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#9aa097;letter-spacing:.5px")}>
        <div>INTERNAL</div><div>LOCATION</div><div>CODE</div><div style={css('text-align:center')}>APPOINTMENTS</div><div style={css('text-align:right')}>VISIBILITY</div>
      </div>
      {vm.adminSites.map((s, i) => (
        <div key={i} style={css(siteGrid + ';padding:13px 18px;border-bottom:1px solid #f2f4ee;align-items:center')}>
          <div style={css('display:flex;align-items:center;gap:10px')}><div style={css('font-size:12.5px;font-weight:600;color:#23282a')}>{s.name}</div></div>
          <div style={css('font-size:12px;color:#5c625c')}>{s.loc}</div>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#5c625c")}>{s.code}</div>
          <div style={css("text-align:center;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#3c423d")}>{s.appointments}</div>
          <div style={css('display:flex;justify-content:flex-end')}><button onClick={s.toggle} style={s.statusStyle}>{s.statusLabel}</button></div>
        </div>
      ))}
    </div>
  );
}
