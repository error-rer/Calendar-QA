import { useState, useEffect, useMemo } from 'react';
import type { VM } from '../useScheduler';
import type { Assignment, SiteAuditResult } from '../types';
import { css, HButton } from '../ui';
import { isInternalAssignment, normalizeSite, normalizeAuditResults, isAuditResultCompleted, sortSites } from '../types';

function AuditResultsDialog({ vm, target }: { vm: VM; target: Assignment }) {
  const isInternal = isInternalAssignment(target);

  // Sibling assignments across the appointment series (shared by groupId / seriesId)
  const siblings = useMemo(() => {
    const seriesKey = target.seriesId || target.groupId || target.order;
    return vm.assignments.filter(
      (x) =>
        (x.seriesId && x.seriesId === seriesKey) ||
        (x.groupId && x.groupId === seriesKey) ||
        (x.eng === target.eng && x.order === target.order) ||
        x.id === target.id
    );
  }, [vm.assignments, target.id, target.seriesId, target.groupId, target.order, target.eng]);

  const isMultiDay = siblings.length > 1;

  // Shared results across the appointment series
  const sharedResults = useMemo(() => {
    const withRes = siblings.find((x) => x.results && Object.keys(x.results).length > 0);
    return normalizeAuditResults(target.results && Object.keys(target.results).length > 0 ? target.results : withRes?.results);
  }, [target.results, siblings]);

  // Dynamic Site Union: Aggregate the UNION of all sites scheduled across ALL days belonging to this appointment series
  const activeSites = useMemo(() => {
    const siteSet = new Set<string>();
    for (const sib of siblings) {
      const raw = (isInternalAssignment(sib) ? sib.site2 : sib.site1) || '';
      if (raw) {
        raw
          .split(/[/,]/)
          .map((s) => normalizeSite(s.trim()))
          .filter(Boolean)
          .forEach((s) => siteSet.add(s));
      }
    }
    const list = Array.from(siteSet);
    return list.length > 0 ? sortSites(list) : ['General'];
  }, [siblings]);

  // Local state for editing the results per site - keyed by siteName
  const [siteResults, setSiteResults] = useState<Record<string, SiteAuditResult>>(() => {
    const initial: Record<string, SiteAuditResult> = {};
    for (const site of activeSites) {
      const prev = sharedResults[site] || sharedResults[normalizeSite(site)];
      initial[site] = {
        major: prev ? (Number(prev.major) || 0) : 0,
        minor: prev ? (Number(prev.minor) || 0) : 0,
        ofi: prev ? (Number(prev.ofi) || 0) : 0,
        obs: prev ? (Number(prev.obs) || 0) : 0,
        findings: prev ? (Number(prev.findings) || 0) : 0,
      };
    }
    return initial;
  });

  // Re-sync if the target appointment, union of sites, or shared results change:
  // - Keeps previously entered numbers for existing sites strictly intact
  // - Initializes only newly added sites with default 0
  // - Deletes keys for removed sites
  const activeSitesKey = activeSites.join('|');
  useEffect(() => {
    const sites = activeSitesKey ? activeSitesKey.split('|') : ['General'];
    setSiteResults((prev) => {
      const next: Record<string, SiteAuditResult> = {};
      for (const site of sites) {
        const src = prev[site] || sharedResults[site] || sharedResults[normalizeSite(site)];
        next[site] = {
          major: src ? (Number(src.major) || 0) : 0,
          minor: src ? (Number(src.minor) || 0) : 0,
          ofi: src ? (Number(src.ofi) || 0) : 0,
          obs: src ? (Number(src.obs) || 0) : 0,
          findings: src ? (Number(src.findings) || 0) : 0,
        };
      }
      return next;
    });
  }, [target.id, activeSitesKey, sharedResults]);

  const handleInputChange = (site: string, field: keyof SiteAuditResult, rawValue: string) => {
    // Only accept positive integers, reject negative numbers, decimals, letters, scientific notation
    const sanitized = rawValue.replace(/\D/g, '');
    const num = sanitized === '' ? 0 : parseInt(sanitized, 10);
    setSiteResults((prev) => ({
      ...prev,
      [site]: {
        ...(prev[site] || { major: 0, minor: 0, ofi: 0, obs: 0, findings: 0 }),
        [field]: num,
      },
    }));
  };

  const totals = useMemo(() => {
    let totalMajor = 0;
    let totalMinor = 0;
    let totalOfi = 0;
    let totalObs = 0;
    let totalFindings = 0;

    for (const site of activeSites) {
      const r = siteResults[site] || { major: 0, minor: 0, ofi: 0, obs: 0, findings: 0 };
      totalMajor += r.major;
      totalMinor += r.minor;
      totalOfi += r.ofi;
      totalObs += r.obs;
      totalFindings += r.findings;
    }

    // Grand total: sum of all column totals (Major + Minor + OFI + OBS + Finding(s))
    const grandTotal = totalMajor + totalMinor + totalOfi + totalObs + totalFindings;
    return {
      totalMajor,
      totalMinor,
      totalOfi,
      totalObs,
      totalFindings,
      grandTotal,
    };
  }, [activeSites, siteResults]);

  const handleSave = () => {
    // Strict Synchronization: Save unified results for the union of all scheduled sites across the series
    const cleanResults: Record<string, SiteAuditResult> = {};
    for (const site of activeSites) {
      const normSite = normalizeSite(site);
      const r = siteResults[site] || siteResults[normSite] || { major: 0, minor: 0, ofi: 0, obs: 0, findings: 0 };
      cleanResults[normSite] = {
        major: Number(r.major) || 0,
        minor: Number(r.minor) || 0,
        ofi: Number(r.ofi) || 0,
        obs: Number(r.obs) || 0,
        findings: Number(r.findings) || 0,
      };
    }
    vm.saveResults(target.id, cleanResults);
  };

  const handleClear = () => {
    const clearedResults: Record<string, SiteAuditResult> = {};
    for (const site of activeSites) {
      const normSite = normalizeSite(site);
      clearedResults[normSite] = {
        major: 0,
        minor: 0,
        ofi: 0,
        obs: 0,
        findings: 0,
      };
    }
    vm.saveResults(target.id, clearedResults);
  };

  const minWeek = Math.min(...siblings.map((x) => x.week));
  const maxWeek = Math.max(...siblings.map((x) => x.week));
  const minDay = Math.min(...siblings.filter((x) => x.week === minWeek).map((x) => x.day));
  const maxDay = Math.max(...siblings.filter((x) => x.week === maxWeek).map((x) => x.day));
  const fromDate = new Date(2026, 5, 29 + minWeek * 7 + minDay);
  const toDate = new Date(2026, 5, 29 + maxWeek * 7 + maxDay);
  const fmt = (d: Date) => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  const dateRangeStr = fmt(fromDate) === fmt(toDate) ? fmt(fromDate) : `${fmt(fromDate)} - ${fmt(toDate)}`;

  const customerTitle = target.customer || 'Customer Audit';
  const standardText = (isInternal ? (target.department2 || target.department1) : (target.department1 || target.department2)) || '';
  const seriesSiteDisplay = activeSites.join('/');

  return (
    <div style={vm.modalOverlayStyle}>
      <div onClick={vm.stop} style={{ ...vm.modalCardStyle, maxWidth: '680px', width: '100%', overflow: 'hidden' }}>
        {/* Modal Header */}
        <div style={css('padding:16px 20px;border-bottom:1px solid #eef1ea;display:flex;align-items:center;justify-content:space-between')}>
          <div>
            <div style={css('display:flex;align-items:center;gap:8px')}>
              <span style={css('font-size:16px;font-weight:700;color:#15191e;letter-spacing:-.2px')}>Audit Results</span>
              <span style={css(`font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:4px;${
                isInternal
                  ? 'color:#0f9d8c;background:#eef8f3;border:1px solid #ccebe2;'
                  : 'color:#2756d6;background:#eef2fd;border:1px solid #d8e2fa;'
              }`)}>
                {isInternal ? 'Internal Audit' : 'Customer Audit'}
              </span>
            </div>
            <div style={css('font-size:12px;color:#5c625c;margin-top:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap')}>
              <span style={css('font-weight:600;color:#15191e')}>{isInternal ? (target.area ? `${target.area} · ` : '') + 'Internal Audit' : customerTitle}</span>
              <span>·</span>
              <span>Site: {seriesSiteDisplay || 'Unassigned'}</span>
              {standardText && (
                <>
                  <span>·</span>
                  <span>Standard: {standardText}</span>
                </>
              )}
              <span>·</span>
              <span style={css('font-family:\'IBM Plex Mono\',monospace;color:#2756d6')}>{dateRangeStr}</span>
            </div>
          </div>
          <HButton
            onClick={vm.closeResultsModal}
            style={css('width:28px;height:28px;border:1px solid #e2e5de;background:#fff;border-radius:7px;cursor:pointer;color:#6a706a;font-size:14px;display:flex;align-items:center;justify-content:center')}
            hover={{ background: '#f1f3ee' }}
          >
            ✕
          </HButton>
        </div>

        {/* Modal Body / Table */}
        <div className="scrl" style={css('overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px')}>
          {isMultiDay && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f8faf6',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8df',
                fontSize: '12px',
                color: '#3c423d',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '15px' }}>🔗</span>
              <div>
                <strong>Unified Series Results:</strong> Showing all sites scheduled across this multi-day appointment (<strong style={{ color: '#2756d6' }}>{activeSites.join(', ')}</strong>). Findings entered here are shared across all {siblings.length} scheduled days.
              </div>
            </div>
          )}
          <div style={{ border: '1px solid #e2e5de', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8faf6', borderBottom: '1px solid #e2e5de' }}>
                  <th style={{ padding: '10px 14px', fontSize: '11.5px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.04em', width: '130px' }}>
                    Site
                  </th>
                  <th style={{ padding: '10px 8px', fontSize: '11.5px', fontWeight: 700, color: '#b32f2f', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em', width: '90px' }}>
                    Major
                  </th>
                  <th style={{ padding: '10px 8px', fontSize: '11.5px', fontWeight: 700, color: '#c2620c', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em', width: '90px' }}>
                    Minor
                  </th>
                  <th style={{ padding: '10px 8px', fontSize: '11.5px', fontWeight: 700, color: '#2563eb', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em', width: '90px' }}>
                    OFI
                  </th>
                  <th style={{ padding: '10px 8px', fontSize: '11.5px', fontWeight: 700, color: '#0d9488', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em', width: '90px' }}>
                    OBS
                  </th>
                  <th style={{ padding: '10px 8px', fontSize: '11.5px', fontWeight: 700, color: '#15191e', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em', width: '95px' }}>
                    Finding(s)
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeSites.map((site, idx) => {
                  const values = siteResults[site] || { major: 0, minor: 0, ofi: 0, obs: 0, findings: 0 };
                  const siteColor = vm.siteColors[site] || '#6b7280';

                  return (
                    <tr
                      key={site + '-' + idx}
                      style={{
                        borderBottom: '1px solid #eef1ea',
                        background: idx % 2 === 0 ? '#ffffff' : '#fafbf9',
                      }}
                    >
                      {/* Site name & chip */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: siteColor, flexShrink: 0 }} />
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 600, color: '#15191e' }}>
                            {site}
                          </span>
                        </div>
                      </td>

                      {/* Major editable number input */}
                      <td style={{ padding: '6px 8px', verticalAlign: 'middle' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={values.major === 0 ? '0' : String(values.major)}
                          onKeyDown={(e) => {
                            if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault();
                          }}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleInputChange(site, 'major', e.target.value)}
                          style={{
                            width: '100%',
                            height: '36px',
                            textAlign: 'center',
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '13px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid #dde0d9',
                            background: '#fff',
                            color: '#b32f2f',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>

                      {/* Minor editable number input */}
                      <td style={{ padding: '6px 8px', verticalAlign: 'middle' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={values.minor === 0 ? '0' : String(values.minor)}
                          onKeyDown={(e) => {
                            if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault();
                          }}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleInputChange(site, 'minor', e.target.value)}
                          style={{
                            width: '100%',
                            height: '36px',
                            textAlign: 'center',
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '13px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid #dde0d9',
                            background: '#fff',
                            color: '#c2620c',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>

                      {/* OFI editable number input */}
                      <td style={{ padding: '6px 8px', verticalAlign: 'middle' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={values.ofi === 0 ? '0' : String(values.ofi)}
                          onKeyDown={(e) => {
                            if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault();
                          }}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleInputChange(site, 'ofi', e.target.value)}
                          style={{
                            width: '100%',
                            height: '36px',
                            textAlign: 'center',
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '13px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid #dde0d9',
                            background: '#fff',
                            color: '#2563eb',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>

                      {/* OBS editable number input */}
                      <td style={{ padding: '6px 8px', verticalAlign: 'middle' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={values.obs === 0 ? '0' : String(values.obs)}
                          onKeyDown={(e) => {
                            if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault();
                          }}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleInputChange(site, 'obs', e.target.value)}
                          style={{
                            width: '100%',
                            height: '36px',
                            textAlign: 'center',
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '13px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid #dde0d9',
                            background: '#fff',
                            color: '#0d9488',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>

                      {/* Finding(s) editable number input (manual entry) */}
                      <td style={{ padding: '6px 8px', verticalAlign: 'middle' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={values.findings === 0 ? '0' : String(values.findings)}
                          onKeyDown={(e) => {
                            if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault();
                          }}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => handleInputChange(site, 'findings', e.target.value)}
                          style={{
                            width: '100%',
                            height: '36px',
                            textAlign: 'center',
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: '13px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid #dde0d9',
                            background: '#fff',
                            color: '#15191e',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                {/* Second-to-last Row: Total column sums */}
                <tr style={{ background: '#f8faf6', borderTop: '2px solid #e2e5de', fontWeight: 700 }}>
                  <td style={{ padding: '10px 14px', fontSize: '12px', color: '#15191e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Total
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px 8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#b32f2f' }}>
                    {totals.totalMajor}
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px 8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#c2620c' }}>
                    {totals.totalMinor}
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px 8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#2563eb' }}>
                    {totals.totalOfi}
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px 8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#0d9488' }}>
                    {totals.totalObs}
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px 8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#15191e', fontWeight: 700 }}>
                    {totals.totalFindings}
                  </td>
                </tr>

                {/* Last Row: Grand Total / Total Across Categories */}
                <tr style={{ background: '#eef2fd', borderTop: '1px solid #d8e2fa', fontWeight: 700 }}>
                  <td colSpan={5} style={{ padding: '11px 14px', fontSize: '12px', color: '#1e3a8a', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Grand Total / Total Across Categories:
                  </td>
                  <td style={{ textAlign: 'center', padding: '11px 8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#2756d6', fontWeight: 800 }}>
                    {totals.grandTotal}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={css('padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:9px;border-top:1px solid #eef1ea')}>
          <div>
            {isAuditResultCompleted(target) && (
              <button
                type="button"
                onClick={handleClear}
                style={css("background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:8px;padding:9px 14px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
              >
                Clear Results
              </button>
            )}
          </div>
          <div style={css('display:flex;align-items:center;gap:9px')}>
            <HButton
              onClick={vm.closeResultsModal}
              style={css("background:#f4f6f1;border:1px solid #e0e3dc;color:#3c423d;border-radius:8px;padding:9px 16px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
              hover={{ background: '#eaede6' }}
            >
              Cancel
            </HButton>
            <button
              onClick={handleSave}
              style={css("background:#15191e;color:#fff;border:none;border-radius:8px;padding:9px 18px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:'Archivo',sans-serif")}
            >
              Save Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuditResultsModal({ vm }: { vm: VM }) {
  if (!vm.resultsModalOpen || !vm.resultsTargetId) return null;

  const target = vm.assignments.find((a) => a.id === vm.resultsTargetId);
  if (!target) return null;

  return <AuditResultsDialog vm={vm} target={target} />;
}
