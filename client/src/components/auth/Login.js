import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, userRole, currentUser } = useAuth();
  const navigate = useNavigate();

  // Handle navigation when role is available
  useEffect(() => {
    if (currentUser && userRole) {
      console.log('User and role available, navigating...');
      let targetPath = '/';
      if (userRole === 'student') targetPath = '/student';
      else if (userRole === 'institute') targetPath = '/institute';
      else if (userRole === 'company') targetPath = '/company';
      else if (userRole === 'admin') targetPath = '/admin';
      
      console.log('Navigating to:', targetPath);
      navigate(targetPath, { replace: true });
    }
  }, [currentUser, userRole, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      console.log('Starting login process...');
      await login(formData.email, formData.password);
      console.log('Firebase login successful, waiting for role...');
      
      // The navigation will be handled by the useEffect above
      // when userRole becomes available
      
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to log in: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="section" style={{ maxWidth: '400px', margin: '2rem auto' }}>
        <h1 className="text-center">Login</h1>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn" 
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="text-center mt-1">
          <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
          <p><Link to="/forgot-password">Forgot your password?</Link></p>
        </div>

        <div className="demo-accounts mt-1">
          <h3>Demo Accounts</h3>
          <div className="demo-account">
            <strong>Student:</strong> student@demo.com / password123
          </div>
          <div className="demo-account">
            <strong>Institution:</strong> institution@demo.com / password123
          </div>
          <div className="demo-account">
            <strong>Company:</strong> company@demo.com / password123
          </div>
          <div className="demo-account">
            <strong>Admin:</strong> admin@demo.com / password123
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;