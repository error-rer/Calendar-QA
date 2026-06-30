import { Fragment } from 'react';
import type { VM } from '../useScheduler';
import { css, HButton, HDiv } from '../ui';
import { DetailPanel } from './DetailPanel';

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
          {vm.gridPerson && <PersonGrid vm={vm} />}
          {vm.gridPlant && <SiteGrid vm={vm} />}
          {vm.gridCustomer && <CustomerGrid vm={vm} />}
          {vm.mobilePerson && <MobilePerson vm={vm} />}
          {vm.mobileSite && <MobileSite vm={vm} />}
          {vm.mobileCustomer && <MobileCustomer vm={vm} />}
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
        <div style={css('display:flex;flex-direction:column;gap:8px')}>
          <div>
            <div style={css('font-size:10px;color:#9aa097;margin-bottom:4px;font-weight:600')}>Employee</div>
            <select value={vm.filterEmp} onChange={vm.onFilterEmp} style={vm.selStyle}>
              {vm.employeeOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>

          <div>
            <div style={css('font-size:10px;color:#9aa097;margin-bottom:4px;font-weight:600')}>Department</div>
            <select value={vm.filterAuditTopic} onChange={vm.onFilterAuditTopic} style={vm.selStyle}>
              <option value="">All departments</option>
              <optgroup label="Customer">
                {vm.customerTopicOptions.map((o) => (<option key={o} value={o}>{o}</option>))}
              </optgroup>
              <optgroup label="Internal Audit">
                {vm.internalTopicOptions.map((o) => (<option key={o} value={o}>{o}</option>))}
              </optgroup>
            </select>
          </div>

          <div>
            <div style={css('font-size:10px;color:#9aa097;margin-bottom:4px;font-weight:600')}>Site</div>
            <select value={vm.filterSite} onChange={vm.onFilterSite} style={vm.selStyle}>
              {vm.siteOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>

          <div>
            <div style={css('font-size:10px;color:#9aa097;margin-bottom:4px;font-weight:600')}>Company</div>
            <select value={vm.filterCompany} onChange={vm.onFilterCompany} style={vm.selStyle}>
              <option value="">All companies</option>
              {vm.companyNames.map((o) => (<option key={o} value={o}>{o}</option>))}
            </select>
          </div>

          <div>
            <div style={css('font-size:10px;color:#9aa097;margin-bottom:4px;font-weight:600')}>Purpose</div>
            <select value={vm.filterAuditType} onChange={vm.onFilterAuditType} style={vm.selStyle}>
              <option value="">All purposes</option>
              {vm.auditTypes.map((o) => (<option key={o} value={o}>{o}</option>))}
            </select>
          </div>
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
              {cell.empty && <div style={css('font-size:10.5px;color:#bcc1b8;text-align:center;padding:8px 0')}>—</div>}
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
      {vm.showViewTabs && (
        <div style={css('display:flex;background:#f1f3ee;border:1px solid #e0e3dc;border-radius:8px;padding:2px;gap:2px')}>
          <button onClick={vm.setPerson} style={vm.personTabStyle}>By QA</button>
          <button onClick={vm.setPlant} style={vm.plantTabStyle}>By Department</button>
          <button onClick={vm.setCustomer} style={vm.customerTabStyle}>By Company</button>
        </div>
      )}
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

function DayHeaders({ vm }: { vm: VM }) {
  return (
    <>
      {vm.days.map((d, i) => (
        <div key={i} style={css('position:sticky;top:0;z-index:3;background:#f3f5ef;border-bottom:1px solid #d8dcd4;border-right:1px solid #e2e5de;padding:9px 12px 8px')}>
          <div>
            <div style={css('font-size:12px;font-weight:700;color:#23282a;letter-spacing:.2px')}>{d.label}</div>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;color:#8a9088;margin-top:1px")}>{d.date}</div>
          </div>
        </div>
      ))}
    </>
  );
}

function CornerHeader({ label }: { label: string }) {
  return (
    <div style={css('position:sticky;top:0;left:0;z-index:4;background:#f3f5ef;border-bottom:1px solid #d8dcd4;border-right:1px solid #e2e5de;padding:10px 14px;display:flex;align-items:flex-end')}>
      <span style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#9aa097;letter-spacing:.5px")}>{label}</span>
    </div>
  );
}

function PersonGrid({ vm }: { vm: VM }) {
  return (
    <div style={{ ...gridBase, gridTemplateColumns: vm.gridCols }}>
      <CornerHeader label="QA" />
      <DayHeaders vm={vm} />
      {vm.personRows.map((r) => (
        <Fragment key={r.engId}>
          <div onClick={r.onNameClick} style={r.nameCellStyle} title="View weekly timetable">
            <div style={css('display:flex;align-items:center;gap:9px')}>
              <div style={r.avatarStyle}>{r.initials}</div>
              <div style={css('min-width:0')}>
                <div style={css('font-size:12.5px;font-weight:600;color:#23282a;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{r.name}</div>
                <div style={css('font-size:10px;color:#8a9088;line-height:1.2')}>{r.department}{r.subDepartments.length > 0 ? ' — ' + r.subDepartments.join(', ') : ''}</div>
              </div>
            </div>
            </div>
          {r.cells.map((cell) => (
            <div key={cell.cellId} onDragOver={cell.onDragOver} onDragLeave={cell.onDragLeave} onDrop={cell.onDrop} style={cell.style}>
              {cell.chips.map((chip) => (
                <div key={chip.aid} draggable onClick={chip.onClick} onDragStart={chip.onDragStart} onDragEnd={chip.onDragEnd} style={chip.style}>
                  <div style={css('display:flex;align-items:center;gap:6px')}>
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;color:#15191e")}>{chip.code}</span>
                    <span style={css('flex:1')} />
                  </div>
                  <div style={css('font-size:10.5px;color:#5c625c;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{chip.purpose}</div>
                </div>
              ))}
              {cell.empty && (
                <HDiv onClick={cell.onHintClick} title="Assign an appointment here" style={cell.hintStyle} hover={{ background: '#eef2fd', borderColor: '#9bb0e8', color: '#5b7fd6' }}>＋</HDiv>
              )}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

function SiteGrid({ vm }: { vm: VM }) {
  return (
    <div style={{ ...gridBase, gridTemplateColumns: vm.gridCols }}>
      <CornerHeader label="INTERNAL" />
      <DayHeaders vm={vm} />
      {vm.plantRows.map((r, ri) => (
        <Fragment key={ri}>
            <div style={css('border-bottom:1px solid #e2e5de;border-right:1px solid #e2e5de;padding:12px 14px;background:#fff;position:sticky;left:0;z-index:2')}>
            <div style={css('display:flex;align-items:center;gap:9px')}>
              <div>
                <div style={css('font-size:12.5px;font-weight:700;color:#23282a')}>{r.name}</div>
                <div style={css('font-size:10px;color:#8a9088')}>{r.loc}</div>
              </div>
            </div>
          </div>
          {r.cells.map((cell, ci) => (
            <div key={ci} style={cell.style}>
              {cell.chips.map((chip) => (
                <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                  <div style={chip.avatarStyle}>{chip.initials}</div>
                  <div style={css('min-width:0;flex:1')}>
                    <div style={css('font-size:11px;font-weight:600;color:#23282a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{chip.name}</div>
                    <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#7a807a")}>{chip.code}</div>
                    <div style={css('font-size:9.5px;color:#a6aca2')}>{chip.purpose}</div>
                  </div>
                </div>
              ))}
              {cell.empty && <div style={css('font-size:10.5px;color:#bcc1b8;text-align:center;padding:8px 0')}>—</div>}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

function CustomerGrid({ vm }: { vm: VM }) {
  return (
    <div style={{ ...gridBase, gridTemplateColumns: vm.gridCols }}>
      <CornerHeader label="CUSTOMER" />
      <DayHeaders vm={vm} />
      {vm.customerRows.map((r, ri) => (
        <Fragment key={ri}>
          <div style={css('border-bottom:1px solid #e2e5de;border-right:1px solid #e2e5de;padding:12px 14px;background:#fff;position:sticky;left:0;z-index:2')}>
            <div style={css('display:flex;align-items:center;gap:9px')}>
              <div>
                <div style={css('font-size:12.5px;font-weight:700;color:#23282a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{r.name}</div>
                <div style={css('font-size:10px;color:#8a9088')}>{r.sub}</div>
              </div>
            </div>
          </div>
          {r.cells.map((cell, ci) => (
            <div key={ci} style={cell.style}>
              {cell.chips.map((chip) => (
                <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                  <div style={chip.avatarStyle}>{chip.initials}</div>
                  <div style={css('min-width:0;flex:1')}>
                    <div style={css('font-size:11px;font-weight:600;color:#23282a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{chip.name}</div>
                    <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#7a807a")}>{chip.code}</div>
                    <div style={css('font-size:9.5px;color:#a6aca2')}>{chip.purpose}</div>
                  </div>
                </div>
              ))}
              {cell.empty && <div style={css('font-size:10.5px;color:#bcc1b8;text-align:center;padding:8px 0')}>—</div>}
            </div>
          ))}
        </Fragment>
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
              <div style={css('font-size:10.5px;color:#8a9088')}>{r.department}{r.subDepartments.length > 0 ? ' — ' + r.subDepartments.join(', ') : ''}</div>
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

function MobileCustomer({ vm }: { vm: VM }) {
  return (
    <div style={css('padding:11px 11px 24px;display:flex;flex-direction:column;gap:10px')}>
      {vm.mobileCustomerRows.map((r, ri) => (
        <div key={ri} style={css('background:#fff;border:1px solid #e4e7e0;border-radius:12px;padding:12px 13px')}>
          <div style={css('display:flex;align-items:center;gap:9px;margin-bottom:10px')}>
            <div><div style={css('font-size:13px;font-weight:700;color:#23282a')}>{r.name}</div><div style={css('font-size:10.5px;color:#8a9088')}>{r.sub}</div></div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:6px')}>
            {r.cell.chips.map((chip) => (
              <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                <div style={chip.avatarStyle}>{chip.initials}</div>
                <div style={css('min-width:0;flex:1')}><div style={css('font-size:11.5px;font-weight:600;color:#23282a')}>{chip.name}</div><div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#7a807a")}>{chip.code}</div><div style={css('font-size:9.5px;color:#a6aca2')}>{chip.purpose}</div></div>
              </div>
            ))}
            {r.cell.empty && <div style={css('font-size:11px;color:#a6aca2;text-align:center;padding:8px 0;font-style:italic')}>No work scheduled</div>}
          </div>
        </div>
      ))}
    </div>
  );
}


function MonthGrid({ vm }: { vm: VM }) {
  return (
    <div style={css('padding:18px 20px 40px;max-width:1180px;margin:0 auto')}>
      <div style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:7px;margin-bottom:7px')}>
        {vm.monthWeekdayHeads.map((h, i) => (
          <div key={i} style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#9aa097;letter-spacing:.5px;text-align:center;padding:2px 0")}>{h}</div>
        ))}
      </div>
      <div style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:7px')}>
        {vm.monthCells.map((c, i) =>
          c.blank ? (
            <div key={i} style={c.style} />
          ) : (
            <div key={i} onClick={c.onClick} style={c.style}>
              <div style={css('display:flex;align-items:center;justify-content:space-between')}>
                <span style={c.numStyle}>{c.dateNum}</span>
                <span style={c.countDotStyle}>{c.countTxt}</span>
              </div>
              <div style={css('display:flex;flex-direction:column;gap:3px')}>
                {(c.chips ?? []).map((ch, ci) => (
                  <div key={ci} style={ch.style}>
                    <span style={ch.dotStyle} />
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;color:#23282a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{ch.code}</span>
                    <span style={css('font-size:8px;color:#7a807a;margin-left:2px')}>{ch.engName}</span>
                    <span style={css('flex:1')} />
                    <span style={css('font-size:8px;color:#9aa097')}>{ch.purpose}</span>
                  </div>
                ))}
                {(c.more ?? 0) > 0 && <span style={css('font-size:9.5px;color:#9aa097;padding-left:2px')}>{c.moreTxt}</span>}
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
    <div style={css('padding:12px 11px 30px')}>
      <div style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px')}>
        {vm.monthWeekdayHeads.map((h, i) => (
          <div key={i} style={css("font-family:'IBM Plex Mono',monospace;font-size:8.5px;font-weight:600;color:#9aa097;text-align:center")}>{h}</div>
        ))}
      </div>
      <div style={css('display:grid;grid-template-columns:repeat(7,1fr);gap:4px')}>
        {vm.monthCells.map((c, i) =>
          c.blank ? (
            <div key={i} style={c.style} />
          ) : (
            <div key={i} onClick={c.onClick} style={c.style}>
              <div style={css('display:flex;align-items:center;justify-content:space-between')}>
                <span style={c.numStyle}>{c.dateNum}</span>
                <span style={c.countDotStyle}>{c.countTxt}</span>
              </div>
              <div style={css('display:flex;flex-direction:column;gap:2px')}>
                {(c.chips ?? []).map((ch, ci) => (
                  <div key={ci} style={ch.style}>
                    <span style={ch.dotStyle} />
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:600;color:#23282a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{ch.code}</span>
                    <span style={css('font-size:7px;color:#9aa097')}>{ch.purpose}</span>
                  </div>
                ))}
                {(c.more ?? 0) > 0 && <span style={css('font-size:8px;color:#9aa097;padding-left:2px')}>{c.moreTxt}</span>}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
