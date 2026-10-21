import { useState } from 'react';
import type { VM } from '../useScheduler';
import { css, HButton } from '../ui';

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
          <button onClick={vm.setTabSheets} style={vm.tabSheetsStyle}>Google Sheets</button>
        </div>

        {vm.tabEngineers && <EngineersTable vm={vm} />}
        {vm.tabOptions && <OptionsPanel vm={vm} />}
        {vm.tabSheets && <GoogleSheetsPanel vm={vm} />}
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
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);

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
            label="Standard"
            count={vm.adminFilterDept.length}
            selected={vm.adminFilterDept}
            items={vm.adminDeptOptions.map((d) => ({ value: d, label: d }))}
            onToggle={vm.toggleAdminFilterDept}
          />
          <HButton onClick={vm.addEngineer} style={css("background:#15191e;color:#fff;border:none;border-radius:7px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#23282e' }}>+ New Auditor</HButton>
        </div>
      </div>
      {vm.adminEngineers.map((e, idx) => (
        <div
          key={e.id}
          draggable
          onDragStart={(evt) => {
            setDraggedIdx(idx);
            evt.dataTransfer.effectAllowed = 'move';
            evt.dataTransfer.setData('text/plain', String(idx));
          }}
          onDragOver={(evt) => {
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'move';
            if (dropTargetIdx !== idx) setDropTargetIdx(idx);
          }}
          onDrop={(evt) => {
            evt.preventDefault();
            if (draggedIdx !== null && dropTargetIdx !== null && draggedIdx !== dropTargetIdx) {
              const next = [...vm.adminEngineers];
              const [moved] = next.splice(draggedIdx, 1);
              next.splice(dropTargetIdx, 0, moved);
              vm.reorderEngineers(next);
            }
            setDraggedIdx(null);
            setDropTargetIdx(null);
          }}
          onDragEnd={() => {
            setDraggedIdx(null);
            setDropTargetIdx(null);
          }}
          style={css(
            'display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid #f2f4ee;transition:background 0.15s ease, transform 0.15s ease;background:' +
              (dropTargetIdx === idx && draggedIdx !== idx ? '#eef2fd' : '#fff') +
              ';opacity:' +
              (draggedIdx === idx ? '0.4' : '1') +
              ';box-shadow:' +
              (draggedIdx === idx ? '0 4px 12px rgba(0,0,0,0.12)' : 'none') +
              ';cursor:grab'
          )}
        >
          <div style={css('display:flex;align-items:center;gap:10px;min-width:0;flex:1')}>
            <span style={css('color:#a6aca2;font-size:12px;cursor:grab;user-select:none;line-height:1;padding:2px;flex-shrink:0')}>⋮⋮</span>
            <div onClick={() => vm.openEditEngineer(e.id)} style={css('display:flex;align-items:center;gap:10px;min-width:0;cursor:pointer;flex:1')}>
              <div style={e.avatarStyle}>{e.initials}</div>
              <div style={css('min-width:0')}>
                <div style={css('font-size:12.5px;font-weight:600;color:#23282a;text-decoration:none')}>
                  {e.name}
                </div>
                <div style={css('font-size:10.5px;color:#8a9088')}>{e.department}{e.subDepartments.length > 0 ? ' - ' + e.subDepartments.join(', ') : ''}</div>
              </div>
            </div>
          </div>
          <button onClick={e.onDelete} style={css('background:none;border:none;cursor:pointer;color:#bcc1b8;font-size:13px;padding:4px 8px;flex-shrink:0')}>✕</button>
        </div>
      ))}
      {vm.adminEngineers.length === 0 && (
        <div style={css('padding:24px;text-align:center;font-size:12.5px;color:#8a9088;font-style:italic')}>
          No auditors match the selected site/standard filters.
        </div>
      )}
    </div>
  );
}

