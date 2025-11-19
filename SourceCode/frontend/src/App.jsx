import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import ManualFeed from './pages/ManualFeed.jsx';
import Schedule from './pages/Schedule.jsx';
import AppLayout from './components/AppLayout.jsx';

const App = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/manual-feed" element={<ManualFeed />} />
      <Route path="/schedule" element={<Schedule />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;


