const StatusBadge = ({ status = 'offline' }) => {
  const normalized = status === 'online' ? 'online' : 'offline';
  return <span className={`status-badge status-badge--${normalized}`}>{normalized}</span>;
};

export default StatusBadge;


