import type { VM } from '../useScheduler';
import { css, HButton } from '../ui';

export function Profile({ vm }: { vm: VM }) {
  const p = vm.profile;
  return (
    <main className="scrl" style={css('flex:1;overflow:auto;background:#eef0ea;min-height:0')}>
      <div style={css('max-width:880px;margin:0 auto;padding:26px 22px 60px')}>
        <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;overflow:hidden;margin-bottom:16px')}>
          <div style={css('height:84px;background:#15191e;position:relative')}>
            <div style={css('position:absolute;inset:0;opacity:.5;background-image:linear-gradient(rgba(111,227,160,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(111,227,160,.07) 1px,transparent 1px);background-size:22px 22px')} />
          </div>
          <div style={css('padding:0 22px 20px;display:flex;align-items:flex-end;gap:16px;margin-top:-32px;position:relative;flex-wrap:wrap')}>
            <div style={css("width:72px;height:72px;border-radius:16px;background:#2f6df0;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:24px;font-weight:600;border:3px solid #fff;flex-shrink:0")}>JL</div>
            <div style={css('flex:1;min-width:0;padding-bottom:2px')}>
              <div style={css('font-size:20px;font-weight:700;letter-spacing:-.3px')}>{p.name}</div>
              <div style={css('font-size:12.5px;color:#7a807a;margin-top:1px')}>{p.role}</div>
            </div>
            <HButton style={css("background:#f4f6f1;border:1px solid #e0e3dc;color:#3c423d;border-radius:9px;padding:9px 15px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#eaede6' }}>Edit profile</HButton>
          </div>
        </div>

        <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px')}>
          {p.stats.map((s, i) => (
            <div key={i} style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;padding:15px 17px')}>
              <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#9aa097;letter-spacing:.5px")}>{s.label}</div>
              <div style={css('font-size:26px;font-weight:700;letter-spacing:-.5px;margin-top:5px')}>{s.value}</div>
              <div style={css('font-size:11px;color:#8a9088;margin-top:1px')}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={css('display:grid;grid-template-columns:1.2fr 1fr;gap:16px')}>
          <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;padding:18px 20px')}>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#9aa097;letter-spacing:.5px;margin-bottom:14px")}>ACCOUNT</div>
            <div style={css('display:flex;flex-direction:column;gap:13px')}>
              <Row label="Email" value={p.email} />
              <Divider />
              <Row label="Phone" value={p.phone} />
              <Divider />
              <Row label="Team" value={p.team} />
              <Divider />
              <Row label="Tenure" value={p.joined} />
            </div>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#9aa097;letter-spacing:.5px;margin:20px 0 11px")}>INTERNAL UNDER COVERAGE</div>
            <div style={css('display:flex;gap:7px;flex-wrap:wrap')}>
              {p.sites.map((st, i) => (
                <div key={i} style={css('display:flex;align-items:center;gap:7px;padding:6px 11px;background:#f6f7f4;border:1px solid #e6e9e2;border-radius:8px')}>
                  <span style={st.swatchStyle} />
                  <span style={css('font-size:11.5px;font-weight:600;color:#3c423d')}>{st.name}</span>
                  <span style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#9aa097")}>{st.code}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;padding:18px 20px')}>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#9aa097;letter-spacing:.5px;margin-bottom:14px")}>YOUR RECENT ACTIVITY</div>
            <div style={css('display:flex;flex-direction:column;gap:13px')}>
              {p.activity.map((a, i) => (
                <div key={i} style={css('display:flex;gap:9px;align-items:flex-start')}>
                  <span style={a.dotStyle} />
                  <div style={css('line-height:1.3;min-width:0')}>
                    <span style={css('font-size:11.5px;color:#3c423d')}><span style={css('font-weight:600')}>{a.who}</span> {a.text}</span>
                    <div style={css("font-size:9.5px;color:#a6aca2;margin-top:1px;font-family:'IBM Plex Mono',monospace")}>{a.ago}</div>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={css('display:flex;justify-content:space-between;align-items:center;gap:10px')}>
      <span style={css('font-size:12px;color:#8a9088')}>{label}</span>
      <span style={css('font-size:12.5px;color:#23282a;font-weight:500')}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div style={css('height:1px;background:#f2f4ee')} />;
}
