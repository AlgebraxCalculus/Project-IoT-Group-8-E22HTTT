import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthAPI } from '../services/api.js';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await AuthAPI.register(form);
      setSuccess('Registration successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const apiError = err.response?.data;
      if (apiError?.message) {
        setError(apiError.message);
      } else if (Array.isArray(apiError?.errors) && apiError.errors.length > 0) {
        setError(apiError.errors[0].msg);
      } else {
        setError('Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Create Operator Account</h2>
        <p className="auth-card__subtitle">Access Smart Pet Feeder dashboard</p>
        {error && <p className="alert alert--error">{error}</p>}
        {success && <p className="alert alert--success">{success}</p>}
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Nguyen Van A"
          value={form.name}
          onChange={handleChange}
          required
        />
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          required
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
        <p className="auth-card__footer">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;


