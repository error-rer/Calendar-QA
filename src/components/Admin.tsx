import { useState } from 'react';
import type { VM } from '../useScheduler';
import { css, HButton } from '../ui';

const engGrid = 'display:grid;grid-template-columns:minmax(180px,1.4fr) 2fr 80px 50px;gap:0';

export function Admin({ vm }: { vm: VM }) {
  return (
    <main className="scrl" style={vm.adminMainStyle}>
      <div style={vm.adminWrapStyle}>
        <div style={css('margin-bottom:20px')}>
          <div style={css('font-size:20px;font-weight:700;letter-spacing:-.3px')}>Manage workspace</div>
          <div style={css('font-size:13px;color:#7a807a;margin-top:3px')}>Auditors and appointment form options. Changes apply to the live schedule.</div>
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
          <button onClick={vm.setTabOptions} style={vm.tabOptionsStyle}>Options</button>
        </div>

        {vm.tabEngineers && <EngineersTable vm={vm} />}
        {vm.tabOptions && <OptionsPanel vm={vm} />}
      </div>
    </main>
  );
}

function AdminFilterDropdown({ label, count, selected, items, onToggle }: { label: string; count: number; selected: string[]; items: { value: string; label: string }[]; onToggle: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const active = selected.length > 0;
  return (
    <div style={css('position:relative')}>
      <button
        onClick={() => setOpen(!open)}
        style={css(
          'display:flex;align-items:center;gap:5px;padding:6px 10px;border-radius:7px;border:1px solid ' +
            (active ? '#2756d6' : '#dde0d9') +
            ';background:' +
            (active ? '#eef2fd' : '#fff') +
            ';font-size:11.5px;font-weight:' +
            (active ? '600' : '500') +
            ';color:' +
            (active ? '#2756d6' : '#4a504a') +
            ";cursor:pointer;font-family:'Archivo',sans-serif;transition:all .12s ease"
        )}
      >
        {label}
        {count > 0 && (
          <span style={css('background:#2756d6;color:#fff;border-radius:10px;padding:0 5px;font-size:9.5px;font-weight:600')}>
            {count}
          </span>
        )}
        <span style={css('font-size:9px;color:' + (active ? '#2756d6' : '#8a9088'))}>▾</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={css('position:fixed;inset:0;z-index:99')} />
          <div style={css('position:absolute;top:100%;right:0;z-index:100;margin-top:4px;background:#fff;border:1px solid #dde0d9;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.15);min-width:140px;max-height:220px;overflow-y:auto;padding:5px')}>
            {items.map((item) => {
              const on = selected.includes(item.value);
              return (
                <div
                  key={item.value}
                  onClick={() => onToggle(item.value)}
                  style={css(
                    "display:flex;align-items:center;gap:7px;padding:6px 8px;border-radius:5px;cursor:pointer;font-size:11.5px;font-family:'Archivo',sans-serif;color:#3c423d;background:" +
                      (on ? '#eef2fd' : '#fff') +
                      ';font-weight:' +
                      (on ? '600' : '400')
                  )}
                >
                  <span
                    style={css(
                      'width:14px;height:14px;border-radius:3px;border:1px solid ' +
                        (on ? '#2756d6' : '#cdd2c9') +
                        ';background:' +
                        (on ? '#2756d6' : '#fff') +
                        ';display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;flex-shrink:0'
                    )}
                  >
                    {on ? '✓' : ''}
                  </span>
                  {item.label}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function EngineersTable({ vm }: { vm: VM }) {
  return (
    <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;position:relative;z-index:10')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #eef1ea;flex-wrap:wrap;gap:10px;position:relative;z-index:20')}>
        <div style={css('font-size:13px;font-weight:700')}>Auditor <span style={css('color:#9aa097;font-weight:500')}>· {vm.adminEngineers.length}</span></div>
        <div style={css('display:flex;align-items:center;gap:8px;flex-wrap:wrap')}>
          <AdminFilterDropdown
            label="Site"
            count={vm.adminFilterSite.length}
            selected={vm.adminFilterSite}
            items={vm.siteCodeOptions.map((s) => ({ value: s, label: s }))}
            onToggle={vm.toggleAdminFilterSite}
          />
          <AdminFilterDropdown
            label="Department"
            count={vm.adminFilterDept.length}
            selected={vm.adminFilterDept}
            items={vm.adminDeptOptions.map((d) => ({ value: d, label: d }))}
            onToggle={vm.toggleAdminFilterDept}
          />
          <HButton onClick={vm.addEngineer} style={css("background:#15191e;color:#fff;border:none;border-radius:7px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#23282e' }}>+ New Auditor</HButton>
        </div>
      </div>
      {vm.adminEngineers.map((e) => (
        <div key={e.id} style={css(engGrid + ';padding:12px 18px;border-bottom:1px solid #f2f4ee;align-items:center')}>
          <div onClick={() => vm.openEditEngineer(e.id)} style={css('display:flex;align-items:center;gap:10px;min-width:0;cursor:pointer')}>
            <div style={e.avatarStyle}>{e.initials}</div>
            <div style={css('min-width:0')}>
              <div style={css('font-size:12.5px;font-weight:600;color:#23282a;text-decoration:none')}>
                {e.name}
              </div>
              <div style={css('font-size:10.5px;color:#8a9088')}>{e.department}{e.subDepartments.length > 0 ? ' - ' + e.subDepartments.join(', ') : ''}</div>
            </div>
          </div>
          <div style={css("text-align:center;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#3c423d")}>{e.appointments}</div>
          <button onClick={e.onDelete} style={css('background:none;border:none;cursor:pointer;color:#bcc1b8;font-size:13px;padding:2px')}>✕</button>
        </div>
      ))}
      {vm.adminEngineers.length === 0 && (
        <div style={css('padding:24px;text-align:center;font-size:12.5px;color:#8a9088;font-style:italic')}>
          No auditors match the selected site/department filters.
        </div>
      )}
    </div>
  );
}

function TagListEditor({ title, count, values, onAdd, onRemove, placeholder, colorFor, onColorChange }: { title: string; count: number; values: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void; placeholder: string; colorFor?: (v: string) => string; onColorChange?: (v: string, color: string) => void }) {
  const [draft, setDraft] = useState('');
  const submit = () => { onAdd(draft); setDraft(''); };
  return (
    <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;overflow:hidden')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #eef1ea')}>
        <div style={css('font-size:13px;font-weight:700')}>{title} <span style={css('color:#9aa097;font-weight:500')}>· {count}</span></div>
      </div>
      <div style={css('padding:14px 18px;display:flex;flex-wrap:wrap;gap:8px')}>
        {values.map((v) => (
          <div key={v} style={css('display:flex;align-items:center;gap:6px;background:#f4f6f1;border:1px solid #e0e3dc;border-radius:20px;padding:5px 6px 5px ' + (colorFor ? '8px' : '12px') + ';font-size:12px;color:#3c423d')}>
            {colorFor && onColorChange && (
              <input
                type="color"
                value={colorFor(v)}
                onChange={(e) => onColorChange(v, e.target.value)}
                title={'Edit color for ' + v}
                style={css('width:16px;height:16px;padding:0;border:none;border-radius:50%;cursor:pointer;background:none;flex-shrink:0')}
              />
            )}
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
      <TagListEditor
        title="Site"
        count={vm.siteCodeOptions.length}
        values={vm.siteCodeOptions}
        onAdd={vm.addSiteCodeOption}
        onRemove={vm.removeSiteCodeOption}
        placeholder="e.g. U4"
        colorFor={(v) => vm.siteColors[v] || '#999999'}
        onColorChange={vm.setSiteColor}
      />
      <TagListEditor
        title="Customer"
        count={vm.customerOptions.length}
        values={vm.customerOptions}
        onAdd={vm.addCustomerOption}
        onRemove={vm.removeCustomerOption}
        placeholder="e.g. Company F"
      />
    </div>
  );
}
