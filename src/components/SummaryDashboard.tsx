import { useState } from 'react';
import type { VM } from '../useScheduler';
import { css } from '../ui';

const rowFields: { label: string; key: 'major' | 'minor' | 'ofi' | 'total' }[] = [
  { label: 'Major', key: 'major' },
  { label: 'Minor', key: 'minor' },
  { label: 'OFI', key: 'ofi' },
  { label: 'Total', key: 'total' },
];

const utlFields: { label: string; key: 'utl1' | 'utl2' | 'utl3' | 'total' }[] = [
  { label: 'UTL1', key: 'utl1' },
  { label: 'UTL2', key: 'utl2' },
  { label: 'UTL3', key: 'utl3' },
  { label: 'Total', key: 'total' },
];

function SummaryTable({ vm, periods, rows, cells }: { vm: VM; periods: typeof vm.summaryPeriods; rows: typeof rowFields; cells: typeof vm.summaryCells }) {
  const cols = '90px repeat(' + periods.length + ', minmax(48px, 1fr))';
  return (
    <div style={css('min-width:720px')}>
      <div style={css('display:grid;grid-template-columns:' + cols + ';gap:4px;font-size:11px;font-weight:600;color:#8a9088;padding:4px 0 8px;border-bottom:2px solid #e4e7e0')}>
        <div></div>
        {periods.map((p) => (
          <div key={p.key} style={css('text-align:right')}>{p.label}</div>
        ))}
      </div>
      {rows.map((rf) => (
        <div key={rf.key} style={css('display:grid;grid-template-columns:' + cols + ';gap:4px;padding:8px 0;border-bottom:1px solid #f0f2ec;font-size:13px')}>
          <div style={css('color:#23282a;font-weight:600')}>{rf.label}</div>
          {periods.map((p) => {
            const cell = cells[vm.summaryPeriods.indexOf(p)];
            return <div key={p.key} style={css('text-align:right;font-weight:600;color:#23282a')}>{cell ? (cell as any)[rf.key] : 0}</div>;
          })}
        </div>
      ))}
    </div>
  );
}

function UtlTable({ vm, periods }: { vm: VM; periods: typeof vm.summaryPeriods }) {
  const cols = '90px repeat(' + periods.length + ', minmax(48px, 1fr))';
  return (
    <div style={css('min-width:720px')}>
      <div style={css('display:grid;grid-template-columns:' + cols + ';gap:4px;font-size:11px;font-weight:600;color:#8a9088;padding:4px 0 8px;border-bottom:2px solid #e4e7e0')}>
        <div></div>
        {periods.map((p) => (
          <div key={p.key} style={css('text-align:right')}>{p.label}</div>
        ))}
      </div>
      {utlFields.map((rf) => (
        <div key={rf.key} style={css('display:grid;grid-template-columns:' + cols + ';gap:4px;padding:8px 0;border-bottom:1px solid #f0f2ec;font-size:13px')}>
          <div style={css('color:#23282a;font-weight:600')}>{rf.label}</div>
          {periods.map((p) => {
            const cell = vm.utlCells[vm.summaryPeriods.indexOf(p)];
            return <div key={p.key} style={css('text-align:right;font-weight:600;color:#23282a')}>{cell ? (cell as any)[rf.key] : 0}</div>;
          })}
        </div>
      ))}
    </div>
  );
}

export function SummaryDashboard({ vm }: { vm: VM }) {
  const [yearText, setYearText] = useState(String(vm.summaryYear));
  const commitYear = (v: string) => { const n = parseInt(v, 10); if (!isNaN(n)) vm.setSummaryYear(n); };
  return (
    <main className="scrl" style={css('flex:1;min-height:0;overflow:auto;background:#eef0ea')}>
      <div style={css('max-width:1040px;margin:0 auto;padding:30px 24px 80px')}>
        <div style={css('display:flex;align-items:center;gap:12px;margin-bottom:20px')}>
          <div style={css('font-size:22px;font-weight:700;letter-spacing:-.3px;color:#15191e')}>Summary Dashboard</div>
          <div style={css('flex:1')} />
          <button onClick={() => { vm.setSummaryYear(vm.summaryYear - 1); setYearText(String(vm.summaryYear - 1)); }} style={css('padding:4px 10px;border-radius:6px;border:1px solid #e0e3dc;background:#fff;cursor:pointer;font-size:12px;font-weight:600;color:#4a504a;font-family:\'Archivo\',sans-serif')}>‹</button>
          <input value={yearText} onFocus={(e) => { setYearText(String(vm.summaryYear)); e.currentTarget.select(); }} onChange={(e) => setYearText(e.currentTarget.value)} onBlur={(e) => commitYear(e.currentTarget.value)} onKeyDown={(e) => { if (e.key === 'Enter') { commitYear(e.currentTarget.value); (e.target as HTMLInputElement).blur(); } }} style={css('width:60px;text-align:center;border:1px solid #e0e3dc;border-radius:6px;padding:4px 6px;font-size:15px;font-weight:700;color:#15191e;font-family:\'Archivo\',sans-serif;outline:none;background:#fff')} />
          <button onClick={() => { vm.setSummaryYear(vm.summaryYear + 1); setYearText(String(vm.summaryYear + 1)); }} style={css('padding:4px 10px;border-radius:6px;border:1px solid #e0e3dc;background:#fff;cursor:pointer;font-size:12px;font-weight:600;color:#4a504a;font-family:\'Archivo\',sans-serif')}>›</button>
        </div>

        <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;padding:20px;overflow-x:auto;margin-bottom:20px')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#5c625c;letter-spacing:.5px;margin-bottom:12px")}>BY CATEGORY</div>
          <SummaryTable vm={vm} periods={vm.summaryPeriods} rows={rowFields} cells={vm.summaryCells} />
        </div>

        <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;padding:20px;overflow-x:auto')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#5c625c;letter-spacing:.5px;margin-bottom:12px")}>BY UTL SITE</div>
          <UtlTable vm={vm} periods={vm.summaryPeriods} />
        </div>
      </div>
    </main>
  );
}