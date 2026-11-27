import type { ReactNode } from 'react';
import type { VM } from '../useScheduler';

// Line icons drawn to match the app's other icons: 24px grid, 2px round stroke.
const Icon = ({ children }: { children: ReactNode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const ICONS: Record<string, ReactNode> = {
  schedule: <Icon><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2.5v3M8 2.5v3M3 9.5h18" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" /></Icon>,
  table: <Icon><rect x="3" y="3.5" width="18" height="17" rx="2" /><path d="M3 9h18M3 14.5h18M9.5 9v11.5" /></Icon>,
  summary: <Icon><path d="M3.5 3.5v17h17" /><path d="M8 16.5v-4M12.5 16.5V8M17 16.5v-6.5" /></Icon>,
  manage: <Icon><path d="M4 20v-6M4 10V4M12 20v-8M12 8V4M20 20v-4M20 12V4" /><path d="M1.5 14h5M9.5 8h5M17.5 16h5" /></Icon>,
  history: <Icon><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5" /><path d="M3.5 3.5v5h5" /><path d="M12 7.5V12l3 2" /></Icon>,
};

/** Main navigation on phones: the five pages in thumb reach. Desktop keeps the tabs in the header. */
export function BottomNav({ vm }: { vm: VM }) {
  const items = [
    { key: 'schedule', label: 'Schedule', on: vm.isSchedule, go: vm.goSchedule },
    { key: 'table', label: 'Table', on: vm.isTable, go: vm.goTable },
    { key: 'summary', label: 'Summary', on: vm.isSummary, go: vm.goSummary },
    ...(vm.canManage ? [{ key: 'manage', label: 'Manage', on: vm.isAdmin, go: vm.goAdmin }] : []),
    { key: 'history', label: 'History', on: vm.isHistory, go: vm.goHistory },
  ];
  return (
    <nav aria-label="Main" className="bottom-nav" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((it) => (
        <button key={it.key} type="button" onClick={it.go} aria-current={it.on ? 'page' : undefined}>
          <span className="pill">{ICONS[it.key]}</span>
          {it.label}
        </button>
      ))}
    </nav>
  );
}
