import { useState, useMemo } from 'react';
import type { VM } from '../useScheduler';
import type { Assignment, SiteAuditResult } from '../types';
import { css } from '../ui';
import { isInternalAssignment, calculateCustomerAuditsCount } from '../types';

const TARGET_SITES = ['UTL1', 'UTL2A', 'UTL2B', 'UTL3A', 'UTL3T'] as const;
type TargetSite = typeof TARGET_SITES[number];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const CATEGORIES = [
  { key: 'major' as const, label: 'Major', dot: '#d97706', text: '#b45309' },
  { key: 'minor' as const, label: 'Minor', dot: '#2563eb', text: '#1d4ed8' },
  { key: 'ofi' as const, label: 'OFI', dot: '#059669', text: '#047857' },
  { key: 'obs' as const, label: 'OBS', dot: '#7c3aed', text: '#6d28d9' },
  { key: 'findings' as const, label: 'Finding(s)', dot: '#dc2626', text: '#b91c1c' },
];

type CategoryKey = typeof CATEGORIES[number]['key'];

const SITE_CONFIG: Record<TargetSite, { label: string; badgeBg: string; text: string; border: string; dot: string }> = {
  UTL1: { label: 'UTL1', badgeBg: '#fee2e2', text: '#b91c1c', border: '#fecaca', dot: '#dc2626' },
  UTL2A: { label: 'UTL2A', badgeBg: '#ecfdf5', text: '#047857', border: '#a7f3d0', dot: '#10b981' },
  UTL2B: { label: 'UTL2B', badgeBg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', dot: '#16a34a' },
  UTL3A: { label: 'UTL3A', badgeBg: '#f0f9ff', text: '#0369a1', border: '#bae6fd', dot: '#0284c7' },
  UTL3T: { label: 'UTL3T', badgeBg: '#eef2ff', text: '#4338ca', border: '#c7d2fe', dot: '#4f46e5' },
};

function normalizeToTargetSite(siteKey: string): TargetSite | null {
  const s = siteKey.trim().toUpperCase().replace(/[\s-_]/g, '');
  if (s === 'UTL1' || s === 'U1') return 'UTL1';
  if (s === 'UTL2A' || s === 'U2A' || s === 'UTL2' || s === 'U2') return 'UTL2A';
  if (s === 'UTL2B' || s === 'U2B') return 'UTL2B';
  if (s === 'UTL3A' || s === 'U3A' || s === 'UTL3' || s === 'U3') return 'UTL3A';
  if (s === 'UTL3T' || s === 'U3T') return 'UTL3T';
  return null;
}

export function SummaryDashboard({ vm }: { vm: VM }) {
  const [yearText, setYearText] = useState(String(vm.summaryYear));
  const commitYear = (v: string) => {
    const n = parseInt(v, 10);
    if (!isNaN(n)) vm.setSummaryYear(n);
  };

  // State to track expand/collapse for each of the 5 sites (default all expanded)
  const [expandedSites, setExpandedSites] = useState<Record<TargetSite, boolean>>({
    UTL1: true,
    UTL2A: true,
    UTL2B: true,
    UTL3A: true,
    UTL3T: true,
  });

  const allExpanded = TARGET_SITES.every((s) => expandedSites[s]);

  const toggleSite = (site: TargetSite) => {
    setExpandedSites((prev) => ({ ...prev, [site]: !prev[site] }));
  };

  const toggleAll = () => {
    const nextState = !allExpanded;
    setExpandedSites({
      UTL1: nextState,
      UTL2A: nextState,
      UTL2B: nextState,
      UTL3A: nextState,
      UTL3T: nextState,
    });
  };

  // Metric cards: Audits count in selected year
  const yearAppts = useMemo(() => {
    return (vm.assignments || [])
      .map((a) => {
        const base = new Date(2026, 5, 29 + a.week * 7);
        base.setDate(base.getDate() + a.day);
        const isInternal = isInternalAssignment(a);
        return {
          id: a.id,
          dateObj: base,
          auditType: isInternal ? 'Internal Audit' : 'Customer Audit',
          customer: isInternal ? '' : (a.customer || ''),
          year: base.getFullYear(),
        };
      })
      .filter((a) => a.year === vm.summaryYear);
  }, [vm.assignments, vm.summaryYear]);

  const customerAuditsCount = useMemo(() => calculateCustomerAuditsCount(yearAppts), [yearAppts]);
  const internalAuditsCount = useMemo(() => yearAppts.filter((a) => a.auditType === 'Internal Audit').length, [yearAppts]);

  // Aggregate Findings by Site, Month, and Category dynamically from appointments
  const matrixData = useMemo(() => {
    const siteData: Record<TargetSite, Record<CategoryKey, number[]>> = {
      UTL1: { major: Array(12).fill(0), minor: Array(12).fill(0), ofi: Array(12).fill(0), obs: Array(12).fill(0), findings: Array(12).fill(0) },
      UTL2A: { major: Array(12).fill(0), minor: Array(12).fill(0), ofi: Array(12).fill(0), obs: Array(12).fill(0), findings: Array(12).fill(0) },
      UTL2B: { major: Array(12).fill(0), minor: Array(12).fill(0), ofi: Array(12).fill(0), obs: Array(12).fill(0), findings: Array(12).fill(0) },
      UTL3A: { major: Array(12).fill(0), minor: Array(12).fill(0), ofi: Array(12).fill(0), obs: Array(12).fill(0), findings: Array(12).fill(0) },
      UTL3T: { major: Array(12).fill(0), minor: Array(12).fill(0), ofi: Array(12).fill(0), obs: Array(12).fill(0), findings: Array(12).fill(0) },
    };

    // Group sibling assignments by unique appointment to avoid double counting multi-day appointments
    const apptMap = new Map<string, { month: number; year: number; results?: Record<string, SiteAuditResult>; raw: Assignment }>();

    for (const a of vm.assignments || []) {
      const key = a.order ? `${a.order}_${a.eng || ''}` : a.id;
      const d = new Date(2026, 5, 29 + a.week * 7 + a.day);
      const existing = apptMap.get(key);
      if (!existing) {
        apptMap.set(key, {
          month: d.getMonth(),
          year: d.getFullYear(),
          results: a.results,
          raw: a,
        });
      } else {
        if (d.getFullYear() === vm.summaryYear) {
          const prevDate = new Date(2026, 5, 29 + existing.raw.week * 7 + existing.raw.day);
          if (d < prevDate || existing.year !== vm.summaryYear) {
            existing.month = d.getMonth();
            existing.year = d.getFullYear();
          }
        }
        if (!existing.results && a.results) {
          existing.results = a.results;
        }
      }
    }

    // Aggregate findings per site and month
    for (const appt of apptMap.values()) {
      if (appt.year !== vm.summaryYear) continue;
      const m = appt.month;
      if (m < 0 || m > 11) continue;

      if (appt.results && Object.keys(appt.results).length > 0) {
        for (const [siteKey, res] of Object.entries(appt.results)) {
          const targetSite = normalizeToTargetSite(siteKey);
          if (!targetSite) continue;
          siteData[targetSite].major[m] += Number(res.major) || 0;
          siteData[targetSite].minor[m] += Number(res.minor) || 0;
          siteData[targetSite].ofi[m] += Number(res.ofi) || 0;
          siteData[targetSite].obs[m] += Number(res.obs) || 0;
          siteData[targetSite].findings[m] += Number(res.findings) || 0;
        }
      } else {
        // Fallback for appointments without an explicit results map
        const rawSites = (appt.raw.site1 || appt.raw.site2 || '').split(/[/,]/).map((s) => s.trim()).filter(Boolean);
        for (const s of rawSites) {
          const targetSite = normalizeToTargetSite(s);
          if (targetSite) {
            siteData[targetSite].major[m] += Number(appt.raw.major) || 0;
            siteData[targetSite].minor[m] += Number(appt.raw.minor) || 0;
            siteData[targetSite].ofi[m] += Number(appt.raw.ofi) || 0;
            siteData[targetSite].findings[m] += Number(appt.raw.request) || 0;
          }
        }
      }
    }

    // Site monthly aggregates and full year totals
    const siteMonthlyTotal: Record<TargetSite, number[]> = {
      UTL1: Array(12).fill(0),
      UTL2A: Array(12).fill(0),
      UTL2B: Array(12).fill(0),
      UTL3A: Array(12).fill(0),
      UTL3T: Array(12).fill(0),
    };

    const siteFullYearTotals: Record<TargetSite, Record<CategoryKey | 'total', number>> = {
      UTL1: { major: 0, minor: 0, ofi: 0, obs: 0, findings: 0, total: 0 },
      UTL2A: { major: 0, minor: 0, ofi: 0, obs: 0, findings: 0, total: 0 },
      UTL2B: { major: 0, minor: 0, ofi: 0, obs: 0, findings: 0, total: 0 },
      UTL3A: { major: 0, minor: 0, ofi: 0, obs: 0, findings: 0, total: 0 },
      UTL3T: { major: 0, minor: 0, ofi: 0, obs: 0, findings: 0, total: 0 },
    };

    for (const site of TARGET_SITES) {
      for (let m = 0; m < 12; m++) {
        const monthSum =
          siteData[site].major[m] +
          siteData[site].minor[m] +
          siteData[site].ofi[m] +
          siteData[site].obs[m] +
          siteData[site].findings[m];
        siteMonthlyTotal[site][m] = monthSum;
      }

      for (const cat of CATEGORIES) {
        const catSum = siteData[site][cat.key].reduce((a, b) => a + b, 0);
        siteFullYearTotals[site][cat.key] = catSum;
      }
      siteFullYearTotals[site].total = siteMonthlyTotal[site].reduce((a, b) => a + b, 0);
    }

    // Grand totals across all 5 sites
    const grandTotalMonthly: Record<CategoryKey, number[]> = {
      major: Array(12).fill(0),
      minor: Array(12).fill(0),
      ofi: Array(12).fill(0),
      obs: Array(12).fill(0),
      findings: Array(12).fill(0),
    };

    const overallMonthlyTotal = Array(12).fill(0);

    for (let m = 0; m < 12; m++) {
      for (const cat of CATEGORIES) {
        let sum = 0;
        for (const site of TARGET_SITES) {
          sum += siteData[site][cat.key][m];
        }
        grandTotalMonthly[cat.key][m] = sum;
      }
      overallMonthlyTotal[m] = TARGET_SITES.reduce((acc, site) => acc + siteMonthlyTotal[site][m], 0);
    }

    const grandTotalFullYear: Record<CategoryKey | 'overall', number> = {
      major: grandTotalMonthly.major.reduce((a, b) => a + b, 0),
      minor: grandTotalMonthly.minor.reduce((a, b) => a + b, 0),
      ofi: grandTotalMonthly.ofi.reduce((a, b) => a + b, 0),
      obs: grandTotalMonthly.obs.reduce((a, b) => a + b, 0),
      findings: grandTotalMonthly.findings.reduce((a, b) => a + b, 0),
      overall: overallMonthlyTotal.reduce((a, b) => a + b, 0),
    };

    return {
      siteData,
      siteMonthlyTotal,
      siteFullYearTotals,
      grandTotalMonthly,
      overallMonthlyTotal,
      grandTotalFullYear,
    };
  }, [vm.assignments, vm.summaryYear]);

  const totalFindings = matrixData.grandTotalFullYear.overall;

  // Export to Excel with custom styles, borders, and structured grouping
  const handleExportExcel = async () => {
    // @ts-ignore
    const XLSX = (await import('xlsx-js-style')).default || (await import('xlsx-js-style'));

    const headers = ['', ...MONTHS, 'Full Year Total'];
    const rows: (string | number)[][] = [];

    rows.push([`UTAC - Audit Findings by Site and Month (Year ${vm.summaryYear})`]);
    rows.push([]);

    const headerRowIndex = rows.length;
    rows.push(headers);

    const siteHeaderRowIndices: number[] = [];
    const siteTotalRowIndices: number[] = [];

    for (const site of TARGET_SITES) {
      siteHeaderRowIndices.push(rows.length);

      // Site Header Row
      rows.push([
        `${site} Findings`,
        ...Array(12).fill(''),
        '',
      ]);

      // Category Sub-rows
      for (const cat of CATEGORIES) {
        rows.push([
          `    ${cat.label}`,
          ...matrixData.siteData[site][cat.key],
          matrixData.siteFullYearTotals[site][cat.key],
        ]);
      }

      // Site Total sub-row
      siteTotalRowIndices.push(rows.length);
      rows.push([
        `    ${site} Total`,
        ...matrixData.siteMonthlyTotal[site],
        matrixData.siteFullYearTotals[site].total,
      ]);

      rows.push([]);
    }

    // Grand Total Section
    const grandHeaderIdx = rows.length;
    rows.push(['Grand Total Across All Sites', ...Array(12).fill(''), '']);

    for (const cat of CATEGORIES) {
      rows.push([
        `    Total ${cat.label}`,
        ...matrixData.grandTotalMonthly[cat.key],
        matrixData.grandTotalFullYear[cat.key],
      ]);
    }

    const overallTotalIdx = rows.length;
    rows.push([
      'Overall Monthly Total',
      ...matrixData.overallMonthlyTotal,
      matrixData.grandTotalFullYear.overall,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Style Title Cell
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (worksheet[titleCell]) {
      worksheet[titleCell].s = {
        font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '0F172A' } },
      };
    }

    // Style Headers
    for (let col = 0; col < headers.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '0F172A' } },
          alignment: { horizontal: col === 0 ? 'left' : 'right', vertical: 'center' },
          fill: { fgColor: { rgb: 'E2E8F0' } },
          border: {
            top: { style: 'thin', color: { rgb: '94A3B8' } },
            bottom: { style: 'medium', color: { rgb: '475569' } },
            left: { style: 'thin', color: { rgb: 'CBD5E1' } },
            right: { style: 'thin', color: { rgb: 'CBD5E1' } },
          },
        };
      }
    }

    // Style Site Headers
    for (const rIdx of siteHeaderRowIndices) {
      for (let col = 0; col < headers.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rIdx, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '1E293B' } },
            alignment: { horizontal: col === 0 ? 'left' : 'right', vertical: 'center' },
            fill: { fgColor: { rgb: 'F1F5F9' } },
            border: {
              top: { style: 'thin', color: { rgb: 'CBD5E1' } },
              bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
            },
          };
        }
      }
    }

    // Style Site Totals
    for (const rIdx of siteTotalRowIndices) {
      for (let col = 0; col < headers.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rIdx, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '0F172A' } },
            alignment: { horizontal: col === 0 ? 'left' : 'right', vertical: 'center' },
            fill: { fgColor: { rgb: 'F8FAFC' } },
            border: {
              top: { style: 'thin', color: { rgb: 'E2E8F0' } },
              bottom: { style: 'thin', color: { rgb: '94A3B8' } },
            },
          };
        }
      }
    }

    // Style Grand Total Header
    for (let col = 0; col < headers.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: grandHeaderIdx, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '0F172A' } },
          alignment: { horizontal: 'left', vertical: 'center' },
          fill: { fgColor: { rgb: 'E2E8F0' } },
          border: {
            top: { style: 'medium', color: { rgb: '475569' } },
            bottom: { style: 'thin', color: { rgb: '94A3B8' } },
          },
        };
      }
    }

    // Style Overall Monthly Total
    for (let col = 0; col < headers.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: overallTotalIdx, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { name: 'Calibri', sz: 11, bold: true, color: col === headers.length - 1 ? { rgb: '2563EB' } : { rgb: '0F172A' } },
          alignment: { horizontal: col === 0 ? 'left' : 'right', vertical: 'center' },
          fill: { fgColor: { rgb: 'E2E8F0' } },
          border: {
            top: { style: 'medium', color: { rgb: '475569' } },
            bottom: { style: 'double', color: { rgb: '0F172A' } },
          },
        };
      }
    }

    // Style all standard data rows
    for (let r = headerRowIndex + 1; r < rows.length; r++) {
      if (siteHeaderRowIndices.includes(r) || siteTotalRowIndices.includes(r) || r === grandHeaderIdx || r === overallTotalIdx) continue;
      for (let col = 0; col < headers.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c: col });
        if (worksheet[cellAddress] && !worksheet[cellAddress].s) {
          worksheet[cellAddress].s = {
            font: { name: 'Calibri', sz: 10, color: { rgb: '334155' } },
            alignment: { horizontal: col === 0 ? 'left' : 'right', vertical: 'center' },
            border: {
              bottom: { style: 'hair', color: { rgb: 'E2E8F0' } },
            },
          };
        }
      }
    }

    worksheet['!cols'] = [
      { wch: 30 },
      ...Array.from({ length: 12 }, () => ({ wch: 9 })),
      { wch: 15 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Findings ${vm.summaryYear}`);
    XLSX.writeFile(workbook, `annual-audit-findings-${vm.summaryYear}.xlsx`);
  };

  const gridCols = '220px repeat(12, minmax(48px, 1fr)) 96px';

  return (
    <main className="scrl" style={css('flex:1;min-height:0;overflow:auto;background:#eef0ea')}>
      <div style={css('max-width:1120px;margin:0 auto;padding:30px 24px 80px')}>
        {/* Header with Year Selector */}
        <div style={css('display:flex;align-items:center;gap:12px;margin-bottom:20px')}>
          <div style={css('font-size:22px;font-weight:700;letter-spacing:-.3px;color:#15191e')}>Summary Dashboard</div>
          <div style={css('flex:1')} />
          <button
            onClick={() => { vm.setSummaryYear(vm.summaryYear - 1); setYearText(String(vm.summaryYear - 1)); }}
            style={css('padding:4px 10px;border-radius:6px;border:1px solid #e0e3dc;background:#fff;cursor:pointer;font-size:12px;font-weight:600;color:#4a504a;font-family:\'Archivo\',sans-serif')}
          >
            ‹
          </button>
          <input
            value={yearText}
            onFocus={(e) => { setYearText(String(vm.summaryYear)); e.currentTarget.select(); }}
            onChange={(e) => setYearText(e.currentTarget.value)}
            onBlur={(e) => commitYear(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { commitYear(e.currentTarget.value); (e.target as HTMLInputElement).blur(); } }}
            style={css('width:60px;text-align:center;border:1px solid #e0e3dc;border-radius:6px;padding:4px 6px;font-size:15px;font-weight:700;color:#15191e;font-family:\'Archivo\',sans-serif;outline:none;background:#fff')}
          />
          <button
            onClick={() => { vm.setSummaryYear(vm.summaryYear + 1); setYearText(String(vm.summaryYear + 1)); }}
            style={css('padding:4px 10px;border-radius:6px;border:1px solid #e0e3dc;background:#fff;cursor:pointer;font-size:12px;font-weight:600;color:#4a504a;font-family:\'Archivo\',sans-serif')}
          >
            ›
          </button>
        </div>

        {/* Metric Cards Row */}
        <div style={css('display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:20px')}>
          <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;padding:16px 18px;box-shadow:0 1px 3px rgba(0,0,0,0.02)')}>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;color:#8a9088;text-transform:uppercase;letter-spacing:0.5px")}>Total Audits</div>
            <div style={css('font-size:24px;font-weight:700;color:#15191e;margin-top:2px')}>{customerAuditsCount + internalAuditsCount}</div>
            <div style={css('font-size:11px;color:#8a9088;margin-top:2px')}>Scheduled in {vm.summaryYear}</div>
          </div>

          <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;padding:16px 18px;box-shadow:0 1px 3px rgba(0,0,0,0.02)')}>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;color:#2756d6;text-transform:uppercase;letter-spacing:0.5px")}>Customer Audits</div>
            <div style={css('font-size:24px;font-weight:700;color:#2756d6;margin-top:2px')}>{customerAuditsCount}</div>
            <div style={css('font-size:11px;color:#8a9088;margin-top:2px')}>Consecutive day visits</div>
          </div>

          <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;padding:16px 18px;box-shadow:0 1px 3px rgba(0,0,0,0.02)')}>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px")}>Internal Audits</div>
            <div style={css('font-size:24px;font-weight:700;color:#374151;margin-top:2px')}>{internalAuditsCount}</div>
            <div style={css('font-size:11px;color:#8a9088;margin-top:2px')}>Plant & process audits</div>
          </div>

          <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:12px;padding:16px 18px;box-shadow:0 1px 3px rgba(0,0,0,0.02)')}>
            <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;color:#8a9088;text-transform:uppercase;letter-spacing:0.5px")}>Total Findings</div>
            <div style={css('font-size:24px;font-weight:700;color:#15191e;margin-top:2px')}>{totalFindings}</div>
            <div style={css('font-size:11px;color:#8a9088;margin-top:2px')}>Across 5 sites (Major, Minor, OFI, OBS, Findings)</div>
          </div>
        </div>

        {/* Unified Annual Audit Findings by Site & Month Matrix */}
        <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.02)')}>
          {/* Card Header & Controls */}
          <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px')}>
            <div>
              <div style={css('font-size:16px;font-weight:700;color:#15191e;letter-spacing:-.2px')}>
                Audit Findings by Site and Month
              </div>
              <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;color:#8a9088;margin-top:2px")}>
                5 Sites (UTL1, UTL2A, UTL2B, UTL3A, UTL3T) · 12 Months · Year {vm.summaryYear}
              </div>
            </div>

            <div style={css('display:flex;align-items:center;gap:8px')}>
              <button
                onClick={toggleAll}
                style={css('display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:7px;border:1px solid #dde0d9;background:#fff;cursor:pointer;font-size:12px;font-weight:600;color:#4a504a;font-family:\'Archivo\',sans-serif')}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {allExpanded ? (
                    <polyline points="18 15 12 9 6 15" />
                  ) : (
                    <polyline points="6 9 12 15 18 9" />
                  )}
                </svg>
                {allExpanded ? 'Collapse All' : 'Expand All'}
              </button>

              <button
                onClick={handleExportExcel}
                style={css('display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:7px;border:1px solid #10b981;background:#f0fdf4;cursor:pointer;font-size:12px;font-weight:600;color:#047857;font-family:\'Archivo\',sans-serif')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14 2 14 8 20 8" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="8" y1="13" x2="16" y2="13" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="8" y1="17" x2="16" y2="17" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="10 9 9 9 8 9" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Export to Excel
              </button>
            </div>
          </div>

          {/* Matrix Table with Horizontal Scroll */}
          <div style={css('overflow-x:auto;border:1px solid #e7eae3;border-radius:10px')}>
            <div style={css('min-width:960px')}>
              {/* Header Row */}
              <div style={css(`display:grid;grid-template-columns:${gridCols};background:#f8faf6;padding:10px 14px;border-bottom:2px solid #e2e5de;font-size:11px;font-weight:700;color:#5c625c;font-family:'IBM Plex Mono',monospace;letter-spacing:.3px`)}>
                <div />
                {MONTHS.map((m) => (
                  <div key={m} style={css('text-align:right')}>{m}</div>
                ))}
                <div style={css('text-align:right;color:#2756d6')}>Full Year Total</div>
              </div>

              {/* 5 Collapsible Site Groups */}
              {TARGET_SITES.map((site) => {
                const isExpanded = expandedSites[site];
                const conf = SITE_CONFIG[site];
                const siteTotal = matrixData.siteFullYearTotals[site].total;

                return (
                  <div key={site} style={css('border-bottom:1px solid #e7eae3')}>
                    {/* Top-Level Site Header Row */}
                    <div
                      onClick={() => toggleSite(site)}
                      style={css(`display:grid;grid-template-columns:${gridCols};padding:10px 14px;background:#ffffff;align-items:center;cursor:pointer;user-select:none;font-size:12.5px;transition:background 0.15s`)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f9faf7')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                      <div style={css('display:flex;align-items:center;gap:8px')}>
                        <span style={css('display:flex;align-items:center;justify-content:center;width:16px;height:16px;color:#6b7280')}>
                          {isExpanded ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          )}
                        </span>
                        <span style={css(`font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;background:${conf.badgeBg};color:${conf.text};border:1px solid ${conf.border}`)}>
                          {site}
                        </span>
                        <span style={css('font-weight:600;color:#15191e;font-size:12.5px')}>
                          Findings
                        </span>
                      </div>

                      {MONTHS.map((_, mIdx) => (
                        <div key={mIdx} />
                      ))}

                      <div />
                    </div>

                    {/* Detailed Sub-Rows when Expanded */}
                    {isExpanded && (
                      <div style={css('background:#fafbfa;border-top:1px solid #f0f2eb')}>
                        {CATEGORIES.map((cat) => {
                          const catYearTotal = matrixData.siteFullYearTotals[site][cat.key];
                          return (
                            <div
                              key={cat.key}
                              style={css(`display:grid;grid-template-columns:${gridCols};padding:7px 14px;align-items:center;border-bottom:1px solid #f2f4ee;font-size:12px`)}
                            >
                              <div style={css('display:flex;align-items:center;gap:8px;padding-left:26px')}>
                                <span style={css(`width:6px;height:6px;border-radius:50%;background:${cat.dot}`)} />
                                <span style={css(`color:#4b5563;font-weight:500`)}>{cat.label}</span>
                              </div>

                              {MONTHS.map((_, mIdx) => {
                                const count = matrixData.siteData[site][cat.key][mIdx];
                                return (
                                  <div
                                    key={mIdx}
                                    style={css(`text-align:right;font-family:'IBM Plex Mono',monospace;font-size:11.5px;${count > 0 ? `font-weight:600;color:${cat.text}` : 'color:#a1a1aa'}`)}
                                  >
                                    {count}
                                  </div>
                                );
                              })}

                              <div style={css(`text-align:right;font-family:'IBM Plex Mono',monospace;font-size:11.5px;font-weight:700;${catYearTotal > 0 ? `color:${cat.text}` : 'color:#a1a1aa'}`)}>
                                {catYearTotal}
                              </div>
                            </div>
                          );
                        })}

                        {/* Total for this Site Sub-Row */}
                        <div style={css(`display:grid;grid-template-columns:${gridCols};padding:7px 14px;align-items:center;background:#f3f6f0;border-top:1px solid #e4e7df;font-size:12px;font-weight:700`)}>
                          <div style={css('padding-left:26px;color:#1e293b')}>
                            Total {site}
                          </div>
                          {MONTHS.map((_, mIdx) => {
                            const count = matrixData.siteMonthlyTotal[site][mIdx];
                            return (
                              <div
                                key={mIdx}
                                style={css(`text-align:right;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:700;${count > 0 ? 'color:#15191e' : 'color:#9ca3af'}`)}
                              >
                                {count}
                              </div>
                            );
                          })}
                          <div style={css(`text-align:right;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:800;${siteTotal > 0 ? 'color:#1e293b' : 'color:#9ca3af'}`)}>
                            {siteTotal}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom Summary Section (Grand Total Across All Sites) */}
              <div style={css('background:#f8faf6;border-top:2px solid #cbd5e1')}>
                {/* Grand Total Header Row */}
                <div style={css(`display:grid;grid-template-columns:${gridCols};padding:9px 14px;background:#eef1ea;align-items:center;font-size:11px;font-weight:700;color:#334155;font-family:'IBM Plex Mono',monospace;letter-spacing:.4px`)}>
                  <div>GRAND TOTAL ACROSS ALL SITES</div>
                  {MONTHS.map((m) => (
                    <div key={m} style={css('text-align:right;color:#64748b')}>-</div>
                  ))}
                  <div style={css('text-align:right;color:#64748b')}>-</div>
                </div>

                {/* Sub-rows for Category Grand Totals */}
                {CATEGORIES.map((cat) => {
                  const catYearTotal = matrixData.grandTotalFullYear[cat.key];
                  return (
                    <div
                      key={cat.key}
                      style={css(`display:grid;grid-template-columns:${gridCols};padding:7px 14px;align-items:center;border-bottom:1px solid #e6e9e1;font-size:12px`)}
                    >
                      <div style={css('display:flex;align-items:center;gap:8px;padding-left:14px')}>
                        <span style={css(`width:6px;height:6px;border-radius:50%;background:${cat.dot}`)} />
                        <span style={css('font-weight:600;color:#334155')}>Total {cat.label}</span>
                      </div>

                      {MONTHS.map((_, mIdx) => {
                        const count = matrixData.grandTotalMonthly[cat.key][mIdx];
                        return (
                          <div
                            key={mIdx}
                            style={css(`text-align:right;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;${count > 0 ? `color:${cat.text}` : 'color:#9ca3af'}`)}
                          >
                            {count}
                          </div>
                        );
                      })}

                      <div style={css(`text-align:right;font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:700;${catYearTotal > 0 ? `color:${cat.text}` : 'color:#9ca3af'}`)}>
                        {catYearTotal}
                      </div>
                    </div>
                  );
                })}

                {/* Overall Monthly Total (Highlight Row) */}
                <div style={css(`display:grid;grid-template-columns:${gridCols};padding:10px 14px;background:#e9ede5;border-top:2px solid #94a3b8;border-bottom:2px solid #94a3b8;align-items:center;font-size:12.5px;font-weight:800`)}>
                  <div style={css('color:#0f172a')}>
                    Overall Monthly Total
                  </div>

                  {MONTHS.map((_, mIdx) => {
                    const count = matrixData.overallMonthlyTotal[mIdx];
                    return (
                      <div
                        key={mIdx}
                        style={css(`text-align:right;font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:800;${count > 0 ? 'color:#0f172a' : 'color:#64748b'}`)}
                      >
                        {count}
                      </div>
                    );
                  })}

                  <div style={css('text-align:right;font-family:\'IBM Plex Mono\',monospace;font-size:14px;font-weight:900;color:#2756d6')}>
                    {matrixData.grandTotalFullYear.overall}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
