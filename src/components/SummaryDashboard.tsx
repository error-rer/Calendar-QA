import type { VM } from '../useScheduler';
import { css, HButton } from '../ui';

export function SummaryDashboard({ vm }: { vm: VM }) {
  return (
    <main className="scrl" style={css('flex:1;min-height:0;overflow:auto;background:#eef0ea')}>
      <div style={css('max-width:720px;margin:0 auto;padding:30px 24px 80px')}>
        <div style={css('margin-bottom:24px')}>
          <div style={css('font-size:22px;font-weight:700;letter-spacing:-.3px;color:#15191e')}>Summary Dashboard</div>
          <div style={css('font-size:13px;color:#7a807a;margin-top:3px')}>Customer and Internal Audit activity by employee.</div>
        </div>

        <div style={css('display:flex;align-items:center;gap:16px;margin-bottom:28px')}>
          <div style={css('display:flex;background:#f1f3ee;border:1px solid #e0e3dc;border-radius:8px;padding:2px;gap:2px')}>
            <button onClick={vm.setSummaryWeek} style={vm.summaryWeekStyle}>Week</button>
            <button onClick={vm.setSummaryMonth} style={vm.summaryMonthStyle}>Month</button>
          </div>
          <div style={css('display:flex;align-items:center;gap:8px')}>
            <HButton onClick={vm.prevSummaryWeek} style={css('width:26px;height:26px;border:1px solid #dde0d9;background:#fff;border-radius:6px;cursor:pointer;color:#4a504a;font-size:13px;display:flex;align-items:center;justify-content:center')} hover={{ background: '#f1f3ee' }}>‹</HButton>
            <div style={css('text-align:center;line-height:1.15')}>
              <div style={css('font-size:12px;font-weight:600;color:#23282a')}>{vm.summaryWeekLabel}</div>
              <div style={css("font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#8a9088")}>{vm.summaryWeekTag}</div>
            </div>
            <HButton onClick={vm.nextSummaryWeek} style={css('width:26px;height:26px;border:1px solid #dde0d9;background:#fff;border-radius:6px;cursor:pointer;color:#4a504a;font-size:13px;display:flex;align-items:center;justify-content:center')} hover={{ background: '#f1f3ee' }}>›</HButton>
          </div>
        </div>

        <div style={css('display:flex;flex-direction:column;gap:20px')}>
          <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;padding:20px')}>
            <div style={css('display:flex;gap:28px;margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #e4e7e0')}>
              <div>
                <div style={css('color:#9aa097;font-size:10.5px;font-weight:600;letter-spacing:.3px')}>Employees</div>
                <div style={css("font-family:'IBM Plex Mono',monospace;color:#3c423d;font-size:22px;font-weight:700")}>{vm.summaryEmpCount}</div>
              </div>
              <div>
                <div style={css('color:#9aa097;font-size:10.5px;font-weight:600;letter-spacing:.3px')}>Customer</div>
                <div style={css("font-family:'IBM Plex Mono',monospace;color:#3a6bc4;font-size:22px;font-weight:700")}>{vm.summaryCustomerCount}</div>
              </div>
            </div>
            <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:2px;font-size:11px;font-weight:600;color:#8a9088;padding:4px 0 8px;border-bottom:2px solid #e4e7e0')}>
              <div>Name</div>
              <div style={css('text-align:right')}>Customers Managed</div>
            </div>
            {vm.summaryEmpBreakdown.map((e) => (
              <div key={e.id} style={css('display:grid;grid-template-columns:1fr 1fr;gap:2px;padding:6px 0;border-bottom:1px solid #f0f2ec;font-size:13px')}>
                <div style={css('color:#2a302c;font-weight:500')}>{e.name}</div>
                <div style={css('text-align:right;font-weight:600;color:#3a6bc4')}>{e.companies.length}</div>
              </div>
            ))}
            {vm.summaryEmpBreakdown.length === 0 && <div style={css('color:#9aa097;font-size:13px;padding:6px 0')}>—</div>}
          </div>

          <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;padding:20px')}>
            <div style={css('color:#9aa097;font-size:11.5px;font-weight:600;margin-bottom:12px;letter-spacing:.3px')}>Customer — Site Inspection with Customer</div>
            {vm.summaryCustomerTable.map((c) => (
              <div key={c.name} style={css('margin-bottom:10px')}>
                <div style={css('font-size:13px;font-weight:600;color:#2a302c;margin-bottom:4px')}>{c.name} <span style={css('color:#7a807a;font-weight:400;font-size:11.5px')}>({c.count})</span></div>
                <div style={css('display:flex;flex-wrap:wrap;gap:4px')}>
                  {c.emps.map((e) => (
                    <span key={e.id} style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;background:#f0f4fa;color:#3a6bc4;border-radius:6px;padding:2px 8px;font-weight:500")}>{e.name} {e.count}</span>
                  ))}
                </div>
              </div>
            ))}
            {vm.summaryCustomerTable.length === 0 && <div style={css('color:#9aa097;font-size:13px')}>—</div>}
          </div>

          <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;padding:20px')}>
            <div style={css('color:#9aa097;font-size:11.5px;font-weight:600;margin-bottom:12px;letter-spacing:.3px')}>Internal Audit — Site Inspection without Customer</div>
            {vm.summaryInternalTable.map((p) => (
              <div key={p.name} style={css('margin-bottom:10px')}>
                <div style={css('font-size:13px;font-weight:600;color:#2a302c;margin-bottom:4px')}>{p.name} <span style={css('color:#7a807a;font-weight:400;font-size:11.5px')}>({p.count})</span></div>
                <div style={css('display:flex;flex-wrap:wrap;gap:4px')}>
                  {p.emps.map((e) => (
                    <span key={e.id} style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;background:#eef3ea;color:#3d7840;border-radius:6px;padding:2px 8px;font-weight:500")}>{e.name} {e.count}</span>
                  ))}
                </div>
              </div>
            ))}
            {vm.summaryInternalTable.length === 0 && <div style={css('color:#9aa097;font-size:13px')}>—</div>}
          </div>
        </div>
      </div>
    </main>
  );
}


