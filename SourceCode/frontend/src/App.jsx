import { Navigate, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import ManualFeed from './pages/ManualFeed.jsx';
import Schedule from './pages/Schedule.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const App = () => (
  <Routes>
    <Route
      element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/" element={<Dashboard />} />
      <Route path="/manual-feed" element={<ManualFeed />} />
      <Route path="/schedule" element={<Schedule />} />
    </Route>

    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;


