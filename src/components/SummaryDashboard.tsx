import { useState, useMemo, useRef, useEffect } from 'react';
import type { VM } from '../useScheduler';
import type { Assignment, SiteAuditResult } from '../types';
import { css } from '../ui';
import { isInternalAssignment, calculateCustomerAuditsCount } from '../types';

export const CANONICAL_SITE_ORDER = [
  'UTL1',
  'UTL2',
  'UTL2A',
  'UTL2B',
  'UTL3',
  'UTL3A',
  'UTL3T',
] as const;
export type CanonicalSite = typeof CANONICAL_SITE_ORDER[number];
type TargetSite = string;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const CATEGORIES = [
  { key: 'major' as const, label: 'Major', dot: '#d97706', text: '#b45309' },
  { key: 'minor' as const, label: 'Minor', dot: '#2563eb', text: '#1d4ed8' },
  { key: 'ofi' as const, label: 'OFI', dot: '#059669', text: '#047857' },
  { key: 'obs' as const, label: 'OBS', dot: '#7c3aed', text: '#6d28d9' },
  { key: 'findings' as const, label: 'Finding(s)', dot: '#dc2626', text: '#b91c1c' },
];

type CategoryKey = typeof CATEGORIES[number]['key'];

function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(100, 116, 139, ${alpha})`;
  let c = hex.trim().replace(/^#/, '');
  if (c.length === 3) {
    c = c.split('').map((ch) => ch + ch).join('');
  }
  if (c.length === 6) {
    const num = parseInt(c, 16);
    if (!isNaN(num)) {
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  if (c.length === 8) {
    const num = parseInt(c.slice(0, 6), 16);
    if (!isNaN(num)) {
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  if (hex.startsWith('rgb')) {
    return hex.replace(/rgb\((.*?)\)/, `rgba($1, ${alpha})`).replace(/rgba\((.*?),\s*[\d.]+\)/, `rgba($1, ${alpha})`);
  }
  return hex;
}

const DEFAULT_SITE_PALETTE: Record<string, { bg: string; text: string; border: string }> = {
  UTL1: { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' }, // soft red / rose
  UTL2: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' }, // soft green
  UTL2A: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' }, // soft emerald
  UTL2B: { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' }, // soft teal
  UTL3: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }, // soft blue
  UTL3A: { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' }, // soft blue / sky
  UTL3T: { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' }, // soft indigo / purple
};

interface SiteOptionLike {
  color?: string;
  [key: string]: unknown;
}

function getSiteBadgeStyle(
  site: string,
  siteColorOrConfig?: string | SiteOptionLike
): React.CSSProperties {
  const customColor =
    typeof siteColorOrConfig === 'string'
      ? siteColorOrConfig
      : siteColorOrConfig?.color;

  if (customColor && customColor.trim()) {
    const color = customColor.trim();
    return {
      backgroundColor: hexToRgba(color, 0.12),
      borderColor: hexToRgba(color, 0.32),
      color: color,
    };
  }

  const norm = normalizeToTargetSite(site) || site.trim().toUpperCase();
  const fallback = DEFAULT_SITE_PALETTE[norm] || {
    bg: '#f4f4f5',
    text: '#3f3f46',
    border: '#e4e4e7',
  };

  return {
    backgroundColor: fallback.bg,
    borderColor: fallback.border,
    color: fallback.text,
  };
}

function normalizeToTargetSite(siteKey: string): string {
  const s = siteKey.trim().toUpperCase().replace(/[\s-_]/g, '');
  if (s === 'UTL1' || s === 'U1') return 'UTL1';
  if (s === 'UTL2B' || s === 'U2B') return 'UTL2B';
  if (s === 'UTL2A' || s === 'U2A') return 'UTL2A';
  if (s === 'UTL2' || s === 'U2') return 'UTL2';
  if (s === 'UTL3B' || s === 'U3B') return 'UTL3B';
  if (s === 'UTL3T' || s === 'U3T') return 'UTL3T';
  if (s === 'UTL3A' || s === 'U3A') return 'UTL3A';
  if (s === 'UTL3' || s === 'U3') return 'UTL3';
  return siteKey.trim().toUpperCase();
}

function compareSites(a: string, b: string): number {
  const idxA = (CANONICAL_SITE_ORDER as readonly string[]).indexOf(a as CanonicalSite);
  const idxB = (CANONICAL_SITE_ORDER as readonly string[]).indexOf(b as CanonicalSite);

  if (idxA !== -1 && idxB !== -1) {
    return idxA - idxB;
  }
  if (idxA !== -1) return -1;
  if (idxB !== -1) return 1;
  return a.localeCompare(b);
}

export function SummaryDashboard({ vm }: { vm: VM }) {
  const [yearText, setYearText] = useState(String(vm.summaryYear));
  const commitYear = (v: string) => {
    const n = parseInt(v, 10);
    if (!isNaN(n)) vm.setSummaryYear(n);
  };

  // Dropdown state for Export Findings to Excel
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportDropdownOpen]);

  // State to track expand/collapse for each site (default all expanded)
  const [expandedSites, setExpandedSites] = useState<Record<string, boolean>>({
    UTL1: true,
    UTL2: true,
    UTL2A: true,
    UTL2B: true,
    UTL3: true,
    UTL3A: true,
    UTL3T: true,
  });

  const targetSitesList = useMemo<string[]>(() => {
    const set = new Set<string>();
    for (const s of CANONICAL_SITE_ORDER) {
      set.add(s);
    }
    if (vm.siteCodeOptions && vm.siteCodeOptions.length > 0) {
      for (const raw of vm.siteCodeOptions) {
        const norm = normalizeToTargetSite(raw);
        if (norm) set.add(norm);
      }
    }
    for (const a of vm.assignments || []) {
      if (a.results) {
        for (const k of Object.keys(a.results)) {
          const norm = normalizeToTargetSite(k);
          if (norm) set.add(norm);
        }
      }
      const rawSites = (a.site1 || a.site2 || '').split(/[/,]/).map((s) => s.trim()).filter(Boolean);
      for (const s of rawSites) {
        const norm = normalizeToTargetSite(s);
        if (norm) set.add(norm);
      }
    }
    return Array.from(set).sort(compareSites);
  }, [vm.siteCodeOptions, vm.assignments]);

  const allExpanded = targetSitesList.every((s) => expandedSites[s]);

  const toggleSite = (site: TargetSite) => {
    setExpandedSites((prev) => ({ ...prev, [site]: !prev[site] }));
  };

  const toggleAll = () => {
    const nextState = !allExpanded;
    const nextMap: Record<string, boolean> = {};
    targetSitesList.forEach((s) => { nextMap[s] = nextState; });
    setExpandedSites(nextMap as Record<TargetSite, boolean>);
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
    const siteData: Record<string, Record<CategoryKey, number[]>> = {};
    const siteMonthlyTotal: Record<string, number[]> = {};
    const siteFullYearTotals: Record<string, Record<CategoryKey | 'total', number>> = {};

    const ensureSite = (site: string) => {
      if (!siteData[site]) {
        siteData[site] = {
          major: Array(12).fill(0),
          minor: Array(12).fill(0),
          ofi: Array(12).fill(0),
          obs: Array(12).fill(0),
          findings: Array(12).fill(0),
        };
        siteMonthlyTotal[site] = Array(12).fill(0);
        siteFullYearTotals[site] = { major: 0, minor: 0, ofi: 0, obs: 0, findings: 0, total: 0 };
      }
    };

    for (const site of targetSitesList) {
      ensureSite(site);
    }

    // Group sibling assignments by unique appointment to avoid double counting multi-day appointments
    const apptMap = new Map<string, { month: number; year: number; results?: Record<string, SiteAuditResult>; raw: Assignment }>();

    for (const a of vm.assignments || []) {
      const key = a.seriesId || a.groupId || (a.order ? a.order : a.id);
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
          ensureSite(targetSite);
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
            ensureSite(targetSite);
            siteData[targetSite].major[m] += Number(appt.raw.major) || 0;
            siteData[targetSite].minor[m] += Number(appt.raw.minor) || 0;
            siteData[targetSite].ofi[m] += Number(appt.raw.ofi) || 0;
            siteData[targetSite].findings[m] += Number(appt.raw.request) || 0;
          }
        }
      }
    }

    // Site monthly aggregates and full year totals
    for (const site of targetSitesList) {
      ensureSite(site);
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

    // Grand totals across all configured sites
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
        for (const site of targetSitesList) {
          if (siteData[site]) {
            sum += siteData[site][cat.key][m];
          }
        }
        grandTotalMonthly[cat.key][m] = sum;
      }
      overallMonthlyTotal[m] = targetSitesList.reduce((acc, site) => acc + (siteMonthlyTotal[site]?.[m] || 0), 0);
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
  }, [vm.assignments, vm.summaryYear, targetSitesList]);

  const totalFindings = matrixData.grandTotalFullYear.overall;

  // Aggregate Audit Visits by Site and Month (0..11)
  const auditVisitsData = useMemo(() => {
    const siteVisits: Record<string, number[]> = {};
    const siteFullYearTotals: Record<string, number> = {};

    for (const site of targetSitesList) {
      siteVisits[site] = Array(12).fill(0);
      siteFullYearTotals[site] = 0;
    }

    const seenVisits = new Set<string>();

    for (const a of vm.assignments || []) {
      // Strictly only evaluate Customer Audit (CS) appointments
      if (isInternalAssignment(a) || a.sectionType === 'internal') continue;

      const d = new Date(2026, 5, 29 + a.week * 7 + a.day);
      if (d.getFullYear() !== vm.summaryYear) continue;

      const month = d.getMonth();
      if (month < 0 || month > 11) continue;

      const dateISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      // Identify the site(s) assigned to the appointment / day
      const rawSiteStr = (a.site1 || a.site2 || '').trim();
      const rawSites = rawSiteStr.split(/[/,]/).map((s) => s.trim()).filter(Boolean);

      for (const raw of rawSites) {
        const targetSite = normalizeToTargetSite(raw);
        if (!targetSite) continue;

        if (!siteVisits[targetSite]) {
          siteVisits[targetSite] = Array(12).fill(0);
          siteFullYearTotals[targetSite] = 0;
        }

        const seriesKey = a.seriesId || a.groupId || (a.order ? a.order : a.id);
        const visitKey = `${seriesKey}_${dateISO}_${targetSite}`;
        if (seenVisits.has(visitKey)) continue;
        seenVisits.add(visitKey);

        siteVisits[targetSite][month]++;
      }
    }

    for (const site of targetSitesList) {
      if (siteVisits[site]) {
        siteFullYearTotals[site] = siteVisits[site].reduce((a, b) => a + b, 0);
      }
    }

    const monthlyTotals = Array(12).fill(0);
    for (let m = 0; m < 12; m++) {
      for (const site of targetSitesList) {
        monthlyTotals[m] += siteVisits[site]?.[m] || 0;
      }
    }

    const grandTotal = monthlyTotals.reduce((a, b) => a + b, 0);

    return {
      siteVisits,
      siteFullYearTotals,
      monthlyTotals,
      grandTotal,
    };
  }, [vm.assignments, vm.summaryYear, targetSitesList]);

  // Export Audit Visits to Excel
  const handleExportVisitsExcel = async () => {
    // @ts-ignore
    const XLSX = (await import('xlsx-js-style')).default || (await import('xlsx-js-style'));

    const rows: (string | number)[][] = [];

    rows.push([`UTAC - Customer Audit Visits by Site (Year ${vm.summaryYear})`]);
    rows.push([]);

    const headers = ['Site', ...MONTHS, 'Full Year Total'];
    const headerRowIndex = rows.length;
    rows.push(headers);

    for (const site of targetSitesList) {
      rows.push([
        site,
        ...auditVisitsData.siteVisits[site],
        auditVisitsData.siteFullYearTotals[site],
      ]);
    }

    const totalRowIndex = rows.length;
    rows.push([
      'Total',
      ...auditVisitsData.monthlyTotals,
      auditVisitsData.grandTotal,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    // Style Title
    if (worksheet['A1']) {
      worksheet['A1'].s = {
        font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '1E3A8A' } },
        alignment: { horizontal: 'left', vertical: 'center' },
      };
    }

    // Style Header Row
    for (let col = 0; col < headers.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: '1E293B' } },
          alignment: { horizontal: col === 0 ? 'left' : 'right', vertical: 'center' },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          border: {
            top: { style: 'medium', color: { rgb: '94A3B8' } },
            bottom: { style: 'medium', color: { rgb: '94A3B8' } },
            left: { style: 'thin', color: { rgb: 'E2E8F0' } },
            right: { style: 'thin', color: { rgb: 'E2E8F0' } },
          },
        };
      }
    }

    // Style Site Data Rows
    for (let r = headerRowIndex + 1; r < totalRowIndex; r++) {
      for (let col = 0; col < headers.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c: col });
        if (worksheet[cellAddress]) {
          const val = worksheet[cellAddress].v;
          const isNum = typeof val === 'number';
          const isTotalCol = col === headers.length - 1;
          worksheet[cellAddress].s = {
            font: {
              name: 'Calibri',
              sz: 10,
              bold: isTotalCol || (isNum && val > 0),
              color: isNum && val === 0 ? { rgb: '94A3B8' } : (isTotalCol ? { rgb: '2563EB' } : { rgb: '0F172A' }),
            },
            alignment: { horizontal: col === 0 ? 'left' : 'right', vertical: 'center' },
            fill: isTotalCol ? { fgColor: { rgb: 'F8FAFC' } } : undefined,
            border: {
              bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
              left: { style: 'thin', color: { rgb: 'F1F5F9' } },
              right: { style: 'thin', color: { rgb: 'F1F5F9' } },
            },
          };
        }
      }
    }

    // Style Total Row
    for (let col = 0; col < headers.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: totalRowIndex, c: col });
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

    worksheet['!cols'] = [
      { wch: 18 },
      ...Array.from({ length: 12 }, () => ({ wch: 9 })),
      { wch: 15 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Visits ${vm.summaryYear}`);
    XLSX.writeFile(workbook, `audit-visits-${vm.summaryYear}.xlsx`);
  };

  const handleExportFindingsExcel = async (
    mode: 'all' | 'summary' | 'single',
    selectedSite?: string
  ) => {
    // @ts-ignore
    const XLSX = (await import('xlsx-js-style')).default || (await import('xlsx-js-style'));

    const headers = ['Site / Finding Category', ...MONTHS, 'Full Year Total'];
    const rows: (string | number)[][] = [];

    const siteHeaderRowIndices: number[] = [];
    const siteTotalRowIndices: number[] = [];
    let grandHeaderIdx = -1;
    let overallTotalIdx = -1;

    let filename = '';
    let sheetName = '';

    if (mode === 'all') {
      filename = `Audit_Findings_All_Sites_${vm.summaryYear}.xlsx`;
      sheetName = `Findings All Sites ${vm.summaryYear}`;
      rows.push([`UTAC - Audit Findings by Site - All Sites (Year ${vm.summaryYear})`]);
      rows.push([]);
      rows.push(headers);

      for (const site of targetSitesList) {
        siteHeaderRowIndices.push(rows.length);
        rows.push([site, ...Array(12).fill(''), '']);

        for (const cat of CATEGORIES) {
          rows.push([
            `    ${cat.label}`,
            ...(matrixData.siteData[site]?.[cat.key] || Array(12).fill(0)),
            matrixData.siteFullYearTotals[site]?.[cat.key] || 0,
          ]);
        }

        siteTotalRowIndices.push(rows.length);
        rows.push([
          `Total ${site}`,
          ...(matrixData.siteMonthlyTotal[site] || Array(12).fill(0)),
          matrixData.siteFullYearTotals[site]?.total || 0,
        ]);

        rows.push([]);
      }

      grandHeaderIdx = rows.length;
      rows.push(['Grand Total Across All Sites', ...Array(12).fill(''), '']);

      for (const cat of CATEGORIES) {
        rows.push([
          `    Total ${cat.label}`,
          ...matrixData.grandTotalMonthly[cat.key],
          matrixData.grandTotalFullYear[cat.key],
        ]);
      }

      overallTotalIdx = rows.length;
      rows.push([
        'Overall Grand Total',
        ...matrixData.overallMonthlyTotal,
        matrixData.grandTotalFullYear.overall,
      ]);
    } else if (mode === 'summary') {
      filename = `Audit_Findings_Summary_${vm.summaryYear}.xlsx`;
      sheetName = `Findings Summary ${vm.summaryYear}`;
      rows.push([`UTAC - Audit Findings Summary by Site (Year ${vm.summaryYear})`]);
      rows.push([]);
      rows.push(headers);

      for (const site of targetSitesList) {
        siteTotalRowIndices.push(rows.length);
        rows.push([
          `Total ${site}`,
          ...(matrixData.siteMonthlyTotal[site] || Array(12).fill(0)),
          matrixData.siteFullYearTotals[site]?.total || 0,
        ]);
      }

      rows.push([]);

      overallTotalIdx = rows.length;
      rows.push([
        'Overall Grand Total',
        ...matrixData.overallMonthlyTotal,
        matrixData.grandTotalFullYear.overall,
      ]);
    } else if (mode === 'single' && selectedSite) {
      filename = `Audit_Findings_${selectedSite}_${vm.summaryYear}.xlsx`;
      sheetName = `${selectedSite} ${vm.summaryYear}`;
      rows.push([`UTAC - Audit Findings - ${selectedSite} (Year ${vm.summaryYear})`]);
      rows.push([]);
      rows.push(headers);

      siteHeaderRowIndices.push(rows.length);
      rows.push([selectedSite, ...Array(12).fill(''), '']);

      for (const cat of CATEGORIES) {
        rows.push([
          `    ${cat.label}`,
          ...(matrixData.siteData[selectedSite]?.[cat.key] || Array(12).fill(0)),
          matrixData.siteFullYearTotals[selectedSite]?.[cat.key] || 0,
        ]);
      }

      siteTotalRowIndices.push(rows.length);
      rows.push([
        `Total ${selectedSite}`,
        ...(matrixData.siteMonthlyTotal[selectedSite] || Array(12).fill(0)),
        matrixData.siteFullYearTotals[selectedSite]?.total || 0,
      ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const headerRowIndex = 2;

    // Style Title Cell
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (worksheet[titleCell]) {
      worksheet[titleCell].s = {
        font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '0F172A' } },
        alignment: { horizontal: 'left', vertical: 'center' },
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
    if (grandHeaderIdx >= 0) {
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
    }

    // Style Overall Monthly Total
    if (overallTotalIdx >= 0) {
      for (let col = 0; col < headers.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: overallTotalIdx, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            font: {
              name: 'Calibri',
              sz: 11,
              bold: true,
              color: col === headers.length - 1 ? { rgb: '2563EB' } : { rgb: '0F172A' },
            },
            alignment: { horizontal: col === 0 ? 'left' : 'right', vertical: 'center' },
            fill: { fgColor: { rgb: 'E2E8F0' } },
            border: {
              top: { style: 'medium', color: { rgb: '475569' } },
              bottom: { style: 'double', color: { rgb: '0F172A' } },
            },
          };
        }
      }
    }

    // Style all standard data rows
    for (let r = headerRowIndex + 1; r < rows.length; r++) {
      if (
        siteHeaderRowIndices.includes(r) ||
        siteTotalRowIndices.includes(r) ||
        r === grandHeaderIdx ||
        r === overallTotalIdx
      ) {
        continue;
      }
      if (!rows[r] || rows[r].length === 0) continue;

      for (let col = 0; col < headers.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c: col });
        if (worksheet[cellAddress] && !worksheet[cellAddress].s) {
          const val = worksheet[cellAddress].v;
          const isNum = typeof val === 'number';
          worksheet[cellAddress].s = {
            font: {
              name: 'Calibri',
              sz: 10,
              bold: col === headers.length - 1 && isNum && val > 0,
              color: isNum && val === 0 ? { rgb: '94A3B8' } : { rgb: '334155' },
            },
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
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
    XLSX.writeFile(workbook, filename);
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
        <div className="summary-kpi-grid">
          {/* Card 1: TOTAL AUDITS */}
          <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:16px;padding:20px 22px;box-shadow:0 1px 3px rgba(0,0,0,0.02);display:flex;flex-direction:column;justify-content:space-between')}>
            <div>
              <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#8a9088;text-transform:uppercase;letter-spacing:0.5px")}>Total Audits</div>
              <div style={css("font-size:28px;font-weight:800;color:#15191e;margin-top:4px;line-height:1.1;font-family:'Archivo',sans-serif")}>{customerAuditsCount + internalAuditsCount}</div>
            </div>
            <div style={css('display:flex;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap;min-height:28px;user-select:none;-webkit-user-select:none;cursor:default')}>
              <span style={css("display:inline-flex;align-items:center;padding:4px 12px;border-radius:8px;background:#eff6ff;color:#1d4ed8;font-size:13.5px;font-weight:500;font-family:'Archivo',sans-serif;border:1px solid #bfdbfe;line-height:1.2;user-select:none;cursor:default")}>
                {customerAuditsCount} Customer Audit
              </span>
              <span style={css('color:#d4d4d8;font-size:14px;user-select:none;cursor:default')}>·</span>
              <span style={css("display:inline-flex;align-items:center;padding:4px 12px;border-radius:8px;background:#ecfdf5;color:#047857;font-size:13.5px;font-weight:500;font-family:'Archivo',sans-serif;border:1px solid #a7f3d0;line-height:1.2;user-select:none;cursor:default")}>
                {internalAuditsCount} Internal Audit
              </span>
            </div>
          </div>

          {/* Card 2: TOTAL VISITS */}
          <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:16px;padding:20px 22px;box-shadow:0 1px 3px rgba(0,0,0,0.02);display:flex;flex-direction:column;justify-content:space-between')}>
            <div>
              <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#8a9088;text-transform:uppercase;letter-spacing:0.5px")}>Total Visits</div>
              <div style={css("font-size:28px;font-weight:800;color:#15191e;margin-top:4px;line-height:1.1;font-family:'Archivo',sans-serif")}>{auditVisitsData.grandTotal}</div>
            </div>
            <div style={css('display:flex;align-items:center;gap:6px;margin-top:14px;min-height:28px')}>
              <span style={css("font-size:11.5px;color:#71786e;font-family:'Archivo',sans-serif;font-weight:500")}>
                Customer site-days in {vm.summaryYear}
              </span>
            </div>
          </div>

          {/* Card 3: TOTAL FINDINGS */}
          <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:16px;padding:20px 22px;box-shadow:0 1px 3px rgba(0,0,0,0.02);display:flex;flex-direction:column;justify-content:space-between')}>
            <div>
              <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#8a9088;text-transform:uppercase;letter-spacing:0.5px")}>Total Findings</div>
              <div style={css("font-size:28px;font-weight:800;color:#15191e;margin-top:4px;line-height:1.1;font-family:'Archivo',sans-serif")}>{totalFindings}</div>
            </div>
            <div style={css('display:flex;align-items:center;gap:6px;margin-top:14px;min-height:28px')}>
              <span style={css("font-size:11.5px;color:#71786e;font-family:'Archivo',sans-serif;font-weight:500")}>
                Across 5 sites (Major, Minor, OFI, OBS, Findings)
              </span>
            </div>
          </div>
        </div>

        {/* Audit Visits by Site Matrix */}
        <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.02);margin-bottom:20px')}>
          {/* Card Header & Controls */}
          <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px')}>
            <div>
              <div style={css('font-size:16px;font-weight:700;color:#15191e;letter-spacing:-.2px')}>
                Audit Visits by Site
              </div>
              <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;color:#8a9088;margin-top:2px")}>
                Customer Audits (CS) · 5 Sites (UTL1, UTL2A, UTL2B, UTL3A, UTL3T) · 12 Months · Year {vm.summaryYear}
              </div>
            </div>

            <div style={css('display:flex;align-items:center;gap:8px')}>
              <button
                type="button"
                onClick={handleExportVisitsExcel}
                style={css("display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:7px;border:1px solid #10b981;background:#f0fdf4;cursor:pointer;font-size:12px;font-weight:600;color:#047857;font-family:'Archivo',sans-serif")}
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

              {/* Sites Rows */}
              {targetSitesList.map((site) => {
                const siteColor = vm.siteColors?.[site] || vm.siteColors?.[normalizeToTargetSite(site) || site];
                const badgeStyle = getSiteBadgeStyle(site, siteColor);
                const siteTotal = auditVisitsData.siteFullYearTotals[site];

                return (
                  <div
                    key={site}
                    style={css(`display:grid;grid-template-columns:${gridCols};padding:10px 14px;background:#ffffff;align-items:center;font-size:12.5px;border-bottom:1px solid #e7eae3;transition:background 0.15s`)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f9faf7')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                  >
                    <div style={css('display:flex;align-items:center;gap:8px')}>
                      <span
                        style={{
                          ...badgeStyle,
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          display: 'inline-flex',
                          alignItems: 'center',
                          lineHeight: '1.2',
                          userSelect: 'none',
                          transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                        }}
                      >
                        {site}
                      </span>
                    </div>

                    {MONTHS.map((_, mIdx) => {
                      const count = auditVisitsData.siteVisits[site][mIdx];
                      return (
                        <div
                          key={mIdx}
                          style={css(`text-align:right;font-family:'IBM Plex Mono',monospace;font-size:12px;color:${count > 0 ? '#15191e' : '#b4b9ae'};font-weight:${count > 0 ? '700' : '400'}`)}
                        >
                          {count}
                        </div>
                      );
                    })}

                    <div style={css(`text-align:right;font-family:'IBM Plex Mono',monospace;font-size:12.5px;font-weight:700;color:${siteTotal > 0 ? '#2756d6' : '#b4b9ae'}`)}>
                      {siteTotal}
                    </div>
                  </div>
                );
              })}

              {/* Total Bottom Row */}
              <div style={css(`display:grid;grid-template-columns:${gridCols};padding:11px 14px;background:#f8faf6;align-items:center;border-top:2px solid #e2e5de;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:#15191e`)}>
                <div style={css('text-transform:uppercase;letter-spacing:.5px;font-weight:800')}>Total</div>

                {MONTHS.map((_, mIdx) => {
                  const mSum = auditVisitsData.monthlyTotals[mIdx];
                  return (
                    <div
                      key={mIdx}
                      style={css(`text-align:right;font-size:12px;font-weight:800;color:${mSum > 0 ? '#15191e' : '#b4b9ae'}`)}
                    >
                      {mSum}
                    </div>
                  );
                })}

                <div style={css('text-align:right;font-size:13px;font-weight:800;color:#2756d6')}>
                  {auditVisitsData.grandTotal}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Annual Audit Findings by Site Matrix */}
        <div style={css('background:#fff;border:1px solid #e2e5de;border-radius:14px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.02)')}>
          {/* Card Header & Controls */}
          <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px')}>
            <div>
              <div style={css('font-size:16px;font-weight:700;color:#15191e;letter-spacing:-.2px')}>
                Audit Findings by Site
              </div>
              <div style={css("font-family:'IBM Plex Mono',monospace;font-size:11px;color:#8a9088;margin-top:2px")}>
                {targetSitesList.length} Sites ({targetSitesList.join(', ')}) · 12 Months · Year {vm.summaryYear}
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

              {/* Export to Excel Dropdown Menu */}
              <div ref={exportDropdownRef} style={css('position:relative;display:inline-block')}>
                <button
                  type="button"
                  onClick={() => setExportDropdownOpen((prev) => !prev)}
                  style={css(
                    'display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:7px;border:1px solid #10b981;background:#f0fdf4;cursor:pointer;font-size:12px;font-weight:600;color:#047857;font-family:\'Archivo\',sans-serif;transition:all 0.15s ease'
                  )}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#dcfce7';
                    e.currentTarget.style.borderColor = '#059669';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f0fdf4';
                    e.currentTarget.style.borderColor = '#10b981';
                  }}
                  aria-haspopup="true"
                  aria-expanded={exportDropdownOpen}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14 2 14 8 20 8" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="8" y1="13" x2="16" y2="13" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="8" y1="17" x2="16" y2="17" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="10 9 9 9 8 9" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Export to Excel</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#047857"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: exportDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {exportDropdownOpen && (
                  <div
                    style={css(
                      'position:absolute;right:0;top:calc(100% + 4px);z-index:50;min-width:260px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1),0 8px 10px -6px rgba(0,0,0,0.1);padding:6px;font-family:\'Archivo\',sans-serif'
                    )}
                  >
                    {/* Option 1: Full Matrix */}
                    <button
                      type="button"
                      onClick={() => {
                        setExportDropdownOpen(false);
                        handleExportFindingsExcel('all');
                      }}
                      style={css(
                        'width:100%;text-align:left;display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:6px;border:none;background:transparent;cursor:pointer;font-size:12.5px;font-weight:600;color:#1e293b;transition:background 0.12s'
                      )}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '2px', flexShrink: 0 }}>
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                        <line x1="3" y1="15" x2="21" y2="15"/>
                        <line x1="9" y1="3" x2="9" y2="21"/>
                        <line x1="15" y1="3" x2="15" y2="21"/>
                      </svg>
                      <div>
                        <div>Export All Sites (Full Matrix)</div>
                        <div style={css('font-size:11px;font-weight:400;color:#64748b;margin-top:1px')}>
                          Complete 12-month report across all canonical sites
                        </div>
                      </div>
                    </button>

                    {/* Option 2: Summary Only */}
                    <button
                      type="button"
                      onClick={() => {
                        setExportDropdownOpen(false);
                        handleExportFindingsExcel('summary');
                      }}
                      style={css(
                        'width:100%;text-align:left;display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:6px;border:none;background:transparent;cursor:pointer;font-size:12.5px;font-weight:600;color:#1e293b;transition:background 0.12s'
                      )}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '2px', flexShrink: 0 }}>
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                      </svg>
                      <div>
                        <div>Export Summary Only</div>
                        <div style={css('font-size:11px;font-weight:400;color:#64748b;margin-top:1px')}>
                          Subtotals per site &amp; overall grand total
                        </div>
                      </div>
                    </button>

                    {/* Divider Line */}
                    <div style={css('height:1px;background:#e2e8f0;margin:6px 0')} />
                    <div style={css('padding:4px 10px 2px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px')}>
                      Individual Sites
                    </div>

                    {/* Individual Sites list */}
                    {targetSitesList.map((site) => (
                      <button
                        key={site}
                        type="button"
                        onClick={() => {
                          setExportDropdownOpen(false);
                          handleExportFindingsExcel('single', site);
                        }}
                        style={css(
                          'width:100%;text-align:left;display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:6px;border:none;background:transparent;cursor:pointer;font-size:12px;font-weight:500;color:#334155;transition:background 0.12s'
                        )}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={css('display:inline-block;width:6px;height:6px;border-radius:50%;background:#10b981')} />
                        <span>Export {site} only</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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

              {/* Collapsible Site Groups */}
              {targetSitesList.map((site) => {
                const isExpanded = expandedSites[site];
                const siteColor = vm.siteColors?.[site] || vm.siteColors?.[normalizeToTargetSite(site) || site];
                const badgeStyle = getSiteBadgeStyle(site, siteColor);
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
                        <span
                          style={{
                            ...badgeStyle,
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            display: 'inline-flex',
                            alignItems: 'center',
                            lineHeight: '1.2',
                            userSelect: 'none',
                            transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                          }}
                        >
                          {site}
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
