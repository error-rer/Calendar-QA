import { useScheduler } from './useScheduler';
import { css } from './ui';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { Schedule } from './components/Schedule';
import { Admin } from './components/Admin';
import { Profile } from './components/Profile';
import { CreateModal } from './components/CreateModal';
import { EngineerModal } from './components/EngineerModal';
import { SiteModal } from './components/SiteModal';
import { CustomerModal } from './components/CustomerModal';
import { LeaveModal } from './components/LeaveModal';

export default function App() {
  const vm = useScheduler();

  return (
    <div style={css('height:100vh;width:100%;display:flex;flex-direction:column;overflow:hidden;background:#e9ebe6')}>
      {vm.showLogin && <Login vm={vm} />}

      {vm.showApp && (
        <div style={css('flex:1;display:flex;flex-direction:column;min-height:0')}>
          <Header vm={vm} />
          {vm.isSchedule && <Schedule vm={vm} />}
          {vm.isAdmin && <Admin vm={vm} />}
          {vm.isProfile && <Profile vm={vm} />}
          <CreateModal vm={vm} />
          <EngineerModal vm={vm} />
          <SiteModal vm={vm} />
          <CustomerModal vm={vm} />
          <LeaveModal vm={vm} />
        </div>
      )}
    </div>
  );
}
