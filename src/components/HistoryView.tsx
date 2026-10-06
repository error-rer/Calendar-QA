import { useState, useMemo } from 'react';
import type { VM } from '../useScheduler';
import type { ActionType, ActivityLog, EntityType } from '../types';
import { css, HButton } from '../ui';

function getActionBadgeStyle(actionType: ActionType): { bg: string; color: string; border: string } {
  switch (actionType) {
    case 'CREATE':
    case 'MANAGE_ITEM':
      return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' };
    case 'UPDATE':
    case 'REORDER':
      return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    case 'DELETE':
      return { bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' };
    default:
      return { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
  }
}

function getEntityBadgeStyle(entityType: EntityType): { bg: string; color: string } {
  switch (entityType) {
    case 'APPOINTMENT':
      return { bg: '#f1f5f9', color: '#334155' };
    case 'CUSTOMER':
      return { bg: '#f0fdf4', color: '#15803d' };
    case 'END_CUSTOMER':
      return { bg: '#faf5ff', color: '#7e22ce' };
    case 'AUDITOR':
      return { bg: '#fff7ed', color: '#c2410c' };
    case 'SITE':
      return { bg: '#f0f9ff', color: '#0369a1' };
    case 'STANDARD':
      return { bg: '#fdf2f8', color: '#be185d' };
    default:
      return { bg: '#f3f4f6', color: '#4b5563' };
  }
}

export function HistoryView({ vm }: { vm: VM }) {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredLogs = useMemo(() => {
    let logs = vm.activityLogs || [];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      logs = logs.filter(
        (log) =>
          log.description.toLowerCase().includes(q) ||
          log.user.name.toLowerCase().includes(q) ||
          (log.user.email && log.user.email.toLowerCase().includes(q)) ||
          log.entityType.toLowerCase().includes(q) ||
          log.actionType.toLowerCase().includes(q)
      );
    }

    if (actionFilter !== 'ALL') {
      logs = logs.filter((log) => log.actionType === actionFilter);
    }

    if (entityFilter !== 'ALL') {
      logs = logs.filter((log) => log.entityType === entityFilter);
    }

    if (dateFrom) {
      logs = logs.filter((log) => {
        return log.timestamp >= dateFrom;
      });
    }

    if (dateTo) {
      logs = logs.filter((log) => {
        return log.timestamp <= dateTo + 'T23:59:59';
      });
    }

    return logs;
  }, [vm.activityLogs, search, actionFilter, entityFilter, dateFrom, dateTo]);

  const hasFilters = search || actionFilter !== 'ALL' || entityFilter !== 'ALL' || dateFrom || dateTo;

  const handleResetFilters = () => {
    setSearch('');
    setActionFilter('ALL');
    setEntityFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div style={css('flex:1;display:flex;flex-direction:column;min-height:0;background:#e9ebe6;padding:16px 20px;gap:14px;overflow-y:auto')}>
      {/* Top Header Card */}
      <div style={css('background:#fff;border:1px solid #d8dcd4;border-radius:12px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 1px 3px rgba(0,0,0,0.03)')}>
        <div>
          <div style={css('display:flex;align-items:center;gap:10px')}>
            <h1 style={css('font-size:18px;font-weight:700;color:#15191e;margin:0;letter-spacing:-.3px')}>Activity Audit Log</h1>
            <span style={css('background:#f1f3ee;border:1px solid #e0e3dc;color:#5c625c;font-size:11.5px;font-weight:600;padding:2px 8px;border-radius:12px')}>
              {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <p style={css('font-size:12px;color:#8a9088;margin:3px 0 0 0')}>
            Track real-time appointment updates, master data modifications, and user actions across the system.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={css('background:#fff;border:1px solid #d8dcd4;border-radius:12px;padding:12px 16px;display:flex;flex-wrap:wrap;align-items:center;gap:10px;box-shadow:0 1px 3px rgba(0,0,0,0.03)')}>
        {/* Search Input */}
        <div style={css('flex:1;min-width:220px;position:relative')}>
          <input
            type="text"
            placeholder="Search description, user, entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={css("width:100%;padding:7px 12px;border:1px solid #d8dcd4;border-radius:8px;font-size:12.5px;color:#15191e;outline:none;background:#fcfdfb;font-family:'Archivo',sans-serif")}
          />
        </div>

        {/* Action Type Filter */}
        <div style={css('display:flex;align-items:center;gap:5px')}>
          <label style={css('font-size:11.5px;font-weight:600;color:#5c625c')}>Action:</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={css("padding:6px 10px;border:1px solid #d8dcd4;border-radius:8px;font-size:12px;color:#15191e;background:#fff;outline:none;font-family:'Archivo',sans-serif;cursor:pointer")}
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="REORDER">REORDER</option>
            <option value="MANAGE_ITEM">MANAGE_ITEM</option>
          </select>
        </div>

        {/* Entity Type Filter */}
        <div style={css('display:flex;align-items:center;gap:5px')}>
          <label style={css('font-size:11.5px;font-weight:600;color:#5c625c')}>Entity:</label>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            style={css("padding:6px 10px;border:1px solid #d8dcd4;border-radius:8px;font-size:12px;color:#15191e;background:#fff;outline:none;font-family:'Archivo',sans-serif;cursor:pointer")}
          >
            <option value="ALL">All Entities</option>
            <option value="APPOINTMENT">Appointment</option>
            <option value="CUSTOMER">Customer</option>
            <option value="END_CUSTOMER">End Customer</option>
            <option value="AUDITOR">Auditor</option>
            <option value="SITE">Site</option>
            <option value="STANDARD">Standard</option>
          </select>
        </div>

        {/* Date Range Filters */}
        <div style={css('display:flex;align-items:center;gap:5px')}>
          <label style={css('font-size:11.5px;font-weight:600;color:#5c625c')}>From:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={css("padding:5px 8px;border:1px solid #d8dcd4;border-radius:8px;font-size:12px;color:#15191e;background:#fff;outline:none;font-family:'Archivo',sans-serif")}
          />
        </div>

        <div style={css('display:flex;align-items:center;gap:5px')}>
          <label style={css('font-size:11.5px;font-weight:600;color:#5c625c')}>To:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={css("padding:5px 8px;border:1px solid #d8dcd4;border-radius:8px;font-size:12px;color:#15191e;background:#fff;outline:none;font-family:'Archivo',sans-serif")}
          />
        </div>

        {hasFilters && (
          <HButton
            onClick={handleResetFilters}
            style={css("background:#f4f6f1;border:1px solid #e0e3dc;color:#5c625c;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
            hover={{ background: '#eaede6' }}
          >
            Clear Filters
          </HButton>
        )}
      </div>

      {/* Audit Log Table Feed */}
      <div style={css('background:#fff;border:1px solid #d8dcd4;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.03);display:flex;flex-direction:column;flex:1')}>
        <div className="scrl" style={css('overflow-y:auto;flex:1')}>
          <table style={css('width:100%;border-collapse:collapse;text-align:left;font-size:12.5px')}>
            <thead>
              <tr style={css('background:#f8faf6;border-bottom:1px solid #e2e5de;color:#5c625c;font-size:11.5px;font-weight:700;letter-spacing:.2px;text-transform:uppercase')}>
                <th style={css('padding:10px 16px;width:180px')}>User</th>
                <th style={css('padding:10px 12px;width:110px')}>Action</th>
                <th style={css('padding:10px 12px;width:120px')}>Entity</th>
                <th style={css('padding:10px 16px')}>Description</th>
                <th style={css('padding:10px 16px;width:170px;text-align:right')}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={css('padding:48px 16px;text-align:center;color:#8a9088;font-size:13px')}>
                    <div style={css('font-size:24px;margin-bottom:8px')}>📜</div>
                    No activity audit logs found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: ActivityLog, idx: number) => {
                  const actionStyle = getActionBadgeStyle(log.actionType);
                  const entityStyle = getEntityBadgeStyle(log.entityType);
                  const initials = log.user.avatarInitials || log.user.name.slice(0, 2).toUpperCase();

                  return (
                    <tr
                      key={log.id || idx}
                      style={css('border-bottom:1px solid #f0f3ec;transition:background .15s ease')}
                    >
                      {/* User Column */}
                      <td style={css('padding:12px 16px;vertical-align:middle')}>
                        <div style={css('display:flex;align-items:center;gap:9px')}>
                          <div style={css("width:28px;height:28px;border-radius:7px;background:#15191e;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:700;flex-shrink:0")}>
                            {initials}
                          </div>
                          <div>
                            <div style={css('font-weight:600;color:#15191e;line-height:1.1')}>{log.user.name}</div>
                            {log.user.email && (
                              <div style={css('font-size:10.5px;color:#8a9088;margin-top:1px')}>{log.user.email}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td style={css('padding:12px 12px;vertical-align:middle')}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            letterSpacing: '0.3px',
                            backgroundColor: actionStyle.bg,
                            color: actionStyle.color,
                            border: `1px solid ${actionStyle.border}`,
                          }}
                        >
                          {log.actionType}
                        </span>
                      </td>

                      {/* Entity Badge */}
                      <td style={css('padding:12px 12px;vertical-align:middle')}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            backgroundColor: entityStyle.bg,
                            color: entityStyle.color,
                          }}
                        >
                          {log.entityType}
                        </span>
                      </td>

                      {/* Description */}
                      <td style={css('padding:12px 16px;vertical-align:middle;color:#2a2f28;font-weight:500;line-height:1.35')}>
                        {log.description}
                      </td>

                      {/* Timestamp */}
                      <td style={css("padding:12px 16px;vertical-align:middle;text-align:right;color:#6a706a;font-family:'IBM Plex Mono',monospace;font-size:11px")}>
                        {log.timestamp}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
