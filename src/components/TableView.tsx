import { useState, useMemo } from 'react';
import type { VM } from '../useScheduler';
import type { Assignment } from '../types';
import { isInternalAssignment, calculateAuditStats, normalizeSite, normalizeSites, getSiteOrderIndex } from '../types';
import { css, HButton } from '../ui';

interface TableRowData {
  id: string;
  assignment: Assignment;
  dateObj: Date;
  dateStr: string;
  dayName: string;
  auditType: 'Customer Audit' | 'Internal Audit';
  customer: string;
  site: string;
  standard: string;
  auditCategory: string;
  purpose: string;
  targetPackage: string;
  customerNames: string;
  auditor: string;
}

type SortColumn = 'date' | 'auditType' | 'customer' | 'site' | 'standard' | 'auditCategory' | 'purpose' | 'targetPackage' | 'customerNames' | 'auditor';

function TableMultiSelectFilter({
  label,
  allLabel,
  options,
  selected,
  onChange,
}: {
  label: string;
  allLabel: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = selected.length > 0;

  let displayLabel = allLabel;
  if (selected.length === 1) {
    displayLabel = selected[0];
  } else if (selected.length > 1) {
    displayLabel = `${label} (${selected.length})`;
  }

  const handleToggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((x) => x !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([...options]);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div style={css('position:relative')}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={css(
          'display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;border:1px solid ' +
            (active ? '#2756d6' : '#dde0d9') +
            ';background:' +
            (active ? '#eef2fd' : '#fff') +
            ';font-size:12px;font-weight:' +
            (active ? '600' : '500') +
            ';color:' +
            (active ? '#2756d6' : '#23282a') +
            ";cursor:pointer;font-family:'Archivo',sans-serif;transition:all .12s ease;white-space:nowrap"
        )}
      >
        <span
          title={displayLabel}
          style={css('max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}
        >
          {displayLabel}
        </span>
        {active && (
          <span
            role="button"
            onClick={handleClear}
            title="Clear filter"
            style={css(
              'display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:#2756d6;color:#fff;font-size:10px;line-height:1;margin-left:2px;cursor:pointer'
            )}
          >
            ×
          </span>
        )}
        <span style={css('font-size:9px;color:' + (active ? '#2756d6' : '#8a9088'))}>▾</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={css('position:fixed;inset:0;z-index:99')} />
          <div
            style={css(
              'position:absolute;top:100%;left:0;z-index:100;margin-top:4px;background:#fff;border:1px solid #dde0d9;border-radius:9px;box-shadow:0 6px 20px rgba(0,0,0,.15);min-width:180px;max-width:280px;overflow:hidden'
            )}
          >
            {/* Quick Actions Header: Select All | Clear */}
            <div
              style={css(
                'display:flex;align-items:center;justify-content:space-between;padding:7px 10px;background:#f8f9f7;border-bottom:1px solid #edf0ea;font-size:11px'
              )}
            >
              <button
                type="button"
                onClick={handleSelectAll}
                style={css(
                  "background:none;border:none;color:#2756d6;font-size:11px;font-weight:600;cursor:pointer;padding:2px 4px;font-family:'Archivo',sans-serif"
                )}
              >
                Select All
              </button>
              <span style={css('color:#d4d8d1')}>|</span>
              <button
                type="button"
                onClick={handleClear}
                style={css(
                  "background:none;border:none;color:#7a807a;font-size:11px;font-weight:600;cursor:pointer;padding:2px 4px;font-family:'Archivo',sans-serif"
                )}
              >
                Clear
              </button>
            </div>

            {/* Options list */}
            <div style={css('max-height:220px;overflow-y:auto;padding:4px')}>
              {options.length === 0 ? (
                <div style={css('padding:10px;text-align:center;color:#8a9088;font-size:11.5px;font-style:italic')}>
                  No options
                </div>
              ) : (
                options.map((opt) => {
                  const isChecked = selected.includes(opt);
                  return (
                    <div
                      key={opt}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleToggle(opt)}
                      style={css(
                        "display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:5px;cursor:pointer;font-size:11.5px;font-family:'Archivo',sans-serif;color:#23282a;user-select:none;transition:background .1s ease;" +
                          (isChecked ? 'background:#eef2fd;font-weight:600;' : 'background:#fff;font-weight:400;')
                      )}
                    >
                      <span
                        style={css(
                          'width:14px;height:14px;border-radius:3px;border:1px solid ' +
                            (isChecked ? '#2756d6' : '#cdd2c9') +
                            ';background:' +
                            (isChecked ? '#2756d6' : '#fff') +
                            ';display:flex;align-items:center;justify-content:center;font-size:9.5px;color:#fff;flex-shrink:0'
                        )}
                      >
                        {isChecked ? '✓' : ''}
                      </span>
                      <span
                        title={opt}
                        style={css('white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:230px')}
                      >
                        {opt}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function TableView({ vm }: { vm: VM }) {
  // Filters state
  const [search, setSearch] = useState('');
  const [auditTypeFilter, setAuditTypeFilter] = useState<'ALL' | 'Customer Audit' | 'Internal Audit'>('ALL');
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [selectedHosts, setSelectedHosts] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sorting state
  const [sortCol, setSortCol] = useState<SortColumn>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'ALL'>(25);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Engineers map for lookup
  const engMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of vm.engineers) {
      map.set(e.id, e.name);
    }
    return map;
  }, [vm.engineers]);

  // Transform all assignments into 7-column table records
  const allRows: TableRowData[] = useMemo(() => {
    const list: TableRowData[] = [];
    const baseDate = new Date(2026, 5, 29);

    for (const a of vm.assignments) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + (a.week || 0) * 7 + (a.day || 0));

      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      const dateStr = `${dd}/${mm}/${yyyy}`;
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[d.getDay()];

      const isInternal = isInternalAssignment(a);
      const auditType: 'Customer Audit' | 'Internal Audit' = isInternal ? 'Internal Audit' : 'Customer Audit';
      const customer = isInternal ? '' : (a.customer || '');
      const site = normalizeSites((isInternal ? (a.site2 || a.site1) : (a.site1 || a.site2)) || '');
      const standard = (isInternal ? (a.department2 || a.department1) : (a.department1 || a.department2)) || '';
      const auditCategory = isInternal ? (a.auditCategory || '') : '';
      const purpose = (isInternal ? (a.area || a.purpose) : (a.purpose || '')) || '';
      const targetPackage = a.targetPackage || '';
      const customerNames = a.customerNames || '';
      const auditor = (isInternal ? (a.auditor2 || a.auditor1) : (a.auditor1 || a.auditor2)) || (engMap.get(a.eng) || '');

      list.push({
        id: a.id,
        assignment: a,
        dateObj: d,
        dateStr,
        dayName,
        auditType,
        customer,
        site,
        standard,
        auditCategory,
        purpose,
        targetPackage,
        customerNames,
        auditor,
      });
    }

    return list;
  }, [vm.assignments, engMap]);

  // Collect unique filter options from live data
  const filterOptions = useMemo(() => {
    const customers = new Set<string>();
    const standards = new Set<string>();
    const auditCategories = new Set<string>();
    const targetPackages = new Set<string>();
    const customerNames = new Set<string>();
    const auditors = new Set<string>();

    for (const r of allRows) {
      if (r.customer && r.customer.trim()) customers.add(r.customer.trim());
      if (r.standard) {
        r.standard.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => standards.add(s));
      }
      if (r.auditCategory && r.auditCategory.trim()) auditCategories.add(r.auditCategory.trim());
      if (r.targetPackage) {
        r.targetPackage.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => targetPackages.add(s));
      }
      if (r.customerNames) {
        r.customerNames.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => customerNames.add(s));
      }
      if (r.auditor) {
        r.auditor.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => auditors.add(s));
      }
    }

    const sortByMasterOrder = (items: Iterable<string>, masterOrder?: readonly string[]) => {
      const arr = Array.from(items);
      if (!masterOrder || masterOrder.length === 0) {
        return arr.sort((a, b) => a.localeCompare(b));
      }
      const orderMap = new Map<string, number>();
      masterOrder.forEach((item, index) => {
        orderMap.set(item.trim().toLowerCase(), index);
      });
      return arr.sort((a, b) => {
        const idxA = orderMap.has(a.trim().toLowerCase()) ? orderMap.get(a.trim().toLowerCase())! : 9999;
        const idxB = orderMap.has(b.trim().toLowerCase()) ? orderMap.get(b.trim().toLowerCase())! : 9999;
        if (idxA !== idxB) return idxA - idxB;
        return a.localeCompare(b);
      });
    };

    return {
      customers: sortByMasterOrder(customers, vm.customerOptions),
      standards: sortByMasterOrder(standards, vm.standardFilterOptions),
      auditCategories: sortByMasterOrder(auditCategories, vm.auditCategoryFilterOptions),
      targetPackages: sortByMasterOrder(targetPackages, vm.targetPackageFilterOptions),
      customerNames: sortByMasterOrder(customerNames, vm.customerNameFilterOptions),
      auditors: sortByMasterOrder(auditors, vm.auditorOptions),
    };
  }, [allRows, vm.customerOptions, vm.standardFilterOptions, vm.auditCategoryFilterOptions, vm.targetPackageFilterOptions, vm.customerNameFilterOptions, vm.auditorOptions]);

  // Apply Search & Filters
  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      // Global text search across all columns
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const match =
          r.dateStr.toLowerCase().includes(q) ||
          r.dayName.toLowerCase().includes(q) ||
          r.auditType.toLowerCase().includes(q) ||
          r.customer.toLowerCase().includes(q) ||
          r.site.toLowerCase().includes(q) ||
          r.standard.toLowerCase().includes(q) ||
          r.auditCategory.toLowerCase().includes(q) ||
          r.purpose.toLowerCase().includes(q) ||
          r.auditor.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Audit Type filter
      if (auditTypeFilter !== 'ALL' && r.auditType !== auditTypeFilter) {
        return false;
      }

      // Site filter (matching any individual site part of composite rows against canonical sites)
      if (selectedSites.length > 0) {
        const rowSites = (r.site || '').split(/[/,]/).map((s) => s.trim()).filter(Boolean);
        const matchesSite = rowSites.some((s) => selectedSites.includes(s) || selectedSites.some((sel) => sel.toLowerCase() === s.toLowerCase()));
        if (!matchesSite) return false;
      }

      // Standard filter (multi-select)
      if (selectedStandards.length > 0) {
        const rowStds = (r.standard || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
        const matchesStandard = rowStds.some((s) => selectedStandards.map((x) => x.toLowerCase()).includes(s));
        if (!matchesStandard) return false;
      }

      // Audit Category filter (multi-select)
      if (selectedCategories.length > 0) {
        const cat = (r.auditCategory || '').trim().toLowerCase();
        const matchesCategory = selectedCategories.map((c) => c.toLowerCase()).includes(cat);
        if (!matchesCategory) return false;
      }

      // Target Package filter (multi-select)
      if (selectedPackages.length > 0) {
        const rowPkgs = (r.targetPackage || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
        const matchesPackage = rowPkgs.some((p) => selectedPackages.map((x) => x.toLowerCase()).includes(p));
        if (!matchesPackage) return false;
      }

      // Customer (Company) filter (multi-select)
      if (selectedCustomers.length > 0) {
        const cust = (r.customer || '').trim().toLowerCase();
        const matchesCustomer = selectedCustomers.map((c) => c.toLowerCase()).includes(cust);
        if (!matchesCustomer) return false;
      }

      // Auditor / QMS Host filter (multi-select)
      if (selectedHosts.length > 0) {
        const rowAuds = (r.auditor || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
        const matchesHost = rowAuds.some((a) => selectedHosts.map((x) => x.toLowerCase()).includes(a));
        if (!matchesHost) return false;
      }

      // Date range filter
      if (dateFrom) {
        const fromD = new Date(dateFrom + 'T00:00:00');
        if (r.dateObj < fromD) return false;
      }
      if (dateTo) {
        const toD = new Date(dateTo + 'T23:59:59');
        if (r.dateObj > toD) return false;
      }

      return true;
    });
  }, [allRows, search, auditTypeFilter, selectedSites, selectedStandards, selectedCategories, selectedPackages, selectedCustomers, selectedHosts, dateFrom, dateTo]);

  // Apply Sorting
  const sortedRows = useMemo(() => {
    const getMasterIndex = (val: string, masterList?: readonly string[] | string[]) => {
      if (!val) return 9999;
      if (!masterList || masterList.length === 0) return 9999;
      const first = val.split(/[,/]/)[0].trim().toLowerCase();
      const idx = masterList.findIndex((item) => item.trim().toLowerCase() === first);
      return idx !== -1 ? idx : 9999;
    };

    return [...filteredRows].sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'date') {
        cmp = a.dateObj.getTime() - b.dateObj.getTime();
      } else if (sortCol === 'site') {
        const idxA = getSiteOrderIndex(a.site, vm.siteCodeOptions);
        const idxB = getSiteOrderIndex(b.site, vm.siteCodeOptions);
        if (idxA !== idxB) {
          cmp = idxA - idxB;
        } else {
          cmp = (a.site || '').localeCompare(b.site || '');
        }
      } else if (sortCol === 'standard') {
        const idxA = getMasterIndex(a.standard, vm.standardFilterOptions);
        const idxB = getMasterIndex(b.standard, vm.standardFilterOptions);
        if (idxA !== idxB) {
          cmp = idxA - idxB;
        } else {
          cmp = (a.standard || '').localeCompare(b.standard || '');
        }
      } else if (sortCol === 'customer') {
        const idxA = getMasterIndex(a.customer, vm.customerOptions);
        const idxB = getMasterIndex(b.customer, vm.customerOptions);
        if (idxA !== idxB) {
          cmp = idxA - idxB;
        } else {
          cmp = (a.customer || '').localeCompare(b.customer || '');
        }
      } else if (sortCol === 'auditCategory') {
        const idxA = getMasterIndex(a.auditCategory, vm.auditCategoryFilterOptions);
        const idxB = getMasterIndex(b.auditCategory, vm.auditCategoryFilterOptions);
        if (idxA !== idxB) {
          cmp = idxA - idxB;
        } else {
          cmp = (a.auditCategory || '').localeCompare(b.auditCategory || '');
        }
      } else if (sortCol === 'purpose') {
        const idxA = getMasterIndex(a.purpose, vm.purposeOptions);
        const idxB = getMasterIndex(b.purpose, vm.purposeOptions);
        if (idxA !== idxB) {
          cmp = idxA - idxB;
        } else {
          cmp = (a.purpose || '').localeCompare(b.purpose || '');
        }
      } else if (sortCol === 'targetPackage') {
        const idxA = getMasterIndex(a.targetPackage, vm.targetPackageFilterOptions);
        const idxB = getMasterIndex(b.targetPackage, vm.targetPackageFilterOptions);
        if (idxA !== idxB) {
          cmp = idxA - idxB;
        } else {
          cmp = (a.targetPackage || '').localeCompare(b.targetPackage || '');
        }
      } else if (sortCol === 'customerNames') {
        const idxA = getMasterIndex(a.customerNames, vm.customerNameFilterOptions);
        const idxB = getMasterIndex(b.customerNames, vm.customerNameFilterOptions);
        if (idxA !== idxB) {
          cmp = idxA - idxB;
        } else {
          cmp = (a.customerNames || '').localeCompare(b.customerNames || '');
        }
      } else if (sortCol === 'auditor') {
        const idxA = getMasterIndex(a.auditor, vm.masterAuditorOptions);
        const idxB = getMasterIndex(b.auditor, vm.masterAuditorOptions);
        if (idxA !== idxB) {
          cmp = idxA - idxB;
        } else {
          cmp = (a.auditor || '').localeCompare(b.auditor || '');
        }
      } else {
        const valA = (a[sortCol] || '').toLowerCase();
        const valB = (b[sortCol] || '').toLowerCase();
        cmp = valA.localeCompare(valB);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [
    filteredRows,
    sortCol,
    sortDir,
    vm.siteCodeOptions,
    vm.standardFilterOptions,
    vm.customerOptions,
    vm.auditCategoryFilterOptions,
    vm.purposeOptions,
    vm.targetPackageFilterOptions,
    vm.customerNameFilterOptions,
    vm.masterAuditorOptions,
  ]);

  // Apply Pagination
  const totalEntries = sortedRows.length;
  const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalEntries / (pageSize as number)));
  const currentPage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    if (pageSize === 'ALL') return sortedRows;
    const start = (currentPage - 1) * (pageSize as number);
    return sortedRows.slice(start, start + (pageSize as number));
  }, [sortedRows, currentPage, pageSize]);

  // Stats calculation (Consecutive days per customer counted as 1 visit)
  const stats = useMemo(() => {
    const auditStats = calculateAuditStats(allRows);
    const allAuditors = new Set<string>();
    const allSites = new Set<string>();
    for (const r of allRows) {
      if (r.auditor) {
        r.auditor.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => allAuditors.add(s));
      }
      if (r.site) {
        r.site.split(/[/,]/).map((s) => s.trim()).filter(Boolean).forEach((s) => allSites.add(s));
      }
    }
    return {
      total: auditStats.totalAudits,
      totalRecords: allRows.length,
      customerCount: auditStats.customerAudits,
      internalCount: auditStats.internalAudits,
      uniqueSites: allSites.size,
      uniqueAuditors: allAuditors.size,
    };
  }, [allRows]);

  const filteredStats = useMemo(() => {
    const auditStats = calculateAuditStats(filteredRows);
    const filteredAuditors = new Set<string>();
    const filteredSites = new Set<string>();
    for (const r of filteredRows) {
      if (r.auditor) {
        r.auditor.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => filteredAuditors.add(s));
      }
      if (r.site) {
        r.site.split(/[/,]/).map((s) => s.trim()).filter(Boolean).forEach((s) => filteredSites.add(s));
      }
    }
    return {
      total: auditStats.totalAudits,
      totalRecords: filteredRows.length,
      customerCount: auditStats.customerAudits,
      internalCount: auditStats.internalAudits,
      uniqueSites: filteredSites.size,
      uniqueAuditors: filteredAuditors.size,
    };
  }, [filteredRows]);

  const hasActiveFilters =
    search.trim() !== '' ||
    auditTypeFilter !== 'ALL' ||
    selectedSites.length > 0 ||
    selectedStandards.length > 0 ||
    selectedCategories.length > 0 ||
    selectedPackages.length > 0 ||
    selectedCustomers.length > 0 ||
    selectedHosts.length > 0 ||
    dateFrom !== '' ||
    dateTo !== '';

  const handleResetFilters = () => {
    setSearch('');
    setAuditTypeFilter('ALL');
    setSelectedSites([]);
    setSelectedStandards([]);
    setSelectedCategories([]);
    setSelectedPackages([]);
    setSelectedCustomers([]);
    setSelectedHosts([]);
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
    setPage(1);
  };

  // CSV Export with exact 7 columns and UTF-8 BOM
  const handleExportCSV = () => {
    const headers = ['DD/MM/YYYY', 'Audit Type', 'Customer', 'Site', 'Standard', 'Audit Category', 'Purpose', 'Target Package', 'Customer Name', 'QMS Host'];
    const rows = sortedRows.map((r) => [
      r.dateStr,
      r.auditType,
      r.customer,
      r.site,
      r.standard,
      r.auditCategory,
      r.purpose,
      r.targetPackage,
      r.customerNames,
      r.auditor,
    ]);

    const csvContent =
      '\uFEFF' + // UTF-8 BOM for Microsoft Excel
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => {
              const str = String(cell ?? '');
              if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            })
            .join(',')
        )
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayISO = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `calendar-qa-audits-${todayISO}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Excel (.xlsx) Export with column widths, bold centered header row, and AutoFilter
  const handleExportExcel = async () => {
    // @ts-ignore
    const XLSX = (await import('xlsx-js-style')).default || (await import('xlsx-js-style'));
    const headers = ['DD/MM/YYYY', 'Audit Type', 'Customer', 'Site', 'Standard', 'Audit Category', 'Purpose', 'Target Package', 'Customer Name', 'QMS Host'];
    const rows = sortedRows.map((r) => [
      r.dateStr,
      r.auditType,
      r.customer,
      r.site,
      r.standard,
      r.auditCategory,
      r.purpose,
      r.targetPackage,
      r.customerNames,
      r.auditor,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Format header row (Row 1): bold font and center alignment (horizontal & vertical)
    for (let col = 0; col < headers.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: 'F3F4F6' } },
        };
      }
    }

    // Set column widths for optimal reading in Excel
    worksheet['!cols'] = [
      { wch: 14 }, // DD/MM/YYYY
      { wch: 18 }, // Audit Type
      { wch: 22 }, // Customer
      { wch: 10 }, // Site
      { wch: 18 }, // Standard
      { wch: 28 }, // Purpose
      { wch: 22 }, // Auditor
    ];

    // Enable AutoFilter on header row across columns A through G
    const lastRowIndex = Math.max(1, rows.length + 1);
    worksheet['!autofilter'] = { ref: `A1:G${lastRowIndex}` };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Schedule');

    const todayISO = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `calendar-qa-audits-${todayISO}.xlsx`);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    vm.removeAssign(id);
    setDeleteConfirmId(null);
  };

  return (
    <div style={css('flex:1;display:flex;flex-direction:column;min-height:0;background:#e9ebe6;padding:16px 20px;gap:14px;overflow-y:auto')}>
      {/* Top Header Card */}
      <div style={css('background:#fff;border:1px solid #d8dcd4;border-radius:12px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 3px rgba(0,0,0,0.03);flex-wrap:wrap;gap:12px')}>
        <div>
          <div style={css('display:flex;align-items:center;gap:10px')}>
            <div style={css('font-size:18px;font-weight:700;color:#15191e;letter-spacing:-.3px')}>
              Audit Appointments Table
            </div>
            <span style={css('display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;background:#f4f6f1;border:1px solid #dde0d9;font-size:11.5px;font-weight:600;color:#5c625c')}>
              {hasActiveFilters ? `${filteredStats.total} audits · ${filteredRows.length} scheduled days` : `${stats.total} audits · ${allRows.length} scheduled days`}
            </span>
          </div>
          <div style={css('font-size:12.5px;color:#7a807a;margin-top:3px')}>
            Comprehensive schedule table matching the 7-column format (DD/MM/YYYY, Audit Type, Customer, Site, Standard, Purpose, QMS Host).
          </div>
        </div>

        <div style={css('display:flex;align-items:center;gap:8px')}>
          <HButton
            onClick={handleExportExcel}
            title="Download formatted Microsoft Excel (.xlsx) spreadsheet"
            style={css("background:#fff;border:1px solid #c5ebd0;color:#0f7e3e;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif;display:flex;align-items:center;gap:6px")}
            hover={{ background: '#f0fdf4' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#0F9D58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke="#0F9D58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="8" y1="13" x2="16" y2="13" stroke="#0F9D58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="8" y1="17" x2="16" y2="17" stroke="#0F9D58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="10 9 9 9 8 9" stroke="#0F9D58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export Excel
          </HButton>

          <HButton
            onClick={handleExportCSV}
            title="Download CSV file matching the 7-column layout"
            style={css("background:#fff;border:1px solid #dde0d9;color:#23282a;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif;display:flex;align-items:center;gap:6px")}
            hover={{ background: '#f4f6f1' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#23282a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="7 10 12 15 17 10" stroke="#23282a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="#23282a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export CSV
          </HButton>
        </div>
      </div>

      {/* Summary KPI Counters Row */}
      <div style={css('display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px')}>
        <div style={css('background:#fff;border:1px solid #e0e3dc;border-radius:10px;padding:12px 16px')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;color:#8a9088;text-transform:uppercase;letter-spacing:0.5px")}>Total Audits</div>
          <div style={css('font-size:22px;font-weight:700;color:#15191e;margin-top:2px')}>
            {filteredStats.total}
          </div>
          <div style={css('font-size:11px;color:#8a9088;margin-top:1px')}>
            {hasActiveFilters ? `Showing ${filteredStats.total} of ${stats.total} audits` : 'All scheduled audits'}
          </div>
        </div>

        <div style={css('background:#fff;border:1px solid #e0e3dc;border-radius:10px;padding:12px 16px')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;color:#8a9088;text-transform:uppercase;letter-spacing:0.5px")}>Customer Audits</div>
          <div style={css('font-size:22px;font-weight:700;color:#15191e;margin-top:2px')}>
            {filteredStats.customerCount}
          </div>
          <div style={css('font-size:11px;color:#8a9088;margin-top:1px')}>
            {hasActiveFilters ? `Showing ${filteredStats.customerCount} of ${stats.customerCount} visits` : 'Consecutive day visits'}
          </div>
        </div>

        <div style={css('background:#fff;border:1px solid #e0e3dc;border-radius:10px;padding:12px 16px')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;color:#8a9088;text-transform:uppercase;letter-spacing:0.5px")}>Internal Audits</div>
          <div style={css('font-size:22px;font-weight:700;color:#15191e;margin-top:2px')}>
            {filteredStats.internalCount}
          </div>
          <div style={css('font-size:11px;color:#8a9088;margin-top:1px')}>
            {hasActiveFilters ? `Showing ${filteredStats.internalCount} of ${stats.internalCount} audits` : 'Plant & process audits'}
          </div>
        </div>

        <div style={css('background:#fff;border:1px solid #e0e3dc;border-radius:10px;padding:12px 16px')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;color:#8a9088;text-transform:uppercase;letter-spacing:0.5px")}>Active QMS Hosts</div>
          <div style={css('font-size:22px;font-weight:700;color:#15191e;margin-top:2px')}>
            {filteredStats.uniqueAuditors}
          </div>
          <div style={css('font-size:11px;color:#8a9088;margin-top:1px')}>
            {hasActiveFilters ? `Across ${filteredStats.uniqueSites} plant ${filteredStats.uniqueSites === 1 ? 'site' : 'sites'}` : `Across ${stats.uniqueSites} plant sites`}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={css('background:#fff;border:1px solid #d8dcd4;border-radius:12px;padding:14px 18px;display:flex;flex-direction:column;gap:12px;box-shadow:0 1px 3px rgba(0,0,0,0.03)')}>
        <div style={css('display:flex;align-items:center;gap:10px;flex-wrap:wrap')}>
          {/* Global Search Input */}
          <div style={css('position:relative;flex:1;min-width:240px')}>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search date, customer, site, standard, purpose, target package, customer name, QMS host..."
              style={css("width:100%;box-sizing:border-box;border:1px solid #dde0d9;border-radius:8px;padding:8px 30px 8px 12px;font-size:12.5px;font-family:'Archivo',sans-serif;color:#23282a;outline:none;background:#fafbfa")}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={css('position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9aa097;font-size:14px;padding:2px')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Audit Type Segmented Selector */}
          <div style={css('display:flex;background:#f1f3ee;border:1px solid #e0e3dc;border-radius:8px;padding:2px;gap:2px')}>
            {(['ALL', 'Customer Audit', 'Internal Audit'] as const).map((type) => {
              const active = auditTypeFilter === type;
              return (
                <button
                  key={type}
                  onClick={() => { setAuditTypeFilter(type); setPage(1); }}
                  style={css(
                    "padding:6px 12px;border-radius:6px;border:none;cursor:pointer;font-size:11.5px;font-weight:600;font-family:'Archivo',sans-serif;white-space:nowrap;transition:all .12s;" +
                    (active ? 'background:#15191e;color:#fff;' : 'background:transparent;color:#5c625c;')
                  )}
                >
                  {type === 'ALL' ? 'All Audits' : type}
                </button>
              );
            })}
          </div>

          {/* Site Filter Multi-Select */}
          <TableMultiSelectFilter
            label="Sites"
            allLabel="All Sites"
            options={vm.siteCodeOptions || []}
            selected={selectedSites}
            onChange={(next) => { setSelectedSites(next); setPage(1); }}
          />

          {/* Standard Filter Multi-Select */}
          <TableMultiSelectFilter
            label="Standards"
            allLabel="All Standards"
            options={filterOptions.standards}
            selected={selectedStandards}
            onChange={(next) => { setSelectedStandards(next); setPage(1); }}
          />

          {/* Audit Category Filter Multi-Select */}
          <TableMultiSelectFilter
            label="Categories"
            allLabel="All Audit Categories"
            options={filterOptions.auditCategories}
            selected={selectedCategories}
            onChange={(next) => { setSelectedCategories(next); setPage(1); }}
          />

          {/* Target Package Filter Multi-Select */}
          <TableMultiSelectFilter
            label="Packages"
            allLabel="All Target Packages"
            options={filterOptions.targetPackages}
            selected={selectedPackages}
            onChange={(next) => { setSelectedPackages(next); setPage(1); }}
          />

          {/* Customer Filter Multi-Select */}
          <TableMultiSelectFilter
            label="Customers"
            allLabel="All Customers"
            options={filterOptions.customers}
            selected={selectedCustomers}
            onChange={(next) => { setSelectedCustomers(next); setPage(1); }}
          />

          {/* QMS Host Filter Multi-Select */}
          <TableMultiSelectFilter
            label="QMS Hosts"
            allLabel="All QMS Hosts"
            options={filterOptions.auditors}
            selected={selectedHosts}
            onChange={(next) => { setSelectedHosts(next); setPage(1); }}
          />
        </div>

        {/* Date Range & Reset Row */}
        <div style={css('display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-top:4px')}>
          <div style={css('display:flex;align-items:center;gap:6px')}>
            <span style={css("font-size:11px;font-weight:600;color:#7a807a;font-family:'IBM Plex Mono',monospace;text-transform:uppercase")}>From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              style={css("border:1px solid #dde0d9;background:#fff;border-radius:7px;padding:5px 8px;font-size:11.5px;color:#23282a;outline:none;font-family:'Archivo',sans-serif")}
            />
          </div>

          <div style={css('display:flex;align-items:center;gap:6px')}>
            <span style={css("font-size:11px;font-weight:600;color:#7a807a;font-family:'IBM Plex Mono',monospace;text-transform:uppercase")}>To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              style={css("border:1px solid #dde0d9;background:#fff;border-radius:7px;padding:5px 8px;font-size:11.5px;color:#23282a;outline:none;font-family:'Archivo',sans-serif")}
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              style={css("background:none;border:none;color:#2756d6;font-size:12px;font-weight:600;cursor:pointer;padding:4px 8px;font-family:'Archivo',sans-serif;display:flex;align-items:center;gap:4px")}
            >
              <span>✕</span> Reset filters
            </button>
          )}

          <div style={css('margin-left:auto;font-size:12px;color:#8a9088')}>
            Showing <b style={css('color:#15191e')}>{filteredRows.length}</b> of {allRows.length} audits
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div style={css('background:#fff;border:1px solid #d8dcd4;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.03);display:flex;flex-direction:column')}>
        <div style={css('overflow-x:auto')}>
          <table style={css('width:100%;border-collapse:collapse;font-size:12.5px;text-align:left')}>
            <thead>
              <tr style={css("background:#f8f9f6;border-bottom:1px solid #e0e3dc;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#5c625c;user-select:none")}>
                {/* 1. Date */}
                <th
                  onClick={() => handleSort('date')}
                  style={css('padding:10px 14px;font-weight:700;cursor:pointer;white-space:nowrap')}
                >
                  <div style={css('display:flex;align-items:center;gap:5px')}>
                    DD/MM/YYYY
                    <span style={css('color:' + (sortCol === 'date' ? '#15191e' : '#b0b5ac'))}>
                      {sortCol === 'date' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>

                {/* 2. Audit Type */}
                <th
                  onClick={() => handleSort('auditType')}
                  style={css('padding:10px 14px;font-weight:700;cursor:pointer;white-space:nowrap')}
                >
                  <div style={css('display:flex;align-items:center;gap:5px')}>
                    Audit Type
                    <span style={css('color:' + (sortCol === 'auditType' ? '#15191e' : '#b0b5ac'))}>
                      {sortCol === 'auditType' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>

                {/* 3. Customer */}
                <th
                  onClick={() => handleSort('customer')}
                  style={css('padding:10px 14px;font-weight:700;cursor:pointer;white-space:nowrap')}
                >
                  <div style={css('display:flex;align-items:center;gap:5px')}>
                    Customer
                    <span style={css('color:' + (sortCol === 'customer' ? '#15191e' : '#b0b5ac'))}>
                      {sortCol === 'customer' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>

                {/* 4. Site */}
                <th
                  onClick={() => handleSort('site')}
                  style={css('padding:10px 14px;font-weight:700;cursor:pointer;white-space:nowrap')}
                >
                  <div style={css('display:flex;align-items:center;gap:5px')}>
                    Site
                    <span style={css('color:' + (sortCol === 'site' ? '#15191e' : '#b0b5ac'))}>
                      {sortCol === 'site' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>

                {/* 5. Standard */}
                <th
                  onClick={() => handleSort('standard')}
                  style={css('padding:10px 14px;font-weight:700;cursor:pointer;white-space:nowrap')}
                >
                  <div style={css('display:flex;align-items:center;gap:5px')}>
                    Standard
                    <span style={css('color:' + (sortCol === 'standard' ? '#15191e' : '#b0b5ac'))}>
                      {sortCol === 'standard' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>

                {/* 6. Audit Category */}
                <th
                  onClick={() => handleSort('auditCategory')}
                  style={css('padding:10px 14px;font-weight:700;cursor:pointer;white-space:nowrap')}
                >
                  <div style={css('display:flex;align-items:center;gap:5px')}>
                    Audit Category
                    <span style={css('color:' + (sortCol === 'auditCategory' ? '#15191e' : '#b0b5ac'))}>
                      {sortCol === 'auditCategory' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>

                {/* 7. Purpose */}
                <th
                  onClick={() => handleSort('purpose')}
                  style={css('padding:10px 14px;font-weight:700;cursor:pointer;white-space:nowrap')}
                >
                  <div style={css('display:flex;align-items:center;gap:5px')}>
                    Purpose
                    <span style={css('color:' + (sortCol === 'purpose' ? '#15191e' : '#b0b5ac'))}>
                      {sortCol === 'purpose' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>

                {/* 7. Target Package */}
                <th
                  onClick={() => handleSort('targetPackage')}
                  style={css('padding:10px 14px;font-weight:700;cursor:pointer;white-space:nowrap')}
                >
                  <div style={css('display:flex;align-items:center;gap:5px')}>
                    Target Package
                    <span style={css('color:' + (sortCol === 'targetPackage' ? '#15191e' : '#b0b5ac'))}>
                      {sortCol === 'targetPackage' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>

                {/* 8. Customer Name */}
                <th
                  onClick={() => handleSort('customerNames')}
                  style={css('padding:10px 14px;font-weight:700;cursor:pointer;white-space:nowrap')}
                >
                  <div style={css('display:flex;align-items:center;gap:5px')}>
                    Customer Name
                    <span style={css('color:' + (sortCol === 'customerNames' ? '#15191e' : '#b0b5ac'))}>
                      {sortCol === 'customerNames' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>

                {/* 9. Auditor */}
                <th
                  onClick={() => handleSort('auditor')}
                  style={css('padding:10px 14px;font-weight:700;cursor:pointer;white-space:nowrap')}
                >
                  <div style={css('display:flex;align-items:center;gap:5px')}>
                    QMS Host
                    <span style={css('color:' + (sortCol === 'auditor' ? '#15191e' : '#b0b5ac'))}>
                      {sortCol === 'auditor' ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </div>
                </th>

                {/* 8. Actions */}
                <th style={css('padding:10px 14px;font-weight:700;text-align:right;white-space:nowrap')}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={css('padding:48px 20px;text-align:center;color:#8a9088')}>
                    <div style={css('display:flex;flex-direction:column;align-items:center;gap:8px')}>
                      <div style={css('font-size:28px')}>📋</div>
                      <div style={css('font-size:14px;font-weight:600;color:#23282a')}>No audit appointments found</div>
                      <div style={css('font-size:12px;color:#7a807a')}>
                        {hasActiveFilters ? 'Try adjusting or clearing your filters to see more results.' : 'Create an appointment to start tracking.'}
                      </div>
                      {hasActiveFilters ? (
                        <HButton
                          onClick={handleResetFilters}
                          style={css("margin-top:6px;background:#f4f6f1;border:1px solid #dde0d9;color:#23282a;border-radius:7px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
                          hover={{ background: '#e9ebe6' }}
                        >
                          Clear all filters
                        </HButton>
                      ) : (
                        <HButton
                          onClick={vm.openCreate}
                          style={css("margin-top:6px;background:#15191e;color:#fff;border:none;border-radius:7px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
                          hover={{ background: '#23282e' }}
                        >
                          + New appointment
                        </HButton>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const siteColor = vm.siteColors[row.site] || vm.siteColors[normalizeSite(row.site)] || '#9aa097';
                  const isCustomer = row.auditType === 'Customer Audit';
                  const isConfirmingDelete = deleteConfirmId === row.id;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => vm.openEdit(row.id)}
                      style={css(
                        'border-bottom:1px solid #f0f2ee;transition:background .12s;cursor:pointer;' +
                        'background:#fff;'
                      )}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#f9faf7'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                    >
                      {/* 1. Date */}
                      <td style={css('padding:11px 14px;white-space:nowrap')}>
                        <div style={css('display:flex;align-items:center;gap:6px')}>
                          <span style={css("font-family:'IBM Plex Mono',monospace;font-size:12.5px;font-weight:600;color:#15191e")}>
                            {row.dateStr}
                          </span>
                          <span style={css('font-size:10.5px;padding:1px 5px;border-radius:4px;background:#f1f3ee;color:#5c625c;font-weight:600')}>
                            {row.dayName}
                          </span>
                        </div>
                      </td>

                      {/* 2. Audit Type */}
                      <td style={css('padding:11px 14px;white-space:nowrap')}>
                        <span style={css(
                          'display:inline-block;padding:3px 8px;border-radius:5px;font-size:11.5px;font-weight:600;' +
                          (isCustomer
                            ? 'background:#eef2fd;color:#2756d6;border:1px solid #d4def0;'
                            : 'background:#f3f4f6;color:#374151;border:1px solid #e5e7eb;')
                        )}>
                          {row.auditType}
                        </span>
                      </td>

                      {/* 3. Customer */}
                      <td style={css('padding:11px 14px')}>
                        {row.customer ? (
                          <span style={css('font-weight:600;color:#15191e')}>{row.customer}</span>
                        ) : (
                          <span style={css('color:#a6aca2;font-style:italic')}>—</span>
                        )}
                      </td>

                      {/* 4. Site */}
                      <td style={css('padding:11px 14px;white-space:nowrap')}>
                        {row.site ? (
                          <div style={css('display:flex;align-items:center;gap:6px')}>
                            <span style={css(`width:8px;height:8px;border-radius:50%;background:${siteColor};flex-shrink:0`)} />
                            <span style={css("font-family:'IBM Plex Mono',monospace;font-weight:600;color:#23282a")}>
                              {row.site}
                            </span>
                          </div>
                        ) : (
                          <span style={css('color:#a6aca2')}>—</span>
                        )}
                      </td>

                      {/* 5. Standard */}
                      <td style={css('padding:11px 14px')}>
                        {row.standard ? (
                          <div style={css('display:flex;flex-wrap:wrap;gap:4px;align-items:center')}>
                            {row.standard.split(',').map((s) => s.trim()).filter(Boolean).map((std) => (
                              <span
                                key={std}
                                style={css("display:inline-block;padding:2px 7px;border-radius:4px;background:#f4f6f1;border:1px solid #e0e3dc;font-size:11.5px;font-weight:500;color:#23282a;white-space:nowrap")}
                              >
                                {std}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={css('color:#a6aca2')}>—</span>
                        )}
                      </td>

                      {/* 6. Audit Category */}
                      <td style={css('padding:11px 14px')}>
                        {row.auditCategory ? (
                          <span
                            style={css("display:inline-block;padding:2px 7px;border-radius:4px;background:#ecfdf5;border:1px solid #a7f3d0;font-size:11.5px;font-weight:600;color:#065f46;white-space:nowrap")}
                          >
                            {row.auditCategory}
                          </span>
                        ) : (
                          <span style={css('color:#a6aca2')}>—</span>
                        )}
                      </td>

                      {/* 7. Purpose */}
                      <td style={css('padding:11px 14px;max-width:260px')}>
                        <div style={css('color:#3c423d;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>
                          {row.purpose || <span style={css('color:#a6aca2')}>—</span>}
                        </div>
                      </td>

                      {/* 7. Target Package */}
                      <td style={css('padding:11px 14px')}>
                        {row.targetPackage ? (
                          <div style={css('display:flex;flex-wrap:wrap;gap:4px;align-items:center')}>
                            {row.targetPackage.split(',').map((s) => s.trim()).filter(Boolean).map((pkg) => (
                              <span
                                key={pkg}
                                style={css("display:inline-block;padding:2px 7px;border-radius:4px;background:#f4f6f1;border:1px solid #e0e3dc;font-size:11.5px;font-weight:500;color:#23282a;white-space:nowrap")}
                              >
                                {pkg}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={css('color:#a6aca2')}>—</span>
                        )}
                      </td>

                      {/* 8. Customer Name */}
                      <td style={css('padding:11px 14px')}>
                        {row.customerNames ? (
                          <div style={css('display:flex;flex-wrap:wrap;gap:4px;align-items:center')}>
                            {row.customerNames.split(',').map((s) => s.trim()).filter(Boolean).map((cn) => (
                              <span
                                key={cn}
                                style={css("display:inline-block;padding:2px 7px;border-radius:4px;background:#eef2fd;border:1px solid #d4def0;font-size:11.5px;font-weight:500;color:#2756d6;white-space:nowrap")}
                              >
                                {cn}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={css('color:#a6aca2')}>—</span>
                        )}
                      </td>

                      {/* 9. Auditor */}
                      <td style={css('padding:11px 14px;white-space:nowrap')}>
                        {row.auditor ? (
                          <div style={css('display:flex;align-items:center;gap:7px')}>
                            <div style={css("width:22px;height:22px;border-radius:50%;background:#eef1ea;color:#475569;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;font-family:'IBM Plex Mono',monospace;flex-shrink:0")}>
                              {row.auditor.slice(0, 2).toUpperCase()}
                            </div>
                            <span style={css('font-weight:500;color:#23282a')}>{row.auditor}</span>
                          </div>
                        ) : (
                          <span style={css('color:#a6aca2')}>—</span>
                        )}
                      </td>

                      {/* 8. Actions */}
                      <td style={css('padding:11px 14px;text-align:right;white-space:nowrap')}>
                        {isConfirmingDelete ? (
                          <div style={css('display:flex;align-items:center;justify-content:flex-end;gap:5px')} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleDelete(row.id, e)}
                              style={css("background:#dc2626;color:#fff;border:none;border-radius:5px;padding:3px 8px;font-size:11px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
                            >
                              Delete
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                              style={css("background:#f4f6f1;color:#5c625c;border:1px solid #dde0d9;border-radius:5px;padding:3px 7px;font-size:11px;cursor:pointer;font-family:'Archivo',sans-serif")}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={css('display:flex;align-items:center;justify-content:flex-end;gap:6px')}>
                            <button
                              onClick={(e) => { e.stopPropagation(); vm.openEdit(row.id); }}
                              title="Edit appointment"
                              style={css("background:#f4f6f1;border:1px solid #dde0d9;color:#3c423d;border-radius:6px;padding:3px 8px;font-size:11.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(row.id); }}
                              title="Delete appointment"
                              style={css('background:none;border:none;color:#9aa097;border-radius:6px;padding:4px 6px;cursor:pointer;font-size:12px;line-height:1')}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = '#9aa097'; }}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Page Size Footer */}
        {sortedRows.length > 0 && (
          <div style={css('display:flex;align-items:center;justify-content:space-between;padding:12px 18px;background:#fafbfa;border-top:1px solid #e0e3dc;flex-wrap:wrap;gap:12px')}>
            <div style={css('display:flex;align-items:center;gap:8px;font-size:12px;color:#7a807a')}>
              <span>Rows per page:</span>
              <select
                value={String(pageSize)}
                onChange={(e) => {
                  const val = e.target.value;
                  setPageSize(val === 'ALL' ? 'ALL' : Number(val));
                  setPage(1);
                }}
                style={css("border:1px solid #dde0d9;background:#fff;border-radius:6px;padding:3px 8px;font-size:11.5px;color:#23282a;outline:none;font-family:'Archivo',sans-serif;cursor:pointer")}
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="ALL">All ({sortedRows.length})</option>
              </select>
              <span style={css('margin-left:8px')}>
                Showing {pageSize === 'ALL' ? `1 - ${sortedRows.length}` : `${(currentPage - 1) * (pageSize as number) + 1} - ${Math.min(currentPage * (pageSize as number), sortedRows.length)}`} of {sortedRows.length} entries
              </span>
            </div>

            {pageSize !== 'ALL' && totalPages > 1 && (
              <div style={css('display:flex;align-items:center;gap:4px')}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  style={css(
                    "border:1px solid #dde0d9;background:#fff;border-radius:6px;padding:4px 9px;font-size:11.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer;" +
                    (currentPage <= 1 ? 'opacity:0.4;cursor:default;' : '')
                  )}
                >
                  ‹ Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((pNum) => pNum === 1 || pNum === totalPages || Math.abs(pNum - currentPage) <= 1)
                  .map((pNum, idx, arr) => {
                    const prevPNum = arr[idx - 1];
                    const showEllipsis = prevPNum && pNum - prevPNum > 1;
                    const isCurrent = pNum === currentPage;
                    return (
                      <span key={pNum} style={css('display:flex;align-items:center;gap:4px')}>
                        {showEllipsis && <span style={css('padding:0 4px;color:#9aa097')}>…</span>}
                        <button
                          onClick={() => setPage(pNum)}
                          style={css(
                            "border:1px solid " + (isCurrent ? '#15191e' : '#dde0d9') + ";border-radius:6px;padding:4px 9px;font-size:11.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer;" +
                            (isCurrent ? 'background:#15191e;color:#fff;' : 'background:#fff;color:#3c423d;')
                          )}
                        >
                          {pNum}
                        </button>
                      </span>
                    );
                  })}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  style={css(
                    "border:1px solid #dde0d9;background:#fff;border-radius:6px;padding:4px 9px;font-size:11.5px;font-weight:600;font-family:'Archivo',sans-serif;cursor:pointer;" +
                    (currentPage >= totalPages ? 'opacity:0.4;cursor:default;' : '')
                  )}
                >
                  Next ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