function TagListEditor({ title, count, values, onAdd, onRemove, onReorder, placeholder, colorFor, onColorChange }: { title: string; count: number; values: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void; onReorder?: (list: string[]) => void; placeholder: string; colorFor?: (v: string) => string; onColorChange?: (v: string, color: string) => void }) {
  const [draft, setDraft] = useState('');
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);

  const submit = () => { onAdd(draft); setDraft(''); };

  return (
    <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;overflow:hidden')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #eef1ea')}>
        <div style={css('font-size:13px;font-weight:700')}>{title} <span style={css('color:#9aa097;font-weight:500')}>· {count}</span></div>
      </div>
      <div style={css('padding:14px 18px;display:flex;flex-wrap:wrap;gap:8px')}>
        {values.map((v, idx) => (
          <div
            key={v}
            draggable={!!onReorder}
            onDragStart={(evt) => {
              if (!onReorder) return;
              setDraggedIdx(idx);
              evt.dataTransfer.effectAllowed = 'move';
              evt.dataTransfer.setData('text/plain', String(idx));
            }}
            onDragOver={(evt) => {
              if (!onReorder) return;
              evt.preventDefault();
              evt.dataTransfer.dropEffect = 'move';
              if (dropTargetIdx !== idx) setDropTargetIdx(idx);
            }}
            onDrop={(evt) => {
              if (!onReorder) return;
              evt.preventDefault();
              if (draggedIdx !== null && dropTargetIdx !== null && draggedIdx !== dropTargetIdx) {
                const next = [...values];
                const [moved] = next.splice(draggedIdx, 1);
                next.splice(dropTargetIdx, 0, moved);
                onReorder(next);
              }
              setDraggedIdx(null);
              setDropTargetIdx(null);
            }}
            onDragEnd={() => {
              setDraggedIdx(null);
              setDropTargetIdx(null);
            }}
            style={css(
              'display:flex;align-items:center;gap:6px;background:#f4f6f1;border:1px solid ' +
                (dropTargetIdx === idx && draggedIdx !== idx ? '#2756d6' : '#e0e3dc') +
                ';border-radius:20px;padding:5px ' +
                (onReorder ? '8px' : '12px') +
                ' 5px ' +
                (colorFor ? '8px' : '10px') +
                ';font-size:12px;color:#3c423d;user-select:none;cursor:' +
                (onReorder ? (draggedIdx === idx ? 'grabbing' : 'grab') : 'default') +
                ';opacity:' +
                (draggedIdx === idx ? '0.4' : '1') +
                ';box-shadow:' +
                (draggedIdx === idx ? '0 4px 12px rgba(0,0,0,0.15)' : 'none') +
                ';transform:' +
                (dropTargetIdx === idx && draggedIdx !== idx ? 'scale(1.04)' : 'scale(1)') +
                ';transition:transform 0.15s ease, border-color 0.15s ease'
            )}
          >
            {onReorder && <span style={css('color:#9aa097;font-size:11px;cursor:grab;line-height:1')}>⋮⋮</span>}
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

function DepartmentEditor({ vm, onReorderInternal, onReorderCustomer }: { vm: VM; onReorderInternal?: (list: string[]) => void; onReorderCustomer?: (list: string[]) => void }) {
  const [internalDraft, setInternalDraft] = useState('');
  const [customerDraft, setCustomerDraft] = useState('');

  const [draggedInternalIdx, setDraggedInternalIdx] = useState<number | null>(null);
  const [dropTargetInternalIdx, setDropTargetInternalIdx] = useState<number | null>(null);

  const [draggedCustomerIdx, setDraggedCustomerIdx] = useState<number | null>(null);
  const [dropTargetCustomerIdx, setDropTargetCustomerIdx] = useState<number | null>(null);

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
    <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;overflow:hidden')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;padding:13px 18px;border-bottom:1px solid #eef1ea')}>
        <div style={css('font-size:13px;font-weight:700')}>
          Standard <span style={css('color:#9aa097;font-weight:500')}>· {totalCount}</span>
        </div>
      </div>

      <div style={css('padding:16px 18px;display:flex;flex-direction:column;gap:18px')}>
        {/* INTERNAL AUDIT */}
        <div>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;color:#9aa097;letter-spacing:.5px;margin-bottom:8px")}>
            INTERNAL AUDIT <span style={css('color:#9aa097;font-weight:500')}>· {vm.internalDepartmentOptions.length}</span>
          </div>
          <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px')}>
            {vm.internalDepartmentOptions.map((v, idx) => (
              <div
                key={v}
                draggable={!!onReorderInternal}
                onDragStart={(evt) => {
                  if (!onReorderInternal) return;
                  setDraggedInternalIdx(idx);
                  evt.dataTransfer.effectAllowed = 'move';
                  evt.dataTransfer.setData('text/plain', String(idx));
                }}
                onDragOver={(evt) => {
                  if (!onReorderInternal) return;
                  evt.preventDefault();
                  evt.dataTransfer.dropEffect = 'move';
                  if (dropTargetInternalIdx !== idx) setDropTargetInternalIdx(idx);
                }}
                onDrop={(evt) => {
                  if (!onReorderInternal) return;
                  evt.preventDefault();
                  if (draggedInternalIdx !== null && dropTargetInternalIdx !== null && draggedInternalIdx !== dropTargetInternalIdx) {
                    const next = [...vm.internalDepartmentOptions];
                    const [moved] = next.splice(draggedInternalIdx, 1);
                    next.splice(dropTargetInternalIdx, 0, moved);
                    onReorderInternal(next);
                  }
                  setDraggedInternalIdx(null);
                  setDropTargetInternalIdx(null);
                }}
                onDragEnd={() => {
                  setDraggedInternalIdx(null);
                  setDropTargetInternalIdx(null);
                }}
                style={css(
                  'display:flex;align-items:center;gap:6px;background:#f4f6f1;border:1px solid ' +
                    (dropTargetInternalIdx === idx && draggedInternalIdx !== idx ? '#2756d6' : '#e0e3dc') +
                    ';border-radius:20px;padding:5px ' +
                    (onReorderInternal ? '8px' : '12px') +
                    ';font-size:12px;color:#3c423d;user-select:none;cursor:' +
                    (onReorderInternal ? (draggedInternalIdx === idx ? 'grabbing' : 'grab') : 'default') +
                    ';opacity:' +
                    (draggedInternalIdx === idx ? '0.4' : '1') +
                    ';box-shadow:' +
                    (draggedInternalIdx === idx ? '0 4px 12px rgba(0,0,0,0.15)' : 'none') +
                    ';transform:' +
                    (dropTargetInternalIdx === idx && draggedInternalIdx !== idx ? 'scale(1.04)' : 'scale(1)') +
                    ';transition:transform 0.15s ease, border-color 0.15s ease'
                )}
              >
                {onReorderInternal && <span style={css('color:#9aa097;font-size:11px;cursor:grab;line-height:1')}>⋮⋮</span>}
                {v}
                <button onClick={() => vm.removeInternalDepartmentOption(v)} style={css('background:none;border:none;cursor:pointer;color:#9aa097;font-size:12px;padding:2px;line-height:1')}>✕</button>
              </div>
            ))}
            {vm.internalDepartmentOptions.length === 0 && <span style={css('font-size:12px;color:#a6aca2;font-style:italic')}>No internal audit standards yet.</span>}
          </div>
          <div style={css('display:flex;gap:8px')}>
            <input
              value={internalDraft}
              onChange={(e) => setInternalDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitInternal(); }}
              placeholder="e.g. EHS"
              style={css("flex:1;border:1px solid #dde0d9;border-radius:8px;padding:8px 10px;font-size:12.5px;font-family:'Archivo',sans-serif;color:#23282a;outline:none;background:#fff")}
            />
            <HButton onClick={submitInternal} style={css("background:#15191e;color:#fff;border:none;border-radius:7px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#23282e' }}>+ Add</HButton>
          </div>
        </div>

        <div style={css('border-top:1px solid #eef1ea')} />

        {/* CUSTOMER */}
        <div>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;color:#9aa097;letter-spacing:.5px;margin-bottom:8px")}>
            CUSTOMER <span style={css('color:#9aa097;font-weight:500')}>· {vm.customerDepartmentOptions.length}</span>
          </div>
          <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px')}>
            {vm.customerDepartmentOptions.map((v, idx) => (
              <div
                key={v}
                draggable={!!onReorderCustomer}
                onDragStart={(evt) => {
                  if (!onReorderCustomer) return;
                  setDraggedCustomerIdx(idx);
                  evt.dataTransfer.effectAllowed = 'move';
                  evt.dataTransfer.setData('text/plain', String(idx));
                }}
                onDragOver={(evt) => {
                  if (!onReorderCustomer) return;
                  evt.preventDefault();
                  evt.dataTransfer.dropEffect = 'move';
                  if (dropTargetCustomerIdx !== idx) setDropTargetCustomerIdx(idx);
                }}
                onDrop={(evt) => {
                  if (!onReorderCustomer) return;
                  evt.preventDefault();
                  if (draggedCustomerIdx !== null && dropTargetCustomerIdx !== null && draggedCustomerIdx !== dropTargetCustomerIdx) {
                    const next = [...vm.customerDepartmentOptions];
                    const [moved] = next.splice(draggedCustomerIdx, 1);
                    next.splice(dropTargetCustomerIdx, 0, moved);
                    onReorderCustomer(next);
                  }
                  setDraggedCustomerIdx(null);
                  setDropTargetCustomerIdx(null);
                }}
                onDragEnd={() => {
                  setDraggedCustomerIdx(null);
                  setDropTargetCustomerIdx(null);
                }}
                style={css(
                  'display:flex;align-items:center;gap:6px;background:#f4f6f1;border:1px solid ' +
                    (dropTargetCustomerIdx === idx && draggedCustomerIdx !== idx ? '#2756d6' : '#e0e3dc') +
                    ';border-radius:20px;padding:5px ' +
                    (onReorderCustomer ? '8px' : '12px') +
                    ';font-size:12px;color:#3c423d;user-select:none;cursor:' +
                    (onReorderCustomer ? (draggedCustomerIdx === idx ? 'grabbing' : 'grab') : 'default') +
                    ';opacity:' +
                    (draggedCustomerIdx === idx ? '0.4' : '1') +
                    ';box-shadow:' +
                    (draggedCustomerIdx === idx ? '0 4px 12px rgba(0,0,0,0.15)' : 'none') +
                    ';transform:' +
                    (dropTargetCustomerIdx === idx && draggedCustomerIdx !== idx ? 'scale(1.04)' : 'scale(1)') +
                    ';transition:transform 0.15s ease, border-color 0.15s ease'
                )}
              >
                {onReorderCustomer && <span style={css('color:#9aa097;font-size:11px;cursor:grab;line-height:1')}>⋮⋮</span>}
                {v}
                <button onClick={() => vm.removeCustomerDepartmentOption(v)} style={css('background:none;border:none;cursor:pointer;color:#9aa097;font-size:12px;padding:2px;line-height:1')}>✕</button>
              </div>
            ))}
            {vm.customerDepartmentOptions.length === 0 && <span style={css('font-size:12px;color:#a6aca2;font-style:italic')}>No customer standards yet.</span>}
          </div>
          <div style={css('display:flex;gap:8px')}>
            <input
              value={customerDraft}
              onChange={(e) => setCustomerDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitCustomer(); }}
              placeholder="e.g. ISO13485"
              style={css("flex:1;border:1px solid #dde0d9;border-radius:8px;padding:8px 10px;font-size:12.5px;font-family:'Archivo',sans-serif;color:#23282a;outline:none;background:#fff")}
            />
            <HButton onClick={submitCustomer} style={css("background:#15191e;color:#fff;border:none;border-radius:7px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")} hover={{ background: '#23282e' }}>+ Add</HButton>
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
        onReorder={vm.reorderSiteCodeOptions}
        placeholder="e.g. U4"
        colorFor={(v) => vm.siteColors[v] || '#999999'}
        onColorChange={vm.setSiteColor}
      />
      <DepartmentEditor
        vm={vm}
        onReorderInternal={vm.reorderInternalDepartmentOptions}
        onReorderCustomer={vm.reorderCustomerDepartmentOptions}
      />
      <TagListEditor
        title="Customer"
        count={vm.customerOptions.length}
        values={vm.customerOptions}
        onAdd={vm.addCustomerOption}
        onRemove={vm.removeCustomerOption}
        onReorder={vm.reorderCustomerOptions}
        placeholder="e.g. Company F"
      />
      <TagListEditor
        title="End Customer"
        count={(vm.endCustomerOptions || []).length}
        values={vm.endCustomerOptions || []}
        onAdd={vm.addEndCustomerOption}
        onRemove={vm.removeEndCustomerOption}
        onReorder={vm.reorderEndCustomerOptions}
        placeholder="e.g. End Customer A"
      />
      <TagListEditor
        title="Purpose"
        count={vm.purposeOptions.length}
        values={vm.purposeOptions}
        onAdd={vm.addPurposeOption}
        onRemove={vm.removePurposeOption}
        onReorder={vm.reorderPurposeOptions}
        placeholder="e.g. supplier audit"
      />
    </div>
  );
}


