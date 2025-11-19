import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';

const AppLayout = () => (
  <div className="app-shell">
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


