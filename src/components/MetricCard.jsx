import './MetricCard.css';

export function MetricCard({ icon: Icon, label, value, trend, color = 'primary', onClick }) {
  return (
    <button className={`metric-card metric-${color}`} onClick={onClick}>
      <div className="metric-icon-wrapper">
        <Icon size={24} className="metric-icon" />
      </div>
      <div className="metric-content">
        <span className="metric-label">{label}</span>
        <span className="metric-value">{value}</span>
        {trend && (
          <span className={`metric-trend ${trend > 0 ? 'up' : 'down'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </button>
  );
}
