import { useEffect, useMemo, useState } from 'react';
import {
  Line,
  LineChart,
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

const DEVICE_ID = import.meta.env.VITE_DEVICE_ID || 'demo-feeder-01';

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
      const date = new Date(log.startTime || log.time || log.createdAt || Date.now()).toLocaleDateString();
      acc[date] = (acc[date] || 0) + (log.amount || 0);
      return acc;
    }, {});
    return Object.entries(grouped).map(([date, weight]) => ({ date, weight }));
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
          <p>
            Device status:{' '}
            <StatusBadge status={telemetry.online ? 'online' : 'offline'} />
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
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis unit=" g" />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#1fb1ff" strokeWidth={3} dot />
            </LineChart>
          </ResponsiveContainer>
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
              {feedLogs.map((log) => (
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


