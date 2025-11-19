const TopBar = () => {
  const operatorName = localStorage.getItem('spf_operator') || 'Operator';

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
      </div>
    </header>
  );
};

export default TopBar;


