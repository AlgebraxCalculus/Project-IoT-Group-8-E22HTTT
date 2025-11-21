import { useEffect, useState } from 'react';
import { ScheduleAPI } from '../services/api.js';

const dayOptions = [
  { name: 'Monday', value: 1 },
  { name: 'Tuesday', value: 2 },
  { name: 'Wednesday', value: 3 },
  { name: 'Thursday', value: 4 },
  { name: 'Friday', value: 5 },
  { name: 'Saturday', value: 6 },
  { name: 'Sunday', value: 0 },
];

const dayNameToNumber = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 0,
};

const dayNumberToName = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

const emptyForm = {
  name: 'Feeding schedule',
  time: '08:00',
  daysOfWeek: [1], // Monday
  amount: 50,
  isActive: true,
};

const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSchedules = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await ScheduleAPI.list();
      setSchedules(data.schedules || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'isActive') {
      setForm((prev) => ({ ...prev, isActive: checked }));
      return;
    }
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleToggleDay = (dayValue) => {
    setForm((prev) => {
      const exists = prev.daysOfWeek.includes(dayValue);
      const daysOfWeek = exists
        ? prev.daysOfWeek.filter((d) => d !== dayValue)
        : [...prev.daysOfWeek, dayValue];
      return { ...prev, daysOfWeek };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
      };
      if (editingId) {
        await ScheduleAPI.update(editingId, payload);
      } else {
        await ScheduleAPI.create(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      loadSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save schedule');
    }
  };

  const handleEdit = (entry) => {
    setForm({
      name: entry.name || 'Feeding schedule',
      time: entry.time,
      daysOfWeek: Array.isArray(entry.daysOfWeek) && entry.daysOfWeek.length ? entry.daysOfWeek : [1],
      amount: entry.amount?.toString() ?? '0',
      isActive: Boolean(entry.isActive),
    });
    setEditingId(entry.id || entry._id);
  };

  const handleDelete = async (entry) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await ScheduleAPI.remove(entry.id || entry._id);
      loadSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2>Scheduled Feeding</h2>
          <p>Create recurring feeding events</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={loadSchedules} disabled={loading}>
          Refresh
        </button>
      </div>

      {error && <p className="alert alert--error">{error}</p>}

      <section className="card">
        <h3>{editingId ? 'Update Schedule' : 'New Schedule'}</h3>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Time (HH:mm)
            <input type="time" name="time" value={form.time} onChange={handleChange} required />
          </label>
          <label>
            Amount (g)
            <input
              type="number"
              name="amount"
              min="10"
              step="10"
              value={form.amount}
              onChange={handleChange}
              required
            />
          </label>
          <div>
            <p>Days of week</p>
            <div className="chip-group">
              {dayOptions.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={`chip ${form.daysOfWeek.includes(day.value) ? 'chip--active' : ''}`}
                  onClick={() => handleToggleDay(day.value)}
                >
                  {day.name.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
          <label className="switch">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
            <span>Schedule active</span>
          </label>
          <div className="form-grid__actions">
            <button className="btn btn--primary" type="submit">
              {editingId ? 'Save Changes' : 'Add Schedule'}
            </button>
            {editingId && (
              <button
                className="btn btn--outline"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <h3>Upcoming Tasks</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Days</th>
                <th>Time</th>
                <th>Amount (g)</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {schedules.map((entry) => (
                <tr key={entry.id || entry._id}>
                  <td>{entry.name}</td>
                  <td>
                    {Array.isArray(entry.daysOfWeek) && entry.daysOfWeek.length
                      ? entry.daysOfWeek.map((d) => dayNumberToName[d] || d).join(', ')
                      : '—'}
                  </td>
                  <td>{entry.time}</td>
                  <td>{entry.amount}</td>
                  <td>{entry.isActive ? 'Active' : 'Paused'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn--ghost" type="button" onClick={() => handleEdit(entry)}>
                        Edit
                      </button>
                      <button className="btn btn--danger" type="button" onClick={() => handleDelete(entry)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!schedules.length && (
                <tr>
                  <td colSpan={4}>No schedules configured.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Schedule;


