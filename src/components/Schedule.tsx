import { Fragment, type CSSProperties } from 'react';
import type { VM } from '../useScheduler';
import { css, HButton, HDiv } from '../ui';
import { DetailPanel } from './DetailPanel';

interface LeaveTagInfo {
  label: string;
  note: string;
  style: CSSProperties;
  onRemove: () => void;
}

function MobileAway({ vm }: { vm: VM }) {
  return (
    <div style={css('margin:11px 11px 0;background:#fff;border:1px solid #e4e7e0;border-radius:12px;padding:11px 12px')}>
      <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#9aa097;letter-spacing:.5px;margin-bottom:9px")}>
        ☾ AWAY · {vm.awayLabel.toUpperCase()} <span style={css('color:#c2c7bd')}>· {vm.awayToday.length}</span>
      </div>
      <div style={css('display:flex;flex-wrap:wrap;gap:7px')}>
        {vm.awayToday.map((a) => (
          <HDiv key={a.engId} onClick={a.onRemove} title={(a.note ? a.note + ' · ' : '') + 'Tap to clear'} style={a.pillStyle} hover={{ filter: 'brightness(.98)' }}>
            <div style={a.avatarStyle}>{a.initials}</div>
            <span style={css('font-size:11.5px;font-weight:600')}>{a.name}</span>
            <span style={a.typeStyle}>{a.type}</span>
            <span style={css('opacity:.5;font-size:11px')}>×</span>
          </HDiv>
        ))}
      </div>
    </div>
  );
}