const APPS_SCRIPT_TEMPLATE = `/**
 * Google Apps Script for Calendar-QA Google Sheets Sync
 * Format: DD/MM/YYYY | Audit Type | Customer | Site | Standard | Purpose | Auditor
 */

function setupHeaders(sheet) {
  var headers = [
    'DD/MM/YYYY',
    'Audit Type',
    'Customer',
    'Site',
    'Standard',
    'Purpose',
    'Auditor',
    'ID' // Column 8 (Hidden) - used for matching edits & deletes
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#F3F4F6');
  headerRange.setFontColor('#111827');
  headerRange.setHorizontalAlignment('left');

  sheet.setColumnWidth(1, 120); // Date DD/MM/YYYY
  sheet.setColumnWidth(2, 130); // Audit Type
  sheet.setColumnWidth(3, 160); // Customer
  sheet.setColumnWidth(4, 90);  // Site
  sheet.setColumnWidth(5, 140); // Standard
  sheet.setColumnWidth(6, 180); // Purpose
  sheet.setColumnWidth(7, 160); // Auditor
  sheet.hideColumns(8);         // Hide ID column
  sheet.setFrozenRows(1);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    if (sheet.getLastRow() === 0) {
      setupHeaders(sheet);
    }

    var action = data.action || 'sync_all';

    if (action === 'test') {
      return ContentService.createTextOutput(JSON.stringify({
        ok: true,
        message: 'Connected successfully to Google Sheet!'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'sync_all') {
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 8).clearContent();
      }
      setupHeaders(sheet);

      var rows = data.rows || [];
      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, 8).setValues(rows);
      }
      sheet.hideColumns(8);
      return ContentService.createTextOutput(JSON.stringify({
        ok: true,
        count: rows.length
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'create') {
      var row = data.row;
      if (row && row.length) {
        sheet.appendRow(row);
        sheet.hideColumns(8);
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'edit') {
      var row = data.row;
      var id = data.id || (row ? row[7] : null);
      var lastRow = sheet.getLastRow();
      var found = false;

      if (lastRow > 1 && id) {
        var idValues = sheet.getRange(2, 8, lastRow - 1, 1).getValues();
        for (var i = 0; i < idValues.length; i++) {
          if (String(idValues[i][0]) === String(id)) {
            var targetRow = i + 2;
            sheet.getRange(targetRow, 1, 1, 8).setValues([row]);
            found = true;
            break;
          }
        }
      }

      if (!found && row) {
        sheet.appendRow(row);
        sheet.hideColumns(8);
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true, updated: found })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'delete') {
      var id = data.id;
      var lastRow = sheet.getLastRow();
      if (lastRow > 1 && id) {
        var idValues = sheet.getRange(2, 8, lastRow - 1, 1).getValues();
        for (var i = idValues.length - 1; i >= 0; i--) {
          if (String(idValues[i][0]) === String(id)) {
            sheet.deleteRow(i + 2);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
`;

