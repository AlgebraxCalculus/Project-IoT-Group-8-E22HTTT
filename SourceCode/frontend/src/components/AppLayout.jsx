import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import NotificationMqttBridge from './NotificationMqttBridge.jsx';

const AppLayout = () => (
  <div className="app-shell">
    <NotificationMqttBridge />
    <Sidebar />
    <div className="app-shell__main">
      <TopBar />
      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AppLayout;


