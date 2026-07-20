import { Fragment, useEffect, useRef, useState } from 'react';
import type { VM } from '../useScheduler';
import { css, HButton } from '../ui';
import { DetailPanel } from './DetailPanel';

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

          {vm.emptyWeek && (
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

      {vm.dayDialogOpen && (
        <div onClick={vm.closeDayDialog} style={vm.modalOverlayStyle}>
          <div onClick={vm.stop} style={css('position:relative;background:#fff;border-radius:14px;width:100%;max-width:480px;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.18);margin:20px')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #e7eae3')}>
              <div style={css('display:flex;align-items:center;gap:10px')}>
                <span style={css('font-size:15px;font-weight:700;color:#23282a')}>{vm.dayDialogInfo?.label}</span>
                <span style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;color:#9aa097")}>{vm.dayDialogDate}</span>
              </div>
              <button onClick={vm.closeDayDialog} style={css('width:30px;height:30px;border:1px solid #e2e5de;background:#fff;border-radius:7px;cursor:pointer;color:#6a706a;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0')}>✕</button>
            </div>
            <div className="scrl" style={css('flex:1;overflow:auto;padding:12px 16px')}>
              {vm.dayDialogChips.length === 0 ? (
                <div style={css('text-align:center;padding:24px 0;color:#9aa097;font-size:12px;font-style:italic')}>No appointments this day</div>
              ) : (
                <div style={css('display:flex;flex-direction:column;gap:6px')}>
                  {vm.dayDialogChips.map((chip) => (
                    <div key={chip.id} style={css('display:flex;align-items:center;gap:9px;padding:9px 11px;background:#fff;border:1px solid #e4e7e0;border-left:3px solid ' + chip.color + ';border-radius:7px')}>
                      <div style={css('min-width:0;flex:1')}>
                        <div style={css('font-size:12px;font-weight:600;color:#23282a')}>{chip.code}</div>
                        <div style={css('display:flex;gap:8px;margin-top:2px')}>
                          <span style={css('font-size:10.5px;color:#5c625c')}>{chip.purpose}</span>
                          <span style={css('font-size:10.5px;color:#9aa097')}>{chip.engName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {vm.showTimetable && (
        <div onClick={vm.closeTimetable} style={vm.modalOverlayStyle}>
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
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;color:#15191e")}>{chip.code}</span>
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
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:11.5px;font-weight:600;color:#15191e")}>{chip.code}</span>
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
      </div>
      <div style={css('flex:1')} />
      {vm.showStats && (
        <div style={css('display:flex;align-items:center;gap:7px')}>
          <div style={css('display:flex;align-items:center;gap:6px;padding:5px 10px;background:#f6f7f4;border:1px solid #e4e7e0;border-radius:8px')}>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:13.5px;font-weight:600")}>{vm.stats.assignments}</span><span style={css('font-size:10.5px;color:#7a8079')}>appointments</span>
          </div>
          <div style={css('display:flex;align-items:center;gap:6px;padding:5px 10px;background:#eef3ea;border:1px solid #c7d8bf;border-radius:8px')}>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:13.5px;font-weight:600;color:#3d7840")}>{vm.isMonth ? vm.stats.monthInternals : vm.stats.weekInternals}</span><span style={css('font-size:10.5px;color:#477349')}>{vm.isMonth ? 'internals this month' : 'internals this week'}</span>
          </div>
          <div style={css('display:flex;align-items:center;gap:6px;padding:5px 10px;background:#f0f4fa;border:1px solid #d4def0;border-radius:8px')}>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:13.5px;font-weight:600;color:#3a6bc4")}>{vm.isMonth ? vm.stats.monthCustomers : vm.stats.weekCustomers}</span><span style={css('font-size:10.5px;color:#6a7da8')}>{vm.isMonth ? 'customers this month' : 'customers this week'}</span>
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
            {vm.weekCalendarDays[i].chips.map((chip) => (
              <div key={chip.id} onClick={chip.onClick} title={chip.customer + (chip.purpose ? ' - ' + chip.purpose : '')} style={{
            background: '#f0f2ec', borderRadius: '6px', padding: '6px 8px',
            borderLeft: '3px solid ' + chip.color,
            boxShadow: '0 1px 2px rgba(0,0,0,.06)',
            cursor: 'pointer', overflow: 'hidden',
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#23282a' }}>{chip.customer}</div>
                {chip.purpose && <div style={{ fontSize: '10px', color: '#5c625c', marginTop: '1px' }}>{chip.purpose}</div>}
                {(chip as any).auditor2 && <div style={{ fontSize: '10px', color: '#9aa097', marginTop: '1px' }}>{(chip as any).auditor2}</div>}
              </div>
            ))}
            {vm.weekCalendarDays[i].chips.length === 0 && vm.weekMergedSpans.every((s) => s.startDay > i || s.startDay + s.span <= i) && (
              <div style={css('font-size:10px;color:#bcc1b8;font-style:italic;padding:4px 0')}>–</div>
            )}
          </div>
        </div>
      ))}
      {vm.weekMergedSpans.map((sp) => (
        <div key={sp.id} onClick={sp.onClick} title={sp.customer + (sp.purpose ? ' - ' + sp.purpose : '')} style={{
          gridColumn: `${sp.startDay + 1} / span ${sp.span}`,
          gridRow: `${sp.gridRow + 2}`,
          zIndex: 2,
          background: '#f0f2ec', borderRadius: '6px', padding: '6px 8px',
          borderLeft: '3px solid ' + sp.color,
          boxShadow: '0 1px 2px rgba(0,0,0,.06)',
          cursor: 'pointer', overflow: 'hidden',
          margin: '2px 0',
        }}>
          <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#23282a' }}>{sp.customer}</div>
          {sp.purpose && <div style={{ fontSize: '10px', color: '#5c625c', marginTop: '1px' }}>{sp.purpose}</div>}
          {(sp as any).auditor2 && <div style={{ fontSize: '10px', color: '#9aa097', marginTop: '1px' }}>{(sp as any).auditor2}</div>}
        </div>
      ))}
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
              <div style={css('display:flex;flex-direction:column;gap:2px;margin-top:2px')}>
                {(c.chips ?? []).map((ch, ci) => (
                  <div key={ci} style={css('display:flex;align-items:center;gap:4px;overflow:hidden')}>
                    <span style={ch.dotStyle} />
                    <span style={css('font-size:10.5px;color:#23282a;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{ch.code}</span>
                  </div>
                ))}
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
              <div style={css('display:flex;flex-direction:column;gap:1px;margin-top:1px')}>
                {(c.chips ?? []).map((ch, ci) => (
                  <div key={ci} style={css('display:flex;align-items:center;gap:3px;overflow:hidden')}>
                    <span style={ch.dotStyle} />
                    <span style={css('font-size:8px;color:#23282a;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{ch.code}</span>
                  </div>
                ))}
                {(c.more ?? 0) > 0 && <span style={css('font-size:8px;color:#5b7fd6;font-weight:600')}>{c.moreTxt}</span>}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
