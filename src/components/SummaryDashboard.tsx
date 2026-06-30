import type { VM } from '../useScheduler';
import { css, HButton } from '../ui';

export function SummaryDashboard({ vm }: { vm: VM }) {
  return (
    <main className="scrl" style={css('flex:1;min-height:0;overflow:auto;background:#eef0ea')}>
      <div style={css('max-width:720px;margin:0 auto;padding:30px 24px 80px')}>
        <div style={css('margin-bottom:24px')}>
          <div style={css('font-size:22px;font-weight:700;letter-spacing:-.3px;color:#15191e')}>Summary Dashboard</div>
          <div style={css('font-size:13px;color:#7a807a;margin-top:3px')}>Overview of employees, internal audit, and customer activity.</div>
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

        <div style={css('display:grid;grid-template-columns:repeat(3,1fr);gap:16px')}>
          <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;padding:20px')}>
            <div style={css('color:#9aa097;font-size:11.5px;font-weight:600;margin-bottom:12px;letter-spacing:.3px')}>
              Employee
              <span style={css("font-family:'IBM Plex Mono',monospace;color:#3c423d;margin-left:6px;font-size:20px;font-weight:700")}>{vm.summaryEmpCount}</span>
            </div>
            <div style={css('display:grid;grid-template-columns:1fr 60px 60px 50px;gap:2px;font-size:11px;font-weight:600;color:#8a9088;padding:4px 0 8px;border-bottom:2px solid #e4e7e0')}>
              <div>Name</div>
              <div style={css('text-align:right')}>Internal</div>
              <div style={css('text-align:right')}>Customer</div>
              <div style={css('text-align:right')}>Total</div>
            </div>
            {vm.summaryEmpBreakdown.map((e) => (
              <div key={e.id} style={css('display:grid;grid-template-columns:1fr 60px 60px 50px;gap:2px;padding:6px 0;border-bottom:1px solid #f0f2ec;font-size:13px')}>
                <div style={css('color:#2a302c;font-weight:500')}>{e.name}</div>
                <div style={css('text-align:right;font-weight:600;color:#3d7840')}>{e.internal}</div>
                <div style={css('text-align:right;font-weight:600;color:#3a6bc4')}>{e.customer}</div>
                <div style={css('text-align:right;font-weight:600;color:#5c625c')}>{e.total}</div>
              </div>
            ))}
            {vm.summaryEmpBreakdown.length > 0 && (
              <div style={css('display:grid;grid-template-columns:1fr 60px 60px 50px;gap:2px;padding:8px 0 0;border-top:2px solid #e4e7e0;margin-top:4px;font-size:13px')}>
                <div style={css('color:#2a302c;font-weight:700')}>Total</div>
                <div style={css('text-align:right;font-weight:700;color:#3d7840')}>{vm.summaryEmpTotal.internal}</div>
                <div style={css('text-align:right;font-weight:700;color:#3a6bc4')}>{vm.summaryEmpTotal.customer}</div>
                <div style={css('text-align:right;font-weight:700;color:#5c625c')}>{vm.summaryEmpTotal.total}</div>
              </div>
            )}
            {vm.summaryEmpBreakdown.length === 0 && <div style={css('color:#9aa097;font-size:13px;padding:6px 0')}>—</div>}
          </div>
          <SummaryCard
            label="Internal Audit"
            value={vm.summaryInternalCount}
            accent="#3d7840"
          />
          <SummaryCard
            label="Customer"
            value={vm.summaryCustomerCount}
            accent="#3a6bc4"
          />
        </div>
      </div>
    </main>
  );
}

function SummaryCard({ label, value, accent }: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;padding:24px 20px')}>
      <div style={css('color:#9aa097;font-size:11.5px;font-weight:600;margin-bottom:8px;letter-spacing:.3px')}>{label}</div>
      <div style={css("font-family:'IBM Plex Mono',monospace;font-size:36px;font-weight:700;color:" + accent + ';line-height:1')}>{value}</div>
    </div>
  );
}
