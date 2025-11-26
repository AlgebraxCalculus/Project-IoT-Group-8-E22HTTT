import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { FeedLogAPI } from '../services/api.js';
import { createMqttClient } from '../services/mqtt.js';
import StatusBadge from '../components/StatusBadge.jsx';
import StatCard from '../components/StatCard.jsx';

const DEVICE_ID = import.meta.env.VITE_DEVICE_ID || 'petfeeder-feed-node-01';

const Dashboard = () => {
  const [telemetry, setTelemetry] = useState({ weight: 0 });
  const [clientStatus, setClientStatus] = useState('offline');
  const [feedLogs, setFeedLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoadingLogs(true);
    setError('');
    try {
      const { data } = await FeedLogAPI.list();
      setFeedLogs(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load feed history');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    const client = createMqttClient({
      deviceId: DEVICE_ID,
      onTelemetry: (data) => {
        setTelemetry((prev) => ({ ...prev, ...data }));
      },
      onStatusChange: (status) => setClientStatus(status),
    });
    return () => client?.end(true);
  }, []);

  const chartData = useMemo(() => {
    const grouped = feedLogs.reduce((acc, log) => {
      // Only count successful feeds
      if (log.status && log.status !== 'success') {
        return acc;
      }
      
      // Parse date correctly using local timezone
      const dateStr = log.startTime || log.time || log.createdAt;
      if (!dateStr) return acc;
      
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return acc;
      
      // Get local date string (YYYY-MM-DD) for grouping
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      // Format label for display
      const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateLabel, dateKey, weight: 0 };
      }
      
      // Only sum actual amount, not targetAmount
      const amount = Number(log.amount) || 0;
      acc[dateKey].weight += amount;
      
      return acc;
    }, {});
    
    // Sort by date (oldest first) and return
    return Object.values(grouped)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .map(({ date, weight }) => ({ date, weight: Math.round(weight) }));
  }, [feedLogs]);

  const lastFeedDisplay = telemetry.lastFeed
    ? new Date(telemetry.lastFeed).toLocaleString()
    : 'N/A';

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2>Device Dashboard</h2>
          <p>Track live telemetry and feeding analytics</p>
        </div>
        <div className="status-stack">
          <p>
            MQTT status: <StatusBadge status={clientStatus === 'online' ? 'online' : 'offline'} />
          </p>
        </div>
      </div>

      <section className="grid grid--3">
        <StatCard label="Food Weight" value={`${telemetry.weight ?? 0} g`} description="Live hopper reading" />
        <StatCard label="Last Feed" value={lastFeedDisplay} description="From telemetry" />
      </section>

      <section className="card">
        <div className="card__header">
          <h3>Feeding Volume (daily)</h3>
          <button className="btn btn--ghost" type="button" onClick={fetchLogs} disabled={loadingLogs}>
            Refresh
          </button>
        </div>
        {error && <p className="alert alert--error">{error}</p>}
        {loadingLogs && <p className="alert alert--info">Loading chart data...</p>}
        <div style={{ width: '100%', height: 320 }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1fb1ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1fb1ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis
                  dataKey="date"
                  stroke="#6b94aa"
                  style={{ fontSize: '0.85rem' }}
                  tick={{ fill: '#6b94aa' }}
                />
                <YAxis
                  unit=" g"
                  stroke="#6b94aa"
                  style={{ fontSize: '0.85rem' }}
                  tick={{ fill: '#6b94aa' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e7ff',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                    boxShadow: '0 10px 30px rgba(4, 23, 34, 0.15)',
                  }}
                  labelStyle={{ color: '#041722', fontWeight: 600, marginBottom: '0.5rem' }}
                  formatter={(value) => [`${value} g`, 'Amount']}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#1fb1ff"
                  strokeWidth={3}
                  fill="url(#colorWeight)"
                  dot={{ fill: '#1fb1ff', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: '#13d8aa' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <p style={{ color: '#6b94aa' }}>No data available. Try feeding your pet first!</p>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card__header">
          <h3>Feed History</h3>
          <p>Total entries: {feedLogs.length}</p>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Start</th>
                <th>End</th>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {[...feedLogs]
                .sort((a, b) => {
                  const timeA = new Date(a.startTime || a.time || a.createdAt || 0).getTime();
                  const timeB = new Date(b.startTime || b.time || b.createdAt || 0).getTime();
                  return timeB - timeA; // Newest first
                })
                .map((log) => (
                  <tr key={log.id || log._id || log.startTime}>
                    <td>{log.startTime ? new Date(log.startTime).toLocaleString() : '—'}</td>
                    <td>{log.endTime ? new Date(log.endTime).toLocaleString() : '—'}</td>
                    <td>{log.feedType || 'manual'}</td>
                    <td>{log.status || 'success'}</td>
                    <td>{log.amount ?? 0} g</td>
                    <td>{log.targetAmount ?? '—'}</td>
                  </tr>
                ))}
              {!feedLogs.length && (
                <tr>
                  <td colSpan={6}>No records yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;


