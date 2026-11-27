import { useScheduler } from './useScheduler';
import { css } from './ui';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Schedule } from './components/Schedule';
import { Admin } from './components/Admin';
import { Profile } from './components/Profile';
import { SummaryDashboard } from './components/SummaryDashboard';
import { HistoryView } from './components/HistoryView';
import { TableView } from './components/TableView';
import { CreateModal } from './components/CreateModal';
import { EditModal } from './components/EditModal';
import { EditScopeModal } from './components/EditScopeModal';
import { EngineerModal } from './components/EngineerModal';
import { AuditResultsModal } from './components/AuditResultsModal';

export default function App() {
  const vm = useScheduler();

  return (
    <div className="app-shell" style={css('width:100%;display:flex;flex-direction:column;overflow:hidden;background:#e9ebe6')}>
      {vm.loading && (
        <div style={css('flex:1;display:flex;align-items:center;justify-content:center;color:#8a9088;font-size:14px')}>Loading…</div>
      )}

      {!vm.loading && vm.showLogin && <Login vm={vm} />}

      {!vm.loading && vm.showApp && (
        <div style={css('flex:1;display:flex;flex-direction:column;min-height:0')}>
          {vm.saveError && (
            <div role="alert" style={css('display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 16px;background:#fff1f0;border-bottom:1px solid #f2b8b5;color:#8f211b;font-size:12px')}>
              <span>{vm.saveError}</span>
              <button onClick={vm.dismissSaveError} style={css('border:0;background:transparent;color:inherit;font-weight:700;cursor:pointer')}>Dismiss</button>
            </div>
          )}
          <Header vm={vm} />
          {vm.isSchedule && <Schedule vm={vm} />}
          {vm.isTable && <TableView vm={vm} />}
          {vm.isAdmin && <Admin vm={vm} />}
          {vm.isProfile && <Profile vm={vm} />}
          {vm.isSummary && <SummaryDashboard vm={vm} />}
          {vm.isHistory && <HistoryView vm={vm} />}
          {vm.isMobile && <BottomNav vm={vm} />}
          <CreateModal vm={vm} />
          <EditModal vm={vm} />
          <EditScopeModal vm={vm} />
          <EngineerModal vm={vm} />
          <AuditResultsModal vm={vm} />
        </div>
      )}
    </div>
  );
}
