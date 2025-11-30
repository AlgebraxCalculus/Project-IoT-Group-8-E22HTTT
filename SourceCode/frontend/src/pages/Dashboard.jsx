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
import { FeedAPI } from '../services/api.js';

const Dashboard = () => {
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoadingStats(true);
    setError('');
    try {
      const { data } = await FeedAPI.weeklyStats();
      // Backend trả về { data: [...], days: 7 }
      setWeeklyStats(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load feed statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const chartData = useMemo(() => {
    // Backend trả về data với format: { date: "2024-11-14", totalAmount: 350, feedCount: 2 }
    return weeklyStats.map((stat) => {
      const dateObj = new Date(stat.date);
      const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        date: dateLabel,
        weight: stat.totalAmount || 0,
        count: stat.feedCount || 0,
      };
    });
  }, [weeklyStats]);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2>Device Dashboard</h2>
          <p>Feeding analytics and statistics</p>
        </div>
      </div>

      <section className="card">
        <div className="card__header">
          <h3>Feeding Volume (7 days)</h3>
          <button className="btn btn--ghost" type="button" onClick={fetchStats} disabled={loadingStats}>
            Refresh
          </button>
        </div>
        {error && <p className="alert alert--error">{error}</p>}
        {loadingStats && <p className="alert alert--info">Loading chart data...</p>}
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
          <h3>Weekly Summary</h3>
          <p>Last 7 days feeding statistics</p>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Amount</th>
                <th>Feed Count</th>
              </tr>
            </thead>
            <tbody>
              {weeklyStats.length > 0 ? (
                weeklyStats.map((stat, idx) => {
                  const dateObj = new Date(stat.date);
                  const dateDisplay = dateObj.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  });
                  return (
                    <tr key={stat.date || idx}>
                      <td>{dateDisplay}</td>
                      <td>{stat.totalAmount || 0} g</td>
                      <td>{stat.feedCount || 0} times</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3}>No data available</td>
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


