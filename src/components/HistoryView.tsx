import { useState, useMemo } from 'react';
import type { VM } from '../useScheduler';
import type { ActionType, ActivityLog, EntityType } from '../types';
import { css, HButton } from '../ui';

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Create', UPDATE: 'Update', DELETE: 'Delete', REORDER: 'Reorder', MANAGE_ITEM: 'Manage', RESET: 'Reset', OTHER: 'Other',
};
const ENTITY_LABELS: Record<string, string> = {
  APPOINTMENT: 'Appointment', HOLIDAY: 'Holiday / Restriction', CUSTOMER: 'Customer', END_CUSTOMER: 'End Customer',
  AUDITOR: 'QMS Host', QMS_HOST: 'QMS Host', SITE: 'Site', STANDARD: 'Standard', DEPARTMENT: 'Department', PURPOSE: 'Purpose',
  TARGET_PACKAGE: 'Target Package', CUSTOMER_NAME: 'Customer Name', AUDIT_CATEGORY: 'Audit Category',
};
const humanize = (code: string) => code.charAt(0) + code.slice(1).toLowerCase().replace(/_/g, ' ');

/** Parses log timestamps: ISO (current) or the older local 'dd/mm/yyyy hh:mm:ss' format. */
function parseLogTime(value: string): Date | null {
  if (!value) return null;
  const legacy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  const d = legacy
    ? new Date(+legacy[3], +legacy[2] - 1, +legacy[1], +legacy[4], +legacy[5], +(legacy[6] || 0))
    : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** Local calendar day (yyyy-mm-dd) of a log entry, for the From/To filter. */
function logDayKey(value: string): string {
  const d = parseLogTime(value);
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Shows a log timestamp in the viewer's local time. */
function formatLogTime(value: string): { date: string; time: string } | null {
  const d = parseLogTime(value);
  if (!d) return null;
  return {
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  };
}

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
    case 'RESET':
      return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
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
    case 'QMS_HOST':
    case 'AUDITOR':
      return { bg: '#fff7ed', color: '#c2410c' };
    case 'SITE':
      return { bg: '#f0f9ff', color: '#0369a1' };
    case 'STANDARD':
      return { bg: '#fdf2f8', color: '#be185d' };
    case 'PURPOSE':
      return { bg: '#fef3c7', color: '#b45309' };
    case 'TARGET_PACKAGE':
      return { bg: '#fef3c7', color: '#92400e' };
    case 'CUSTOMER_NAME':
      return { bg: '#e0e7ff', color: '#3730a3' };
    case 'AUDIT_CATEGORY':
      return { bg: '#ecfdf5', color: '#065f46' };
    case 'HOLIDAY':
      return { bg: '#fef3c7', color: '#92400e' };
    default:
      return { bg: '#f3f4f6', color: '#4b5563' };
  }
}

