import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', path: '/', icon: '📊' },
  { label: 'Feed Now', path: '/manual-feed', icon: '🍽️' },
  { label: 'Schedules', path: '/schedule', icon: '🕒' },
];

const Sidebar = () => (
  <aside className="sidebar">
    <div className="sidebar__brand">
      <div className="sidebar__logo">SPF</div>
      <div>
        <p className="sidebar__title">Smart Pet Feeder</p>
      </div>
    </div>
    <nav className="sidebar__nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
        >
          <span className="sidebar__icon" aria-hidden>
            {item.icon}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default Sidebar;


