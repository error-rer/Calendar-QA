import { useState, useMemo } from 'react';
import type { VM } from '../useScheduler';
import type { Assignment } from '../types';
import { isInternalAssignment } from '../types';
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
  purpose: string;
  auditor: string;
}

type SortColumn = 'date' | 'auditType' | 'customer' | 'site' | 'standard' | 'purpose' | 'auditor';

export function TableView({ vm }: { vm: VM }) {
  // Filters state
  const [search, setSearch] = useState('');
  const [auditTypeFilter, setAuditTypeFilter] = useState<'ALL' | 'Customer Audit' | 'Internal Audit'>('ALL');
  const [siteFilter, setSiteFilter] = useState('ALL');
  const [standardFilter, setStandardFilter] = useState('ALL');
  const [auditorFilter, setAuditorFilter] = useState('ALL');
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
      const site = (isInternal ? (a.site2 || a.site1) : (a.site1 || a.site2)) || '';
      const standard = (isInternal ? (a.department2 || a.department1) : (a.department1 || a.department2)) || '';
      const purpose = (isInternal ? (a.area || a.purpose) : (a.purpose || '')) || '';
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
        purpose,
        auditor,
      });
    }

    return list;
  }, [vm.assignments, engMap]);

  // Collect unique filter options from live data
  const filterOptions = useMemo(() => {
    const sites = new Set<string>();
    const standards = new Set<string>();
    const auditors = new Set<string>();

    for (const r of allRows) {
      if (r.site) sites.add(r.site);
      if (r.standard) standards.add(r.standard);
      if (r.auditor) auditors.add(r.auditor);
    }

    return {
      sites: Array.from(sites).sort(),
      standards: Array.from(standards).sort(),
      auditors: Array.from(auditors).sort(),
    };
  }, [allRows]);

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
          r.purpose.toLowerCase().includes(q) ||
          r.auditor.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Audit Type filter
      if (auditTypeFilter !== 'ALL' && r.auditType !== auditTypeFilter) {
        return false;
      }

      // Site filter
      if (siteFilter !== 'ALL' && r.site !== siteFilter) {
        return false;
      }

      // Standard filter
      if (standardFilter !== 'ALL' && r.standard !== standardFilter) {
        return false;
      }

      // Auditor filter
      if (auditorFilter !== 'ALL' && r.auditor !== auditorFilter) {
        return false;
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
  }, [allRows, search, auditTypeFilter, siteFilter, standardFilter, auditorFilter, dateFrom, dateTo]);

  // Apply Sorting
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'date') {
        cmp = a.dateObj.getTime() - b.dateObj.getTime();
      } else {
        const valA = (a[sortCol] || '').toLowerCase();
        const valB = (b[sortCol] || '').toLowerCase();
        cmp = valA.localeCompare(valB);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredRows, sortCol, sortDir]);

  // Apply Pagination
  const totalEntries = sortedRows.length;
  const totalPages = pageSize === 'ALL' ? 1 : Math.max(1, Math.ceil(totalEntries / (pageSize as number)));
  const currentPage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    if (pageSize === 'ALL') return sortedRows;
    const start = (currentPage - 1) * (pageSize as number);
    return sortedRows.slice(start, start + (pageSize as number));
  }, [sortedRows, currentPage, pageSize]);

  // Stats calculation
  const stats = useMemo(() => {
    let customerCount = 0;
    let internalCount = 0;
    for (const r of allRows) {
      if (r.auditType === 'Customer Audit') customerCount++;
      else internalCount++;
    }
    return {
      total: allRows.length,
      customerCount,
      internalCount,
      uniqueSites: filterOptions.sites.length,
      uniqueAuditors: filterOptions.auditors.length,
    };
  }, [allRows, filterOptions]);

  const hasActiveFilters =
    search.trim() !== '' ||
    auditTypeFilter !== 'ALL' ||
    siteFilter !== 'ALL' ||
    standardFilter !== 'ALL' ||
    auditorFilter !== 'ALL' ||
    dateFrom !== '' ||
    dateTo !== '';

  const handleResetFilters = () => {
    setSearch('');
    setAuditTypeFilter('ALL');
    setSiteFilter('ALL');
    setStandardFilter('ALL');
    setAuditorFilter('ALL');
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
    const headers = ['DD/MM/YYYY', 'Audit Type', 'Customer', 'Site', 'Standard', 'Purpose', 'Auditor'];
    const rows = sortedRows.map((r) => [
      r.dateStr,
      r.auditType,
      r.customer,
      r.site,
      r.standard,
      r.purpose,
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

  // Excel (.xlsx) Export with column widths and styled worksheet
  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const headers = ['DD/MM/YYYY', 'Audit Type', 'Customer', 'Site', 'Standard', 'Purpose', 'Auditor'];
    const rows = sortedRows.map((r) => [
      r.dateStr,
      r.auditType,
      r.customer,
      r.site,
      r.standard,
      r.purpose,
      r.auditor,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

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
              {allRows.length} total records
            </span>
          </div>
          <div style={css('font-size:12.5px;color:#7a807a;margin-top:3px')}>
            Comprehensive schedule table matching the 7-column format (DD/MM/YYYY, Audit Type, Customer, Site, Standard, Purpose, Auditor).
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

          <HButton
            onClick={vm.openCreate}
            style={css("background:#15191e;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif;display:flex;align-items:center;gap:6px")}
            hover={{ background: '#23282e' }}
          >
            <span style={css('font-size:14px;line-height:1')}>＋</span> New appointment
          </HButton>
        </div>
      </div>

      {/* Summary KPI Counters Row */}
      <div style={css('display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px')}>
        <div style={css('background:#fff;border:1px solid #e0e3dc;border-radius:10px;padding:12px 16px')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;color:#8a9088;text-transform:uppercase;letter-spacing:0.5px")}>Total Audits</div>
          <div style={css('font-size:22px;font-weight:700;color:#15191e;margin-top:2px')}>{stats.total}</div>
          <div style={css('font-size:11px;color:#8a9088;margin-top:1px')}>{hasActiveFilters ? `Showing ${filteredRows.length} filtered` : 'All scheduled appointments'}</div>
        </div>

        <div style={css('background:#fff;border:1px solid #e0e3dc;border-radius:10px;padding:12px 16px')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;color:#2756d6;text-transform:uppercase;letter-spacing:0.5px")}>Customer Audits</div>
          <div style={css('font-size:22px;font-weight:700;color:#2756d6;margin-top:2px')}>{stats.customerCount}</div>
          <div style={css('font-size:11px;color:#8a9088;margin-top:1px')}>Client & external audits</div>
        </div>

        <div style={css('background:#fff;border:1px solid #e0e3dc;border-radius:10px;padding:12px 16px')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.5px")}>Internal Audits</div>
          <div style={css('font-size:22px;font-weight:700;color:#374151;margin-top:2px')}>{stats.internalCount}</div>
          <div style={css('font-size:11px;color:#8a9088;margin-top:1px')}>Plant & process audits</div>
        </div>

        <div style={css('background:#fff;border:1px solid #e0e3dc;border-radius:10px;padding:12px 16px')}>
          <div style={css("font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;color:#8a9088;text-transform:uppercase;letter-spacing:0.5px")}>Active Auditors</div>
          <div style={css('font-size:22px;font-weight:700;color:#15191e;margin-top:2px')}>{stats.uniqueAuditors}</div>
          <div style={css('font-size:11px;color:#8a9088;margin-top:1px')}>Across {stats.uniqueSites} plant sites</div>
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
              placeholder="Search date, customer, site, standard, purpose, auditor..."
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

          {/* Site Filter Dropdown */}
          <select
            value={siteFilter}
            onChange={(e) => { setSiteFilter(e.target.value); setPage(1); }}
            style={css("border:1px solid #dde0d9;background:#fff;border-radius:8px;padding:7px 10px;font-size:12px;color:#23282a;outline:none;font-family:'Archivo',sans-serif;cursor:pointer")}
          >
            <option value="ALL">All Sites</option>
            {filterOptions.sites.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Standard Filter Dropdown */}
          <select
            value={standardFilter}
            onChange={(e) => { setStandardFilter(e.target.value); setPage(1); }}
            style={css("border:1px solid #dde0d9;background:#fff;border-radius:8px;padding:7px 10px;font-size:12px;color:#23282a;outline:none;font-family:'Archivo',sans-serif;cursor:pointer")}
          >
            <option value="ALL">All Standards</option>
            {filterOptions.standards.map((std) => (
              <option key={std} value={std}>{std}</option>
            ))}
          </select>

          {/* Auditor Filter Dropdown */}
          <select
            value={auditorFilter}
            onChange={(e) => { setAuditorFilter(e.target.value); setPage(1); }}
            style={css("border:1px solid #dde0d9;background:#fff;border-radius:8px;padding:7px 10px;font-size:12px;color:#23282a;outline:none;font-family:'Archivo',sans-serif;cursor:pointer")}
          >
            <option value="ALL">All Auditors</option>
            {filterOptions.auditors.map((aud) => (
              <option key={aud} value={aud}>{aud}</option>
            ))}
          </select>
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

                {/* 6. Purpose */}
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

                {/* 7. Auditor */}
                <th
                  onClick={() => handleSort('auditor')}
                  style={css('padding:10px 14px;font-weight:700;cursor:pointer;white-space:nowrap')}
                >
                  <div style={css('display:flex;align-items:center;gap:5px')}>
                    Auditor
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
                  const siteColor = vm.siteColors[row.site] || '#9aa097';
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
                          <span style={css('color:#23282a;font-weight:500')}>{row.standard}</span>
                        ) : (
                          <span style={css('color:#a6aca2')}>—</span>
                        )}
                      </td>

                      {/* 6. Purpose */}
                      <td style={css('padding:11px 14px;max-width:260px')}>
                        <div style={css('color:#3c423d;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>
                          {row.purpose || <span style={css('color:#a6aca2')}>—</span>}
                        </div>
                      </td>

                      {/* 7. Auditor */}
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