function renderDescription(desc: string) {
  if (!desc) return '';
  // Match bracketed field tags like [Customer], [Auditor], [Site], [Standard], [Date], [Purpose], etc.
  const parts = desc.split(/(\[[A-Za-z\s]+\])/g);
  if (parts.length === 1) return desc;
  return parts.map((part, i) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return (
        <span
          key={i}
          style={{
            display: 'inline-block',
            fontWeight: 700,
            color: '#1d4ed8',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '4px',
            padding: '1px 5px',
            margin: '0 2px',
            fontSize: '11px',
            lineHeight: 1.25,
            letterSpacing: '0.2px',
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
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
      if (entityFilter === 'QMS_HOST') {
        logs = logs.filter((log) => log.entityType === 'QMS_HOST' || log.entityType === 'AUDITOR');
      } else {
        logs = logs.filter((log) => log.entityType === entityFilter);
      }
    }

    if (dateFrom) {
      logs = logs.filter((log) => {
        const day = logDayKey(log.timestamp);
        return day !== '' && day >= dateFrom;
      });
    }

    if (dateTo) {
      logs = logs.filter((log) => {
        const day = logDayKey(log.timestamp);
        return day !== '' && day <= dateTo;
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
    <div style={css('flex:1;display:flex;flex-direction:column;min-height:0;background:#e9ebe6;overflow-y:auto;' + (vm.isMobile ? 'padding:12px;gap:12px' : 'padding:16px 20px;gap:14px'))}>
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
            {vm.historyOnServer
              ? 'Changes made by everyone: appointments, results, master data, and holiday rules. The server records who made each change and when. Times are shown in your local time zone.'
              : 'Changes made in this browser: appointments, results, master data, and holiday rules. Shared History appears once you are signed in to the server. Times are shown in your local time zone.'}</p>
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
        <div style={css('display:flex;gap:5px;' + (vm.isMobile ? 'flex:1 1 140px;min-width:0;flex-direction:column;align-items:stretch' : 'align-items:center'))}>
          <label style={css('font-size:11.5px;font-weight:600;color:#5c625c')}>Action:</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={css("padding:6px 10px;border:1px solid #d8dcd4;border-radius:8px;font-size:12px;color:#15191e;background:#fff;outline:none;font-family:'Archivo',sans-serif;cursor:pointer" + (vm.isMobile ? ';width:100%;min-width:0' : ''))}
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">{ACTION_LABELS.CREATE}</option>
            <option value="UPDATE">{ACTION_LABELS.UPDATE}</option>
            <option value="DELETE">{ACTION_LABELS.DELETE}</option>
            <option value="REORDER">{ACTION_LABELS.REORDER}</option>
            <option value="MANAGE_ITEM">{ACTION_LABELS.MANAGE_ITEM}</option>
            <option value="RESET">{ACTION_LABELS.RESET}</option>
          </select>
        </div>

        {/* Entity Type Filter */}
        <div style={css('display:flex;gap:5px;' + (vm.isMobile ? 'flex:1 1 140px;min-width:0;flex-direction:column;align-items:stretch' : 'align-items:center'))}>
          <label style={css('font-size:11.5px;font-weight:600;color:#5c625c')}>Entity:</label>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            style={css("padding:6px 10px;border:1px solid #d8dcd4;border-radius:8px;font-size:12px;color:#15191e;background:#fff;outline:none;font-family:'Archivo',sans-serif;cursor:pointer" + (vm.isMobile ? ';width:100%;min-width:0' : ''))}
          >
            <option value="ALL">All Entities</option>
            <option value="APPOINTMENT">Appointment</option>
            <option value="HOLIDAY">Holiday / Restriction</option>
            <option value="CUSTOMER">Customer</option>
            <option value="END_CUSTOMER">End Customer</option>
            <option value="QMS_HOST">QMS Host</option>
            <option value="SITE">Site</option>
            <option value="STANDARD">Standard</option>
            <option value="PURPOSE">Purpose</option>
            <option value="TARGET_PACKAGE">Target Package</option>
            <option value="CUSTOMER_NAME">Customer Name</option>
            <option value="AUDIT_CATEGORY">Audit Category</option>
          </select>
        </div>

        {/* Date Range Filters */}
        <div style={css('display:flex;gap:5px;' + (vm.isMobile ? 'flex:1 1 140px;min-width:0;flex-direction:column;align-items:stretch' : 'align-items:center'))}>
          <label style={css('font-size:11.5px;font-weight:600;color:#5c625c')}>From:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={css("padding:5px 8px;border:1px solid #d8dcd4;border-radius:8px;font-size:12px;color:#15191e;background:#fff;outline:none;font-family:'Archivo',sans-serif" + (vm.isMobile ? ';width:100%;min-width:0' : ''))}
          />
        </div>

        <div style={css('display:flex;gap:5px;' + (vm.isMobile ? 'flex:1 1 140px;min-width:0;flex-direction:column;align-items:stretch' : 'align-items:center'))}>
          <label style={css('font-size:11.5px;font-weight:600;color:#5c625c')}>To:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={css("padding:5px 8px;border:1px solid #d8dcd4;border-radius:8px;font-size:12px;color:#15191e;background:#fff;outline:none;font-family:'Archivo',sans-serif" + (vm.isMobile ? ';width:100%;min-width:0' : ''))}
          />
        </div>

        {hasFilters && (
          <HButton
            className="tap"
            onClick={handleResetFilters}
            style={css("background:#f4f6f1;border:1px solid #e0e3dc;color:#5c625c;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
            hover={{ background: '#eaede6' }}
          >
            Clear Filters
          </HButton>
        )}
      </div>

      {/* Audit Log Table Feed */}
      <div style={css('background:#fff;border:1px solid #d8dcd4;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.03);display:flex;flex-direction:column;' + (vm.isMobile ? 'flex:0 0 auto' : 'flex:1'))}>
        {vm.isMobile ? (
          <ul aria-label="History entries" style={css('list-style:none;margin:0;padding:0')}>
            {filteredLogs.length === 0 ? (
              <li style={css('padding:36px 16px;text-align:center;color:#6a706a;font-size:14px')}>No activity audit logs found matching your filters.</li>
            ) : (
              filteredLogs.map((log: ActivityLog, idx: number) => {
                const actionStyle = getActionBadgeStyle(log.actionType);
                const entityStyle = getEntityBadgeStyle(log.entityType);
                const initials = log.user.avatarInitials || log.user.name.slice(0, 2).toUpperCase();
                const t = formatLogTime(log.timestamp);
                return (
                  <li key={log.id || idx} className="selectable" style={css('padding:12px 14px 13px;border-bottom:1px solid #f0f3ec')}>
                    <div style={css('display:flex;align-items:center;gap:10px')}>
                      <div aria-hidden="true" style={css("width:30px;height:30px;border-radius:8px;background:#15191e;color:#fff;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;flex-shrink:0")}>
                        {initials}
                      </div>
                      <div style={css('min-width:0;flex:1')}>
                        <div style={css('font-size:14px;font-weight:600;color:#15191e;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap')}>{log.user.name}</div>
                        <time dateTime={log.timestamp} style={css("display:block;margin-top:2px;font-family:'IBM Plex Mono',monospace;font-size:12px;color:#6a706a")}>
                          {t ? `${t.date} · ${t.time}` : log.timestamp}
                        </time>
                      </div>
                    </div>
                    <div style={css('display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:9px')}>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, backgroundColor: actionStyle.bg, color: actionStyle.color, border: `1px solid ${actionStyle.border}` }}>
                        {ACTION_LABELS[log.actionType] || humanize(String(log.actionType))}
                      </span>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, backgroundColor: entityStyle.bg, color: entityStyle.color }}>
                        {ENTITY_LABELS[log.entityType] || humanize(String(log.entityType))}
                      </span>
                      {vm.historyOnServer && !log.synced && (
                        <span title="Stored only in this browser. Other people cannot see it." style={css('font-size:12px;color:#92400e')}>This browser only</span>
                      )}
                    </div>
                    <div style={css('margin-top:7px;font-size:14px;line-height:1.45;color:#2a2f28;overflow-wrap:anywhere')}>{renderDescription(log.description)}</div>
                  </li>
                );
              })
            )}
          </ul>
        ) : (
        <div className="scrl" style={css('overflow:auto;flex:1')}>
          <table style={css('width:100%;min-width:760px;border-collapse:collapse;text-align:left;font-size:12.5px')}>
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
                            {vm.historyOnServer && !log.synced && (
                              <div
                                title="This entry is stored only in this browser: it was recorded before shared History, or it could not be saved to the server. Other people cannot see it."
                                style={css('font-size:10.5px;color:#92400e;margin-top:2px')}
                              >
                                This browser only
                              </div>
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
                          {ACTION_LABELS[log.actionType] || humanize(String(log.actionType))}
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
                          {ENTITY_LABELS[log.entityType] || humanize(String(log.entityType))}
                        </span>
                      </td>

                      {/* Description */}
                      <td style={css('padding:12px 16px;vertical-align:middle;color:#2a2f28;font-weight:500;line-height:1.4')}>
                        {renderDescription(log.description)}
                      </td>

                      {/* Timestamp */}
                      <td style={css("padding:12px 16px;vertical-align:middle;text-align:right;color:#6a706a;font-family:'IBM Plex Mono',monospace;font-size:11px;white-space:nowrap")}>
                        {(() => {
                          const t = formatLogTime(log.timestamp);
                          if (!t) return log.timestamp;
                          return (
                            <time dateTime={log.timestamp} title={log.timestamp}>
                              <span style={css('color:#23282a')}>{t.date}</span>
                              <span style={css('margin-left:8px')}>{t.time}</span>
                            </time>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}
        {vm.historyHasMore && (
          <div style={css('display:flex;justify-content:center;padding:12px;border-top:1px solid #f0f3ec')}>
            <HButton
              className="tap"
              onClick={vm.loadOlderHistory}
              disabled={vm.historyLoadingOlder}
              style={css("background:#f4f6f1;border:1px solid #dde0d9;color:#3c423d;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
              hover={{ background: '#e9ece5' }}
            >
              {vm.historyLoadingOlder ? 'Loading older changes…' : 'Load older changes'}
            </HButton>
          </div>
        )}
      </div>
    </div>
  );
}
