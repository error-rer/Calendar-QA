import { Fragment, useEffect, useRef, useState } from 'react';
import type { VM } from '../useScheduler';
import { getAccentBackground } from '../useScheduler';
import { css, HButton, HInput } from '../ui';
import { DetailPanel } from './DetailPanel';

function renderApptCode(code: string) {
  if (typeof code === 'string' && (code.startsWith('CS') || code.startsWith('IA'))) {
    const spaceDotIdx = code.indexOf(' · ');
    if (spaceDotIdx !== -1) {
      const prefix = code.slice(0, spaceDotIdx);
      const rest = code.slice(spaceDotIdx);
      return (
        <>
          <span style={{ color: '#757575', fontWeight: 600 }}>{prefix}</span>
          <span>{rest}</span>
        </>
      );
    }
  }
  return code;
}

function MultiSelect({ label, items, selected, onToggle }: { label: string; items: { value: string; label: string }[]; selected: string[]; onToggle: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const selCount = selected.length;
  return (
    <div ref={ref} style={css('position:relative')}>
      <button onClick={() => setOpen(!open)} style={css('width:100%;padding:6px 8px;border:1px solid #dde0d9;border-radius:6px;background:#fff;cursor:pointer;font-size:11px;font-family:\'Archivo\',sans-serif;font-weight:600;color:#3c423d;text-align:left;display:flex;align-items:center;justify-content:space-between')}>
        <span>{label}{selCount > 0 ? <span style={css('color:#2756d6;margin-left:3px')}>({selCount})</span> : ''}</span>
        <span style={css('font-size:8px;color:#9aa097')}>{open ? '\u25B2' : '\u25BC'}</span>
      </button>
      {open && (
        <div style={css('position:absolute;top:100%;left:0;right:0;z-index:30;margin-top:3px;background:#fff;border:1px solid #dde0d9;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.08);max-height:200px;overflow-y:auto;padding:4px')}>
          {items.map((item) => {
            const on = selected.includes(item.value);
            return (
              <div key={item.value} onClick={() => onToggle(item.value)} style={css('display:flex;align-items:center;gap:6px;padding:5px 6px;border-radius:4px;cursor:pointer;font-size:11px;font-family:\'Archivo\',sans-serif;color:#3c423d;background:' + (on ? '#eef2fd' : '#fff') + ';font-weight:' + (on ? '600' : '400'))}>
                <span style={css('width:14px;height:14px;border-radius:3px;border:1px solid ' + (on ? '#2756d6' : '#cdd2c9') + ';background:' + (on ? '#2756d6' : '#fff') + ';display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;flex-shrink:0')}>{on ? '\u2713' : ''}</span>
                {item.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const gridBase = css('display:inline-grid;min-width:100%');

export function Schedule({ vm }: { vm: VM }) {
  return (
    <div style={css('flex:1;display:flex;min-height:0;overflow:hidden;position:relative')}>
      {vm.showSidebarBackdrop && (
        <div onClick={vm.closeSidebar} style={css('position:fixed;inset:0;background:rgba(20,25,30,.42);z-index:70;animation:fadeIn .15s ease')} />
      )}

      <Sidebar vm={vm} />

      <div style={css('flex:1;min-width:0;display:flex;flex-direction:column;min-height:0')}>
        <Toolbar vm={vm} />

        <main className="scrl" style={css('flex:1;min-width:0;overflow:auto;background:#eef0ea;position:relative')}>
          <div style={css('position:absolute;inset:0;pointer-events:none;opacity:.35;background-image:radial-gradient(circle,#bcc2b4 1px,transparent 1px);background-size:22px 22px')} />
          {vm.showWeekCalendar && <WeekCalendar vm={vm} />}
          {vm.mobilePerson && <MobilePerson vm={vm} />}
          {vm.mobileSite && <MobileSite vm={vm} />}
          {vm.mobileSiteDept && <MobileSiteDept vm={vm} />}
          {vm.monthDesktop && <MonthGrid vm={vm} />}
          {vm.monthMobile && <MonthMobile vm={vm} />}
          {vm.isYear && <YearGrid vm={vm} />}

          {vm.emptyWeek && !vm.isMonth && !vm.isYear && (
            <div style={css('position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(238,240,234,.82)')}>
              <div style={css('text-align:center;max-width:300px;padding:20px')}>
                <div style={css('font-size:15px;font-weight:700;color:#3c423d;margin-bottom:6px')}>No plan drafted for this week</div>
                <div style={css('font-size:12.5px;color:#7a807a;line-height:1.4;margin-bottom:16px')}>Start from the current week's coverage and adjust, or build from scratch.</div>
                <button onClick={vm.copyWeek} style={css("background:#15191e;color:#fff;border:none;border-radius:8px;padding:10px 18px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}>Copy current week's plan</button>
              </div>
            </div>
          )}
        </main>
      </div>

      <DetailPanel vm={vm} />
      <DayDialogModal vm={vm} />

      {vm.showTimetable && (
        <div style={vm.modalOverlayStyle}>
          <div onClick={vm.stop} style={css('position:relative;background:#fff;border-radius:14px;width:100%;max-width:1200px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.18);margin:20px')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #e7eae3')}>
              <div style={css('display:flex;align-items:center;gap:10px')}>
                <span style={css('font-size:15px;font-weight:700;color:#23282a')}>{vm.timetableEngName}</span>
                <span style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;color:#9aa097")}>WEEKLY TIMETABLE</span>
              </div>
              <button onClick={vm.closeTimetable} style={css('width:30px;height:30px;border:1px solid #e2e5de;background:#fff;border-radius:7px;cursor:pointer;color:#6a706a;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0')}>✕</button>
            </div>
            <div className="scrl" style={css('flex:1;overflow:auto;padding:4px')}>
              {vm.isMobile ? <MobileTimetable vm={vm} /> : <TimetableGrid vm={vm} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EyeOffIcon({ size = 15, color = '#5c625c' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function EyeOnIcon({ size = 15, color = '#2756d6' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function DayDialogModal({ vm }: { vm: VM }) {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [confirmDeleteChip, setConfirmDeleteChip] = useState<{ id: string; code: string; onDelete: () => void } | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const requestDelete = (chip: any) => {
    setConfirmDeleteChip({ id: chip.id, code: chip.code, onDelete: chip.onDelete });
  };

  const confirmDelete = () => {
    confirmDeleteChip?.onDelete();
    setConfirmDeleteChip(null);
  };

  const cancelDelete = () => {
    setConfirmDeleteChip(null);
  };

  if (!vm.dayDialogOpen) return null;

  return (
    <div style={vm.modalOverlayStyle}>
      <div onClick={vm.stop} style={css('position:relative;background:#fff;border-radius:14px;width:100%;max-width:500px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.18);margin:20px')}>
        <div style={css('display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #e7eae3')}>
          <div style={css('display:flex;align-items:center;gap:10px')}>
            <span style={css('font-size:15px;font-weight:700;color:#23282a')}>{vm.dayDialogInfo?.label}</span>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#9aa097")}>{vm.dayDialogDate}</span>
          </div>
          <div style={css('display:flex;align-items:center;gap:8px')}>
            <HButton
              onClick={() => vm.openCreateWithDate(vm.dayDialogDateISO)}
              title="Create New Appointment for this date"
              style={css("padding:6px 12px;border:1px solid #15191e;background:#15191e;color:#fff;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;display:flex;align-items:center;gap:4px;font-family:'Archivo',sans-serif")}
              hover={{ background: '#23282e' }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1 }}>+</span> New Appointment
            </HButton>
            <HButton onClick={vm.closeDayDialog} style={css('width:30px;height:30px;border:1px solid #e2e5de;background:#fff;border-radius:7px;cursor:pointer;color:#6a706a;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0')} hover={{ background: '#f1f3ee' }}>✕</HButton>
          </div>
        </div>
        <div className="scrl" style={css('flex:1;overflow:auto;padding:12px 16px')}>
          {vm.dayDialogChips.length === 0 ? (
            <div style={css('text-align:center;padding:24px 0;color:#9aa097;font-size:12px;font-style:italic')}>No appointments this day</div>
          ) : (
            <div style={css('display:flex;flex-direction:column;gap:8px')}>
              {vm.dayDialogChips.map((chip) => {
                const chColors = chip.colors && chip.colors.length > 0 ? chip.colors : [chip.color];
                const isExpanded = !!expandedIds[chip.id];
                return (
                  <div key={chip.id} style={{ display: 'flex', flexDirection: 'column', background: '#fff', border: '1px solid #e4e7e0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'stretch' }}>
                      <div style={{ width: '4px', background: getAccentBackground(chColors), flexShrink: 0, alignSelf: 'stretch' }} />
                      <div style={css('min-width:0;flex:1;padding:9px 11px;display:flex;align-items:center;justify-content:space-between;gap:10px')}>
                        <div onClick={() => toggleExpand(chip.id)} style={{ minWidth: 0, flex: 1, cursor: 'pointer' }} title="Click to expand embedded details">
                          <div style={css(`font-size:12.5px;font-weight:600;color:${chip.isInternal ? '#10b981' : '#2756d6'}`)}>{renderApptCode(chip.code)}</div>
                          {chip.purpose ? (
                            <div style={css('font-size:11px;color:#5c625c;margin-top:2px')}>{chip.purpose}</div>
                          ) : null}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleExpand(chip.id); }}
                            title={isExpanded ? 'Hide embedded details' : 'Show embedded details'}
                            style={css('width:30px;height:30px;border:1px solid ' + (isExpanded ? '#9bb0e8' : '#dde0d9') + ';background:' + (isExpanded ? '#eef2fd' : '#f4f6f1') + ';border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center')}
                          >
                            {isExpanded ? <EyeOnIcon size={15} color="#2756d6" /> : <EyeOffIcon size={15} color="#5c625c" />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); chip.onEdit(); }}
                            title="Edit appointment details"
                            style={css('width:30px;height:30px;border:1px solid #dde0d9;background:#f4f6f1;border-radius:7px;cursor:pointer;color:#3c423d;font-size:13px;display:flex;align-items:center;justify-content:center')}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); requestDelete(chip); }}
                            title="Delete appointment"
                            style={css('width:30px;height:30px;border:1px solid #fecaca;background:#fef2f2;border-radius:7px;cursor:pointer;color:#dc2626;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center')}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={css('border-top:1px solid #e7eae3;background:#fafbf8;padding:12px 14px;display:flex;flex-direction:column;gap:8px')}>
                        <div style={css('display:flex;align-items:center;gap:8px')}>
                          <span style={css(`font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:4px;${
                            chip.isInternal
                              ? 'color:#0f9d8c;background:#eef8f3;border:1px solid #ccebe2;'
                              : 'color:#2756d6;background:#eef2fd;border:1px solid #d8e2fa;'
                          }`)}>
                            {chip.isInternal ? 'Internal Audit' : 'Customer Audit'}
                          </span>
                          {chip.site && (
                            <span style={css('font-size:11.5px;color:#23282a;font-weight:600')}>
                              Site: <span style={css('color:#15191e')}>{chip.site}</span>
                            </span>
                          )}
                        </div>

                        <div style={css('display:flex;flex-direction:column;gap:4px;font-size:11.5px;color:#5c625c')}>
                          {!chip.isInternal ? (
                            <>
                              {chip.customer && <div>Customer: <span style={css('color:#15191e;font-weight:600')}>{chip.customer}</span></div>}
                              {chip.endCustomer && <div>End customer: <span style={css('color:#3c423d')}>{chip.endCustomer}</span></div>}
                              {chip.apptPurpose && <div>Purpose: <span style={css('color:#3c423d')}>{chip.apptPurpose}</span></div>}
                              {chip.auditor && <div>Auditor: <span style={css('color:#3c423d')}>{chip.auditor}</span></div>}
                              {chip.department && <div>Department: <span style={css('color:#3c423d')}>{chip.department}</span></div>}
                            </>
                          ) : (
                            <>
                              {chip.area && <div>Area: <span style={css('color:#15191e;font-weight:600')}>{chip.area}</span></div>}
                              {chip.auditor && <div>Auditor: <span style={css('color:#3c423d')}>{chip.auditor}</span></div>}
                              {chip.department && <div>Department: <span style={css('color:#3c423d')}>{chip.department}</span></div>}
                            </>
                          )}
                        </div>

                        {(chip.major || chip.minor || chip.ofi || chip.request || chip.utl1 || chip.utl2 || chip.utl3) ? (
                          <div style={css('display:flex;gap:8px;flex-wrap:wrap;margin-top:2px')}>
                            {!!chip.major && <span style={css('font-size:10px;color:#b32f2f;font-weight:600')}>Major: {chip.major}</span>}
                            {!!chip.minor && <span style={css('font-size:10px;color:#c2620c;font-weight:600')}>Minor: {chip.minor}</span>}
                            {!!chip.ofi && <span style={css('font-size:10px;color:#5b7fd6;font-weight:600')}>OFI: {chip.ofi}</span>}
                            {!!chip.request && <span style={css('font-size:10px;color:#1f8a5b;font-weight:600')}>Request: {chip.request}</span>}
                            {!!chip.utl1 && <span style={css('font-size:10px;color:#8a5bbf;font-weight:600')}>UTL1: {chip.utl1}</span>}
                            {!!chip.utl2 && <span style={css('font-size:10px;color:#8a5bbf;font-weight:600')}>UTL2: {chip.utl2}</span>}
                            {!!chip.utl3 && <span style={css('font-size:10px;color:#8a5bbf;font-weight:600')}>UTL3: {chip.utl3}</span>}
                          </div>
                        ) : null}

                        <EmbeddedNotes notes={chip.notes || []} onAddNote={chip.onAddNote} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {confirmDeleteChip && (
        <div
          onClick={cancelDelete}
          style={css('position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(15,20,25,0.55);animation:fadeIn .12s ease')}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={css('background:#fff;border-radius:14px;padding:28px 28px 22px;width:100%;max-width:360px;box-shadow:0 12px 48px rgba(0,0,0,.22);display:flex;flex-direction:column;gap:18px;margin:20px')}
          >
            {/* Icon */}
            <div style={css('display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center')}>
              <div style={css('width:48px;height:48px;border-radius:50%;background:#fef2f2;border:1.5px solid #fecaca;display:flex;align-items:center;justify-content:center;font-size:20px')}>🗑️</div>
              <div style={css('font-size:15px;font-weight:700;color:#15191e')}>Delete this appointment?</div>
              <div style={css('font-size:12px;color:#6a706a;line-height:1.5')}>
                <span style={css('font-weight:600;color:#23282a')}>{confirmDeleteChip.code}</span>
                {' '}will be permanently removed. This action cannot be undone.
              </div>
            </div>
            {/* Buttons */}
            <div style={css('display:flex;gap:10px')}>
              <button
                onClick={cancelDelete}
                style={css("flex:1;padding:9px 0;border:1px solid #dde0d9;background:#f4f6f1;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:#3c423d;font-family:'Archivo',sans-serif")}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={css("flex:1;padding:9px 0;border:none;background:#dc2626;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:#fff;font-family:'Archivo',sans-serif")}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmbeddedNotes({ notes, onAddNote }: { notes: any[]; onAddNote: (t: string) => void }) {
  const [text, setText] = useState('');
  const handlePost = () => {
    if (!text.trim()) return;
    onAddNote(text);
    setText('');
  };
  return (
    <div style={css('margin-top:6px;border-top:1px dashed #e2e5de;padding-top:8px')}>
      <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#9aa097;letter-spacing:.5px;margin-bottom:6px")}>
        NOTES - {notes.length}
      </div>
      <div style={css('display:flex;flex-direction:column;gap:8px;margin-bottom:8px')}>
        {notes.map((m, i) => (
          <div key={i} style={css('display:flex;gap:7px;align-items:flex-start')}>
            <div style={m.avatarStyle}>{m.initials}</div>
            <div style={css('min-width:0;flex:1')}>
              <div style={css('display:flex;align-items:baseline;gap:6px')}>
                <span style={css('font-size:11px;font-weight:600;color:#23282a')}>{m.who}</span>
                <span style={css("font-size:9px;color:#a6aca2;font-family:'IBM Plex Mono',monospace")}>{m.ago}</span>
                <span style={css('flex:1')} />
                <span onClick={m.onDelete} style={css('font-size:10.5px;color:#bcc1b8;cursor:pointer;line-height:1')} title="Delete note">✕</span>
              </div>
              <div style={css('font-size:11px;color:#3c423d;line-height:1.3;margin-top:1px')}>{m.text}</div>
            </div>
          </div>
        ))}
        {notes.length === 0 && <div style={css('font-size:10.5px;color:#a6aca2;font-style:italic')}>No notes yet.</div>}
      </div>
      <div style={css('display:flex;gap:6px')}>
        <HInput
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handlePost(); }}
          placeholder="Add a note…"
          style={css("flex:1;border:1px solid #dde0d9;border-radius:6px;padding:6px 9px;font-size:11px;font-family:'Archivo',sans-serif;color:#23282a;outline:none")}
          focus={{ borderColor: '#9bb0e8' }}
        />
        <button onClick={handlePost} style={css('background:#15191e;color:#fff;border:none;border-radius:6px;padding:0 11px;font-size:11px;font-weight:600;cursor:pointer')}>Post</button>
      </div>
    </div>
  );
}

function Sidebar({ vm }: { vm: VM }) {
  return (
    <aside className="scrl" style={vm.sidebarStyle}>
      <div style={css('padding:13px 15px 12px;border-bottom:1px solid #e7eae3')}>
        <div style={css('display:flex;align-items:center;justify-content:space-between')}>
          <HButton onClick={vm.prevWeek} style={css('width:26px;height:26px;border:1px solid #dde0d9;background:#fff;border-radius:6px;cursor:pointer;color:#4a504a;font-size:13px;display:flex;align-items:center;justify-content:center')} hover={{ background: '#f1f3ee' }}>‹</HButton>
          <div style={css('text-align:center;line-height:1.15')}>
            <div style={css('font-size:13px;font-weight:700;letter-spacing:-.1px')}>{vm.periodLabel}</div>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;color:#8a9088;letter-spacing:.3px;margin-top:1px")}>{vm.periodTag}</div>
          </div>
          <HButton onClick={vm.nextWeek} style={css('width:26px;height:26px;border:1px solid #dde0d9;background:#fff;border-radius:6px;cursor:pointer;color:#4a504a;font-size:13px;display:flex;align-items:center;justify-content:center')} hover={{ background: '#f1f3ee' }}>›</HButton>
        </div>
      </div>

      <div style={css('padding:13px 15px 12px;border-bottom:1px solid #e7eae3')}>
        <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:9px')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#9aa097;letter-spacing:.6px")}>FILTERS</div>
          {vm.hasFilters && (
            <button onClick={vm.clearFilters} style={css("font-size:10.5px;color:#5b7fd6;background:none;border:none;cursor:pointer;font-family:'Archivo',sans-serif;font-weight:600;padding:0")}>Clear all</button>
          )}
        </div>
        <div style={css('display:flex;flex-direction:column;gap:6px')}>
          <MultiSelect label="Type" items={vm.apptTypeOptions} selected={vm.filterApptType} onToggle={vm.toggleFilterApptType} />
          <MultiSelect label="Auditor" items={vm.employeeOptions.filter((o) => o.value).map((o) => ({ value: o.value, label: o.label }))} selected={vm.filterEmp} onToggle={vm.toggleFilterEmp} />
          <MultiSelect label="Department" items={[...vm.customerTopicOptions, ...vm.internalTopicOptions].map((o) => ({ value: o, label: o }))} selected={vm.filterAuditTopic} onToggle={vm.toggleFilterAuditTopic} />
          <MultiSelect label="Site" items={vm.siteOptions.filter((o) => o.value).map((o) => ({ value: o.value, label: o.label }))} selected={vm.filterSite} onToggle={vm.toggleFilterSite} />
          <MultiSelect label="Customer" items={vm.companyNames.map((o) => ({ value: o, label: o }))} selected={vm.filterCompany} onToggle={vm.toggleFilterCompany} />
          <MultiSelect label="Purpose" items={vm.auditTypes.map((o) => ({ value: o, label: o }))} selected={vm.filterAuditType} onToggle={vm.toggleFilterAuditType} />
        </div>
      </div>

      <div style={css('padding:13px 15px 6px;border-top:1px solid #e7eae3;margin-top:auto;flex-shrink:0')}>
        <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#9aa097;letter-spacing:.6px;margin-bottom:8px")}>ACTIVITY</div>
      </div>
      <div className="scrl" style={css('padding:0 15px 14px;overflow-y:auto;flex:1;min-height:54px')}>
        <div style={css('display:flex;flex-direction:column;gap:10px')}>
          {vm.activity.map((a, i) => (
            <div key={i} style={css('display:flex;gap:8px;align-items:flex-start')}>
              <span style={a.dotStyle} />
              <div style={css('line-height:1.3;min-width:0')}>
                <span style={css('font-size:11px;color:#3c423d')}><span style={css('font-weight:600')}>{a.who}</span> {a.text}</span>
                <div style={css("font-size:9.5px;color:#a6aca2;margin-top:1px;font-family:'IBM Plex Mono',monospace")}>{a.ago}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={css('padding:13px 15px 14px;border-top:1px solid #e7eae3;flex-shrink:0')}>
        <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#9aa097;letter-spacing:.6px;margin-bottom:8px")}>COLOR CODE SITE</div>
        <div style={css('display:flex;flex-direction:column;gap:7px')}>
          {vm.siteColorList.map((s) => (
            <div key={s.site} style={css('display:flex;align-items:center;gap:8px')}>
              <span style={css('width:10px;height:10px;border-radius:3px;flex-shrink:0;background:' + s.color)} />
              <span style={css('font-size:11.5px;color:#3c423d')}>{s.site}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function TimetableGrid({ vm }: { vm: VM }) {
  return (
    <div style={{ ...gridBase, gridTemplateColumns: vm.timetableGridCols }}>
      <div style={css('position:sticky;top:0;left:0;z-index:4;background:#f3f5ef;border-bottom:1px solid #d8dcd4;border-right:1px solid #e2e5de;padding:10px 14px')}>
        <span style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#9aa097;letter-spacing:.5px")}>TIME</span>
      </div>
      <DayHeaders vm={vm} />
      {vm.timetableRows.map((r) => (
        <Fragment key={r.slotId}>
          <div style={css('border-bottom:1px solid #e2e5de;border-right:1px solid #e2e5de;padding:12px 14px;background:#fff;position:sticky;left:0;z-index:2')}>
            <span style={css('font-size:11.5px;font-weight:700;color:#23282a')}>{r.label}</span>
          </div>
          {r.cells.map((cell, ci) => (
            <div key={ci} style={cell.style}>
              {cell.chips.map((chip) => (
                <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                  <div style={css('display:flex;align-items:center;gap:6px')}>
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;color:#15191e")}>{renderApptCode(chip.code)}</span>
                    <span style={css('flex:1')} />
                  </div>
                  <div style={css('font-size:10.5px;color:#5c625c;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{chip.purpose}</div>
                </div>
              ))}
              {cell.empty && <div style={css('font-size:10.5px;color:#bcc1b8;text-align:center;padding:8px 0')}>-</div>}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

function MobileTimetable({ vm }: { vm: VM }) {
  return (
    <div style={css('padding:4px 0;display:flex;flex-direction:column;gap:10px')}>
      <div style={css('display:flex;flex-direction:column;gap:8px')}>
        {vm.mobileTimetableRows.map((r) => (
          <div key={r.slotId}>
            <div style={css('font-size:11px;font-weight:700;color:#9aa097;margin-bottom:5px;padding-left:2px')}>{r.label}</div>
            <div style={css('display:flex;flex-direction:column;gap:6px')}>
              {r.cell.chips.map((chip) => (
                <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                  <div style={css('display:flex;align-items:center;gap:6px')}>
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:11.5px;font-weight:600;color:#15191e")}>{renderApptCode(chip.code)}</span>
                    <span style={css('flex:1')} />
                  </div>
                  <div style={css('font-size:10.5px;color:#5c625c;margin-top:2px')}>{chip.purpose}</div>
                </div>
              ))}
              {r.cell.empty && <div style={css('font-size:11px;color:#a6aca2;text-align:center;padding:8px 0;font-style:italic')}>No appointments</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Toolbar({ vm }: { vm: VM }) {
  return (
    <div style={vm.toolbarStyle}>
      {vm.isMobile && (
        <button onClick={vm.toggleSidebar} style={css('width:34px;height:34px;border:1px solid #dde0d9;background:#fff;border-radius:8px;cursor:pointer;color:#3c423d;font-size:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0')}>☰</button>
      )}
      <div style={css('display:flex;background:#f1f3ee;border:1px solid #e0e3dc;border-radius:8px;padding:2px;gap:2px')}>
        <button onClick={vm.setWeekScale} style={vm.weekScaleStyle}>Week</button>
        <button onClick={vm.setMonthScale} style={vm.monthScaleStyle}>Month</button>
        <button onClick={vm.setYearScale} style={vm.yearScaleStyle}>Year</button>
      </div>
      <div style={css('flex:1')} />
      {vm.showStats && (
        <div style={css('display:flex;align-items:center;gap:7px')}>
          <div style={css('display:flex;align-items:center;gap:6px;padding:5px 10px;background:#f6f7f4;border:1px solid #e4e7e0;border-radius:8px')}>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:13.5px;font-weight:600")}>{vm.stats.assignments}</span><span style={css('font-size:10.5px;color:#7a8079')}>appointments</span>
          </div>
          <div style={css('display:flex;align-items:center;gap:6px;padding:5px 10px;background:#f0f4fa;border:1px solid #d4def0;border-radius:8px')}>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:13.5px;font-weight:600;color:#3a6bc4")}>
              {vm.isYear ? vm.stats.yearCustomers : vm.isMonth ? vm.stats.monthCustomers : vm.stats.weekCustomers}
            </span>
            <span style={css('font-size:10.5px;color:#6a7da8')}>
              {vm.isYear ? 'customers this year' : vm.isMonth ? 'customers this month' : 'customers this week'}
            </span>
          </div>
          <div style={css('display:flex;align-items:center;gap:6px;padding:5px 10px;background:#eef3ea;border:1px solid #c7d8bf;border-radius:8px')}>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:13.5px;font-weight:600;color:#3d7840")}>
              {vm.isYear ? vm.stats.yearInternals : vm.isMonth ? vm.stats.monthInternals : vm.stats.weekInternals}
            </span>
            <span style={css('font-size:10.5px;color:#477349')}>
              {vm.isYear ? 'internals this year' : vm.isMonth ? 'internals this month' : 'internals this week'}
            </span>
          </div>
        </div>
      )}
      <HButton onClick={vm.openCreate} style={css("background:#15191e;color:#fff;border:none;border-radius:8px;padding:8px 13px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif;display:flex;align-items:center;gap:6px;flex-shrink:0")} hover={{ background: '#23282e' }}>
        <span style={css('font-size:14px;line-height:1')}>＋</span>New appointment
      </HButton>
      {vm.showDayStrip && (
        <div style={css('width:100%;display:flex;gap:5px')}>
          {vm.daySel.map((d, i) => (
            <button key={i} onClick={d.onClick} style={d.style}>
              <div style={d.labelStyle}>{d.label}</div>
              <div style={d.dateStyle}>{d.date}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WeekCalendar({ vm }: { vm: VM }) {
  return (
    <div style={css('display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:0;min-width:100%;background:#fff;border-top:1px solid #e6e9e2')}>
      {vm.days.map((d, i) => (
        <div key={i} style={css('gridRow:1/-1;border-right:1px solid #e6e9e2;border-bottom:1px solid #e6e9e2;vertical-align:top;background:#fbfcfa;padding:6px 8px')}>
          <div style={css('text-align:center;margin-bottom:6px')}>
            <div style={css('font-size:12px;font-weight:700;color:#9aa097;letter-spacing:.5px')}>{d.label}</div>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:700;color:#23282a;margin-top:2px")}>{d.date.split(' ').pop()}</div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:2px')}>
            {vm.weekCalendarDays[i].chips.map((chip) => {
              const chColors = chip.colors && chip.colors.length > 0 ? chip.colors : [chip.color];
              return (
                <div key={chip.id} onClick={chip.onClick} title={[chip.customer, chip.auditor2 || chip.purpose, chip.auditor2 ? '' : chip.auditor1].filter(Boolean).join(' - ')} style={{
                  display: 'flex', alignItems: 'stretch',
                  background: '#f0f2ec', borderRadius: '6px',
                  boxShadow: '0 1px 2px rgba(0,0,0,.06)',
                  cursor: 'pointer', overflow: 'hidden',
                }}>
                  <div style={{ width: '3px', background: getAccentBackground(chColors), flexShrink: 0, alignSelf: 'stretch' }} />
                  <div style={{ padding: '6px 8px', minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, color: chip.isInternal ? '#10b981' : '#2756d6' }}>{renderApptCode(chip.customer)}</div>
                    {chip.purpose ? (
                      <div style={{ fontSize: '10px', color: '#5c625c', marginTop: '1px' }}>{chip.purpose}</div>
                    ) : null}
                  </div>
                </div>
              );
            })}
            {vm.weekCalendarDays[i].chips.length === 0 && vm.weekMergedSpans.every((s) => s.startDay > i || s.startDay + s.span <= i) && (
              <div style={css('font-size:10px;color:#bcc1b8;font-style:italic;padding:4px 0')}>–</div>
            )}
          </div>
        </div>
      ))}
      {vm.weekMergedSpans.map((sp) => {
        const spColors = sp.colors && sp.colors.length > 0 ? sp.colors : [sp.color];
        return (
          <div onClick={sp.onClick} title={[sp.customer, sp.auditor2 || sp.purpose, sp.auditor2 ? '' : sp.auditor1].filter(Boolean).join(' - ')} style={{
            gridColumn: `${sp.startDay + 1} / span ${sp.span}`,
            gridRow: `${sp.gridRow + 2}`,
            zIndex: 2,
            display: 'flex', alignItems: 'stretch',
            background: '#f0f2ec', borderRadius: '6px',
            boxShadow: '0 1px 2px rgba(0,0,0,.06)',
            cursor: 'pointer', overflow: 'hidden',
            margin: '2px 0',
          }}>
            <div style={{ width: '3px', background: getAccentBackground(spColors), flexShrink: 0, alignSelf: 'stretch' }} />
            <div style={{ padding: '6px 8px', minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: sp.isInternal ? '#10b981' : '#2756d6' }}>{renderApptCode(sp.customer)}</div>
              {sp.purpose ? (
                <div style={{ fontSize: '10px', color: '#5c625c', marginTop: '1px' }}>{sp.purpose}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayHeaders({ vm }: { vm: VM }) {
  return (
    <>
      {vm.days.map((d, i) => (
        <div key={i} style={css('position:sticky;top:0;z-index:3;background:#f3f5ef;border-bottom:1px solid #d8dcd4;border-right:1px solid #e2e5de;padding:12px 12px 10px')}>
          <div>
            <div style={css('font-size:13px;font-weight:700;color:#23282a;letter-spacing:.2px')}>{d.label}</div>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;color:#8a9088;margin-top:2px")}>{d.date}</div>
          </div>
        </div>
      ))}
    </>
  );
}

function MobileSiteDept({ vm }: { vm: VM }) {
  return (
    <div style={css('padding:11px 11px 24px;display:flex;flex-direction:column;gap:10px')}>
      {vm.mobileSiteDeptRows.map((r, ri) => (
        <div key={ri} style={css('background:#fff;border:1px solid #e4e7e0;border-radius:12px;padding:12px 13px')}>
          <div style={css('display:flex;align-items:center;gap:9px;margin-bottom:10px')}>
            <div style={css('width:12px;height:12px;border-radius:3px;background:' + r.color + ';flex-shrink:0')} />
            <div>
              <div style={css('font-size:13px;font-weight:700;color:#23282a')}>{r.name}</div>
              <div style={css('font-size:10.5px;color:#8a9088')}>{r.engCount + ' engineer' + (r.engCount > 1 ? 's' : '')}</div>
            </div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:6px')}>
            {r.cell.chips.map((chip) => (
              <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                <div style={chip.avatarStyle}>{chip.initials}</div>
                <div style={css('min-width:0;flex:1')}><div style={css('font-size:11.5px;font-weight:600;color:#23282a')}>{chip.name}</div><div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#7a807a")}>{chip.code}</div><div style={css('font-size:9.5px;color:#a6aca2')}>{chip.purpose}</div></div>
              </div>
            ))}
            {r.cell.chips.length === 0 && <div style={css('font-size:11px;color:#a6aca2;text-align:center;padding:8px 0;font-style:italic')}>No appointments</div>}
          </div>
        </div>
      ))}
    </div>
  );
}


function MobilePerson({ vm }: { vm: VM }) {
  return (
    <div style={css('padding:11px 11px 24px;display:flex;flex-direction:column;gap:10px')}>
      {vm.mobilePersonRows.map((r) => (
        <div key={r.engId} style={css('background:#fff;border:1px solid #e4e7e0;border-radius:12px;padding:12px 13px')}>
          <div onClick={r.onNameClick} style={css('display:flex;align-items:center;gap:10px;margin-bottom:10px;cursor:pointer')} title="View weekly timetable">
            <div style={r.avatarStyle}>{r.initials}</div>
            <div style={css('min-width:0;flex:1')}>
              <div style={css('font-size:13px;font-weight:600;color:#23282a')}>{r.name}</div>
              <div style={css('font-size:10.5px;color:#8a9088')}>{r.department}{r.subDepartments.length > 0 ? ' - ' + r.subDepartments.join(', ') : ''}</div>
            </div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:6px')}>
            {r.cell.chips.map((chip) => (
              <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                <div style={css('display:flex;align-items:center;gap:6px')}>
                  <span style={css("font-family:'IBM Plex Mono',monospace;font-size:11.5px;font-weight:600;color:#15191e")}>{chip.code}</span>
                  <span style={css('flex:1')} />
                </div>
                <div style={css('font-size:10.5px;color:#5c625c;margin-top:2px')}>{chip.purpose}</div>
              </div>
            ))}
            {r.cell.chips.length === 0 && (
               <button onClick={r.cell.onHintClick} style={css("width:100%;padding:10px;border:1px dashed #cdd2c9;background:#fbfcfa;border-radius:9px;color:#7a807a;font-size:12px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}>＋ Assign appointment</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileSite({ vm }: { vm: VM }) {
  return (
    <div style={css('padding:11px 11px 24px;display:flex;flex-direction:column;gap:10px')}>
      {vm.mobileSiteRows.map((r, ri) => (
        <div key={ri} style={css('background:#fff;border:1px solid #e4e7e0;border-radius:12px;padding:12px 13px')}>
          <div style={css('display:flex;align-items:center;gap:9px;margin-bottom:10px')}>
            <div><div style={css('font-size:13px;font-weight:700;color:#23282a')}>{r.name}</div><div style={css('font-size:10.5px;color:#8a9088')}>{r.loc}</div></div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:6px')}>
            {r.cell.chips.map((chip) => (
              <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                <div style={chip.avatarStyle}>{chip.initials}</div>
                <div style={css('min-width:0;flex:1')}><div style={css('font-size:11.5px;font-weight:600;color:#23282a')}>{chip.name}</div><div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#7a807a")}>{chip.code}</div><div style={css('font-size:9.5px;color:#a6aca2')}>{chip.purpose}</div></div>
              </div>
            ))}
            {r.cell.empty && <div style={css('font-size:11px;color:#a6aca2;text-align:center;padding:8px 0;font-style:italic')}>No coverage scheduled</div>}
          </div>
        </div>
      ))}
    </div>
  );
}



function MonthGrid({ vm }: { vm: VM }) {
  return (
    <div style={css('height:100%;display:flex;flex-direction:column')}>
      <div style={css('display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid #e6e9e2')}>
        {vm.monthWeekdayHeads.map((h, i) => (
          <div key={i} style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#9aa097;letter-spacing:.5px;text-align:center;padding:7px 0;border-right:1px solid #e6e9e2;" + (i === 6 ? 'border-right:none' : ''))}>{h}</div>
        ))}
      </div>
      <div style={css('flex:1;display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:1fr')}>
        {vm.monthCells.map((c, i) =>
          c.blank ? (
            <div key={i} style={c.style} />
          ) : (
            <div key={i} onClick={c.onClick} style={c.style}>
              <span style={c.numStyle}>{c.dateNum}</span>
              <div style={css('display:flex;flex-direction:column;gap:3px;margin-top:2px')}>
                {(c.chips ?? []).map((ch, ci) => {
                  const chColors = ch.colors && ch.colors.length > 0 ? ch.colors : [ch.color || '#9aa097'];
                  return (
                    <div key={ci} style={{
                      display: 'flex', alignItems: 'stretch',
                      background: '#f0f2ec', borderRadius: '5px',
                      boxShadow: '0 1px 2px rgba(0,0,0,.05)',
                      overflow: 'hidden',
                    }}>
                      <div style={{ width: '3px', background: getAccentBackground(chColors), flexShrink: 0, alignSelf: 'stretch' }} />
                      <div style={{ padding: '3px 5px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#23282a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{renderApptCode(ch.code)}</div>
                        {ch.purpose ? (
                          <div style={{ fontSize: '9.5px', color: '#5c625c', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.purpose}</div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {(c.more ?? 0) > 0 && <span style={css('font-size:10px;color:#5b7fd6;font-weight:600')}>{c.moreTxt}</span>}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function MonthMobile({ vm }: { vm: VM }) {
  return (
    <div style={css('height:100%;display:flex;flex-direction:column')}>
      <div style={css('display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid #e6e9e2')}>
        {vm.monthWeekdayHeads.map((h, i) => (
          <div key={i} style={css("font-family:'IBM Plex Mono',monospace;font-size:8.5px;font-weight:600;color:#9aa097;text-align:center;padding:5px 0;border-right:1px solid #e6e9e2;" + (i === 6 ? 'border-right:none' : ''))}>{h}</div>
        ))}
      </div>
      <div style={css('flex:1;display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:1fr')}>
        {vm.monthCells.map((c, i) =>
          c.blank ? (
            <div key={i} style={c.style} />
          ) : (
            <div key={i} onClick={c.onClick} style={c.style}>
              <span style={c.numStyle}>{c.dateNum}</span>
              <div style={css('display:flex;flex-direction:column;gap:2px;margin-top:1px')}>
                {(c.chips ?? []).map((ch, ci) => {
                  const chColors = ch.colors && ch.colors.length > 0 ? ch.colors : [ch.color || '#9aa097'];
                  return (
                    <div key={ci} style={{
                      display: 'flex', alignItems: 'stretch',
                      background: '#f0f2ec', borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      <div style={{ width: '2px', background: getAccentBackground(chColors), flexShrink: 0, alignSelf: 'stretch' }} />
                      <div style={{ padding: '2px 4px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '8px', fontWeight: 600, color: '#23282a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{renderApptCode(ch.code)}</div>
                        {ch.purpose ? (
                          <div style={{ fontSize: '7.5px', color: '#5c625c', marginTop: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.purpose}</div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {(c.more ?? 0) > 0 && <span style={css('font-size:8px;color:#5b7fd6;font-weight:600')}>{c.moreTxt}</span>}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function YearGrid({ vm }: { vm: VM }) {
  const WEEKDAY_MINI = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div style={css('padding:20px;max-width:1440px;margin:0 auto;display:flex;flex-direction:column;gap:20px')}>
      {/* Year Header Banner */}
      <div style={css('display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid #e2e5de;border-radius:12px;padding:14px 18px;box-shadow:0 2px 8px rgba(0,0,0,.03);flex-wrap:wrap;gap:12px')}>
        <div>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#2756d6;letter-spacing:.6px")}>
            YEAR OVERVIEW · {vm.yearYear}
          </div>
          <div style={css('font-size:13px;font-weight:600;color:#5c625c;margin-top:2px')}>
            Click any month block to jump to Month View
          </div>
        </div>
      </div>

      {/* 12 Month Grid Cards */}
      <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px')}>
        {vm.yearMonths.map((m: any) => {
          const isCurrentMonth = m.year === new Date().getFullYear() && m.monthIndex === new Date().getMonth();

          return (
            <div
              key={m.monthIndex}
              onClick={() => vm.jumpToMonth(m.year, m.monthIndex)}
              style={css(
                `background:#fff;border:1px solid ${isCurrentMonth ? '#2756d6' : '#e4e7e0'};border-radius:12px;padding:14px;cursor:pointer;transition:all .15s ease;display:flex;flex-direction:column;gap:10px;box-shadow:${
                  isCurrentMonth ? '0 4px 14px rgba(39,86,214,.12)' : '0 2px 6px rgba(0,0,0,.02)'
                }`
              )}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2756d6';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isCurrentMonth ? '#2756d6' : '#e4e7e0';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = isCurrentMonth ? '0 4px 14px rgba(39,86,214,.12)' : '0 2px 6px rgba(0,0,0,.02)';
              }}
            >
              {/* Card Month Title & Pill Badge */}
              <div style={css('display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f0f2ed;padding-bottom:8px')}>
                <div style={css('display:flex;align-items:center;gap:6px')}>
                  <span style={css(`font-size:14px;font-weight:700;color:${isCurrentMonth ? '#2756d6' : '#15191e'}`)}>
                    {m.monthName}
                  </span>
                  {isCurrentMonth && (
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;background:#eef2fd;color:#2756d6;border:1px solid #d8e2fa;padding:1px 5px;border-radius:4px")}>
                      NOW
                    </span>
                  )}
                </div>
                <span
                  style={css(
                    `font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;padding:2px 7px;border-radius:12px;${
                      m.totalAppts > 0
                        ? 'background:#f3e8ff;color:#7c3aed;border:1px solid #ddd6fe;'
                        : 'background:#f4f6f1;color:#8a9088;border:1px solid #e2e5de;'
                    }`
                  )}
                >
                  {m.totalAppts > 0 ? `${m.totalAppts} ${m.totalAppts === 1 ? 'Appt' : 'Appts'}` : 'Clear'}
                </span>
              </div>

              {/* Mini Calendar Weekday Headers */}
              <div style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center')}>
                {WEEKDAY_MINI.map((w, idx) => (
                  <div
                    key={`${m.monthIndex}-head-${idx}`}
                    style={css(
                      `font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;${
                        idx >= 5 ? 'color:#b0b5ab;' : 'color:#8a9088;'
                      }`
                    )}
                  >
                    {w}
                  </div>
                ))}
              </div>

              {/* Mini Calendar Days Grid */}
              <div style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:3px')}>
                {m.days.map((d: any, dIdx: number) => {
                  if (d.blank) {
                    return <div key={`blank-${m.monthIndex}-${dIdx}`} style={css('height:22px')} />;
                  }

                  let bg = '#fafbf8';
                  let border = '1px solid #eef1ea';
                  let textColor = '#3c423d';

                  if (d.isWeekend) {
                    bg = '#f4f6f1';
                    textColor = '#a6aca2';
                    border = '1px solid #e8ebe4';
                  } else if (d.hasAppts) {
                    textColor = '#15191e';
                    if (d.customerApptsCount > 0 && d.internalApptsCount > 0) {
                      bg = 'linear-gradient(135deg, #ADCEFF 50%, #CCEDD0 50%)';
                      border = '1px solid #93c5fd';
                    } else if (d.customerApptsCount > 0) {
                      bg = '#ADCEFF';
                      border = '1px solid #93c5fd';
                    } else {
                      bg = '#CCEDD0';
                      border = '1px solid #a7f3d0';
                    }
                  }

                  return (
                    <div
                      key={d.dateISO}
                      title={
                        d.hasAppts
                          ? `${d.dayNum} ${m.monthName}: ${d.totalApptsCount} appointments (${d.customerApptsCount} CS, ${d.internalApptsCount} IA)`
                          : `${d.dayNum} ${m.monthName}`
                      }
                      style={css(
                        `height:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:4px;font-size:10px;font-family:'Archivo',sans-serif;font-weight:${
                          d.hasAppts || d.isToday ? '700' : '500'
                        };position:relative;${
                          d.isToday ? 'outline:2px solid #2756d6;outline-offset:-1px;' : ''
                        };background:${bg};color:${textColor};border:${border}`
                      )}
                    >
                      <span>{d.dayNum}</span>
                    </div>
                  );
                })}
              </div>

              {/* Card Footer / Quick Action */}
              <div style={css('display:flex;align-items:center;justify-content:space-between;border-top:1px solid #f0f2ed;padding-top:8px;margin-top:2px')}>
                <div style={css('font-size:10.5px;color:#7a8079')}>
                  {m.customerAppts > 0 || m.internalAppts > 0 ? (
                    <span>
                      <strong style={{ color: '#2756d6' }}>{m.customerAppts}</strong> CS ·{' '}
                      <strong style={{ color: '#10b981' }}>{m.internalAppts}</strong> IA
                    </span>
                  ) : (
                    'No scheduled audits'
                  )}
                </div>
                <span style={css("font-family:'Archivo',sans-serif;font-size:11px;font-weight:700;color:#2756d6;display:flex;align-items:center;gap:3px")}>
                  View Month →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
