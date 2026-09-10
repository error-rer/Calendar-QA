import { useState } from 'react';
import type { VM } from '../useScheduler';
import { css, HButton } from '../ui';

const engGrid = 'display:grid;grid-template-columns:minmax(180px,1.4fr) 2fr 80px 50px;gap:0';

export function Admin({ vm }: { vm: VM }) {
  return (
    <main className="scrl" style={vm.adminMainStyle}>
      <div style={vm.adminWrapStyle}>
        <div style={css('margin-bottom:20px')}>
          <div style={css('font-size:20px;font-weight:700;letter-spacing:-.3px;color:#f8fafc')}>Manage workspace</div>
          <div style={css('font-size:13px;color:#94a3b8;margin-top:3px')}>Auditors and appointment form options. Changes apply to the live schedule.</div>
        </div>

        <div style={vm.adminStatGridStyle}>
          {vm.adminStats.map((s, i) => (
            <div key={i} style={css('background:#1e293b;border:1px solid #334155;border-radius:11px;padding:14px 16px')}>
              <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#94a3b8;letter-spacing:.5px")}>{s.label}</div>
              <div style={css('font-size:25px;font-weight:700;letter-spacing:-.5px;margin-top:5px;color:#f8fafc')}>{s.value}</div>
              <div style={css('font-size:11px;color:#64748b;margin-top:1px')}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={css('display:flex;background:#1e293b;border:1px solid #334155;border-radius:9px;padding:2px;gap:2px;width:max-content;margin-bottom:16px')}>
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
            (active ? '#3b82f6' : '#334155') +
            ';background:' +
            (active ? '#1e3a8a' : '#0f172a') +
            ';font-size:11.5px;font-weight:' +
            (active ? '600' : '500') +
            ';color:' +
            (active ? '#93c5fd' : '#94a3b8') +
            ";cursor:pointer;font-family:'Archivo',sans-serif;transition:all .12s ease"
        )}
      >
        {label}
        {count > 0 && (
          <span style={css('background:#2563eb;color:#fff;border-radius:10px;padding:0 5px;font-size:9.5px;font-weight:600')}>
            {count}
          </span>
        )}
        <span style={css('font-size:9px;color:' + (active ? '#93c5fd' : '#94a3b8'))}>▾</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={css('position:fixed;inset:0;z-index:99')} />
          <div style={css('position:absolute;top:100%;right:0;z-index:100;margin-top:4px;background:#1e293b;border:1px solid #334155;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.4);min-width:140px;max-height:220px;overflow-y:auto;padding:5px')}>
            {items.map((item) => {
              const on = selected.includes(item.value);
              return (
                <div
                  key={item.value}
                  onClick={() => onToggle(item.value)}
                  style={css(
                    "display:flex;align-items:center;gap:7px;padding:6px 8px;border-radius:5px;cursor:pointer;font-size:11.5px;font-family:'Archivo',sans-serif;color:#f8fafc;background:" +
                      (on ? '#1e3a8a' : '#1e293b') +
                      ';font-weight:' +
                      (on ? '600' : '400')
                  )}
                >
                  <span
                    style={css(
                      'width:14px;height:14px;border-radius:3px;border:1px solid ' +
                        (on ? '#3b82f6' : '#475569') +
                        ';background:' +
                        (on ? '#2563eb' : '#0f172a') +
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
    <div style={css('background:#1e293b;border:1px solid #334155;border-radius:12px;position:relative;z-index:10')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #334155;flex-wrap:wrap;gap:10px;position:relative;z-index:20')}>
        <div style={css('font-size:13px;font-weight:700;color:#f8fafc')}>Auditor <span style={css('color:#94a3b8;font-weight:500')}>· {vm.adminEngineers.length}</span></div>
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
          <HButton onClick={vm.addEngineer} style={css("background:#2563eb;color:#fff;border:none;border-radius:7px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#1d4ed8' }}>+ New Auditor</HButton>
        </div>
      </div>
      {vm.adminEngineers.map((e) => (
        <div key={e.id} style={css(engGrid + ';padding:12px 18px;border-bottom:1px solid #334155;align-items:center')}>
          <div onClick={() => vm.openEditEngineer(e.id)} style={css('display:flex;align-items:center;gap:10px;min-width:0;cursor:pointer')}>
            <div style={e.avatarStyle}>{e.initials}</div>
            <div style={css('min-width:0')}>
              <div style={css('font-size:12.5px;font-weight:600;color:#f8fafc;text-decoration:none')}>
                {e.name}
              </div>
              <div style={css('font-size:10.5px;color:#94a3b8')}>{e.department}{e.subDepartments.length > 0 ? ' - ' + e.subDepartments.join(', ') : ''}</div>
            </div>
          </div>
          <div style={css("text-align:center;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:#93c5fd")}>{e.appointments}</div>
          <button onClick={e.onDelete} style={css('background:none;border:none;cursor:pointer;color:#94a3b8;font-size:13px;padding:2px')}>✕</button>
        </div>
      ))}
      {vm.adminEngineers.length === 0 && (
        <div style={css('padding:24px;text-align:center;font-size:12.5px;color:#94a3b8;font-style:italic')}>
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
    <div style={css('background:#1e293b;border:1px solid #334155;border-radius:12px;overflow:hidden')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #334155')}>
        <div style={css('font-size:13px;font-weight:700;color:#f8fafc')}>{title} <span style={css('color:#94a3b8;font-weight:500')}>· {count}</span></div>
      </div>
      <div style={css('padding:14px 18px;display:flex;flex-wrap:wrap;gap:8px')}>
        {values.map((v) => (
          <div key={v} style={css('display:flex;align-items:center;gap:6px;background:#0f172a;border:1px solid #334155;border-radius:20px;padding:5px 6px 5px ' + (colorFor ? '8px' : '12px') + ';font-size:12px;color:#f8fafc')}>
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
            <button onClick={() => onRemove(v)} style={css('background:none;border:none;cursor:pointer;color:#94a3b8;font-size:12px;padding:2px;line-height:1')}>✕</button>
          </div>
        ))}
        {values.length === 0 && <span style={css('font-size:12px;color:#64748b;font-style:italic')}>No options yet.</span>}
      </div>
      <div style={css('display:flex;gap:8px;padding:0 18px 16px')}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder={placeholder}
          style={css("flex:1;border:1px solid #334155;border-radius:8px;padding:8px 10px;font-size:12.5px;font-family:'Archivo',sans-serif;color:#f8fafc;outline:none;background:#0f172a")}
        />
        <HButton onClick={submit} style={css("background:#2563eb;color:#fff;border:none;border-radius:7px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#1d4ed8' }}>+ Add</HButton>
      </div>
    </div>
  );
}

function DepartmentEditor({ vm }: { vm: VM }) {
  const [internalDraft, setInternalDraft] = useState('');
  const [customerDraft, setCustomerDraft] = useState('');

  const submitInternal = () => {
    if (!internalDraft.trim()) return;
    vm.addInternalDepartmentOption(internalDraft.trim());
    setInternalDraft('');
  };

  const submitCustomer = () => {
    if (!customerDraft.trim()) return;
    vm.addCustomerDepartmentOption(customerDraft.trim());
    setCustomerDraft('');
  };

  const totalCount = vm.internalDepartmentOptions.length + vm.customerDepartmentOptions.length;

  return (
    <div style={css('background:#1e293b;border:1px solid #334155;border-radius:12px;overflow:hidden')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #334155')}>
        <div style={css('font-size:13px;font-weight:700;color:#f8fafc')}>
          Department <span style={css('color:#94a3b8;font-weight:500')}>· {totalCount}</span>
        </div>
      </div>

      <div style={css('padding:16px 18px;display:flex;flex-direction:column;gap:18px')}>
        {/* INTERNAL AUDIT */}
        <div>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;color:#64748b;letter-spacing:.5px;margin-bottom:8px")}>
            INTERNAL AUDIT <span style={css('color:#94a3b8;font-weight:500')}>· {vm.internalDepartmentOptions.length}</span>
          </div>
          <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px')}>
            {vm.internalDepartmentOptions.map((v) => (
              <div key={v} style={css('display:flex;align-items:center;gap:6px;background:#0f172a;border:1px solid #334155;border-radius:20px;padding:5px 12px;font-size:12px;color:#f8fafc')}>
                {v}
                <button onClick={() => vm.removeInternalDepartmentOption(v)} style={css('background:none;border:none;cursor:pointer;color:#94a3b8;font-size:12px;padding:2px;line-height:1')}>✕</button>
              </div>
            ))}
            {vm.internalDepartmentOptions.length === 0 && <span style={css('font-size:12px;color:#64748b;font-style:italic')}>No internal audit departments yet.</span>}
          </div>
          <div style={css('display:flex;gap:8px')}>
            <input
              value={internalDraft}
              onChange={(e) => setInternalDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitInternal(); }}
              placeholder="e.g. EHS"
              style={css("flex:1;border:1px solid #334155;border-radius:8px;padding:8px 10px;font-size:12.5px;font-family:'Archivo',sans-serif;color:#f8fafc;outline:none;background:#0f172a")}
            />
            <HButton onClick={submitInternal} style={css("background:#2563eb;color:#fff;border:none;border-radius:7px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#1d4ed8' }}>+ Add</HButton>
          </div>
        </div>

        <div style={css('border-top:1px solid #334155')} />

        {/* CUSTOMER */}
        <div>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;color:#64748b;letter-spacing:.5px;margin-bottom:8px")}>
            CUSTOMER <span style={css('color:#94a3b8;font-weight:500')}>· {vm.customerDepartmentOptions.length}</span>
          </div>
          <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px')}>
            {vm.customerDepartmentOptions.map((v) => (
              <div key={v} style={css('display:flex;align-items:center;gap:6px;background:#0f172a;border:1px solid #334155;border-radius:20px;padding:5px 12px;font-size:12px;color:#f8fafc')}>
                {v}
                <button onClick={() => vm.removeCustomerDepartmentOption(v)} style={css('background:none;border:none;cursor:pointer;color:#94a3b8;font-size:12px;padding:2px;line-height:1')}>✕</button>
              </div>
            ))}
            {vm.customerDepartmentOptions.length === 0 && <span style={css('font-size:12px;color:#64748b;font-style:italic')}>No customer departments yet.</span>}
          </div>
          <div style={css('display:flex;gap:8px')}>
            <input
              value={customerDraft}
              onChange={(e) => setCustomerDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitCustomer(); }}
              placeholder="e.g. ISO13485"
              style={css("flex:1;border:1px solid #334155;border-radius:8px;padding:8px 10px;font-size:12.5px;font-family:'Archivo',sans-serif;color:#f8fafc;outline:none;background:#0f172a")}
            />
            <HButton onClick={submitCustomer} style={css("background:#2563eb;color:#fff;border:none;border-radius:7px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#1d4ed8' }}>+ Add</HButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionsPanel({ vm }: { vm: VM }) {
  return (
    <div style={css('display:flex;flex-direction:column;gap:16px')}>
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
      <DepartmentEditor vm={vm} />
      <TagListEditor
        title="Customer"
        count={vm.customerOptions.length}
        values={vm.customerOptions}
        onAdd={vm.addCustomerOption}
        onRemove={vm.removeCustomerOption}
        placeholder="e.g. Company F"
      />
      <TagListEditor
        title="Purpose"
        count={vm.purposeOptions.length}
        values={vm.purposeOptions}
        onAdd={vm.addPurposeOption}
        onRemove={vm.removePurposeOption}
        placeholder="e.g. supplier audit"
      />
    </div>
  );
}
