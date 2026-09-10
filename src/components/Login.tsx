import type { VM } from '../useScheduler';
import { css, HButton, HInput } from '../ui';

export function Login({ vm }: { vm: VM }) {
  const isDark = vm.isDark;

  return (
    <div style={vm.loginWrapStyle}>
      <div style={vm.loginBrandStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', position: 'relative', zIndex: 2 }}>
          <img
            src="/utac-logo.jpg"
            alt="UTAC Logo"
            style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'contain', background: '#fff', padding: '2px' }}
          />
          <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-.2px' }}>UTAC</div>
        </div>

        {vm.isMobile && (
          <div style={{ fontSize: '13px', color: '#9aa0a0', marginTop: '8px', position: 'relative', zIndex: 2 }}>
            Plan QA site coverage - together, on any device.
          </div>
        )}

        {vm.showLoginExtras && (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2, maxWidth: '380px' }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: '#6fe3a0', letterSpacing: '1.5px', marginBottom: '16px' }}>QA OPERATIONS PLATFORM</div>
              <div style={{ fontSize: '34px', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-.8px', marginBottom: '16px' }}>
                Plan site coverage<br />without the spreadsheet.
              </div>
              <div style={{ fontSize: '14px', lineHeight: 1.55, color: '#9aa0a0' }}>
                Schedule which QA go to which internal site, on which customer lot - together, in real time, with department and conflict guardrails.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginTop: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#c4cac8' }}><span style={{ color: '#6fe3a0' }}>▢</span>Cross-site weekly coverage grid</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#c4cac8' }}><span style={{ color: '#6fe3a0' }}>▢</span>Live department &amp; double-book checks</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#c4cac8' }}><span style={{ color: '#6fe3a0' }}>▢</span>Shared planning with your QA leads</div>
              </div>
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#5a6160', position: 'relative', zIndex: 2 }}>v2.4 - U1 - U2 - U3</div>
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: .5, backgroundImage: 'linear-gradient(rgba(111,227,160,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(111,227,160,.06) 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
            <div style={{ position: 'absolute', right: '34px', bottom: '34px', zIndex: 1, width: '130px', height: '130px', opacity: .55, backgroundImage: 'radial-gradient(circle,rgba(111,227,160,.5) 2px,transparent 2.5px)', backgroundSize: '26px 26px' }} />
          </>
        )}
      </div>

      <div style={vm.loginFormWrapStyle}>
        <div style={{ width: '100%', maxWidth: '360px', animation: 'fadeUp .35s ease' }}>
          <div style={{ fontSize: '21px', fontWeight: 700, letterSpacing: '-.3px', marginBottom: '5px', color: isDark ? '#f8fafc' : '#0f172a' }}>Sign in</div>
          <div style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '26px' }}>Use your Nexsil work account.</div>
          <label htmlFor="login-email" style={{ fontSize: '11px', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', display: 'block', marginBottom: '6px' }}>Work email</label>
          <HInput
            id="login-email"
            value={vm.loginEmail}
            onChange={vm.onEmail}
            onKeyDown={vm.onLoginKey}
            style={{ width: '100%', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: '9px', padding: '11px 13px', fontSize: '13.5px', fontFamily: "'Archivo',sans-serif", color: isDark ? '#f8fafc' : '#0f172a', outline: 'none', marginBottom: '15px', background: isDark ? '#0f172a' : '#ffffff' }}
            focus={{ borderColor: '#2563eb' }}
          />
          <label htmlFor="login-pass" style={{ fontSize: '11px', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', display: 'block', marginBottom: '6px' }}>Password</label>
          <HInput
            id="login-pass"
            type="password"
            value={vm.loginPass}
            onChange={vm.onPass}
            onKeyDown={vm.onLoginKey}
            style={{ width: '100%', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: '9px', padding: '11px 13px', fontSize: '13.5px', fontFamily: "'Archivo',sans-serif", color: isDark ? '#f8fafc' : '#0f172a', outline: 'none', marginBottom: '20px', background: isDark ? '#0f172a' : '#ffffff' }}
            focus={{ borderColor: '#2563eb' }}
          />
          <HButton
            onClick={vm.signIn}
            style={css("width:100%;background:#2563eb;color:#fff;border:none;border-radius:9px;padding:12px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
            hover={{ background: '#1d4ed8' }}
          >
            Sign in
          </HButton>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0' }}>
            <div style={{ flex: 1, height: '1px', background: isDark ? '#334155' : '#e2e8f0' }} />
            <span style={{ fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: isDark ? '#334155' : '#e2e8f0' }} />
          </div>
          <HButton
            onClick={vm.signIn}
            style={{ width: '100%', background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: '9px', padding: '11px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Archivo',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px' }}
            hover={{ background: isDark ? '#1e293b' : '#f8fafc' }}
          >
            <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: isDark ? '#1e293b' : '#e2e8f0', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>G</span>
            Continue with Google
          </HButton>
          <div style={{ fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8', textAlign: 'center', marginTop: '24px', lineHeight: 1.5 }}>
            QA Operations - UTAC<br />Protected internal system - authorized staff only
          </div>
        </div>
      </div>
    </div>
  );
}