function GoogleSheetsPanel({ vm }: { vm: VM }) {
  const cfg = vm.googleSheetsConfig || { webhookUrl: '', autoSync: true, lastSynced: '' };
  const [url, setUrl] = useState(cfg.webhookUrl || '');
  const [autoSync, setAutoSync] = useState(cfg.autoSync ?? true);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const isConfigured = !!cfg.webhookUrl;
  const isDirty = url !== cfg.webhookUrl || autoSync !== cfg.autoSync;

  const handleSave = async () => {
    await vm.updateGoogleSheetsConfig({
      webhookUrl: url.trim(),
      autoSync,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    if (url.trim() !== cfg.webhookUrl) {
      await vm.updateGoogleSheetsConfig({ webhookUrl: url.trim(), autoSync });
    }
    const res = await vm.testGoogleSheetsConnection(url.trim());
    setTesting(false);
    setTestResult({ ok: res.success, msg: res.message || '' });
    setTimeout(() => setTestResult(null), 6000);
  };

  const handleFullSync = async () => {
    if (!url.trim()) {
      setSyncResult({ ok: false, msg: 'Please enter and save your Webhook URL first.' });
      return;
    }
    setSyncing(true);
    setSyncResult(null);
    if (isDirty) {
      await vm.updateGoogleSheetsConfig({ webhookUrl: url.trim(), autoSync });
    }
    const res = await vm.syncAllToGoogleSheets();
    setSyncing(false);
    setSyncResult({
      ok: res.success,
      msg: res.success ? `Successfully synced ${res.count ?? 0} appointments to Google Sheets!` : (res.message || 'Sync failed'),
    });
    setTimeout(() => setSyncResult(null), 6000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div style={css('display:flex;flex-direction:column;gap:18px;max-width:860px')}>
      {/* Configuration Card */}
      <div style={css('background:#fff;border:1px solid #e0e3dc;border-radius:11px;padding:22px 24px')}>
        <div style={css('display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px')}>
          <div>
            <div style={css('font-size:15px;font-weight:700;color:#15191e;display:flex;align-items:center;gap:8px')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" stroke="#0F9D58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 9H21" stroke="#0F9D58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 21V9" stroke="#0F9D58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Google Sheets Live Sync
            </div>
            <div style={css('font-size:12.5px;color:#7a807a;margin-top:3px')}>
              Automatically sync appointments to your Google Sheet when created, edited, or deleted.
            </div>
          </div>

          <div style={css('display:flex;align-items:center;gap:6px;background:' + (isConfigured ? '#eaf7ee' : '#f4f6f1') + ';border:1px solid ' + (isConfigured ? '#c5ebd0' : '#e0e3dc') + ';padding:4px 10px;border-radius:20px;font-size:11.5px;font-weight:600;color:' + (isConfigured ? '#0f7e3e' : '#7a807a'))}>
            <span style={css('width:7px;height:7px;border-radius:50%;background:' + (isConfigured ? '#10b981' : '#9aa097'))}></span>
            {isConfigured ? 'Connected' : 'Not Configured'}
          </div>
        </div>

        {/* Webhook Input Field */}
        <div style={css('margin-bottom:16px')}>
          <label style={css("display:block;font-size:11.5px;font-weight:600;color:#5c625c;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px")}>
            Google Apps Script Webhook URL
          </label>
          <div style={css('display:flex;gap:8px')}>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              style={css("flex:1;border:1px solid #dde0d9;border-radius:8px;padding:9px 12px;font-size:12.5px;font-family:'IBM Plex Mono',monospace;color:#23282a;outline:none;background:#fafbfa")}
            />
            <HButton
              onClick={handleSave}
              style={css("background:#15191e;color:#fff;border:none;border-radius:8px;padding:9px 16px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif;white-space:nowrap")}
              hover={{ background: '#23282e' }}
            >
              {saved ? '✓ Saved' : isDirty ? 'Save Config' : 'Saved'}
            </HButton>
          </div>
        </div>

        {/* Auto Sync Toggle */}
        <div style={css('display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#f9faf8;border:1px solid #eaede7;border-radius:8px;margin-bottom:18px')}>
          <div>
            <div style={css('font-size:13px;font-weight:600;color:#23282a')}>Auto-sync on changes</div>
            <div style={css('font-size:12px;color:#7a807a;margin-top:2px')}>Instantly sync every new appointment, edit, or deletion to Google Sheets in real time.</div>
          </div>
          <label style={css('position:relative;display:inline-block;width:38px;height:22px;cursor:pointer')}>
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => {
                const nextVal = e.target.checked;
                setAutoSync(nextVal);
                vm.updateGoogleSheetsConfig({ autoSync: nextVal });
              }}
              style={css('opacity:0;width:0;height:0')}
            />
            <span style={css(
              'position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;border-radius:22px;transition:.2s;background:' +
              (autoSync ? '#15191e' : '#cbd1c8')
            )}>
              <span style={css(
                'position:absolute;content:"";height:16px;width:16px;left:3px;bottom:3px;background:white;border-radius:50%;transition:.2s;transform:' +
                (autoSync ? 'translateX(16px)' : 'translateX(0)')
              )}></span>
            </span>
          </label>
        </div>

        {/* Action Buttons & Feedback */}
        <div style={css('display:flex;align-items:center;flex-wrap:wrap;gap:10px;padding-top:6px;border-top:1px solid #f0f2ee')}>
          <HButton
            onClick={handleTest}
            disabled={testing || !url.trim()}
            style={css("background:#fff;border:1px solid #dde0d9;color:#3c423d;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif;opacity:" + (testing || !url.trim() ? '0.6' : '1'))}
            hover={{ background: '#f4f6f1' }}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </HButton>

          <HButton
            onClick={handleFullSync}
            disabled={syncing || !url.trim()}
            style={css("background:#2756d6;border:none;color:#fff;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif;opacity:" + (syncing || !url.trim() ? '0.6' : '1'))}
            hover={{ background: '#1e44ab' }}
          >
            {syncing ? 'Syncing...' : 'Sync All Data to Sheet'}
          </HButton>

          {cfg.lastSynced && (
            <div style={css("margin-left:auto;font-size:11.5px;color:#8a9088;font-family:'IBM Plex Mono',monospace")}>
              Last synced: {new Date(cfg.lastSynced).toLocaleString()}
            </div>
          )}
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div style={css('margin-top:12px;padding:9px 12px;border-radius:7px;font-size:12.5px;background:' + (testResult.ok ? '#eaf7ee' : '#fdeeed') + ';color:' + (testResult.ok ? '#0f7e3e' : '#b91c1c') + ';border:1px solid ' + (testResult.ok ? '#c5ebd0' : '#f9c5c2'))}>
            {testResult.ok ? '✓ ' : '✕ '} {testResult.msg}
          </div>
        )}

        {/* Sync Result Message */}
        {syncResult && (
          <div style={css('margin-top:12px;padding:9px 12px;border-radius:7px;font-size:12.5px;background:' + (syncResult.ok ? '#eaf7ee' : '#fdeeed') + ';color:' + (syncResult.ok ? '#0f7e3e' : '#b91c1c') + ';border:1px solid ' + (syncResult.ok ? '#c5ebd0' : '#f9c5c2'))}>
            {syncResult.ok ? '✓ ' : '✕ '} {syncResult.msg}
          </div>
        )}
      </div>

      {/* Sync Format Preview Card */}
      <div style={css('background:#fff;border:1px solid #e0e3dc;border-radius:11px;padding:20px 24px')}>
        <div style={css('font-size:14px;font-weight:700;color:#15191e;margin-bottom:4px')}>
          Google Sheet Columns Format
        </div>
        <div style={css('font-size:12px;color:#7a807a;margin-bottom:14px')}>
          Appointments are synced into your spreadsheet with the exact 7-column layout shown below:
        </div>

        <div style={css('overflow-x:auto;border:1px solid #e2e5de;border-radius:8px')}>
          <table style={css('width:100%;border-collapse:collapse;font-size:12px;text-align:left')}>
            <thead>
              <tr style={css("background:#f4f6f1;border-bottom:1px solid #e2e5de;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#5c625c")}>
                <th style={css('padding:8px 12px;font-weight:700')}>Col A</th>
                <th style={css('padding:8px 12px;font-weight:700')}>Col B</th>
                <th style={css('padding:8px 12px;font-weight:700')}>Col C</th>
                <th style={css('padding:8px 12px;font-weight:700')}>Col D</th>
                <th style={css('padding:8px 12px;font-weight:700')}>Col E</th>
                <th style={css('padding:8px 12px;font-weight:700')}>Col F</th>
                <th style={css('padding:8px 12px;font-weight:700')}>Col G</th>
              </tr>
            </thead>
            <tbody>
              <tr style={css('font-weight:600;color:#15191e;background:#fafbfa;border-bottom:1px solid #f0f2ee')}>
                <td style={css('padding:9px 12px')}>DD/MM/YYYY</td>
                <td style={css('padding:9px 12px')}>Audit Type</td>
                <td style={css('padding:9px 12px')}>Customer</td>
                <td style={css('padding:9px 12px')}>Site</td>
                <td style={css('padding:9px 12px')}>Standard</td>
                <td style={css('padding:9px 12px')}>Purpose</td>
                <td style={css('padding:9px 12px')}>Auditor</td>
              </tr>
              <tr style={css('color:#7a807a;font-size:11.5px;border-bottom:1px solid #f0f2ee')}>
                <td style={css('padding:8px 12px')}>29/06/2026</td>
                <td style={css('padding:8px 12px')}><span style={css('display:inline-block;padding:2px 6px;border-radius:4px;background:#eef2fd;color:#2756d6;font-size:11px;font-weight:600')}>Customer Audit</span></td>
                <td style={css('padding:8px 12px')}>Company F</td>
                <td style={css('padding:8px 12px')}>U4</td>
                <td style={css('padding:8px 12px')}>ISO13485</td>
                <td style={css('padding:8px 12px')}>Supplier Audit</td>
                <td style={css('padding:8px 12px')}>Phichaya P.</td>
              </tr>
              <tr style={css('color:#7a807a;font-size:11.5px')}>
                <td style={css('padding:8px 12px')}>30/06/2026</td>
                <td style={css('padding:8px 12px')}><span style={css('display:inline-block;padding:2px 6px;border-radius:4px;background:#f3f4f6;color:#4b5563;font-size:11px;font-weight:600')}>Internal Audit</span></td>
                <td style={css('padding:8px 12px;color:#a6aca2')}>—</td>
                <td style={css('padding:8px 12px')}>U5</td>
                <td style={css('padding:8px 12px')}>ISO9001</td>
                <td style={css('padding:8px 12px')}>Production Area</td>
                <td style={css('padding:8px 12px')}>Tanawat T.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Setup Guide Card */}
      <div style={css('background:#fff;border:1px solid #e0e3dc;border-radius:11px;padding:20px 24px')}>
        <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:12px')}>
          <div>
            <div style={css('font-size:14px;font-weight:700;color:#15191e')}>
              Quick Setup Guide (Google Apps Script)
            </div>
            <div style={css('font-size:12px;color:#7a807a;margin-top:2px')}>
              Follow these simple steps to deploy your Google Sheet sync endpoint in under 2 minutes.
            </div>
          </div>
          <HButton
            onClick={handleCopyCode}
            style={css("background:#15191e;color:#fff;border:none;border-radius:7px;padding:7px 12px;font-size:11.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif;white-space:nowrap")}
            hover={{ background: '#23282e' }}
          >
            {copied ? '✓ Script Copied!' : 'Copy Script Code'}
          </HButton>
        </div>

        <ol style={css('margin:0;padding-left:18px;font-size:12.5px;color:#3c423d;line-height:1.7')}>
          <li>Open your target Google Sheet (or create a new spreadsheet).</li>
          <li>In the top menu bar, click <b>Extensions</b> &gt; <b>Apps Script</b>.</li>
          <li>Delete any code in the editor, click the <b>Copy Script Code</b> button above, and paste it into <code>Code.gs</code>.</li>
          <li>At the top right, click <b>Deploy</b> &gt; <b>New deployment</b>.</li>
          <li>Click the gear icon next to &quot;Select type&quot; and choose <b>Web app</b>:
            <ul style={css('margin:4px 0;padding-left:18px;color:#5c625c')}>
              <li><b>Description:</b> Calendar QA Sync</li>
              <li><b>Execute as:</b> <b>Me</b> (your Google account)</li>
              <li><b>Who has access:</b> <b>Anyone</b></li>
            </ul>
          </li>
          <li>Click <b>Deploy</b>, authorize access if prompted, and copy the <b>Web app URL</b> (ends in <code>/exec</code>).</li>
          <li>Paste the URL into the field above and click <b>Save Config</b> &amp; <b>Test Connection</b>!</li>
        </ol>

        <div style={css('margin-top:14px;padding-top:12px;border-top:1px solid #f0f2ee')}>
          <button
            onClick={() => setShowCode(!showCode)}
            style={css("background:none;border:none;color:#2756d6;font-size:12px;font-weight:600;cursor:pointer;padding:0;font-family:'Archivo',sans-serif")}
          >
            {showCode ? '▼ Hide Apps Script Source Code' : '▶ View Apps Script Source Code'}
          </button>
          {showCode && (
            <pre style={css("margin-top:10px;background:#f4f6f1;border:1px solid #dde0d9;border-radius:8px;padding:12px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#23282a;max-height:280px;overflow-y:auto;white-space:pre-wrap")}>
              {APPS_SCRIPT_TEMPLATE}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
