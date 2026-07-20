import { useState } from 'react';
import type { VM } from '../useScheduler';
import { css, HButton } from '../ui';

const engGrid = 'display:grid;grid-template-columns:minmax(180px,1.4fr) 2fr 80px;gap:0';
const siteGrid = 'display:grid;grid-template-columns:1.4fr 1.4fr 90px 80px 120px 50px;gap:0';
const orderGrid = 'display:grid;grid-template-columns:96px 1.3fr 1fr 96px 50px;gap:0';

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
          <button onClick={vm.setTabEng} style={vm.tabEngStyle}>Auditor</button>
          <button onClick={vm.setTabSite} style={vm.tabSiteStyle}>Internal</button>
          <button onClick={vm.setTabOrder} style={vm.tabOrderStyle}>Customer orders</button>
          <button onClick={vm.setTabOptions} style={vm.tabOptionsStyle}>Options</button>
        </div>

        {vm.tabEngineers && <EngineersTable vm={vm} />}
        {vm.tabSites && <SitesTable vm={vm} />}
        {vm.tabOrders && <OrdersTable vm={vm} />}
        {vm.tabOptions && <OptionsPanel vm={vm} />}
      </div>
    </main>
  );
}

function EngineersTable({ vm }: { vm: VM }) {
  return (
    <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;overflow:hidden')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #eef1ea')}>
        <div style={css('font-size:13px;font-weight:700')}>Auditor <span style={css('color:#9aa097;font-weight:500')}>┬╖ {vm.engCount}</span></div>
        <HButton onClick={vm.addEngineer} style={css("background:#15191e;color:#fff;border:none;border-radius:7px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#23282e' }}>+ New Auditor</HButton>
      </div>
      <div style={css(engGrid + ";padding:9px 18px;border-bottom:1px solid #eef1ea;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#9aa097;letter-spacing:.5px")}>
        <div>Auditor</div><div>DEPT + SUB-DEPT</div><div style={css('text-align:center')}>APPOINTMENTS</div>
      </div>
      {vm.adminEngineers.map((e) => (
        <div key={e.id} style={css(engGrid + ';padding:12px 18px;border-bottom:1px solid #f2f4ee;align-items:center')}>
          <div style={css('display:flex;align-items:center;gap:10px;min-width:0')}>
            <div style={e.avatarStyle}>{e.initials}</div>
            <div style={css('min-width:0')}>
              <div style={css('font-size:12.5px;font-weight:600;color:#23282a')}>{e.name}</div>
              <div style={css('font-size:10.5px;color:#8a9088')}>{e.department}{e.subDepartments.length > 0 ? ' ΓÇö ' + e.subDepartments.join(', ') : ''}</div>
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
        <div style={css('font-size:13px;font-weight:700')}>Internal sites <span style={css('color:#9aa097;font-weight:500')}>┬╖ {vm.siteCount}</span></div>
        <HButton onClick={vm.addSite} style={css("background:#15191e;color:#fff;border:none;border-radius:7px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#23282e' }}>+ New internal</HButton>
      </div>
      <div style={css(siteGrid + ";padding:9px 18px;border-bottom:1px solid #eef1ea;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#9aa097;letter-spacing:.5px")}>
        <div>INTERNAL</div><div>LOCATION</div><div>CODE</div><div style={css('text-align:center')}>APPOINTMENTS</div><div style={css('text-align:right')}>VISIBILITY</div><div></div>
      </div>
      {vm.adminSites.map((s, i) => (
        <div key={i} style={css(siteGrid + ';padding:13px 18px;border-bottom:1px solid #f2f4ee;align-items:center')}>
          <div style={css('display:flex;align-items:center;gap:10px')}><div style={css('font-size:12.5px;font-weight:600;color:#23282a')}>{s.name}</div></div>
          <div style={css('font-size:12px;color:#5c625c')}>{s.loc}</div>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#5c625c")}>{s.code}</div>
          <div style={css("text-align:center;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#3c423d")}>{s.appointments}</div>
          <div style={css('display:flex;justify-content:flex-end')}><button onClick={s.toggle} style={s.statusStyle}>{s.statusLabel}</button></div>
          <button onClick={s.onDelete} style={css('background:none;border:none;cursor:pointer;color:#bcc1b8;font-size:13px;padding:2px')}>✕</button>
        </div>
      ))}
    </div>
  );
}

function OrdersTable({ vm }: { vm: VM }) {
  return (
    <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;overflow:hidden')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #eef1ea')}>
        <div style={css('font-size:13px;font-weight:700')}>Customer orders <span style={css('color:#9aa097;font-weight:500')}>┬╖ {vm.orderCount}</span></div>
        <HButton onClick={vm.addOrder} style={css("background:#15191e;color:#fff;border:none;border-radius:7px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#23282e' }}>+ New order</HButton>
      </div>
      <div style={css(orderGrid + ";padding:9px 18px;border-bottom:1px solid #eef1ea;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#9aa097;letter-spacing:.5px")}>
        <div>ORDER</div><div>PRODUCT</div><div>CUSTOMER</div><div style={css('text-align:right')}>INTERNAL</div><div></div>
      </div>
      {vm.adminOrders.map((o, i) => (
        <div key={i} style={css(orderGrid + ';padding:12px 18px;border-bottom:1px solid #f2f4ee;align-items:center')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11.5px;font-weight:600;color:#15191e")}>{o.code}</div>
          <div style={css('font-size:12px;color:#3c423d;font-weight:500')}>{o.product}</div>
          <div style={css('font-size:11.5px;color:#5c625c')}>{o.customer}</div>
          <div style={css('display:flex;align-items:center;justify-content:flex-end;gap:6px')}><span style={o.swatchStyle} /><span style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#5c625c")}>{o.plantCode}</span></div>
          <button onClick={o.onDelete} style={css('background:none;border:none;cursor:pointer;color:#bcc1b8;font-size:13px;padding:2px')}>✕</button>
        </div>
      ))}
    </div>
  );
}

function TagListEditor({ title, count, values, onAdd, onRemove, placeholder }: { title: string; count: number; values: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void; placeholder: string }) {
  const [draft, setDraft] = useState('');
  const submit = () => { onAdd(draft); setDraft(''); };
  return (
    <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;overflow:hidden')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #eef1ea')}>
        <div style={css('font-size:13px;font-weight:700')}>{title} <span style={css('color:#9aa097;font-weight:500')}>· {count}</span></div>
      </div>
      <div style={css('padding:14px 18px;display:flex;flex-wrap:wrap;gap:8px')}>
        {values.map((v) => (
          <div key={v} style={css('display:flex;align-items:center;gap:6px;background:#f4f6f1;border:1px solid #e0e3dc;border-radius:20px;padding:5px 6px 5px 12px;font-size:12px;color:#3c423d')}>
            {v}
            <button onClick={() => onRemove(v)} style={css('background:none;border:none;cursor:pointer;color:#9aa097;font-size:12px;padding:2px;line-height:1')}>✕</button>
          </div>
        ))}
        {values.length === 0 && <span style={css('font-size:12px;color:#a6aca2;font-style:italic')}>No options yet.</span>}
      </div>
      <div style={css('display:flex;gap:8px;padding:0 18px 16px')}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder={placeholder}
          style={css("flex:1;border:1px solid #dde0d9;border-radius:8px;padding:8px 10px;font-size:12.5px;font-family:'Archivo',sans-serif;color:#23282a;outline:none;background:#fff")}
        />
        <HButton onClick={submit} style={css("background:#15191e;color:#fff;border:none;border-radius:7px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#23282e' }}>+ Add</HButton>
      </div>
    </div>
  );
}

function OptionsPanel({ vm }: { vm: VM }) {
  return (
    <div style={css('display:flex;flex-direction:column;gap:16px')}>
      <TagListEditor
        title="Purpose (customer)"
        count={vm.purposeOptions.length}
        values={vm.purposeOptions}
        onAdd={vm.addPurposeOption}
        onRemove={vm.removePurposeOption}
        placeholder="e.g. supplier audit"
      />
      <TagListEditor
        title="Department (customer)"
        count={vm.customerDepartmentOptions.length}
        values={vm.customerDepartmentOptions}
        onAdd={vm.addCustomerDepartmentOption}
        onRemove={vm.removeCustomerDepartmentOption}
        placeholder="e.g. ISO13485"
      />
      <TagListEditor
        title="Department (internal audit)"
        count={vm.internalDepartmentOptions.length}
        values={vm.internalDepartmentOptions}
        onAdd={vm.addInternalDepartmentOption}
        onRemove={vm.removeInternalDepartmentOption}
        placeholder="e.g. EHS"
      />
    </div>
  );
}
