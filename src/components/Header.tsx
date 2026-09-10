import type { VM } from '../useScheduler';
import { css, HButton, HDiv } from '../ui';

export function Header({ vm }: { vm: VM }) {
  return (
    <header style={css('height:58px;flex-shrink:0;display:flex;align-items:center;gap:14px;padding:0 14px 0 16px;background:#1e293b;border-bottom:1px solid #334155;z-index:30;position:relative')}>
      <div style={css('display:flex;align-items:center;gap:11px')}>
        <img
          src="/utac-logo.jpg"
          alt="UTAC Logo"
          style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'contain', flexShrink: 0 }}
        />
        <div style={css('line-height:1.05')}>
          <div style={css('font-size:14.5px;font-weight:700;color:#f8fafc;letter-spacing:-.2px')}>Calendar Auditor</div>
          {vm.showPresence && (
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;color:#94a3b8;letter-spacing:.3px;margin-top:1px")}>UTAC</div>
          )}
        </div>
      </div>

      <div style={css('display:flex;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:2px;gap:2px;margin-left:2px')}>
        <button onClick={vm.goSchedule} style={vm.navSchedStyle}>Schedule</button>
        <button onClick={vm.goSummary} style={vm.navSummaryStyle}>Summary</button>
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
              <div style={css('font-size:11.5px;font-weight:600;color:#f1f5f9')}>3 teammates</div>
              <div style={css('font-size:10px;color:#22c55e;display:flex;align-items:center;gap:4px')}>
                <span style={css('width:6px;height:6px;border-radius:50%;background:#22c55e;animation:pulse 2s infinite')} />editing now
              </div>
            </div>
          </div>
          <div style={css('width:1px;height:26px;background:#334155')} />
        </>
      )}

      <div style={css('position:relative')}>
        <HDiv
          onClick={vm.toggleUserMenu}
          style={css('display:flex;align-items:center;gap:9px;cursor:pointer;padding:4px 8px 4px 4px;border-radius:9px')}
          hover={{ background: '#334155' }}
        >
          <div style={css("width:30px;height:30px;border-radius:8px;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;flex-shrink:0")}>JL</div>
          {vm.showPresence && (
            <>
              <div style={css('line-height:1.1')}>
                <div style={css('font-size:12px;font-weight:600;color:#f8fafc')}>Jordan Lee</div>
                <div style={css('font-size:10px;color:#94a3b8')}>QA Planner</div>
              </div>
              <span style={css('color:#94a3b8;font-size:10px')}>▾</span>
            </>
          )}
        </HDiv>
        {vm.userMenuOpen && (
          <div style={css('position:absolute;right:0;top:48px;width:212px;background:#1e293b;border:1px solid #334155;border-radius:11px;box-shadow:0 10px 30px rgba(0,0,0,.4);padding:7px;z-index:40;animation:fadeUp .14s ease')}>
            <div style={css('padding:8px 10px 9px')}>
              <div style={css('font-size:12.5px;font-weight:600;color:#f8fafc')}>Jordan Lee</div>
              <div style={css('font-size:11px;color:#94a3b8')}>jordan.lee@nexsil.com</div>
            </div>
            <div style={css('height:1px;background:#334155;margin:2px 0')} />
            <HButton onClick={vm.goProfile} style={css("width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:8px 10px;border-radius:7px;font-size:12.5px;color:#f1f5f9;font-family:'Archivo',sans-serif")} hover={{ background: '#334155' }}>Your profile</HButton>
            <HButton onClick={vm.signOut} style={css("width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:8px 10px;border-radius:7px;font-size:12.5px;color:#f87171;font-family:'Archivo',sans-serif")} hover={{ background: '#451a1a' }}>Sign out</HButton>
          </div>
        )}
      </div>
    </header>
  );
}
