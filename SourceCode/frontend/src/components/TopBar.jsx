import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

const TopBar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [operatorName, setOperatorName] = useState('Operator');

  useEffect(() => {
    if (user?.username) {
      setOperatorName(user.username);
      localStorage.setItem('spf_operator', user.username);
    } else {
      const fallback = localStorage.getItem('spf_operator') || 'Operator';
      setOperatorName(fallback);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <div>
        <p className="topbar__subtitle">Smart IoT Control</p>
        <h1 className="topbar__title">Pet Feeding Center</h1>
      </div>
      <div className="topbar__user">
        <div>
          <p className="topbar__user-label">Logged in as</p>
          <p className="topbar__user-name">{operatorName}</p>
        </div>
        <button className="btn btn--ghost" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default TopBar;


