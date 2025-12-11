import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Auth.css';

function Login({ onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error);
      toast.error('Login failed. Please check your credentials.');
      setLoading(false);
    } else {
      toast.success('Welcome back! Logged in successfully.');
    }
  };

  const handleDemoLogin = async () => {
    setEmail('student1@ucmerced.edu');
    setPassword('password123');
    setLoading(true);
    
    const result = await login('student1@ucmerced.edu', 'password123');
    
    if (!result.success) {
      setError(result.error);
      toast.error('Login failed. Please try again.');
      setLoading(false);
    } else {
      toast.success('Welcome! Using demo account.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🎓 PostBoard</h1>
          <p>UC Merced Community Forum</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2>Login</h2>
          
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@ucmerced.edu"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleDemoLogin}
            disabled={loading}
          >
            Demo Login
          </button>

          <div className="auth-switch">
            Don't have an account?{' '}
            <button 
              type="button" 
              className="link-button" 
              onClick={onSwitchToRegister}
              disabled={loading}
            >
              Register
            </button>
          </div>
        </form>

        <div className="demo-credentials">
          <small>
            <strong>Demo Credentials:</strong><br />
            Email: student1@ucmerced.edu<br />
            Password: password123
          </small>
        </div>
      </div>
    </div>
  );
}

export default Login;