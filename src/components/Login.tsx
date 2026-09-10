import type { VM } from '../useScheduler';
import { css, HButton, HInput } from '../ui';

export function Login({ vm }: { vm: VM }) {
  return (
    <div style={vm.loginWrapStyle}>
      <div style={vm.loginBrandStyle}>
        <div style={css('display:flex;align-items:center;gap:11px;position:relative;z-index:2')}>
          <img
            src="/utac-logo.jpg"
            alt="UTAC Logo"
            style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'contain', background: '#fff', padding: '2px' }}
          />
          <div style={css('font-size:15px;font-weight:700;letter-spacing:-.2px')}>UTAC</div>
        </div>

        {vm.isMobile && (
          <div style={css('font-size:13px;color:#9aa0a0;margin-top:8px;position:relative;z-index:2')}>
            Plan QA site coverage - together, on any device.
          </div>
        )}

        {vm.showLoginExtras && (
          <>
            <div style={css('flex:1;display:flex;flex-direction:column;justify-content:center;position:relative;z-index:2;max-width:380px')}>
              <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;color:#6fe3a0;letter-spacing:1.5px;margin-bottom:16px")}>QA OPERATIONS PLATFORM</div>
              <div style={css('font-size:34px;font-weight:700;line-height:1.1;letter-spacing:-.8px;margin-bottom:16px')}>
                Plan site coverage<br />without the spreadsheet.
              </div>
              <div style={css('font-size:14px;line-height:1.55;color:#9aa0a0')}>
                Schedule which QA go to which internal site, on which customer lot - together, in real time, with department and conflict guardrails.
              </div>
              <div style={css('display:flex;flex-direction:column;gap:11px;margin-top:28px')}>
                <div style={css('display:flex;align-items:center;gap:10px;font-size:13px;color:#c4cac8')}><span style={css('color:#6fe3a0')}>▢</span>Cross-site weekly coverage grid</div>
                <div style={css('display:flex;align-items:center;gap:10px;font-size:13px;color:#c4cac8')}><span style={css('color:#6fe3a0')}>▢</span>Live department &amp; double-book checks</div>
                <div style={css('display:flex;align-items:center;gap:10px;font-size:13px;color:#c4cac8')}><span style={css('color:#6fe3a0')}>▢</span>Shared planning with your QA leads</div>
              </div>
            </div>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;color:#5a6160;position:relative;z-index:2")}>v2.4 - U1 - U2 - U3</div>
            <div style={css('position:absolute;inset:0;z-index:1;opacity:.5;background-image:linear-gradient(rgba(111,227,160,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(111,227,160,.06) 1px,transparent 1px);background-size:26px 26px')} />
            <div style={css('position:absolute;right:34px;bottom:34px;z-index:1;width:130px;height:130px;opacity:.55;background-image:radial-gradient(circle,rgba(111,227,160,.5) 2px,transparent 2.5px);background-size:26px 26px')} />
          </>
        )}
      </div>

      <div style={vm.loginFormWrapStyle}>
        <div style={css('width:100%;max-width:360px;animation:fadeUp .35s ease')}>
          <div style={css('font-size:21px;font-weight:700;letter-spacing:-.3px;margin-bottom:5px;color:#f8fafc')}>Sign in</div>
          <div style={css('font-size:13px;color:#94a3b8;margin-bottom:26px')}>Use your Nexsil work account.</div>
          <label htmlFor="login-email" style={css('font-size:11px;font-weight:600;color:#94a3b8;display:block;margin-bottom:6px')}>Work email</label>
          <HInput
            id="login-email"
            value={vm.loginEmail}
            onChange={vm.onEmail}
            onKeyDown={vm.onLoginKey}
            style={css("width:100%;border:1px solid #334155;border-radius:9px;padding:11px 13px;font-size:13.5px;font-family:'Archivo',sans-serif;color:#f8fafc;outline:none;margin-bottom:15px;background:#0f172a")}
            focus={{ borderColor: '#2563eb' }}
          />
          <label htmlFor="login-pass" style={css('font-size:11px;font-weight:600;color:#94a3b8;display:block;margin-bottom:6px')}>Password</label>
          <HInput
            id="login-pass"
            type="password"
            value={vm.loginPass}
            onChange={vm.onPass}
            onKeyDown={vm.onLoginKey}
            style={css("width:100%;border:1px solid #334155;border-radius:9px;padding:11px 13px;font-size:13.5px;font-family:'Archivo',sans-serif;color:#f8fafc;outline:none;margin-bottom:20px;background:#0f172a")}
            focus={{ borderColor: '#2563eb' }}
          />
          <HButton
            onClick={vm.signIn}
            style={css("width:100%;background:#2563eb;color:#fff;border:none;border-radius:9px;padding:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
            hover={{ background: '#1d4ed8' }}
          >
            Sign in
          </HButton>
          <div style={css('display:flex;align-items:center;gap:12px;margin:18px 0')}>
            <div style={css('flex:1;height:1px;background:#334155')} />
            <span style={css('font-size:11px;color:#64748b')}>or</span>
            <div style={css('flex:1;height:1px;background:#334155')} />
          </div>
          <HButton
            onClick={vm.signIn}
            style={css("width:100%;background:#0f172a;color:#f8fafc;border:1px solid #334155;border-radius:9px;padding:11px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif;display:flex;align-items:center;justify-content:center;gap:9px")}
            hover={{ background: '#1e293b' }}
          >
            <span style={css('width:16px;height:16px;border-radius:4px;background:#1e293b;border:1px solid #334155;color:#60a5fa;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700')}>G</span>
            Continue with Google
          </HButton>
          <div style={css('font-size:11px;color:#64748b;text-align:center;margin-top:24px;line-height:1.5')}>
            QA Operations - UTAC<br />Protected internal system - authorized staff only
          </div>
        </div>
      </div>
    </div>
  );
}
