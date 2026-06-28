import type { VM } from '../useScheduler';
import { css, HButton } from '../ui';

const engGrid = 'display:grid;grid-template-columns:minmax(180px,1.4fr) 2fr 80px 130px;gap:0';
const siteGrid = 'display:grid;grid-template-columns:1.4fr 1.4fr 90px 80px 120px;gap:0';
const orderGrid = 'display:grid;grid-template-columns:96px 1.3fr 1fr 90px 1.1fr 86px 96px;gap:0';

export function Admin({ vm }: { vm: VM }) {
  return (
    <main className="scrl" style={vm.adminMainStyle}>
      <div style={vm.adminWrapStyle}>
        <div style={css('margin-bottom:20px')}>
          <div style={css('font-size:20px;font-weight:700;letter-spacing:-.3px')}>Manage workspace</div>
          <div style={css('font-size:13px;color:#7a807a;margin-top:3px')}>Engineers, fab sites, and customer orders. Changes apply to the live schedule.</div>
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
          <button onClick={vm.setTabSite} style={vm.tabSiteStyle}>Fab sites</button>
          <button onClick={vm.setTabOrder} style={vm.tabOrderStyle}>Customer orders</button>
        </div>

        {vm.tabEngineers && <EngineersTable vm={vm} />}
        {vm.tabSites && <SitesTable vm={vm} />}
        {vm.tabOrders && <OrdersTable vm={vm} />}
      </div>
    </main>
  );
}

