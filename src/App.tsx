import { useScheduler } from './useScheduler';
import { css } from './ui';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { Schedule } from './components/Schedule';
import { Admin } from './components/Admin';
import { Profile } from './components/Profile';
import { SummaryDashboard } from './components/SummaryDashboard';
import { CreateModal } from './components/CreateModal';
import { EditModal } from './components/EditModal';
import { EngineerModal } from './components/EngineerModal';

export default function App() {
  const vm = useScheduler();

  return (
    <div style={css('height:100vh;width:100%;display:flex;flex-direction:column;overflow:hidden;background:#e9ebe6')}>
      {vm.loading && (
        <div style={css('flex:1;display:flex;align-items:center;justify-content:center;color:#8a9088;font-size:14px')}>Loading…</div>
      )}

      {!vm.loading && vm.showLogin && <Login vm={vm} />}

      {!vm.loading && vm.showApp && (
        <div style={css('flex:1;display:flex;flex-direction:column;min-height:0')}>
          <Header vm={vm} />
          {vm.isSchedule && <Schedule vm={vm} />}
          {vm.isAdmin && <Admin vm={vm} />}
          {vm.isProfile && <Profile vm={vm} />}
          {vm.isSummary && <SummaryDashboard vm={vm} />}
          <CreateModal vm={vm} />
          <EditModal vm={vm} />
          <EngineerModal vm={vm} />
        </div>
      )}
    </div>
  );
}