function LeaveTag({ tag }: { tag: LeaveTagInfo }) {
  return (
    <HDiv
      onClick={tag.onRemove}
      title={(tag.note ? tag.note + ' · ' : '') + 'Click to clear'}
      style={tag.style}
      hover={{ filter: 'brightness(.97)' }}
    >
      <span style={css('font-size:11px;line-height:1')}>☾</span>
      <span style={css('flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{tag.label}</span>
      <span style={css('opacity:.6;font-size:11px')}>×</span>
    </HDiv>
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
          {vm.showAway && <MobileAway vm={vm} />}
          {vm.gridPerson && <PersonGrid vm={vm} />}
          {vm.gridPlant && <SiteGrid vm={vm} />}
          {vm.gridCustomer && <CustomerGrid vm={vm} />}
          {vm.gridSubdept && <SubDeptGrid vm={vm} />}
          {vm.mobilePerson && <MobilePerson vm={vm} />}
          {vm.mobileSite && <MobileSite vm={vm} />}
          {vm.mobileCustomer && <MobileCustomer vm={vm} />}
          {vm.mobileSubdept && <MobileSubDept vm={vm} />}
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
            <div style={css('font-size:10px;color:#9aa097;margin-bottom:4px;font-weight:600')}>Customer</div>
            <select value={vm.filterCust} onChange={vm.onFilterCust} style={vm.selStyle}>
              {vm.customerOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
          <div>
            <div style={css('font-size:10px;color:#9aa097;margin-bottom:4px;font-weight:600')}>Internal</div>
            <select value={vm.filterPlant} onChange={vm.onFilterPlant} style={vm.selStyle}>
              {vm.plantOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
          <div>
            <div style={css('font-size:10px;color:#9aa097;margin-bottom:4px;font-weight:600')}>Sub-department</div>
            <select value={vm.filterSubdept} onChange={vm.onFilterSubdept} style={vm.selStyle}>
              {vm.subDeptOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </div>
        </div>
      </div>

      <div style={css('padding:13px 15px 6px;flex-shrink:0')}>
        <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:9px')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;color:#9aa097;letter-spacing:.6px")}>UNSTAFFED ORDERS</div>
          <span style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;color:#a96e08;background:#fff3df;border:1px solid #f1dcb0;border-radius:20px;padding:1px 7px")}>{vm.poolCount}</span>
        </div>
      </div>
      <div className="scrl" style={css('padding:0 15px;overflow-y:auto;flex-shrink:0;max-height:202px')}>
        <div style={css('display:flex;flex-direction:column;gap:7px;padding-bottom:4px')}>
          {vm.pool.map((o) => (
            <div key={o.orderId} draggable onDragStart={o.onDragStart} onDragEnd={o.onDragEnd} style={o.tileStyle}>
              <div style={css('display:flex;align-items:center;gap:7px;margin-bottom:5px')}>
                <span style={o.dotStyle} />
                <span style={css("font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;color:#15191e")}>{o.code}</span>
                <span style={o.priorityStyle}>{o.priority}</span>
                <span style={css('flex:1')} />
                <span style={css("font-size:9.5px;color:#aab0a6;font-family:'IBM Plex Mono',monospace")}>{o.plantCode}</span>
              </div>
              <div style={css('font-size:11.5px;color:#3c423d;font-weight:500;line-height:1.25')}>{o.product}</div>
              <div style={css('font-size:10.5px;color:#8a9088;margin-top:1px')}>{o.customer}</div>
            </div>
          ))}
          {vm.poolEmpty && (
            <div style={css('font-size:11px;color:#9aa097;text-align:center;padding:14px 0;font-style:italic')}>All orders staffed ✓</div>
          )}
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
          <button onClick={vm.setPlant} style={vm.plantTabStyle}>By internal</button>
          <button onClick={vm.setCustomer} style={vm.customerTabStyle}>By customer</button>
          <button onClick={vm.setSubdept} style={vm.subdeptTabStyle}>By sub-department</button>
        </div>
      )}
      <div style={css('flex:1')} />
      {vm.showStats && (
        <div style={css('display:flex;align-items:center;gap:7px')}>
          <div style={css('display:flex;align-items:center;gap:6px;padding:5px 10px;background:#f6f7f4;border:1px solid #e4e7e0;border-radius:8px')}>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:13.5px;font-weight:600")}>{vm.stats.assignments}</span><span style={css('font-size:10.5px;color:#7a8079')}>appointments</span>
          </div>
          <div style={vm.conflictPillStyle}>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:13.5px;font-weight:600")}>{vm.stats.conflicts}</span><span style={css('font-size:10.5px;opacity:.85')}>conflicts</span>
          </div>
          <div style={css('display:flex;align-items:center;gap:6px;padding:5px 10px;background:#fff7ea;border:1px solid #f1dcb0;border-radius:8px')}>
            <span style={css("font-family:'IBM Plex Mono',monospace;font-size:13.5px;font-weight:600;color:#a96e08")}>{vm.stats.unassigned}</span><span style={css('font-size:10.5px;color:#9a7a3a')}>unstaffed</span>
          </div>
        </div>
      )}
      <HButton onClick={vm.addLeave} style={css("background:#fff;color:#3c423d;border:1px solid #dde0d9;border-radius:8px;padding:8px 12px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif;display:flex;align-items:center;gap:6px;flex-shrink:0")} hover={{ background: '#f1f3ee' }}>
        <span style={css('font-size:13px;line-height:1')}>☾</span>Leave
      </HButton>
      <HButton onClick={vm.openCreate} style={css("background:#15191e;color:#fff;border:none;border-radius:8px;padding:8px 13px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif;display:flex;align-items:center;gap:6px;flex-shrink:0")} hover={{ background: '#23282e' }}>
        <span style={css('font-size:14px;line-height:1')}>＋</span>New appointment
      </HButton>
      {vm.showDayStrip && (
        <div style={css('width:100%;display:flex;gap:5px')}>
          {vm.daySel.map((d, i) => (
            <button key={i} onClick={d.onClick} style={d.style}>
              <div style={d.labelStyle}>{d.label}</div>
              <div style={d.dateStyle}>{d.date}</div>
              <span style={d.warnDotStyle}>{d.warn}</span>
              <span style={d.leaveDotStyle} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DayHeaders({ vm, withWarn }: { vm: VM; withWarn?: boolean }) {
  return (
    <>
      {vm.days.map((d, i) => (
        <div key={i} style={withWarn
          ? css('position:sticky;top:0;z-index:3;background:#f3f5ef;border-bottom:1px solid #d8dcd4;border-right:1px solid #e2e5de;padding:9px 12px 8px;display:flex;align-items:center;justify-content:space-between')
          : css('position:sticky;top:0;z-index:3;background:#f3f5ef;border-bottom:1px solid #d8dcd4;border-right:1px solid #e2e5de;padding:9px 12px 8px')}>
          <div>
            <div style={css('font-size:12px;font-weight:700;color:#23282a;letter-spacing:.2px')}>{d.label}</div>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;color:#8a9088;margin-top:1px")}>{d.date}</div>
          </div>
          {withWarn && <span style={d.warnStyle}>{d.warn}</span>}
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
      <DayHeaders vm={vm} withWarn />
      {vm.personRows.map((r) => (
        <Fragment key={r.engId}>
          <div style={r.nameCellStyle}>
            <div style={css('display:flex;align-items:center;gap:9px')}>
              <div style={r.avatarStyle}>{r.initials}</div>
              <div style={css('min-width:0')}>
                <div style={css('font-size:12.5px;font-weight:600;color:#23282a;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{r.name}</div>
                <div style={css('font-size:10px;color:#8a9088;line-height:1.2')}>{r.role}</div>
              </div>
            </div>
            <div style={css('display:flex;flex-wrap:wrap;gap:4px;margin-top:7px')}>
              <span style={css("font-family:'IBM Plex Mono',monospace;font-size:8.5px;font-weight:600;color:#3c423d;background:#eef3ee;border:1px solid #dde6dd;border-radius:3px;padding:1px 5px")}>{r.department}</span>
              {r.subDepartments.map((sd, i) => (
                <span key={i} style={css("font-family:'IBM Plex Mono',monospace;font-size:8px;color:#5b7fd6;background:#eef2fd;border:1px solid #d8e2fa;border-radius:3px;padding:1px 4px")}>{sd}</span>
              ))}
            </div>
          </div>
          {r.cells.map((cell) => (
            <div key={cell.cellId} onDragOver={cell.onDragOver} onDragLeave={cell.onDragLeave} onDrop={cell.onDrop} style={cell.style}>
              {cell.leaveTag && <LeaveTag tag={cell.leaveTag} />}
              {cell.chips.map((chip) => (
                <div key={chip.aid} draggable onClick={chip.onClick} onDragStart={chip.onDragStart} onDragEnd={chip.onDragEnd} style={chip.style}>
                  <div style={css('display:flex;align-items:center;gap:6px')}>
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;color:#15191e")}>{chip.code}</span>
                    <span style={css('flex:1')} />
                    <span style={chip.warnDotStyle}>{chip.warnGlyph}</span>
                    <span style={chip.appointmentStyle}>{chip.appointment}</span>
                  </div>
                  <div style={css('font-size:10.5px;color:#5c625c;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{chip.customer}</div>
                </div>
              ))}
              {cell.empty && !cell.leaveTag && (
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
              <span style={r.swatchStyle} />
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
                    <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#7a807a")}>{chip.code} · {chip.appointment}</div>
                  </div>
                  <span style={chip.warnDotStyle}>{chip.warnGlyph}</span>
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
              <span style={r.swatchStyle}>{r.initials}</span>
              <div style={css('min-width:0')}>
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
                    <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#7a807a")}>{chip.code} · {chip.plantCode}</div>
                  </div>
                  <span style={chip.warnDotStyle}>{chip.warnGlyph}</span>
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
          <div style={css('display:flex;align-items:center;gap:10px;margin-bottom:10px')}>
            <div style={r.avatarStyle}>{r.initials}</div>
            <div style={css('min-width:0;flex:1')}>
              <div style={css('font-size:13px;font-weight:600;color:#23282a')}>{r.name}</div>
              <div style={css('font-size:10.5px;color:#8a9088')}>{r.role}</div>
            </div>
            <div style={css('display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end;max-width:120px')}>
              <span style={css("font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:600;color:#3c423d;background:#eef3ee;border:1px solid #dde6dd;border-radius:3px;padding:1px 4px")}>{r.department}</span>
              {r.subDepartments.map((sd, i) => (
                <span key={i} style={css("font-family:'IBM Plex Mono',monospace;font-size:7.5px;color:#5b7fd6;background:#eef2fd;border:1px solid #d8e2fa;border-radius:3px;padding:1px 3px")}>{sd}</span>
              ))}
            </div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:6px')}>
            {r.cell.leaveTag && <LeaveTag tag={r.cell.leaveTag} />}
            {r.cell.chips.map((chip) => (
              <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                <div style={css('display:flex;align-items:center;gap:6px')}>
                  <span style={css("font-family:'IBM Plex Mono',monospace;font-size:11.5px;font-weight:600;color:#15191e")}>{chip.code}</span>
                  <span style={css('flex:1')} />
                  <span style={chip.warnDotStyle}>{chip.warnGlyph}</span>
                  <span style={chip.appointmentStyle}>{chip.appointment}</span>
                </div>
                <div style={css('font-size:10.5px;color:#5c625c;margin-top:2px')}>{chip.customer}</div>
              </div>
            ))}
            {!r.cell.leaveTag && (
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
            <span style={r.swatchStyle} />
            <div><div style={css('font-size:13px;font-weight:700;color:#23282a')}>{r.name}</div><div style={css('font-size:10.5px;color:#8a9088')}>{r.loc}</div></div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:6px')}>
            {r.cell.chips.map((chip) => (
              <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                <div style={chip.avatarStyle}>{chip.initials}</div>
                <div style={css('min-width:0;flex:1')}><div style={css('font-size:11.5px;font-weight:600;color:#23282a')}>{chip.name}</div><div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#7a807a")}>{chip.code} · {chip.appointment}</div></div>
                <span style={chip.warnDotStyle}>{chip.warnGlyph}</span>
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
            <span style={r.swatchStyle}>{r.initials}</span>
            <div><div style={css('font-size:13px;font-weight:700;color:#23282a')}>{r.name}</div><div style={css('font-size:10.5px;color:#8a9088')}>{r.sub}</div></div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:6px')}>
            {r.cell.chips.map((chip) => (
              <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                <div style={chip.avatarStyle}>{chip.initials}</div>
                <div style={css('min-width:0;flex:1')}><div style={css('font-size:11.5px;font-weight:600;color:#23282a')}>{chip.name}</div><div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#7a807a")}>{chip.code} · {chip.plantCode} · {chip.appointment}</div></div>
                <span style={chip.warnDotStyle}>{chip.warnGlyph}</span>
              </div>
            ))}
            {r.cell.empty && <div style={css('font-size:11px;color:#a6aca2;text-align:center;padding:8px 0;font-style:italic')}>No work scheduled</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function SubDeptGrid({ vm }: { vm: VM }) {
  return (
    <div style={{ ...gridBase, gridTemplateColumns: vm.gridCols }}>
      <CornerHeader label="SUB-DEPARTMENT" />
      <DayHeaders vm={vm} />
      {vm.subDeptRows.map((r, ri) => (
        <Fragment key={ri}>
          <div style={css('border-bottom:1px solid #e2e5de;border-right:1px solid #e2e5de;padding:12px 14px;background:#fff;position:sticky;left:0;z-index:2')}>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:12.5px;font-weight:700;color:#23282a")}>{r.name}</div>
          </div>
          {r.cells.map((cell, ci) => (
            <div key={ci} style={cell.style}>
              {cell.chips.map((chip) => (
                <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                  <div style={chip.avatarStyle}>{chip.initials}</div>
                  <div style={css('min-width:0;flex:1')}>
                    <div style={css('font-size:11px;font-weight:600;color:#23282a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{chip.name}</div>
                    <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#7a807a")}>{chip.code} · {chip.appointment}</div>
                  </div>
                  <span style={chip.warnDotStyle}>{chip.warnGlyph}</span>
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

function MobileSubDept({ vm }: { vm: VM }) {
  return (
    <div style={css('padding:11px 11px 24px;display:flex;flex-direction:column;gap:10px')}>
      {vm.mobileSubDeptRows.map((r, ri) => (
        <div key={ri} style={css('background:#fff;border:1px solid #e4e7e0;border-radius:12px;padding:12px 13px')}>
          <div style={css('display:flex;align-items:center;gap:9px;margin-bottom:10px')}>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:700;color:#23282a")}>{r.name}</div>
          </div>
          <div style={css('display:flex;flex-direction:column;gap:6px')}>
            {r.cell.chips.map((chip) => (
              <div key={chip.aid} onClick={chip.onClick} style={chip.style}>
                <div style={chip.avatarStyle}>{chip.initials}</div>
                <div style={css('min-width:0;flex:1')}><div style={css('font-size:11.5px;font-weight:600;color:#23282a')}>{chip.name}</div><div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#7a807a")}>{chip.code} · {chip.appointment}</div></div>
                <span style={chip.warnDotStyle}>{chip.warnGlyph}</span>
              </div>
            ))}
            {r.cell.empty && <div style={css('font-size:11px;color:#a6aca2;text-align:center;padding:8px 0;font-style:italic')}>No coverage scheduled</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthOrderCards({ vm, mobile }: { vm: VM; mobile?: boolean }) {
  return (
    <>
      {vm.monthOrders.map((o) => (
        <div key={o.orderId} style={o.cardStyle}>
          <div style={mobile ? css('display:flex;align-items:center;gap:8px;margin-bottom:6px') : css('display:flex;align-items:center;gap:8px;margin-bottom:7px')}>
            <span style={o.swatchStyle} />
            <span style={mobile
              ? css("font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;color:#15191e")
              : css("font-family:'IBM Plex Mono',monospace;font-size:12.5px;font-weight:600;color:#15191e")}>{o.code}</span>
            <span style={o.priorityStyle}>{o.priority}</span>
            <span style={css('flex:1')} />
            <span style={o.statusStyle}>{o.statusLabel}</span>
          </div>
          <div style={mobile ? css('font-size:12px;color:#3c423d;font-weight:600') : css('font-size:12.5px;color:#3c423d;font-weight:600')}>{o.product}</div>
          {mobile ? (
            <div style={css('font-size:10.5px;color:#8a9088;margin-top:1px')}>{o.customer} · {o.plantCode} · {o.appointmentsTxt} · {o.daysTxt}</div>
          ) : (
            <>
              <div style={css('font-size:11px;color:#8a9088;margin-top:1px')}>{o.customer} · {o.plantCode}</div>
              <div style={css('display:flex;align-items:center;gap:14px;margin-top:10px;padding-top:10px;border-top:1px solid #f2f4ee')}>
                <div><div style={css("font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600;color:#23282a")}>{o.appointments}</div><div style={css('font-size:9.5px;color:#9aa097;letter-spacing:.3px')}>APPOINTMENTS</div></div>
                <div><div style={css("font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600;color:#23282a")}>{o.days}</div><div style={css('font-size:9.5px;color:#9aa097;letter-spacing:.3px')}>DAYS</div></div>
                <div><div style={css("font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600;color:#23282a")}>{o.engs}</div><div style={css('font-size:9.5px;color:#9aa097;letter-spacing:.3px')}>ENGS</div></div>
                <span style={css('flex:1')} />
                <span style={o.confStyle}>⚠ {o.conf}</span>
              </div>
            </>
          )}
        </div>
      ))}
    </>
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
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;color:#23282a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis")}>{ch.code}</span>
                    <span style={css('flex:1')} />
                    <span style={css("font-family:'IBM Plex Mono',monospace;font-size:9px;color:#9aa097")}>{ch.countTxt}</span>
                  </div>
                ))}
                {(c.more ?? 0) > 0 && <span style={css('font-size:9.5px;color:#9aa097;padding-left:2px')}>{c.moreTxt}</span>}
              </div>
            </div>
          ),
        )}
      </div>

      <div style={css('margin-top:26px')}>
        <div style={css('display:flex;align-items:baseline;gap:9px;margin-bottom:13px')}>
          <div style={css('font-size:15px;font-weight:700;letter-spacing:-.2px')}>Customer orders · {vm.monthName}</div>
          <div style={css('font-size:12px;color:#8a9088')}>{vm.monthScheduledCount} of {vm.monthOrderCount} scheduled</div>
        </div>
        <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:11px')}>
          <MonthOrderCards vm={vm} />
        </div>
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
            </div>
          ),
        )}
      </div>
      <div style={css('margin-top:20px')}>
        <div style={css('display:flex;align-items:baseline;gap:8px;margin-bottom:11px')}>
          <div style={css('font-size:14px;font-weight:700')}>Orders · {vm.monthName}</div>
          <div style={css('font-size:11px;color:#8a9088')}>{vm.monthScheduledCount}/{vm.monthOrderCount}</div>
        </div>
        <div style={css('display:flex;flex-direction:column;gap:9px')}>
          <MonthOrderCards vm={vm} mobile />
        </div>
      </div>
    </div>
  );
}
