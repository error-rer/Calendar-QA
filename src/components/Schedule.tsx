import { Fragment, useEffect, useRef, useState, useMemo } from 'react';
import type { VM } from '../useScheduler';
import { getAccentBackground } from '../useScheduler';
import { css, HButton, HInput } from '../ui';
import { getHolidayStyle, isOfficialHoliday } from '../holidays';

function renderApptCode(code: string, overrideColor?: string) {
  if (typeof code === 'string' && (code.startsWith('CS') || code.startsWith('IA'))) {
    const spaceDotIdx = code.indexOf(' · ');
    if (spaceDotIdx !== -1) {
      const prefix = code.slice(0, spaceDotIdx);
      const rest = code.slice(spaceDotIdx);
      const prefixColor = overrideColor || (code.startsWith('CS') ? '#60a5fa' : '#34d399');
      return (
        <>
          <span style={{ color: prefixColor, fontWeight: 700 }}>{prefix}</span>
          <span style={{ color: prefixColor }}>{rest}</span>
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
      <button onClick={() => setOpen(!open)} style={css('width:100%;padding:6px 8px;border:1px solid #334155;border-radius:6px;background:#0f172a;cursor:pointer;font-size:11px;font-family:\'Archivo\',sans-serif;font-weight:600;color:#f8fafc;text-align:left;display:flex;align-items:center;justify-content:space-between')}>
        <span>{label}{selCount > 0 ? <span style={css('color:#60a5fa;margin-left:3px')}>({selCount})</span> : ''}</span>
        <span style={css('font-size:8px;color:#94a3b8')}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={css('position:absolute;top:100%;left:0;right:0;z-index:30;margin-top:3px;background:#1e293b;border:1px solid #334155;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.4);max-height:200px;overflow-y:auto;padding:4px')}>
          {items.map((item) => {
            const on = selected.includes(item.value);
            return (
              <div key={item.value} onClick={() => onToggle(item.value)} style={css('display:flex;align-items:center;gap:6px;padding:5px 6px;border-radius:4px;cursor:pointer;font-size:11px;font-family:\'Archivo\',sans-serif;color:#f8fafc;background:' + (on ? '#334155' : '#1e293b') + ';font-weight:' + (on ? '600' : '400'))}>
                <span style={css('width:14px;height:14px;border-radius:3px;border:1px solid ' + (on ? '#3b82f6' : '#475569') + ';background:' + (on ? '#2563eb' : '#0f172a') + ';display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;flex-shrink:0')}>{on ? '✓' : ''}</span>
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
    <div style={css('flex:1;display:flex;min-height:0;overflow:hidden;position:relative;background:#0f172a')}>
      {vm.showSidebarBackdrop && (
        <div onClick={vm.closeSidebar} style={css('position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:70;animation:fadeIn .15s ease')} />
      )}

      <Sidebar vm={vm} />

      <div style={css('flex:1;min-width:0;display:flex;flex-direction:column;min-height:0')}>
        <Toolbar vm={vm} />

        <main className="scrl" style={css('flex:1;min-width:0;overflow:auto;background:#0f172a;position:relative')}>
          <div style={css('position:absolute;inset:0;pointer-events:none;opacity:.25;background-image:radial-gradient(circle,#334155 1px,transparent 1px);background-size:22px 22px')} />
          {vm.showWeekCalendar && <WeekCalendar vm={vm} />}
          {vm.mobilePerson && <MobilePerson vm={vm} />}
          {vm.mobileSite && <MobileSite vm={vm} />}
          {vm.mobileSiteDept && <MobileSiteDept vm={vm} />}
          {vm.monthDesktop && <MonthGrid vm={vm} />}
          {vm.monthMobile && <MonthMobile vm={vm} />}
          {vm.isYear && <YearGrid vm={vm} />}
          {vm.isSearch && <SearchView vm={vm} />}

        </main>
      </div>

      <DayDialogModal vm={vm} />

      {vm.showTimetable && (
        <div style={vm.modalOverlayStyle}>
          <div onClick={vm.stop} style={css('position:relative;background:#1e293b;border:1px solid #334155;border-radius:14px;width:100%;max-width:1200px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.5);margin:20px')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #334155')}>
              <div style={css('display:flex;align-items:center;gap:10px')}>
                <span style={css('font-size:15px;font-weight:700;color:#f8fafc')}>{vm.timetableEngName}</span>
                <span style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;color:#94a3b8")}>WEEKLY TIMETABLE</span>
              </div>
              <button onClick={vm.closeTimetable} style={css('width:30px;height:30px;border:1px solid #475569;background:#334155;border-radius:7px;cursor:pointer;color:#cbd5e1;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0')}>✕</button>
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

function EyeOffIcon({ size = 15, color = '#94a3b8' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function EyeOnIcon({ size = 15, color = '#60a5fa' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function SearchIcon({ size = 16, color = '#f8fafc' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ApptCard({ chip }: { chip: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; code: string; onDelete: () => void } | null>(null);

  const toggleExpand = () => setIsExpanded((prev) => !prev);
  const requestDelete = () => setConfirmDelete({ id: chip.id, code: chip.code, onDelete: chip.onDelete });
  const confirmDeleteAction = () => {
    confirmDelete?.onDelete();
    setConfirmDelete(null);
  };
  const cancelDelete = () => setConfirmDelete(null);

  const isInc = chip.isIncomplete;
  const chColors = chip.colors && chip.colors.length > 0 ? chip.colors : [chip.color];
  const barBg = isInc ? '#7f1d1d' : '#1e293b';
  const accentBg = isInc ? '#ef4444' : getAccentBackground(chColors);
  const titleColor = isInc ? '#FFFFFF' : (chip.isInternal ? '#34d399' : '#60a5fa');
  const purposeColor = isInc ? '#fca5a5' : '#94a3b8';
  const cardBorder = isInc ? '1px solid #ef4444' : '1px solid #334155';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: barBg, border: cardBorder, borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{ width: '4px', background: accentBg, flexShrink: 0, alignSelf: 'stretch' }} />
        <div style={css('min-width:0;flex:1;padding:9px 11px;display:flex;align-items:center;justify-content:space-between;gap:10px')}>
          <div
            onClick={toggleExpand}
            style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}
            title="Click to expand embedded details"
          >
            <div style={css(`font-size:12.5px;font-weight:600;color:${titleColor}`)}>{renderApptCode(chip.code, isInc ? '#FFFFFF' : undefined)}</div>
            {chip.purpose ? (
              <div style={css(`font-size:11px;color:${purposeColor};margin-top:2px`)}>{chip.purpose}</div>
            ) : null}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
              title={isExpanded ? 'Hide embedded details' : 'Show embedded details'}
              style={css('width:30px;height:30px;border:1px solid ' + (isExpanded ? '#3b82f6' : '#334155') + ';background:' + (isExpanded ? '#1e3a8a' : '#0f172a') + ';border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center')}
            >
              {isExpanded ? <EyeOnIcon size={15} color="#60a5fa" /> : <EyeOffIcon size={15} color="#94a3b8" />}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); chip.onEdit(); }}
              title="Edit appointment details"
              style={css('width:30px;height:30px;border:1px solid #334155;background:#0f172a;border-radius:7px;cursor:pointer;color:#f8fafc;font-size:13px;display:flex;align-items:center;justify-content:center')}
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); requestDelete(); }}
              title="Delete appointment"
              style={css('width:30px;height:30px;border:1px solid #ef4444;background:#7f1d1d;border-radius:7px;cursor:pointer;color:#f87171;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center')}
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div style={css('border-top:1px solid #334155;background:#0f172a;padding:12px 14px;display:flex;flex-direction:column;gap:8px')}>
          <div style={css('display:flex;align-items:center;gap:8px')}>
            <span style={css(`font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:4px;${
              chip.isInternal
                ? 'color:#34d399;background:#064e3b;border:1px solid #047857;'
                : 'color:#60a5fa;background:#172554;border:1px solid #1d4ed8;'
            }`)}>
              {chip.isInternal ? 'Internal Audit' : 'Customer Audit'}
            </span>
            {isInc && (
              <span style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:4px;color:#f87171;background:#7f1d1d;border:1px solid #ef4444;")}>
                Incomplete Data
              </span>
            )}
            {chip.site && (
              <span style={css('font-size:11.5px;color:#cbd5e1;font-weight:600')}>
                Site: <span style={css('color:#f8fafc')}>{chip.site}</span>
              </span>
            )}
          </div>

          <div style={css('display:flex;flex-direction:column;gap:4px;font-size:11.5px;color:#94a3b8')}>
            {!chip.isInternal ? (
              <>
                {chip.customer && <div>Customer: <span style={css('color:#f8fafc;font-weight:600')}>{chip.customer}</span></div>}
                {chip.endCustomer && <div>End customer: <span style={css('color:#cbd5e1')}>{chip.endCustomer}</span></div>}
                {chip.apptPurpose && <div>Purpose: <span style={css('color:#cbd5e1')}>{chip.apptPurpose}</span></div>}
                {chip.auditor && <div>Auditor: <span style={css('color:#cbd5e1')}>{chip.auditor}</span></div>}
                {chip.department && <div>Department: <span style={css('color:#cbd5e1')}>{chip.department}</span></div>}
              </>
            ) : (
              <>
                {chip.area && <div>Area: <span style={css('color:#f8fafc;font-weight:600')}>{chip.area}</span></div>}
                {chip.auditor && <div>Auditor: <span style={css('color:#cbd5e1')}>{chip.auditor}</span></div>}
                {chip.department && <div>Department: <span style={css('color:#cbd5e1')}>{chip.department}</span></div>}
              </>
            )}
          </div>

          {(chip.major || chip.minor || chip.ofi || chip.request || chip.utl1 || chip.utl2 || chip.utl3) ? (
            <div style={css('display:flex;gap:8px;flex-wrap:wrap;margin-top:2px')}>
              {!!chip.major && <span style={css('font-size:10px;color:#f87171;font-weight:600')}>Major: {chip.major}</span>}
              {!!chip.minor && <span style={css('font-size:10px;color:#fbbf24;font-weight:600')}>Minor: {chip.minor}</span>}
              {!!chip.ofi && <span style={css('font-size:10px;color:#60a5fa;font-weight:600')}>OFI: {chip.ofi}</span>}
              {!!chip.request && <span style={css('font-size:10px;color:#34d399;font-weight:600')}>Request: {chip.request}</span>}
              {!!chip.utl1 && <span style={css('font-size:10px;color:#c084fc;font-weight:600')}>UTL1: {chip.utl1}</span>}
              {!!chip.utl2 && <span style={css('font-size:10px;color:#c084fc;font-weight:600')}>UTL2: {chip.utl2}</span>}
              {!!chip.utl3 && <span style={css('font-size:10px;color:#c084fc;font-weight:600')}>UTL3: {chip.utl3}</span>}
            </div>
          ) : null}

          <EmbeddedNotes notes={chip.notes || []} onAddNote={chip.onAddNote} />
        </div>
      )}

      {confirmDelete && (
        <div
          onClick={cancelDelete}
          style={css('position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);animation:fadeIn .12s ease')}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={css('background:#1e293b;border:1px solid #334155;border-radius:14px;padding:28px 28px 22px;width:100%;max-width:360px;box-shadow:0 12px 48px rgba(0,0,0,.5);display:flex;flex-direction:column;gap:18px;margin:20px')}
          >
            <div style={css('display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center')}>
              <div style={css('width:48px;height:48px;border-radius:50%;background:#7f1d1d;border:1.5px solid #ef4444;display:flex;align-items:center;justify-content:center;font-size:20px')}>🗑️</div>
              <div style={css('font-size:15px;font-weight:700;color:#f8fafc')}>Delete this appointment?</div>
              <div style={css('font-size:12px;color:#94a3b8;line-height:1.5')}>
                <span style={css('font-weight:600;color:#f8fafc')}>{confirmDelete.code}</span>
                {' '}will be permanently removed. This action cannot be undone.
              </div>
            </div>
            <div style={css('display:flex;gap:10px')}>
              <button
                onClick={cancelDelete}
                style={css("flex:1;padding:9px 0;border:1px solid #475569;background:#334155;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:#f8fafc;font-family:'Archivo',sans-serif")}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAction}
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

function DayDialogModal({ vm }: { vm: VM }) {
  if (!vm.dayDialogOpen) return null;

  return (
    <div style={vm.modalOverlayStyle}>
      <div onClick={vm.stop} style={css('position:relative;background:#1e293b;border:1px solid #334155;border-radius:14px;width:100%;max-width:500px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.5);margin:20px')}>
        <div style={css('display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #334155')}>
          <div style={css('display:flex;align-items:center;gap:10px')}>
            <span style={css('font-size:15px;font-weight:700;color:#f8fafc')}>{vm.dayDialogInfo?.label}</span>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#94a3b8")}>{vm.dayDialogDate}</span>
          </div>
          <div style={css('display:flex;align-items:center;gap:8px')}>
            <HButton
              onClick={() => vm.openCreateWithDate(vm.dayDialogDateISO)}
              title="Create New Appointment for this date"
              style={css("padding:6px 12px;border:none;background:#2563eb;color:#fff;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;display:flex;align-items:center;gap:4px;font-family:'Archivo',sans-serif")}
              hover={{ background: '#1d4ed8' }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700, lineHeight: 1 }}>+</span> New Appointment
            </HButton>
            <HButton onClick={vm.closeDayDialog} style={css('width:30px;height:30px;border:1px solid #475569;background:#334155;border-radius:7px;cursor:pointer;color:#cbd5e1;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0')} hover={{ background: '#475569' }}>✕</HButton>
          </div>
        </div>
        <div className="scrl" style={css('flex:1;overflow:auto;padding:12px 16px')}>
          {vm.dayDialogChips.length === 0 ? (
            <div style={css('text-align:center;padding:24px 0;color:#94a3b8;font-size:12px;font-style:italic')}>No appointments this day</div>
          ) : (
            <div style={css('display:flex;flex-direction:column;gap:8px')}>
              {vm.dayDialogChips.map((chip) => (
                <ApptCard key={chip.id} chip={chip} />
              ))}
            </div>
          )}
        </div>
      </div>
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
    <div style={css('margin-top:6px;border-top:1px dashed #334155;padding-top:8px')}>
      <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#94a3b8;letter-spacing:.5px;margin-bottom:6px")}>
        NOTES - {notes.length}
      </div>
      <div style={css('display:flex;flex-direction:column;gap:8px;margin-bottom:8px')}>
        {notes.map((m, i) => (
          <div key={i} style={css('display:flex;gap:7px;align-items:flex-start')}>
            <div style={m.avatarStyle}>{m.initials}</div>
            <div style={css('min-width:0;flex:1')}>
              <div style={css('display:flex;align-items:baseline;gap:6px')}>
                <span style={css('font-size:11px;font-weight:600;color:#f8fafc')}>{m.who}</span>
                <span style={css("font-size:9px;color:#94a3b8;font-family:'IBM Plex Mono',monospace")}>{m.ago}</span>
                <span style={css('flex:1')} />
                <span onClick={m.onDelete} style={css('font-size:10.5px;color:#64748b;cursor:pointer;line-height:1')} title="Delete note">✕</span>
              </div>
              <div style={css('font-size:11px;color:#cbd5e1;line-height:1.3;margin-top:1px')}>{m.text}</div>
            </div>
          </div>
        ))}
        {notes.length === 0 && <div style={css('font-size:10.5px;color:#64748b;font-style:italic')}>No notes yet.</div>}
      </div>
      <div style={css('display:flex;gap:6px')}>
        <HInput
          value={text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handlePost(); }}
          placeholder="Add a note…"
          style={css("flex:1;border:1px solid #334155;background:#0f172a;border-radius:6px;padding:6px 9px;font-size:11px;font-family:'Archivo',sans-serif;color:#f8fafc;outline:none")}
          focus={{ borderColor: '#3b82f6' }}
        />
        <button onClick={handlePost} style={css('background:#2563eb;color:#fff;border:none;border-radius:6px;padding:0 11px;font-size:11px;font-weight:600;cursor:pointer')}>Post</button>
      </div>
    </div>
  );
}

function Sidebar({ vm }: { vm: VM }) {
  return (
    <aside className="scrl" style={vm.sidebarStyle}>
      <div style={css('padding:13px 15px 12px;border-bottom:1px solid #334155')}>
        <div style={css('display:flex;align-items:center;justify-content:space-between')}>
          <HButton onClick={vm.prevWeek} style={css('width:26px;height:26px;border:1px solid #475569;background:#334155;border-radius:6px;cursor:pointer;color:#f8fafc;font-size:13px;display:flex;align-items:center;justify-content:center')} hover={{ background: '#475569' }}>‹</HButton>
          <div style={css('text-align:center;line-height:1.15')}>
            <div style={css('font-size:13px;font-weight:700;color:#f8fafc;letter-spacing:-.1px')}>{vm.periodLabel}</div>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;color:#94a3b8;letter-spacing:.3px;margin-top:1px")}>{vm.periodTag}</div>
          </div>
          <HButton onClick={vm.nextWeek} style={css('width:26px;height:26px;border:1px solid #475569;background:#334155;border-radius:6px;cursor:pointer;color:#f8fafc;font-size:13px;display:flex;align-items:center;justify-content:center')} hover={{ background: '#475569' }}>›</HButton>
        </div>
      </div>

      <div style={css('padding:13px 15px 12px;border-bottom:1px solid #334155')}>
        <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:9px')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#94a3b8;letter-spacing:.6px")}>FILTERS</div>
          {vm.hasFilters && (
            <button onClick={vm.clearFilters} style={css("font-size:10.5px;color:#60a5fa;background:none;border:none;cursor:pointer;font-family:'Archivo',sans-serif;font-weight:600;padding:0")}>Clear all</button>
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

      <div style={css('padding:13px 15px 12px;border-bottom:1px solid #334155')}>
        <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:8px')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#94a3b8;letter-spacing:.6px")}>INCOMPLETE APPOINTMENTS</div>
          <span style={css(`font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;${
            (vm.incompleteAppointments || []).length > 0
              ? 'background:#7f1d1d;color:#f87171;border:1px solid #ef4444;'
              : 'background:#334155;color:#94a3b8;'
          }`)}>
            {(vm.incompleteAppointments || []).length}
          </span>
        </div>

        <div className="scrl" style={css('overflow-y:auto;max-height:220px')}>
          {(!vm.incompleteAppointments || vm.incompleteAppointments.length === 0) ? (
            <div style={css('font-size:11px;color:#94a3b8;font-style:italic;padding:2px 0')}>All appointments complete ✨</div>
          ) : (
            <div style={css('display:flex;flex-direction:column;gap:8px')}>
              {vm.incompleteAppointments.map((item: any) => (
                <div
                  key={item.id}
                  onClick={item.onClick}
                  style={css('display:flex;align-items:center;gap:8px;padding:7px 9px;background:#7f1d1d;border:1px solid #ef4444;border-radius:7px;cursor:pointer;transition:all .15s ease')}
                  title="Click to edit and complete required appointment details"
                >
                  <span style={css('width:8px;height:8px;border-radius:50%;background:#ef4444;flex-shrink:0')} />
                  <div style={css('flex:1;min-width:0;line-height:1.2')}>
                    <div style={css('font-size:11px;font-weight:700;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>
                      {renderApptCode(item.code, '#f8fafc')}
                    </div>
                    <div style={css("font-size:9.5px;color:#fca5a5;margin-top:2px;font-family:'IBM Plex Mono',monospace")}>
                      {item.dateStr}
                    </div>
                  </div>
                  <span style={css('font-size:11px;color:#f87171;flex-shrink:0')}>✏️</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={css('padding:13px 15px 14px')}>
        <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#94a3b8;letter-spacing:.6px;margin-bottom:8px")}>COLOR CODE SITE</div>
        <div style={css('display:flex;flex-direction:column;gap:7px')}>
          {vm.siteColorList.map((s) => (
            <div key={s.site} style={css('display:flex;align-items:center;gap:8px')}>
              <span style={css('width:10px;height:10px;border-radius:3px;flex-shrink:0;background:' + s.color)} />
              <span style={css('font-size:11.5px;color:#cbd5e1')}>{s.site}</span>
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
      <div style={css('position:sticky;top:0;left:0;z-index:4;background:#1e293b;border-bottom:1px solid #334155;border-right:1px solid #334155;padding:10px 14px')}>
        <span style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#94a3b8;letter-spacing:.5px")}>TIME</span>
      </div>
      <DayHeaders vm={vm} />
      {vm.timetableRows.map((r) => (
        <Fragment key={r.slotId}>
          <div style={css('border-bottom:1px solid #334155;border-right:1px solid #334155;padding:12px 14px;background:#1e293b;position:sticky;left:0;z-index:2')}>
            <span style={css('font-size:11.5px;font-weight:700;color:#f8fafc')}>{r.label}</span>
          </div>
          {r.cells.map((cell, ci) => (
            <div key={ci} style={cell.style}>
              {cell.chips.map((chip) => (
                <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                  <div style={css('display:flex;align-items:center;gap:6px')}>
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;color:#f8fafc")}>{renderApptCode(chip.code)}</span>
                    <span style={css('flex:1')} />
                  </div>
                  <div style={css('font-size:10.5px;color:#94a3b8;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{chip.purpose}</div>
                </div>
              ))}
              {cell.empty && <div style={css('font-size:10.5px;color:#64748b;text-align:center;padding:8px 0')}>-</div>}
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
            <div style={css('font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:5px;padding-left:2px')}>{r.label}</div>
            <div style={css('display:flex;flex-direction:column;gap:6px')}>
              {r.cell.chips.map((chip) => (
                <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                  <div style={css('display:flex;align-items:center;gap:6px')}>
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:11.5px;font-weight:600;color:#f8fafc")}>{renderApptCode(chip.code)}</span>
                    <span style={css('flex:1')} />
                  </div>
                  <div style={css('font-size:10.5px;color:#94a3b8;margin-top:2px')}>{chip.purpose}</div>
                </div>
              ))}
              {r.cell.empty && <div style={css('font-size:11px;color:#64748b;text-align:center;padding:8px 0;font-style:italic')}>No appointments</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchRowItem({ dateLabel, chip, isLast }: { dateLabel: string; chip: any; isLast: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; code: string; onDelete: () => void } | null>(null);

  const toggleExpand = () => setIsExpanded((prev) => !prev);
  const requestDelete = () => setConfirmDelete({ id: chip.id, code: chip.code, onDelete: chip.onDelete });
  const confirmDeleteAction = () => {
    confirmDelete?.onDelete();
    setConfirmDelete(null);
  };
  const cancelDelete = () => setConfirmDelete(null);

  const chColors = chip.colors && chip.colors.length > 0 ? chip.colors : [chip.color];
  const isInc = !!chip.isIncomplete;
  const barBgColor = isInc ? '#ef4444' : getAccentBackground(chColors);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderBottom: isLast ? 'none' : '1px solid #334155', background: '#1e293b' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: '52px' }}>
        {/* Left-Aligned Date Column */}
        <div style={{
          width: '125px',
          minWidth: '105px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          background: '#0f172a',
          borderRight: '1px solid #334155',
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: '12px',
            fontWeight: 700,
            color: '#f8fafc',
            letterSpacing: '0.2px',
          }}>
            {dateLabel}
          </span>
        </div>

        {/* Color accent bar: Red (#EF4444) for incomplete data, otherwise standard blue / plant accent */}
        <div style={{ width: '4px', background: barBgColor, flexShrink: 0, alignSelf: 'stretch' }} />

        {/* Main Appointment Content Strip */}
        <div style={{ flex: 1, minWidth: 0, padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div onClick={toggleExpand} style={{ minWidth: 0, flex: 1, cursor: 'pointer' }} title="Click to expand embedded details">
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
              <div style={css(`font-size:12.5px;font-weight:600;color:${chip.isInternal ? '#34d399' : '#60a5fa'}`)}>
                {renderApptCode(chip.code)}
              </div>
              {isInc && (
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#f87171', background: '#7f1d1d', border: '1px solid #ef4444', padding: '1px 5px', borderRadius: '4px', textTransform: 'uppercase', lineHeight: 1 }}>
                  Incomplete
                </span>
              )}
            </div>
            {chip.purpose ? (
              <div style={css('font-size:11px;color:#94a3b8;margin-top:2px')}>{chip.purpose}</div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
              title={isExpanded ? 'Hide embedded details' : 'Show embedded details'}
              style={css('width:30px;height:30px;border:1px solid ' + (isExpanded ? '#3b82f6' : '#334155') + ';background:' + (isExpanded ? '#1e3a8a' : '#0f172a') + ';border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center')}
            >
              {isExpanded ? <EyeOnIcon size={15} color="#60a5fa" /> : <EyeOffIcon size={15} color="#94a3b8" />}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); chip.onEdit(); }}
              title="Edit appointment details"
              style={css('width:30px;height:30px;border:1px solid #334155;background:#0f172a;border-radius:7px;cursor:pointer;color:#f8fafc;font-size:13px;display:flex;align-items:center;justify-content:center')}
            >
              ✏️
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); requestDelete(); }}
              title="Delete appointment"
              style={css('width:30px;height:30px;border:1px solid #ef4444;background:#7f1d1d;border-radius:7px;cursor:pointer;color:#f87171;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center')}
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Details Panel */}
      {isExpanded && (
        <div style={css('border-top:1px solid #334155;background:#0f172a;padding:12px 14px 12px 143px;display:flex;flex-direction:column;gap:8px')}>
          <div style={css('display:flex;align-items:center;gap:8px')}>
            <span style={css(`font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:4px;${
              chip.isInternal
                ? 'color:#34d399;background:#064e3b;border:1px solid #047857;'
                : 'color:#60a5fa;background:#172554;border:1px solid #1d4ed8;'
            }`)}>
              {chip.isInternal ? 'Internal Audit' : 'Customer Audit'}
            </span>
            {chip.site && (
              <span style={css('font-size:11.5px;color:#cbd5e1;font-weight:600')}>
                Site: <span style={css('color:#f8fafc')}>{chip.site}</span>
              </span>
            )}
          </div>

          <div style={css('display:flex;flex-direction:column;gap:4px;font-size:11.5px;color:#94a3b8')}>
            {!chip.isInternal ? (
              <>
                {chip.customer && <div>Customer: <span style={css('color:#f8fafc;font-weight:600')}>{chip.customer}</span></div>}
                {chip.endCustomer && <div>End customer: <span style={css('color:#cbd5e1')}>{chip.endCustomer}</span></div>}
                {chip.apptPurpose && <div>Purpose: <span style={css('color:#cbd5e1')}>{chip.apptPurpose}</span></div>}
                {chip.auditor && <div>Auditor: <span style={css('color:#cbd5e1')}>{chip.auditor}</span></div>}
                {chip.department && <div>Department: <span style={css('color:#cbd5e1')}>{chip.department}</span></div>}
              </>
            ) : (
              <>
                {chip.area && <div>Area: <span style={css('color:#f8fafc;font-weight:600')}>{chip.area}</span></div>}
                {chip.auditor && <div>Auditor: <span style={css('color:#cbd5e1')}>{chip.auditor}</span></div>}
                {chip.department && <div>Department: <span style={css('color:#cbd5e1')}>{chip.department}</span></div>}
              </>
            )}
          </div>

          {(chip.major || chip.minor || chip.ofi || chip.request || chip.utl1 || chip.utl2 || chip.utl3) ? (
            <div style={css('display:flex;gap:8px;flex-wrap:wrap;margin-top:2px')}>
              {!!chip.major && <span style={css('font-size:10px;color:#f87171;font-weight:600')}>Major: {chip.major}</span>}
              {!!chip.minor && <span style={css('font-size:10px;color:#fbbf24;font-weight:600')}>Minor: {chip.minor}</span>}
              {!!chip.ofi && <span style={css('font-size:10px;color:#60a5fa;font-weight:600')}>OFI: {chip.ofi}</span>}
              {!!chip.request && <span style={css('font-size:10px;color:#34d399;font-weight:600')}>Request: {chip.request}</span>}
              {!!chip.utl1 && <span style={css('font-size:10px;color:#c084fc;font-weight:600')}>UTL1: {chip.utl1}</span>}
              {!!chip.utl2 && <span style={css('font-size:10px;color:#c084fc;font-weight:600')}>UTL2: {chip.utl2}</span>}
              {!!chip.utl3 && <span style={css('font-size:10px;color:#c084fc;font-weight:600')}>UTL3: {chip.utl3}</span>}
            </div>
          ) : null}

          <EmbeddedNotes notes={chip.notes || []} onAddNote={chip.onAddNote} />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '360px',
              width: '100%',
              boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '15px', fontWeight: 700 }}>
              <span>⚠️ Delete Appointment?</span>
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4' }}>
              Are you sure you want to delete <strong style={{ color: '#f8fafc' }}>{confirmDelete.code}</strong>? This action cannot be undone.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={cancelDelete}
                style={{
                  padding: '7px 14px',
                  borderRadius: '7px',
                  border: '1px solid #475569',
                  background: '#334155',
                  color: '#f8fafc',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAction}
                style={{
                  padding: '7px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
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

function MaskedDateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const parts = (value || '').split('/');
  const initialDD = parts[0] || '';
  const initialMM = parts[1] || '';
  const initialYYYY = parts[2] || '';

  const [dd, setDd] = useState(initialDD);
  const [mm, setMm] = useState(initialMM);
  const [yyyy, setYyyy] = useState(initialYYYY);

  const ddRef = useRef<HTMLInputElement>(null);
  const mmRef = useRef<HTMLInputElement>(null);
  const yyyyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = (value || '').split('/');
    setDd(p[0] || '');
    setMm(p[1] || '');
    setYyyy(p[2] || '');
  }, [value]);

  const updateAll = (nextDd: string, nextMm: string, nextYyyy: string) => {
    setDd(nextDd);
    setMm(nextMm);
    setYyyy(nextYyyy);
    if (!nextDd && !nextMm && !nextYyyy) {
      onChange('');
    } else {
      onChange(`${nextDd}/${nextMm}/${nextYyyy}`);
    }
  };

  const handleDdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 2);
    updateAll(digits, mm, yyyy);
    if (digits.length === 2) {
      mmRef.current?.focus();
    }
  };

  const handleMmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 2);
    updateAll(dd, digits, yyyy);
    if (digits.length === 2) {
      yyyyRef.current?.focus();
    }
  };

  const handleYyyyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    updateAll(dd, mm, digits);
  };

  const handleMmKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !mm) {
      ddRef.current?.focus();
    }
  };

  const handleYyyyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !yyyy) {
      mmRef.current?.focus();
    }
  };

  const handleBoxClick = () => {
    if (!dd) {
      ddRef.current?.focus();
    } else if (!mm) {
      mmRef.current?.focus();
    } else if (!yyyy) {
      yyyyRef.current?.focus();
    } else {
      ddRef.current?.focus();
    }
  };

  return (
    <div
      onClick={handleBoxClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '6px 10px',
        border: '1px solid #334155',
        background: '#0f172a',
        borderRadius: '6px',
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize: '12.5px',
        color: '#f8fafc',
        cursor: 'text',
      }}
    >
      <input
        ref={ddRef}
        type="text"
        placeholder="DD"
        value={dd}
        onChange={handleDdChange}
        style={{ width: '24px', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center', fontSize: '12.5px', fontFamily: "'IBM Plex Mono',monospace", color: '#f8fafc', padding: 0 }}
      />
      <span style={{ color: '#64748b', margin: '0 2px' }}>/</span>
      <input
        ref={mmRef}
        type="text"
        placeholder="MM"
        value={mm}
        onChange={handleMmChange}
        onKeyDown={handleMmKeyDown}
        style={{ width: '26px', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center', fontSize: '12.5px', fontFamily: "'IBM Plex Mono',monospace", color: '#f8fafc', padding: 0 }}
      />
      <span style={{ color: '#64748b', margin: '0 2px' }}>/</span>
      <input
        ref={yyyyRef}
        type="text"
        placeholder="YYYY"
        value={yyyy}
        onChange={handleYyyyChange}
        onKeyDown={handleYyyyKeyDown}
        style={{ width: '44px', border: 'none', outline: 'none', background: 'transparent', textAlign: 'center', fontSize: '12.5px', fontFamily: "'IBM Plex Mono',monospace", color: '#f8fafc', padding: 0 }}
      />
    </div>
  );
}

function DurationDropdown({ vm }: { vm: VM }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasRange = Boolean(vm.searchDateFrom || vm.searchDateTo);
  let label = 'Duration';
  if (vm.searchDateFrom && vm.searchDateTo) {
    label = `Duration: ${vm.searchDateFrom} - ${vm.searchDateTo}`;
  } else if (vm.searchDateFrom) {
    label = `Duration: From ${vm.searchDateFrom}`;
  } else if (vm.searchDateTo) {
    label = `Duration: To ${vm.searchDateTo}`;
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 11px',
          background: hasRange ? '#1e3a8a' : '#1e293b',
          border: '1px solid ' + (hasRange ? '#3b82f6' : '#334155'),
          borderRadius: '7px',
          cursor: 'pointer',
          fontSize: '12px',
          fontFamily: "'Archivo',sans-serif",
          color: hasRange ? '#60a5fa' : '#f8fafc',
          fontWeight: 600,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        <span>📅</span>
        <span>{label}</span>
        <span style={{ fontSize: '9px', color: hasRange ? '#60a5fa' : '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▼</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '10px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.5)',
            zIndex: 100,
            width: '220px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.4px', textTransform: 'uppercase', fontFamily: "'IBM Plex Mono',monospace" }}>
            Date Duration Range
          </div>

          {/* First row: From date input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#cbd5e1' }}>From</label>
            <MaskedDateInput
              value={vm.searchDateFrom}
              onChange={(val) => vm.setSearchDateRange(val, vm.searchDateTo)}
            />
          </div>

          {/* Second row: To date input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#cbd5e1' }}>To</label>
            <MaskedDateInput
              value={vm.searchDateTo}
              onChange={(val) => vm.setSearchDateRange(vm.searchDateFrom, val)}
            />
          </div>

          {hasRange && (
            <button
              type="button"
              onClick={() => vm.setSearchDateRange('', '')}
              style={{
                marginTop: '2px',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #ef4444',
                background: '#7f1d1d',
                color: '#f87171',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Clear Range
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SearchSortDropdown({ vm }: { vm: VM }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentSort = vm.searchSort || 'oldest';
  const label = currentSort === 'newest' ? 'Sorted: Newest → Oldest' : 'Sorted: Oldest → Newest';

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 11px',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '7px',
          cursor: 'pointer',
          fontSize: '12px',
          fontFamily: "'Archivo',sans-serif",
          color: '#f8fafc',
          fontWeight: 600,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        <span>{label}</span>
        <span style={{ fontSize: '9px', color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▼</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 100,
            minWidth: '170px',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              vm.setSearchSort('oldest');
              setOpen(false);
            }}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              border: 'none',
              background: currentSort === 'oldest' ? '#334155' : 'transparent',
              color: currentSort === 'oldest' ? '#60a5fa' : '#f8fafc',
              fontSize: '12px',
              fontFamily: "'Archivo',sans-serif",
              fontWeight: currentSort === 'oldest' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <span>Oldest (Default)</span>
            {currentSort === 'oldest' && <span style={{ color: '#60a5fa', fontWeight: 700 }}>✓</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              vm.setSearchSort('newest');
              setOpen(false);
            }}
            style={{
              padding: '7px 10px',
              borderRadius: '6px',
              border: 'none',
              background: currentSort === 'newest' ? '#334155' : 'transparent',
              color: currentSort === 'newest' ? '#60a5fa' : '#f8fafc',
              fontSize: '12px',
              fontFamily: "'Archivo',sans-serif",
              fontWeight: currentSort === 'newest' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <span>Newest</span>
            {currentSort === 'newest' && <span style={{ color: '#60a5fa', fontWeight: 700 }}>✓</span>}
          </button>
        </div>
      )}
    </div>
  );
}

function SearchView({ vm }: { vm: VM }) {
  const totalResults = vm.searchResults.reduce((n: number, g: any) => n + g.items.length, 0);

  const allItems = useMemo(() => {
    const list: { dateLabel: string; dateISO: string; item: any }[] = [];
    for (const group of vm.searchResults) {
      for (const item of group.items) {
        list.push({ dateLabel: group.dateLabel, dateISO: group.dateISO, item });
      }
    }
    return list;
  }, [vm.searchResults]);

  return (
    <div style={css('padding:20px;max-width:980px;margin:0 auto;display:flex;flex-direction:column;gap:16px')}>
      {/* Header bar */}
      <div style={css('display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px')}>
        <div style={css('display:flex;align-items:center;gap:10px')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#60a5fa;letter-spacing:.6px")}>ALL APPOINTMENTS · SEARCH</div>
          <div style={css('display:flex;align-items:center;gap:5px;padding:3px 8px;background:#172554;border:1px solid #1d4ed8;border-radius:6px')}>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#93c5fd")}>{totalResults}</span>
            <span style={css('font-size:9.5px;color:#60a5fa')}>results</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DurationDropdown vm={vm} />
          <SearchSortDropdown vm={vm} />
        </div>
      </div>

      {allItems.length === 0 ? (
        <div style={css('display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;background:#1e293b;border:1px solid #334155;border-radius:14px;gap:10px')}>
          <div style={css('font-size:32px')}>🔍</div>
          <div style={css('font-size:15px;font-weight:700;color:#f8fafc')}>
            {vm.searchQuery ? 'No results found' : 'No appointments match active filters'}
          </div>
          <div style={css('font-size:12.5px;color:#94a3b8;text-align:center;max-width:300px;line-height:1.5')}>
            {vm.searchQuery ? `No appointments match "${vm.searchQuery}"` : 'Try adjusting the sidebar filters or clear them.'}
          </div>
        </div>
      ) : (
        /* Compact Bordered List Container */
        <div style={{ display: 'flex', flexDirection: 'column', background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
          {allItems.map((entry, index) => (
            <SearchRowItem
              key={entry.item.id + '-' + index}
              dateLabel={entry.dateLabel}
              chip={entry.item}
              isLast={index === allItems.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchAutoComplete({ vm, inputRef }: { vm: VM; inputRef?: React.RefObject<HTMLInputElement | null> }) {
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(vm.searchQuery);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputVal(vm.searchQuery);
  }, [vm.searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const q = inputVal.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!q) return vm.searchSuggestions.slice(0, 10);
    return vm.searchSuggestions
      .filter((s) => s.label.toLowerCase().includes(q))
      .slice(0, 12);
  }, [q, vm.searchSuggestions]);

  const selectSuggestion = (label: string) => {
    setInputVal(label);
    vm.setSearchQuery(label);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    vm.setSearchQuery(val);
    setOpen(true);
  };

  const renderHighlightedText = (text: string, highlightQuery: string) => {
    if (!highlightQuery) return text;
    const index = text.toLowerCase().indexOf(highlightQuery.toLowerCase());
    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + highlightQuery.length);
    const after = text.slice(index + highlightQuery.length);

    return (
      <>
        {before}
        <span style={{ background: '#1e3a8a', color: '#93c5fd', fontWeight: 700, borderRadius: '2px', padding: '0 2px' }}>
          {match}
        </span>
        {after}
      </>
    );
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '240px', minWidth: '160px' }}>
      <div style={css('display:flex;align-items:center;gap:8px;height:36px;padding:0 10px;border:1px solid #334155;background:#0f172a;border-radius:8px')}>
        <span style={{ display: 'flex', alignItems: 'center' }}><SearchIcon size={15} color="#94a3b8" /></span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search appointments…"
          value={inputVal}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              vm.setSearchQuery(inputVal);
              setOpen(false);
            }
          }}
          style={css("width:100%;border:none;outline:none;font-size:12.5px;font-family:'Archivo',sans-serif;color:#f8fafc;background:transparent;padding:0")}
        />
        {inputVal && (
          <button
            type="button"
            onClick={() => {
              setInputVal('');
              vm.setSearchQuery('');
            }}
            style={css('border:none;background:transparent;color:#94a3b8;cursor:pointer;font-size:12px;padding:0;display:flex;align-items:center')}
          >
            ✕
          </button>
        )}
      </div>

      {open && matches.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0, right: 0,
            marginTop: '4px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 120,
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          {matches.map((item: { label: string; category: string }, idx: number) => (
            <div
              key={item.label + '-' + idx}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(item.label);
              }}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontFamily: "'Archivo',sans-serif",
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                transition: 'background .1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {renderHighlightedText(item.label, q)}
              </span>
              <span style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: '9px',
                fontWeight: 600,
                color: '#60a5fa',
                background: '#172554',
                border: '1px solid #1d4ed8',
                padding: '1px 5px',
                borderRadius: '4px',
                flexShrink: 0,
              }}>
                {item.category}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Toolbar({ vm }: { vm: VM }) {
  const searchRef = useRef<HTMLInputElement>(null);
  return (
    <div style={vm.toolbarStyle}>
      {vm.isMobile && (
        <button onClick={vm.toggleSidebar} style={css('width:34px;height:34px;border:1px solid #334155;background:#0f172a;border-radius:8px;cursor:pointer;color:#f8fafc;font-size:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0')}>☰</button>
      )}
      <div style={css('display:flex;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:2px;gap:2px')}>
        <button onClick={vm.setWeekScale} style={vm.weekScaleStyle}>Week</button>
        <button onClick={vm.setMonthScale} style={vm.monthScaleStyle}>Month</button>
        <button onClick={vm.setYearScale} style={vm.yearScaleStyle}>Year</button>
      </div>
      {/* Standalone search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 } as React.CSSProperties}>
        {vm.isSearch ? (
          <SearchAutoComplete vm={vm} inputRef={searchRef} />
        ) : (
          <button
            onClick={() => { vm.setSearchScale(); setTimeout(() => searchRef.current?.focus(), 80); }}
            title="Search appointments"
            style={css("width:36px;height:36px;border:1px solid #334155;background:#0f172a;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0")}
          >
            <SearchIcon size={16} color="#94a3b8" />
          </button>
        )}
      </div>
      <div style={css('flex:1')} />
      {vm.showStats && (
        <div style={css('display:flex;align-items:center;gap:7px')}>
          <div style={css('display:flex;align-items:center;gap:6px;padding:5px 10px;background:#0f172a;border:1px solid #334155;border-radius:8px')}>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:13.5px;font-weight:600;color:#f8fafc")}>{vm.stats.assignments}</span><span style={css('font-size:10.5px;color:#94a3b8')}>appointments</span>
          </div>
          <div style={css('display:flex;align-items:center;gap:6px;padding:5px 10px;background:#172554;border:1px solid #1d4ed8;border-radius:8px')}>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:13.5px;font-weight:600;color:#60a5fa")}>
              {vm.isYear ? vm.stats.yearCustomers : vm.isMonth ? vm.stats.monthCustomers : vm.stats.weekCustomers}
            </span>
            <span style={css('font-size:10.5px;color:#93c5fd')}>
              {vm.isYear ? 'customers this year' : vm.isMonth ? 'customers this month' : 'customers this week'}
            </span>
          </div>
          <div style={css('display:flex;align-items:center;gap:6px;padding:5px 10px;background:#064e3b;border:1px solid #047857;border-radius:8px')}>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:13.5px;font-weight:600;color:#34d399")}>
              {vm.isYear ? vm.stats.yearInternals : vm.isMonth ? vm.stats.monthInternals : vm.stats.weekInternals}
            </span>
            <span style={css('font-size:10.5px;color:#6ee7b7')}>
              {vm.isYear ? 'internals this year' : vm.isMonth ? 'internals this month' : 'internals this week'}
            </span>
          </div>
        </div>
      )}
      <HButton onClick={vm.openCreate} style={css("background:#2563eb;color:#fff;border:none;border-radius:8px;padding:8px 13px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif;display:flex;align-items:center;gap:6px;flex-shrink:0")} hover={{ background: '#1d4ed8' }}>
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
    <div style={css('display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:0;min-width:100%;background:#0f172a;border-top:1px solid #334155')}>
      {vm.days.map((d: any, i: number) => {
        const holiday = d.holiday;
        const holStyle = holiday ? getHolidayStyle(holiday) : null;
        const bg = holStyle ? holStyle.bg : '#1e293b';
        const borderR = holStyle ? `1px solid ${holStyle.borderColor}` : '1px solid #334155';
        const borderB = holStyle ? `1px solid ${holStyle.borderColor}` : '1px solid #334155';

        return (
          <div key={i} style={css(`gridRow:1/-1;border-right:${borderR};border-bottom:${borderB};vertical-align:top;background:${bg};padding:6px 8px;${holiday ? 'cursor:default;' : ''}`)}>
            <div style={css('text-align:center;margin-bottom:6px')}>
              <div style={css(`font-size:12px;font-weight:700;color:${holStyle ? holStyle.textColor : '#94a3b8'};letter-spacing:.5px`)}>{d.label}</div>
              <div style={css(`font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:700;color:${holStyle ? holStyle.textColor : '#f8fafc'};margin-top:2px`)}>{d.date.split(' ').pop()}</div>
              {holiday && holStyle && holiday.name && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginTop: '4px',
                    lineHeight: '1.25',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                  }}
                  title={holiday.subtitle ? `${holiday.name}\n${holiday.subtitle}` : holiday.name}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: holStyle.textColor }}>
                    {holiday.name}
                  </div>
                  {holiday.subtitle && (
                    <div style={{ fontSize: '10.5px', fontWeight: 600, color: holStyle.textColor, marginTop: '2px', opacity: 0.9 }}>
                      {holiday.subtitle}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={css('display:flex;flex-direction:column;gap:2px')}>
              {vm.weekCalendarDays[i].chips.map((chip) => {
                const isInc = chip.isIncomplete;
                const chColors = chip.colors && chip.colors.length > 0 ? chip.colors : [chip.color];
                const barBg = isInc ? '#7f1d1d' : '#0f172a';
                const titleColor = isInc ? '#FFFFFF' : (chip.isInternal ? '#34d399' : '#60a5fa');
                const purposeColor = isInc ? '#fca5a5' : '#94a3b8';
                const accentBg = isInc ? '#ef4444' : getAccentBackground(chColors);

                return (
                  <div key={chip.id} onClick={chip.onClick} title={[chip.customer, chip.auditor2 || chip.purpose, chip.auditor2 ? '' : chip.auditor1].filter(Boolean).join(' - ')} style={{
                    display: 'flex', alignItems: 'stretch',
                    background: barBg, borderRadius: '6px',
                    border: isInc ? '1px solid #ef4444' : '1px solid #334155',
                    boxShadow: '0 1px 2px rgba(0,0,0,.2)',
                    cursor: 'pointer', overflow: 'hidden',
                  }}>
                    <div style={{ width: '3px', background: accentBg, flexShrink: 0, alignSelf: 'stretch' }} />
                    <div style={{ padding: '6px 8px', minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, color: titleColor }}>{renderApptCode(chip.customer, isInc ? '#FFFFFF' : undefined)}</div>
                      {chip.purpose ? (
                        <div style={{ fontSize: '10px', color: purposeColor, marginTop: '1px' }}>{chip.purpose}</div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {vm.weekCalendarDays[i].chips.length === 0 && vm.weekMergedSpans.every((s) => s.startDay > i || s.startDay + s.span <= i) && (
                isOfficialHoliday(holiday) ? (
                  <div style={css(`font-size:10px;color:${holStyle ? holStyle.textColor : '#64748b'};font-style:italic;padding:4px 0;text-align:center`)}>
                    Holiday
                  </div>
                ) : !holiday ? (
                  <div style={css('font-size:10px;color:#64748b;font-style:italic;padding:4px 0;text-align:center')}>
                    –
                  </div>
                ) : null
              )}
            </div>
          </div>
        );
      })}
      {vm.weekMergedSpans.map((sp) => {
        const isInc = sp.isIncomplete;
        const spColors = sp.colors && sp.colors.length > 0 ? sp.colors : [sp.color];
        const barBg = isInc ? '#7f1d1d' : '#0f172a';
        const titleColor = isInc ? '#FFFFFF' : (sp.isInternal ? '#34d399' : '#60a5fa');
        const purposeColor = isInc ? '#fca5a5' : '#94a3b8';
        const accentBg = isInc ? '#ef4444' : getAccentBackground(spColors);

        return (
          <div onClick={sp.onClick} title={[sp.customer, sp.auditor2 || sp.purpose, sp.auditor2 ? '' : sp.auditor1].filter(Boolean).join(' - ')} style={{
            gridColumn: `${sp.startDay + 1} / span ${sp.span}`,
            gridRow: `${sp.gridRow + 2}`,
            zIndex: 2,
            display: 'flex', alignItems: 'stretch',
            background: barBg, borderRadius: '6px',
            border: isInc ? '1px solid #ef4444' : '1px solid #334155',
            boxShadow: '0 1px 2px rgba(0,0,0,.2)',
            cursor: 'pointer', overflow: 'hidden',
            margin: '2px 0',
          }}>
            <div style={{ width: '3px', background: accentBg, flexShrink: 0, alignSelf: 'stretch' }} />
            <div style={{ padding: '6px 8px', minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: titleColor }}>{renderApptCode(sp.customer, isInc ? '#FFFFFF' : undefined)}</div>
              {sp.purpose ? (
                <div style={{ fontSize: '10px', color: purposeColor, marginTop: '1px' }}>{sp.purpose}</div>
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
      {vm.days.map((d: any, i: number) => {
        const holiday = d.holiday;
        const holStyle = holiday ? getHolidayStyle(holiday) : null;
        const bg = holStyle ? holStyle.bg : '#1e293b';
        const borderB = holStyle ? `1px solid ${holStyle.borderColor}` : '1px solid #334155';
        const borderR = holStyle ? `1px solid ${holStyle.borderColor}` : '1px solid #334155';
        const labelColor = holStyle ? holStyle.textColor : '#f8fafc';
        const dateColor = holStyle ? holStyle.textColor : '#94a3b8';

        return (
          <div
            key={i}
            style={css(
              `position:sticky;top:0;z-index:3;background:${bg};border-bottom:${borderB};border-right:${borderR};padding:10px 12px 9px;transition:background .15s ease;${
                holiday ? 'cursor:default;' : ''
              }`
            )}
            onMouseEnter={(e) => {
              if (holStyle) e.currentTarget.style.background = holStyle.hoverBg;
            }}
            onMouseLeave={(e) => {
              if (holStyle) e.currentTarget.style.background = holStyle.bg;
            }}
          >
            <div>
              <div style={css(`font-size:13px;font-weight:700;color:${labelColor};letter-spacing:.2px`)}>{d.label}</div>
              <div style={css(`font-family:'IBM Plex Mono',monospace;font-size:11px;color:${dateColor};margin-top:2px`)}>{d.date}</div>
              {holiday && holStyle && holiday.name && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    marginTop: '4px',
                    lineHeight: '1.25',
                    wordBreak: 'break-word',
                  }}
                  title={holiday.subtitle ? `${holiday.name}\n${holiday.subtitle}` : holiday.name}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: holStyle.textColor }}>
                    {holiday.name}
                  </div>
                  {holiday.subtitle && (
                    <div style={{ fontSize: '11px', fontWeight: 600, color: holStyle.textColor, marginTop: '2px', opacity: 0.9 }}>
                      {holiday.subtitle}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

function MobileSiteDept({ vm }: { vm: VM }) {
  return (
    <div style={css('padding:11px 11px 24px;display:flex;flex-direction:column;gap:10px')}>
      {vm.mobileSiteDeptRows.map((r, ri) => (
        <div key={ri} style={css('background:#1e293b;border:1px solid #334155;border-radius:12px;padding:12px 13px')}>
          <div style={css('display:flex;align-items:center;gap:9px;margin-bottom:10px')}>
            <div style={css('width:12px;height:12px;border-radius:3px;background:' + r.color + ';flex-shrink:0')} />
            <div>
              <div style={css('font-size:13px;font-weight:700;color:#f8fafc')}>{r.name}</div>
              <div style={css('font-size:10.5px;color:#94a3b8')}>{r.engCount + ' engineer' + (r.engCount > 1 ? 's' : '')}</div>
            </div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:6px')}>
            {r.cell.chips.map((chip) => (
              <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                <div style={chip.avatarStyle}>{chip.initials}</div>
                <div style={css('min-width:0;flex:1')}><div style={css('font-size:11.5px;font-weight:600;color:#f8fafc')}>{chip.name}</div><div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#cbd5e1")}>{chip.code}</div><div style={css('font-size:9.5px;color:#94a3b8')}>{chip.purpose}</div></div>
              </div>
            ))}
            {r.cell.chips.length === 0 && <div style={css('font-size:11px;color:#64748b;text-align:center;padding:8px 0;font-style:italic')}>No appointments</div>}
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
        <div key={r.engId} style={css('background:#1e293b;border:1px solid #334155;border-radius:12px;padding:12px 13px')}>
          <div onClick={r.onNameClick} style={css('display:flex;align-items:center;gap:10px;margin-bottom:10px;cursor:pointer')} title="View weekly timetable">
            <div style={r.avatarStyle}>{r.initials}</div>
            <div style={css('min-width:0;flex:1')}>
              <div style={css('font-size:13px;font-weight:600;color:#f8fafc')}>{r.name}</div>
              <div style={css('font-size:10.5px;color:#94a3b8')}>{r.department}{r.subDepartments.length > 0 ? ' - ' + r.subDepartments.join(', ') : ''}</div>
            </div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:6px')}>
            {r.cell.chips.map((chip) => (
              <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                <div style={css('display:flex;align-items:center;gap:6px')}>
                  <span style={css("font-family:'IBM Plex Mono',monospace;font-size:11.5px;font-weight:600;color:#f8fafc")}>{chip.code}</span>
                  <span style={css('flex:1')} />
                </div>
                <div style={css('font-size:10.5px;color:#94a3b8;margin-top:2px')}>{chip.purpose}</div>
              </div>
            ))}
            {r.cell.chips.length === 0 && (
              r.cell.isHoliday && r.cell.holiday ? (
                <div style={{ width: '100%', padding: '10px', border: '1px solid ' + (getHolidayStyle(r.cell.holiday).borderColor), background: getHolidayStyle(r.cell.holiday).bg, borderRadius: '9px', color: getHolidayStyle(r.cell.holiday).textColor, fontSize: '13.5px', fontWeight: 700, textAlign: 'center', cursor: 'default' }}>
                  {r.cell.holiday.name}{isOfficialHoliday(r.cell.holiday) ? ' (Holiday)' : ''}
                </div>
              ) : (
                <button onClick={r.cell.onHintClick} style={css("width:100%;padding:10px;border:1px dashed #475569;background:#0f172a;border-radius:9px;color:#cbd5e1;font-size:12px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer")}>＋ Assign appointment</button>
              )
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
        <div key={ri} style={css('background:#1e293b;border:1px solid #334155;border-radius:12px;padding:12px 13px')}>
          <div style={css('display:flex;align-items:center;gap:9px;margin-bottom:10px')}>
            <div><div style={css('font-size:13px;font-weight:700;color:#f8fafc')}>{r.name}</div><div style={css('font-size:10.5px;color:#94a3b8')}>{r.loc}</div></div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:6px')}>
            {r.cell.chips.map((chip) => (
              <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                <div style={chip.avatarStyle}>{chip.initials}</div>
                <div style={css('min-width:0;flex:1')}><div style={css('font-size:11.5px;font-weight:600;color:#f8fafc')}>{chip.name}</div><div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#cbd5e1")}>{chip.code}</div><div style={css('font-size:9.5px;color:#94a3b8')}>{chip.purpose}</div></div>
              </div>
            ))}
            {r.cell.empty && <div style={css('font-size:11px;color:#64748b;text-align:center;padding:8px 0;font-style:italic')}>No coverage scheduled</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthGrid({ vm }: { vm: VM }) {
  return (
    <div style={css('height:100%;display:flex;flex-direction:column')}>
      <div style={css('display:grid;grid-template-columns:repeat(7,1fr);border-top:1px solid #334155;border-left:1px solid #334155')}>
        {vm.monthWeekdayHeads.map((h, i) => (
          <div key={i} style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#94a3b8;letter-spacing:.5px;text-align:center;padding:7px 0;border-right:1px solid #334155")}>{h}</div>
        ))}
      </div>
      <div style={css('flex:1;display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:1fr;border-left:1px solid #334155;border-bottom:1px solid #334155')}>
        {vm.monthCells.map((c, i) =>
          c.blank ? (
            <div key={i} style={c.style} />
          ) : (
            <div
              key={i}
              onClick={c.onClick}
              style={c.style}
              onMouseEnter={(e) => {
                if (c.holiday) e.currentTarget.style.background = getHolidayStyle(c.holiday).hoverBg;
              }}
              onMouseLeave={(e) => {
                if (c.holiday) e.currentTarget.style.background = getHolidayStyle(c.holiday).bg;
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: '4px' }}>
                <span style={c.numStyle}>{c.dateNum}</span>
                {c.holiday && c.holiday.name && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      textAlign: 'right',
                      wordBreak: 'break-word',
                    }}
                    title={c.holiday.subtitle ? `${c.holiday.name}\n${c.holiday.subtitle}` : c.holiday.name}
                  >
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: getHolidayStyle(c.holiday).textColor,
                        lineHeight: '1.2',
                      }}
                    >
                      {c.holiday.name}
                    </span>
                    {c.holiday.subtitle && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: getHolidayStyle(c.holiday).textColor,
                          lineHeight: '1.2',
                          marginTop: '1px',
                          opacity: 0.9,
                        }}
                      >
                        {c.holiday.subtitle}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div style={css('display:flex;flex-direction:column;gap:3px;margin-top:2px')}>
                {(c.chips ?? []).map((ch, ci) => {
                  const isInc = ch.isIncomplete;
                  const chColors = ch.colors && ch.colors.length > 0 ? ch.colors : [ch.color || '#9aa097'];
                  const barBg = isInc ? '#7f1d1d' : '#0f172a';
                  const titleColor = isInc ? '#FFFFFF' : (ch.isInternal ? '#34d399' : '#60a5fa');
                  const purposeColor = isInc ? '#fca5a5' : '#94a3b8';
                  const accentBg = isInc ? '#ef4444' : getAccentBackground(chColors);

                  return (
                    <div
                      key={ci}
                      onClick={() => {
                        if (ch.onClick) ch.onClick();
                      }}
                      style={{
                        display: 'flex', alignItems: 'stretch',
                        background: barBg, borderRadius: '5px',
                        border: isInc ? '1px solid #ef4444' : '1px solid #334155',
                        boxShadow: '0 1px 2px rgba(0,0,0,.2)',
                        cursor: 'pointer',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ width: '3px', background: accentBg, flexShrink: 0, alignSelf: 'stretch' }} />
                      <div style={{ padding: '3px 5px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '10.5px', fontWeight: 600, color: titleColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{renderApptCode(ch.code, isInc ? '#FFFFFF' : undefined)}</div>
                        {ch.purpose ? (
                          <div style={{ fontSize: '9.5px', color: purposeColor, marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.purpose}</div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {(c.more ?? 0) > 0 && <span style={css('font-size:10px;color:#60a5fa;font-weight:600')}>{c.moreTxt}</span>}
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
      <div style={css('display:grid;grid-template-columns:repeat(7,1fr);border-top:1px solid #334155;border-left:1px solid #334155')}>
        {vm.monthWeekdayHeads.map((h, i) => (
          <div key={i} style={css("font-family:'IBM Plex Mono',monospace;font-size:8.5px;font-weight:600;color:#94a3b8;text-align:center;padding:5px 0;border-right:1px solid #334155")}>{h}</div>
        ))}
      </div>
      <div style={css('flex:1;display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:1fr;border-left:1px solid #334155;border-bottom:1px solid #334155')}>
        {vm.monthCells.map((c, i) =>
          c.blank ? (
            <div key={i} style={c.style} />
          ) : (
            <div
              key={i}
              onClick={c.onClick}
              style={c.style}
              onMouseEnter={(e) => {
                if (c.holiday) e.currentTarget.style.background = getHolidayStyle(c.holiday).hoverBg;
              }}
              onMouseLeave={(e) => {
                if (c.holiday) e.currentTarget.style.background = getHolidayStyle(c.holiday).bg;
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: '2px' }}>
                <span style={c.numStyle}>{c.dateNum}</span>
                {c.holiday && c.holiday.name && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      textAlign: 'right',
                      wordBreak: 'break-word',
                    }}
                    title={c.holiday.subtitle ? `${c.holiday.name}\n${c.holiday.subtitle}` : c.holiday.name}
                  >
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: getHolidayStyle(c.holiday).textColor,
                        lineHeight: '1.15',
                      }}
                    >
                      {c.holiday.name}
                    </span>
                    {c.holiday.subtitle && (
                      <span
                        style={{
                          fontSize: '8px',
                          fontWeight: 600,
                          color: getHolidayStyle(c.holiday).textColor,
                          lineHeight: '1.15',
                          marginTop: '1px',
                          opacity: 0.9,
                        }}
                      >
                        {c.holiday.subtitle}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div style={css('display:flex;flex-direction:column;gap:2px;margin-top:1px')}>
                {(c.chips ?? []).map((ch, ci) => {
                  const isInc = ch.isIncomplete;
                  const chColors = ch.colors && ch.colors.length > 0 ? ch.colors : [ch.color || '#9aa097'];
                  const barBg = isInc ? '#7f1d1d' : '#0f172a';
                  const titleColor = isInc ? '#FFFFFF' : (ch.isInternal ? '#34d399' : '#60a5fa');
                  const purposeColor = isInc ? '#fca5a5' : '#94a3b8';
                  const accentBg = isInc ? '#ef4444' : getAccentBackground(chColors);

                  return (
                    <div
                      key={ci}
                      onClick={() => {
                        if (ch.onClick) ch.onClick();
                      }}
                      style={{
                        display: 'flex', alignItems: 'stretch',
                        background: barBg, borderRadius: '3px',
                        border: isInc ? '1px solid #ef4444' : '1px solid #334155',
                        cursor: 'pointer',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ width: '2px', background: accentBg, flexShrink: 0, alignSelf: 'stretch' }} />
                      <div style={{ padding: '2px 4px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '8px', fontWeight: 600, color: titleColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{renderApptCode(ch.code, isInc ? '#FFFFFF' : undefined)}</div>
                        {ch.purpose ? (
                          <div style={{ fontSize: '7.5px', color: purposeColor, marginTop: '0.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.purpose}</div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {(c.more ?? 0) > 0 && <span style={css('font-size:8px;color:#60a5fa;font-weight:600')}>{c.moreTxt}</span>}
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
      <div style={css('display:flex;align-items:center;justify-content:space-between;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:14px 18px;box-shadow:0 2px 8px rgba(0,0,0,.2);flex-wrap:wrap;gap:12px')}>
        <div>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#60a5fa;letter-spacing:.6px")}>
            YEAR OVERVIEW · {vm.yearYear}
          </div>
          <div style={css('font-size:13px;font-weight:600;color:#94a3b8;margin-top:2px')}>
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
                `background:#1e293b;border:1px solid ${isCurrentMonth ? '#3b82f6' : '#334155'};border-radius:12px;padding:14px;cursor:pointer;transition:all .15s ease;display:flex;flex-direction:column;gap:10px;box-shadow:${
                  isCurrentMonth ? '0 4px 14px rgba(59,130,246,.25)' : '0 2px 6px rgba(0,0,0,.2)'
                }`
              )}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isCurrentMonth ? '#3b82f6' : '#334155';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = isCurrentMonth ? '0 4px 14px rgba(59,130,246,.25)' : '0 2px 6px rgba(0,0,0,.2)';
              }}
            >
              {/* Card Month Title & Pill Badge */}
              <div style={css('display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #334155;padding-bottom:8px')}>
                <div style={css('display:flex;align-items:center;gap:6px')}>
                  <span style={css(`font-size:14px;font-weight:700;color:${isCurrentMonth ? '#60a5fa' : '#f8fafc'}`)}>
                    {m.monthName}
                  </span>
                  {isCurrentMonth && (
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;background:#172554;color:#60a5fa;border:1px solid #1d4ed8;padding:1px 5px;border-radius:4px")}>
                      NOW
                    </span>
                  )}
                </div>
                <span
                  style={css(
                    `font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;padding:2px 7px;border-radius:12px;${
                      m.totalAppts > 0
                        ? 'background:#4c1d95;color:#c084fc;border:1px solid #6d28d9;'
                        : 'background:#0f172a;color:#94a3b8;border:1px solid #334155;'
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
                        idx >= 5 ? 'color:#64748b;' : 'color:#94a3b8;'
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

                  let bg = '#0f172a';
                  let border = '1px solid #334155';
                  let textColor = '#cbd5e1';

                  if (d.holiday) {
                    const hs = getHolidayStyle(d.holiday);
                    bg = hs.bg;
                    border = `1px solid ${hs.borderColor}`;
                    textColor = hs.textColor;
                  } else if (d.isWeekend) {
                    bg = '#0f172a';
                    textColor = '#64748b';
                    border = '1px solid #1e293b';
                  } else if (d.hasAppts) {
                    textColor = '#ffffff';
                    if (d.customerApptsCount > 0 && d.internalApptsCount > 0) {
                      bg = 'linear-gradient(135deg, #1e3a8a 50%, #064e3b 50%)';
                      border = '1px solid #3b82f6';
                    } else if (d.customerApptsCount > 0) {
                      bg = '#1e3a8a';
                      border = '1px solid #3b82f6';
                    } else {
                      bg = '#064e3b';
                      border = '1px solid #10b981';
                    }
                  }

                  return (
                    <div
                      key={d.dateISO}
                      title={
                        d.holiday
                          ? `${d.dayNum} ${m.monthName}: ${d.holiday.name}${d.hasAppts ? ` (${d.totalApptsCount} appts)` : ''}`
                          : d.hasAppts
                          ? `${d.dayNum} ${m.monthName}: ${d.totalApptsCount} appointments (${d.customerApptsCount} CS, ${d.internalApptsCount} IA)`
                          : `${d.dayNum} ${m.monthName}`
                      }
                      style={css(
                        `height:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:4px;font-size:10px;font-family:'Archivo',sans-serif;font-weight:${
                          d.hasAppts || d.isToday ? '700' : '500'
                        };position:relative;${
                          d.isToday ? 'outline:2px solid #3b82f6;outline-offset:-1px;' : ''
                        };background:${bg};color:${textColor};border:${border};cursor:${d.holiday || d.isWeekend ? 'default' : 'pointer'}`
                      )}
                    >
                      <span>{d.dayNum}</span>
                    </div>
                  );
                })}
              </div>

              {/* Card Footer / Quick Action */}
              <div style={css('display:flex;align-items:center;justify-content:space-between;border-top:1px solid #334155;padding-top:8px;margin-top:2px')}>
                <div style={css('display:flex;align-items:center;gap:5px')}>
                  {m.customerAppts > 0 || m.internalAppts > 0 ? (
                    <>
                      <div style={css('display:flex;align-items:center;gap:4px;padding:3px 7px;background:#172554;border:1px solid #1d4ed8;border-radius:6px')}>
                        <span style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#60a5fa")}>{m.customerAppts}</span>
                        <span style={css('font-size:9.5px;color:#93c5fd')}>CS</span>
                      </div>
                      <div style={css('display:flex;align-items:center;gap:4px;padding:3px 7px;background:#064e3b;border:1px solid #047857;border-radius:6px')}>
                        <span style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#34d399")}>{m.internalAppts}</span>
                        <span style={css('font-size:9.5px;color:#6ee7b7')}>IA</span>
                      </div>
                    </>
                  ) : (
                    <span style={css('font-size:10px;color:#64748b')}>No scheduled audits</span>
                  )}
                </div>
                <span style={css("font-family:'Archivo',sans-serif;font-size:11px;font-weight:700;color:#60a5fa;display:flex;align-items:center;gap:3px")}>
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
