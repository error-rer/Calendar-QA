import type { VM } from '../useScheduler';
import { css, HButton, HDiv } from '../ui';

export function Header({ vm }: { vm: VM }) {
  return (
    <header style={css('height:58px;flex-shrink:0;display:flex;align-items:center;gap:14px;padding:0 14px 0 16px;background:#fff;border-bottom:1px solid #d8dcd4;z-index:30;position:relative')}>
      <div style={css('display:flex;align-items:center;gap:11px')}>
        <div style={css('width:30px;height:30px;border-radius:6px;background:#15191e;display:flex;align-items:center;justify-content:center;flex-shrink:0')}>
          <div style={css('width:13px;height:13px;border:2px solid #6fe3a0;border-radius:2px')} />
        </div>
        <div style={css('line-height:1.05')}>
          <div style={css('font-size:14.5px;font-weight:700;letter-spacing:-.2px')}>Fab&nbsp;QA&nbsp;Ops</div>
          {vm.showPresence && (
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;color:#8a9088;letter-spacing:.3px;margin-top:1px")}>UTAC</div>
          )}
        </div>
      </div>

      <div style={css('display:flex;background:#f1f3ee;border:1px solid #e0e3dc;border-radius:8px;padding:2px;gap:2px;margin-left:2px')}>
        <button onClick={vm.goSchedule} style={vm.navSchedStyle}>Schedule</button>
        <button onClick={vm.goAdmin} style={vm.navAdminStyle}>Manage</button>
      </div>

      <div style={css('flex:1')} />

      {vm.showPresence && (
        <>
          <div style={css('display:flex;align-items:center;gap:9px')}>
            <div style={css('display:flex')}>
              {vm.presence.map((p, i) => (
                <div key={i} title={p.name} style={p.avatarStyle}>{p.initials}</div>
              ))}
            </div>
            <div style={css('line-height:1.1;margin-right:4px')}>
              <div style={css('font-size:11.5px;font-weight:600;color:#2a2f28')}>3 teammates</div>
              <div style={css('font-size:10px;color:#1f9d57;display:flex;align-items:center;gap:4px')}>
                <span style={css('width:6px;height:6px;border-radius:50%;background:#1f9d57;animation:pulse 2s infinite')} />editing now
              </div>
            </div>
          </div>
          <div style={css('width:1px;height:26px;background:#e3e6df')} />
        </>
      )}

      <div style={css('position:relative')}>
        <HDiv
          onClick={vm.toggleUserMenu}
          style={css('display:flex;align-items:center;gap:9px;cursor:pointer;padding:4px 8px 4px 4px;border-radius:9px')}
          hover={{ background: '#f4f6f1' }}
        >
          <div style={css("width:30px;height:30px;border-radius:8px;background:#15191e;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;flex-shrink:0")}>JL</div>
          {vm.showPresence && (
            <>
              <div style={css('line-height:1.1')}>
                <div style={css('font-size:12px;font-weight:600;color:#23282a')}>Jordan Lee</div>
                <div style={css('font-size:10px;color:#8a9088')}>QA Planner</div>
              </div>
              <span style={css('color:#a6aca2;font-size:10px')}>▾</span>
            </>
          )}
        </HDiv>
        {vm.userMenuOpen && (
          <div style={css('position:absolute;right:0;top:48px;width:212px;background:#fff;border:1px solid #e2e5de;border-radius:11px;box-shadow:0 10px 30px rgba(20,25,30,.13);padding:7px;z-index:40;animation:fadeUp .14s ease')}>
            <div style={css('padding:8px 10px 9px')}>
              <div style={css('font-size:12.5px;font-weight:600;color:#23282a')}>Jordan Lee</div>
              <div style={css('font-size:11px;color:#8a9088')}>jordan.lee@nexsil.com</div>
            </div>
            <div style={css('height:1px;background:#eef1ea;margin:2px 0')} />
            <HButton onClick={vm.goProfile} style={css("width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:8px 10px;border-radius:7px;font-size:12.5px;color:#3c423d;font-family:'Archivo',sans-serif")} hover={{ background: '#f4f6f1' }}>Your profile</HButton>
            <HButton onClick={vm.addCustomer} style={css("width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:8px 10px;border-radius:7px;font-size:12.5px;color:#3c423d;font-family:'Archivo',sans-serif")} hover={{ background: '#f4f6f1' }}>New customer</HButton>
            <HButton onClick={vm.addEngineer} style={css("width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:8px 10px;border-radius:7px;font-size:12.5px;color:#3c423d;font-family:'Archivo',sans-serif")} hover={{ background: '#f4f6f1' }}>New QA</HButton>
            <HButton onClick={vm.addSite} style={css("width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:8px 10px;border-radius:7px;font-size:12.5px;color:#3c423d;font-family:'Archivo',sans-serif")} hover={{ background: '#f4f6f1' }}>New internal</HButton>
            <HButton onClick={vm.goAdmin} style={css("width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:8px 10px;border-radius:7px;font-size:12.5px;color:#3c423d;font-family:'Archivo',sans-serif")} hover={{ background: '#f4f6f1' }}>Manage workspace</HButton>
            <HButton onClick={vm.signOut} style={css("width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:8px 10px;border-radius:7px;font-size:12.5px;color:#b32f2f;font-family:'Archivo',sans-serif")} hover={{ background: '#fdeeee' }}>Sign out</HButton>
          </div>
        )}
      </div>
    </header>
  );
}
