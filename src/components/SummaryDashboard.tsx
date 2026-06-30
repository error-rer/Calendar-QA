import type { VM } from '../useScheduler';
import { css } from '../ui';

export function SummaryDashboard({ vm }: { vm: VM }) {
  return (
    <main className="scrl" style={css('flex:1;min-height:0;overflow:auto;background:#eef0ea')}>
      <div style={css('max-width:960px;margin:0 auto;padding:30px 24px 80px')}>
        <div style={css('margin-bottom:24px')}>
          <div style={css('font-size:22px;font-weight:700;letter-spacing:-.3px;color:#15191e')}>Summary Dashboard</div>
          <div style={css('font-size:13px;color:#7a807a;margin-top:3px')}>Overview of internal audit and customer activity.</div>
        </div>

        <div style={css('display:flex;align-items:center;gap:16px;margin-bottom:28px')}>
          <div style={css('display:flex;background:#f1f3ee;border:1px solid #e0e3dc;border-radius:8px;padding:2px;gap:2px')}>
            <button onClick={vm.setSummaryWeek} style={vm.summaryWeekStyle}>Week</button>
            <button onClick={vm.setSummaryMonth} style={vm.summaryMonthStyle}>Month</button>
          </div>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:12px;color:#9aa097")}>{vm.summaryIsWeek ? 'Current week' : 'This month'} · {vm.summaryAssignTotal} appointments</div>
        </div>

        <div style={css('display:flex;flex-direction:column;gap:20px')}>
          <SummarySection
            title="Internal Audit"
            icon="◇"
            accent="#3d7840"
            bg="#eef3ea"
            border="#c7d8bf"
            items={vm.summaryInternals.map((p) => ({
              name: p.name,
              count: p.appointments,
              sub: p.customers.length > 0 ? p.customers.join(', ') : '—',
            }))}
          />
          <SummarySection
            title="Company"
            icon="○"
            accent="#3a6bc4"
            bg="#f0f4fa"
            border="#d4def0"
            items={vm.summaryCompanies.map((c) => ({
              name: c.name,
              count: c.appointments,
              sub: c.plants.length > 0 ? c.plants.join(', ') : '—',
            }))}
          />
        </div>
      </div>
    </main>
  );
}

function SummarySection({ title, icon, accent, bg, border, items }: {
  title: string;
  icon: string;
  accent: string;
  bg: string;
  border: string;
  items: { name: string; count: number; sub: string }[];
}) {
  return (
    <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;overflow:hidden')}>
      <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.5px;padding:14px 20px;border-bottom:1px solid #eef1ea;color:#9aa097")}>
        {icon} {title}
      </div>
      {items.length === 0 ? (
        <div style={css('padding:24px 20px;font-size:13px;color:#a6aca2;text-align:center;font-style:italic')}>No activity for this period.</div>
      ) : (
        items.map((item, i) => (
          <div key={i} style={css('display:flex;align-items:center;gap:14px;padding:13px 20px;border-bottom:' + (i < items.length - 1 ? '1px solid #f2f4ee' : 'none'))}>
            <div style={css('min-width:0;flex:1')}>
              <div style={css('font-size:14px;font-weight:600;color:#23282a')}>{item.name}</div>
              <div style={css('font-size:12px;color:#8a9088;margin-top:3px')}>{item.sub}</div>
            </div>
            <div style={css('display:flex;align-items:center;gap:7px;padding:5px 12px;border-radius:8px;background:' + bg + ';border:1px solid ' + border)}>
              <span style={css("font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:700;color:" + accent)}>{item.count}</span>
              <span style={css('font-size:11px;color:#7a8079')}>appts</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
