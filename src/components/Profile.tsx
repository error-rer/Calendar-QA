import type { VM } from '../useScheduler';
import { HButton } from '../ui';

export function Profile({ vm }: { vm: VM }) {
  const p = vm.profile;
  const isDark = vm.isDark;

  return (
    <main className="scrl" style={{ flex: 1, overflow: 'auto', background: isDark ? '#0f172a' : '#f4f6f1', minHeight: 0 }}>
      <div style={{ maxWidth: '880px', margin: '0 auto', padding: '26px 22px 60px' }}>
        <div style={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
          <div style={{ height: '84px', background: isDark ? '#0f172a' : '#e2e8f0', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: .5, backgroundImage: 'linear-gradient(rgba(111,227,160,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(111,227,160,.07) 1px,transparent 1px)', backgroundSize: '22px 22px' }} />
          </div>
          <div style={{ padding: '0 22px 20px', display: 'flex', alignItems: 'flex-end', gap: '16px', marginTop: '-32px', position: 'relative', flexWrap: 'wrap' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '16px', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: '24px', fontWeight: 600, border: `3px solid ${isDark ? '#1e293b' : '#ffffff'}`, flexShrink: 0 }}>JL</div>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: '2px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-.3px', color: isDark ? '#f8fafc' : '#0f172a' }}>{p.name}</div>
              <div style={{ fontSize: '12.5px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '1px' }}>{p.role}</div>
            </div>
            <HButton style={{ background: isDark ? '#0f172a' : '#f1f5f9', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, color: isDark ? '#94a3b8' : '#334155', borderRadius: '9px', padding: '9px 15px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Archivo',sans-serif" }} hover={{ background: isDark ? '#334155' : '#e2e8f0' }}>Edit profile</HButton>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '16px' }}>
          {p.stats.map((s, i) => (
            <div key={i} style={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', padding: '15px 17px' }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', letterSpacing: '.5px' }}>{s.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-.5px', marginTop: '5px', color: isDark ? '#f8fafc' : '#0f172a' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8', marginTop: '1px' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
          <div style={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', letterSpacing: '.5px', marginBottom: '14px' }}>ACCOUNT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <Row label="Email" value={p.email} isDark={isDark} />
              <Divider isDark={isDark} />
              <Row label="Phone" value={p.phone} isDark={isDark} />
              <Divider isDark={isDark} />
              <Row label="Team" value={p.team} isDark={isDark} />
              <Divider isDark={isDark} />
              <Row label="Tenure" value={p.joined} isDark={isDark} />
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', letterSpacing: '.5px', margin: '20px 0 11px' }}>INTERNAL UNDER COVERAGE</div>
            <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
              {p.sites.map((st, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 11px', background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '8px' }}>
                  <span style={st.swatchStyle} />
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a' }}>{st.name}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9.5px', color: isDark ? '#94a3b8' : '#64748b' }}>{st.code}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', letterSpacing: '.5px', marginBottom: '14px' }}>YOUR RECENT ACTIVITY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              {p.activity.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: '9px', alignItems: 'flex-start' }}>
                  <span style={a.dotStyle} />
                  <div style={{ lineHeight: 1.3, minWidth: 0 }}>
                    <span style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b' }}><span style={{ fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a' }}>{a.who}</span> {a.text}</span>
                    <div style={{ fontSize: '9.5px', color: isDark ? '#64748b' : '#94a3b8', marginTop: '1px', fontFamily: "'IBM Plex Mono',monospace" }}>{a.ago}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>{label}</span>
      <span style={{ fontSize: '12.5px', color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function Divider({ isDark }: { isDark: boolean }) {
  return <div style={{ height: '1px', background: isDark ? '#334155' : '#e2e8f0' }} />;
}