function EngineersTable({ vm }: { vm: VM }) {
  return (
    <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;overflow:hidden')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #eef1ea')}>
        <div style={css('font-size:13px;font-weight:700')}>QA engineers <span style={css('color:#9aa097;font-weight:500')}>· {vm.engCount}</span></div>
        <HButton onClick={vm.addEngineer} style={css("background:#15191e;color:#fff;border:none;border-radius:7px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#23282e' }}>+ New engineer</HButton>
      </div>
      <div style={css(engGrid + ";padding:9px 18px;border-bottom:1px solid #eef1ea;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#9aa097;letter-spacing:.5px")}>
        <div>ENGINEER</div><div>CERTIFICATIONS</div><div style={css('text-align:center')}>APPOINTMENTS</div><div style={css('text-align:right')}>STATUS</div>
      </div>
      {vm.adminEngineers.map((e) => (
        <div key={e.id} style={css(engGrid + ';padding:12px 18px;border-bottom:1px solid #f2f4ee;align-items:center')}>
          <div style={css('display:flex;align-items:center;gap:10px;min-width:0')}>
            <div style={e.avatarStyle}>{e.initials}</div>
            <div style={css('min-width:0')}>
              <div style={css('font-size:12.5px;font-weight:600;color:#23282a')}>{e.name}</div>
              <div style={css('font-size:10.5px;color:#8a9088')}>{e.role}</div>
            </div>
          </div>
          <div style={css('display:flex;gap:5px;flex-wrap:wrap;align-items:center;position:relative')}>
            {e.certs.map((c) => (
              <span key={c.code} style={css("display:inline-flex;align-items:center;gap:4px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#46504a;background:#eef3ee;border:1px solid #dde6dd;border-radius:5px;padding:2px 5px 2px 7px")}>
                {c.code}<HoverX onClick={c.onRemove} />
              </span>
            ))}
            {e.noCerts && (
              <span style={css('font-size:10.5px;color:#c0392b;font-style:italic;background:#fdeeee;border:1px solid #f3cdcd;border-radius:5px;padding:2px 7px')}>no certifications</span>
            )}
            <button onClick={e.toggleAdd} style={css("font-size:10.5px;color:#5b7fd6;background:#eef2fd;border:1px solid #d8e2fa;border-radius:5px;padding:2px 8px;cursor:pointer;font-family:'Archivo',sans-serif;font-weight:600")}>+ cert</button>
            {e.addOpen && (
              <div style={css('position:absolute;left:0;top:28px;z-index:20;background:#fff;border:1px solid #e2e5de;border-radius:9px;box-shadow:0 10px 26px rgba(20,25,30,.14);padding:6px;min-width:172px;animation:fadeUp .12s ease')}>
                {e.addable.map((a) => (
                  <HButton key={a.code} onClick={a.onAdd} style={css("display:block;width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:7px 9px;border-radius:6px;font-size:11.5px;color:#3c423d;font-family:'Archivo',sans-serif")} hover={{ background: '#f4f6f1' }}>
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-weight:600;color:#5b7fd6")}>{a.code}</span> · {a.name}
                  </HButton>
                ))}
                {e.allHeld && <div style={css('font-size:11px;color:#a6aca2;padding:7px 9px;font-style:italic')}>All certs held</div>}
              </div>
            )}
          </div>
          <div style={css("text-align:center;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#3c423d")}>{e.appointments}</div>
          <div style={css('display:flex;justify-content:flex-end')}>
            <button onClick={e.toggleStatus} style={e.statusStyle}>{e.statusLabel}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function HoverX({ onClick }: { onClick: () => void }) {
  return (
    <HButton
      onClick={onClick}
      style={css('cursor:pointer;color:#9aa6a0;font-size:11px;line-height:1;background:none;border:none;padding:0')}
      hover={{ color: '#d23b3b' }}
    >
      ×
    </HButton>
  );
}

function SitesTable({ vm }: { vm: VM }) {
  return (
    <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;overflow:hidden')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #eef1ea')}>
        <div style={css('font-size:13px;font-weight:700')}>Fab &amp; assembly sites <span style={css('color:#9aa097;font-weight:500')}>· {vm.siteCount}</span></div>
        <HButton onClick={vm.addSite} style={css("background:#15191e;color:#fff;border:none;border-radius:7px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#23282e' }}>+ New site</HButton>
      </div>
      <div style={css(siteGrid + ";padding:9px 18px;border-bottom:1px solid #eef1ea;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#9aa097;letter-spacing:.5px")}>
        <div>SITE</div><div>LOCATION</div><div>CODE</div><div style={css('text-align:center')}>APPOINTMENTS</div><div style={css('text-align:right')}>VISIBILITY</div>
      </div>
      {vm.adminSites.map((s, i) => (
        <div key={i} style={css(siteGrid + ';padding:13px 18px;border-bottom:1px solid #f2f4ee;align-items:center')}>
          <div style={css('display:flex;align-items:center;gap:10px')}><span style={s.swatchStyle} /><span style={css('font-size:12.5px;font-weight:600;color:#23282a')}>{s.name}</span></div>
          <div style={css('font-size:12px;color:#5c625c')}>{s.loc}</div>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#5c625c")}>{s.code}</div>
          <div style={css("text-align:center;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#3c423d")}>{s.appointments}</div>
          <div style={css('display:flex;justify-content:flex-end')}><button onClick={s.toggle} style={s.statusStyle}>{s.statusLabel}</button></div>
        </div>
      ))}
    </div>
  );
}

function OrdersTable({ vm }: { vm: VM }) {
  return (
    <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;overflow:hidden')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #eef1ea')}>
        <div style={css('font-size:13px;font-weight:700')}>Customer orders <span style={css('color:#9aa097;font-weight:500')}>· {vm.orderCount}</span></div>
        <HButton onClick={vm.addOrder} style={css("background:#15191e;color:#fff;border:none;border-radius:7px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#23282e' }}>+ New order</HButton>
      </div>
      <div style={css(orderGrid + ";padding:9px 18px;border-bottom:1px solid #eef1ea;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#9aa097;letter-spacing:.5px")}>
        <div>ORDER</div><div>PRODUCT</div><div>CUSTOMER</div><div>SITE</div><div>REQ CERTS</div><div style={css('text-align:center')}>PRIORITY</div><div style={css('text-align:right')}>STATUS</div>
      </div>
      {vm.adminOrders.map((o, i) => (
        <div key={i} style={css(orderGrid + ';padding:12px 18px;border-bottom:1px solid #f2f4ee;align-items:center')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11.5px;font-weight:600;color:#15191e")}>{o.code}</div>
          <div style={css('font-size:12px;color:#3c423d;font-weight:500')}>{o.product}</div>
          <div style={css('font-size:11.5px;color:#5c625c')}>{o.customer}</div>
          <div style={css('display:flex;align-items:center;gap:6px')}><span style={o.swatchStyle} /><span style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#5c625c")}>{o.plantCode}</span></div>
          <div style={css('display:flex;gap:4px;flex-wrap:wrap')}>
            {o.req.map((c, ci) => (
              <span key={ci} style={css("font-family:'IBM Plex Mono',monospace;font-size:9px;color:#6a706a;background:#f1f3ee;border:1px solid #e3e6e0;border-radius:3px;padding:1px 5px")}>{c}</span>
            ))}
          </div>
          <div style={css('display:flex;justify-content:center')}><button onClick={o.cyclePriority} style={o.priorityStyle}>{o.priority}</button></div>
          <div style={css('display:flex;justify-content:flex-end')}><span style={o.statusStyle}>{o.statusLabel}</span></div>
        </div>
      ))}
    </div>
  );
}
