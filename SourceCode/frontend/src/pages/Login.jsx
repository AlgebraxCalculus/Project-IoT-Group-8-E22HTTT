import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthAPI } from '../services/api.js';
import { useAuth } from '../hooks/useAuth.jsx';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await AuthAPI.login(form);
      login({ token: data.token, user: data.user });
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const apiError = err.response?.data;
      if (apiError?.message) {
        setError(apiError.message);
      } else if (Array.isArray(apiError?.errors) && apiError.errors.length > 0) {
        setError(apiError.errors[0].msg);
      } else {
        setError('Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Smart Pet Feeder</h2>
        <p className="auth-card__subtitle">Login to manage your feeder</p>
        {error && <p className="alert alert--error">{error}</p>}
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
          {loading ? 'Signing in...' : 'Login'}
        </button>
        <p className="auth-card__footer">
          No account? <Link to="/register">Register now</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;


