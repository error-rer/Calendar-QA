import type { VM } from '../useScheduler';
import { HButton, HDiv } from '../ui';

export function Header({ vm }: { vm: VM }) {
  const isDark = vm.isDark;

  return (
    <header
      style={{
        height: '58px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '0 14px 0 16px',
        background: isDark ? '#1e293b' : '#ffffff',
        borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        zIndex: 30,
        position: 'relative',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
        <img
          src="/utac-logo.jpg"
          alt="UTAC Logo"
          style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'contain', flexShrink: 0 }}
        />
        <div style={{ lineHeight: 1.05 }}>
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', letterSpacing: '-.2px' }}>
            Calendar Auditor
          </div>
          {vm.showPresence && (
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: isDark ? '#94a3b8' : '#64748b', letterSpacing: '.3px', marginTop: '1px' }}>
              UTAC
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          background: isDark ? '#0f172a' : '#f1f5f9',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          borderRadius: '8px',
          padding: '2px',
          gap: '2px',
          marginLeft: '2px',
        }}
      >
        <button onClick={vm.goSchedule} style={vm.navSchedStyle}>
          Schedule
        </button>
        <button onClick={vm.goSummary} style={vm.navSummaryStyle}>
          Summary
        </button>
        <button onClick={vm.goAdmin} style={vm.navAdminStyle}>
          Manage
        </button>
      </div>

      <div style={{ flex: 1 }} />

      {/* Theme Toggle Button */}
      <button
        onClick={vm.toggleTheme}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        style={{
          background: isDark ? '#334155' : '#f1f5f9',
          border: `1px solid ${isDark ? '#475569' : '#cbd5e1'}`,
          borderRadius: '8px',
          padding: '5px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: "'Archivo', sans-serif",
          color: isDark ? '#f8fafc' : '#0f172a',
          transition: 'all 0.15s ease',
        }}
      >
        <span style={{ fontSize: '13px', lineHeight: 1 }}>{isDark ? '☀️' : '🌙'}</span>
        <span>{isDark ? 'Light' : 'Dark'}</span>
      </button>

      {vm.showPresence && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{ display: 'flex' }}>
              {vm.presence.map((p, i) => (
                <div key={i} title={p.name} style={p.avatarStyle}>
                  {p.initials}
                </div>
              ))}
            </div>
            <div style={{ lineHeight: 1.1, marginRight: '4px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b' }}>
                3 teammates
              </div>
              <div style={{ fontSize: '10px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                editing now
              </div>
            </div>
          </div>
          <div style={{ width: '1px', height: '26px', background: isDark ? '#334155' : '#e2e8f0' }} />
        </>
      )}

      <div style={{ position: 'relative' }}>
        <HDiv
          onClick={vm.toggleUserMenu}
          style={{ display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer', padding: '4px 8px 4px 4px', borderRadius: '9px' }}
          hover={{ background: isDark ? '#334155' : '#f1f5f9' }}
        >
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>
            JL
          </div>
          {vm.showPresence && (
            <>
              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a' }}>Jordan Lee</div>
                <div style={{ fontSize: '10px', color: isDark ? '#94a3b8' : '#64748b' }}>QA Planner</div>
              </div>
              <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '10px' }}>▾</span>
            </>
          )}
        </HDiv>
        {vm.userMenuOpen && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '48px',
              width: '212px',
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              borderRadius: '11px',
              boxShadow: isDark ? '0 10px 30px rgba(0,0,0,.4)' : '0 10px 30px rgba(0,0,0,.1)',
              padding: '7px',
              zIndex: 40,
              animation: 'fadeUp .14s ease',
            }}
          >
            <div style={{ padding: '8px 10px 9px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a' }}>Jordan Lee</div>
              <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>jordan.lee@nexsil.com</div>
            </div>
            <div style={{ height: '1px', background: isDark ? '#334155' : '#e2e8f0', margin: '2px 0' }} />
            <HButton
              onClick={vm.goProfile}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: '7px', fontSize: '12.5px', color: isDark ? '#f1f5f9' : '#0f172a', fontFamily: "'Archivo',sans-serif" }}
              hover={{ background: isDark ? '#334155' : '#f1f5f9' }}
            >
              Your profile
            </HButton>
            <HButton
              onClick={vm.signOut}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: '7px', fontSize: '12.5px', color: isDark ? '#f87171' : '#dc2626', fontFamily: "'Archivo',sans-serif" }}
              hover={{ background: isDark ? '#451a1a' : '#fef2f2' }}
            >
              Sign out
            </HButton>
          </div>
        )}
      </div>
    </header>
  );
}
