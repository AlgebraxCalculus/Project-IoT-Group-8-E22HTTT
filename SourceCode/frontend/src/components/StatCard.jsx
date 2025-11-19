const StatCard = ({ label, value, description }) => (
  <div className="stat-card">
    <p className="stat-card__label">{label}</p>
    <p className="stat-card__value">{value}</p>
    {description && <p className="stat-card__desc">{description}</p>}
  </div>
);

export default StatCard;


