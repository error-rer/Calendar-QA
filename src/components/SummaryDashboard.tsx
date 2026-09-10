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
  const isDark = vm.isDark;
  const cols = '90px repeat(' + periods.length + ', minmax(48px, 1fr))';
  return (
    <div style={css('min-width:720px')}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '4px', fontSize: '11px', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', padding: '4px 0 8px', borderBottom: `2px solid ${isDark ? '#334155' : '#cbd5e1'}` }}>
        <div></div>
        {periods.map((p) => (
          <div key={p.key} style={{ textAlign: 'right' }}>{p.label}</div>
        ))}
      </div>
      {rows.map((rf) => (
        <div key={rf.key} style={{ display: 'grid', gridTemplateColumns: cols, gap: '4px', padding: '8px 0', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, fontSize: '13px' }}>
          <div style={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 600 }}>{rf.label}</div>
          {periods.map((p) => {
            const cell = cells[vm.summaryPeriods.indexOf(p)];
            return <div key={p.key} style={{ textAlign: 'right', fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a' }}>{cell ? (cell as any)[rf.key] : 0}</div>;
          })}
        </div>
      ))}
    </div>
  );
}

function UtlTable({ vm, periods }: { vm: VM; periods: typeof vm.summaryPeriods }) {
  const isDark = vm.isDark;
  const cols = '90px repeat(' + periods.length + ', minmax(48px, 1fr))';
  return (
    <div style={css('min-width:720px')}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: '4px', fontSize: '11px', fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', padding: '4px 0 8px', borderBottom: `2px solid ${isDark ? '#334155' : '#cbd5e1'}` }}>
        <div></div>
        {periods.map((p) => (
          <div key={p.key} style={{ textAlign: 'right' }}>{p.label}</div>
        ))}
      </div>
      {utlFields.map((rf) => (
        <div key={rf.key} style={{ display: 'grid', gridTemplateColumns: cols, gap: '4px', padding: '8px 0', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, fontSize: '13px' }}>
          <div style={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 600 }}>{rf.label}</div>
          {periods.map((p) => {
            const cell = vm.utlCells[vm.summaryPeriods.indexOf(p)];
            return <div key={p.key} style={{ textAlign: 'right', fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a' }}>{cell ? (cell as any)[rf.key] : 0}</div>;
          })}
        </div>
      ))}
    </div>
  );
}

export function SummaryDashboard({ vm }: { vm: VM }) {
  const isDark = vm.isDark;
  const [yearText, setYearText] = useState(String(vm.summaryYear));
  const commitYear = (v: string) => { const n = parseInt(v, 10); if (!isNaN(n)) vm.setSummaryYear(n); };
  return (
    <main className="scrl" style={{ flex: 1, minHeight: 0, overflow: 'auto', background: isDark ? '#0f172a' : '#f4f6f1' }}>
      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '30px 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-.3px', color: isDark ? '#f8fafc' : '#0f172a' }}>Summary Dashboard</div>
          <div style={{ flex: 1 }} />
          <button onClick={() => { vm.setSummaryYear(vm.summaryYear - 1); setYearText(String(vm.summaryYear - 1)); }} style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, background: isDark ? '#1e293b' : '#ffffff', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a', fontFamily: "'Archivo',sans-serif" }}>‹</button>
          <input value={yearText} onFocus={(e) => { setYearText(String(vm.summaryYear)); e.currentTarget.select(); }} onChange={(e) => setYearText(e.currentTarget.value)} onBlur={(e) => commitYear(e.currentTarget.value)} onKeyDown={(e) => { if (e.key === 'Enter') { commitYear(e.currentTarget.value); (e.target as HTMLInputElement).blur(); } }} style={{ width: '60px', textAlign: 'center', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, borderRadius: '6px', padding: '4px 6px', fontSize: '15px', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', fontFamily: "'Archivo',sans-serif", outline: 'none', background: isDark ? '#1e293b' : '#ffffff' }} />
          <button onClick={() => { vm.setSummaryYear(vm.summaryYear + 1); setYearText(String(vm.summaryYear + 1)); }} style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${isDark ? '#334155' : '#cbd5e1'}`, background: isDark ? '#1e293b' : '#ffffff', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a', fontFamily: "'Archivo',sans-serif" }}>›</button>
        </div>

        <div style={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '14px', padding: '20px', overflowX: 'auto', marginBottom: '20px' }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', letterSpacing: '.5px', marginBottom: '12px' }}>BY CATEGORY</div>
          <SummaryTable vm={vm} periods={vm.summaryPeriods} rows={rowFields} cells={vm.summaryCells} />
        </div>

        <div style={{ background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '14px', padding: '20px', overflowX: 'auto' }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', letterSpacing: '.5px', marginBottom: '12px' }}>BY UTL SITE</div>
          <UtlTable vm={vm} periods={vm.summaryPeriods} />
        </div>
      </div>
    </main>
  );
}