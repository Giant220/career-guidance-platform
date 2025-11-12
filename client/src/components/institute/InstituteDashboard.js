import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import InstituteProfile from './InstituteProfile';
import ManageCourses from './ManageCourses';
import ViewApplications from './ViewApplications';
import AdmissionsManagement from './AdmissionsManagement';
import InstituteReports from './InstituteReports';
import './InstituteDashboard.css';

const InstituteDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [institute, setInstitute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      fetchInstituteData();
    }
  }, [currentUser]);

  const fetchInstituteData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const token = await currentUser.getIdToken();
      
      console.log('🔄 Fetching institute profile for user:', currentUser.uid);
      
      const response = await fetch('/api/institutes/profile/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('❌ No institute found, redirecting to registration');
          navigate('/institute-registration');
          return;
        }
        throw new Error(`Failed to fetch institute data: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Institute data loaded:', data);
      setInstitute(data);
    } catch (error) {
      console.error('❌ Error fetching institute data:', error);
      setError(error.message);
      
      // If it's a 404, redirect to registration
      if (error.message.includes('404')) {
        navigate('/institute-registration');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="institute-dashboard">
        <nav className="navbar">
          <div className="logo-area">
            <div className="logo" style={{ backgroundColor: '#ffda77', opacity: 0 }}></div>
            <span className="brand">Institute Portal</span>
          </div>
          <div className="nav-links">
            <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
          </div>
        </nav>
        <div className="main-content">
          <div className="section">
            <div className="loading">
              <h2>Loading Institute Dashboard...</h2>
              <p>Setting up your institution portal</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !institute) {
    return (
      <div className="institute-dashboard">
        <nav className="navbar">
          <div className="logo-area">
            <div className="logo" style={{ backgroundColor: '#ffda77', opacity: 0 }}></div>
            <span className="brand">Institute Portal</span>
          </div>
          <div className="nav-links">
            <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
          </div>
        </nav>
        <div className="main-content">
          <div className="section">
            <div className="error-message">
              <h2>Unable to Load Dashboard</h2>
              <p>{error}</p>
              <div className="action-buttons">
                <button onClick={fetchInstituteData} className="btn btn-primary">
                  Try Again
                </button>
                <button 
                  onClick={() => navigate('/institute-registration')} 
                  className="btn btn-secondary"
                >
                  Complete Registration
                </button>
                <button 
                  onClick={handleLogout} 
                  className="btn btn-danger"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show main dashboard
  return (
    <div className="institute-dashboard">
      <nav className="navbar">
        <div className="logo-area">
          <div className="logo" style={{ backgroundColor: '#ffda77', opacity: 0 }}></div>
          <span className="brand">
            {institute?.name || 'Institute Portal'}
          </span>
        </div>
        <div className="nav-links">
          <Link to="/institute">Dashboard</Link>
          <Link to="/institute/profile">Profile</Link>
          <Link to="/institute/courses">Courses</Link>
          <Link to="/institute/applications">Applications</Link>
          <Link to="/institute/admissions">Admissions</Link>
          <Link to="/institute/reports">Reports</Link>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="main-content">
        <Routes>
          <Route path="/" element={<InstituteHome institute={institute} currentUser={currentUser} />} />
          <Route path="/profile" element={<InstituteProfile institute={institute} onUpdate={fetchInstituteData} currentUser={currentUser} />} />
          <Route path="/courses" element={<ManageCourses institute={institute} currentUser={currentUser} />} />
          <Route path="/applications" element={<ViewApplications institute={institute} currentUser={currentUser} />} />
          <Route path="/admissions" element={<AdmissionsManagement institute={institute} currentUser={currentUser} />} />
          <Route path="/reports" element={<InstituteReports institute={institute} currentUser={currentUser} />} />
        </Routes>
      </div>
    </div>
  );
};

const InstituteHome = ({ institute, currentUser }) => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    pendingApplications: 0,
    totalStudents: 0,
    admissionRate: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    if (currentUser && institute) {
      fetchInstituteStats();
    }
  }, [institute, currentUser]);

  const fetchInstituteStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(false);
      
      if (!institute?.id || !currentUser) {
        console.log('❌ Missing institute ID or user');
        setStatsError(true);
        return;
      }

      const token = await currentUser.getIdToken();
      console.log('🔄 Fetching stats for institute:', institute.id);
      
      const response = await fetch('/api/institutes/stats/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Stats loaded:', data);
      setStats(data);
    } catch (error) {
      console.error('❌ Error fetching institute stats:', error);
      setStatsError(true);
      // Set safe defaults
      setStats({
        totalCourses: 0,
        pendingApplications: 0,
        totalStudents: 0,
        admissionRate: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // If no institute data, show setup message
  if (!institute) {
    return (
      <div className="institute-home">
        <div className="section">
          <div className="setup-message">
            <h1>Welcome to Institute Portal</h1>
            <p>Your institute profile is being set up...</p>
            <div className="action-buttons">
              <button onClick={() => window.location.reload()} className="btn btn-primary">
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="institute-home">
      <div className="section">
        <div className="institute-header">
          <h1>Welcome, {institute?.name || 'Institute'}</h1>
          <p>{institute?.description || 'Manage your institution and student applications'}</p>
          <div className={`status-badge status-${institute?.status || 'pending'}`}>
            {institute?.status || 'Pending Approval'}
          </div>
        </div>

        {statsError && (
          <div className="warning-message">
            <p>⚠️ Statistics are temporarily unavailable. You can still manage your courses and applications.</p>
            <button onClick={fetchInstituteStats} className="btn btn-sm">
              Retry
            </button>
          </div>
        )}

        <div className="dashboard-top">
          <div className="card">
            <h3>Total Courses</h3>
            <p className="stat-number">
              {statsLoading ? '...' : stats.totalCourses}
            </p>
            <small>Active programs</small>
          </div>
          <div className="card">
            <h3>Pending Applications</h3>
            <p className="stat-number">
              {statsLoading ? '...' : stats.pendingApplications}
            </p>
            <small>Require review</small>
          </div>
          <div className="card">
            <h3>Total Students</h3>
            <p className="stat-number">
              {statsLoading ? '...' : stats.totalStudents}
            </p>
            <small>All time</small>
          </div>
          <div className="card">
            <h3>Admission Rate</h3>
            <p className="stat-number">
              {statsLoading ? '...' : `${stats.admissionRate}%`}
            </p>
            <small>This semester</small>
          </div>
        </div>

        <div className="quick-actions stats-grid">
          <div className="card quick-action-card">
            <h3>Manage Courses</h3>
            <p>Add or update your course offerings</p>
            <Link to="/institute/courses" className="btn">Manage Courses</Link>
          </div>
          
          <div className="card quick-action-card">
            <h3>Review Applications</h3>
            <p>Process student applications</p>
            <Link to="/institute/applications" className="btn">View Applications</Link>
          </div>
          
          <div className="card quick-action-card">
            <h3>Admissions</h3>
            <p>Manage student admissions</p>
            <Link to="/institute/admissions" className="btn">Manage Admissions</Link>
          </div>
          
          <div className="card quick-action-card">
            <h3>Reports</h3>
            <p>View institutional reports</p>
            <Link to="/institute/reports" className="btn">View Reports</Link>
          </div>
        </div>

        {institute?.status !== 'approved' && (
          <div className="section warning-message">
            <h3>⚠️ Pending Approval</h3>
            <p>Your institution is currently under review. You will be able to manage applications once approved by the system administrator.</p>
            <p><strong>Status:</strong> {institute?.status || 'pending'}</p>
            {institute?.createdAt && (
              <p><strong>Registered:</strong> {new Date(institute.createdAt).toLocaleDateString()}</p>
            )}
          </div>
        )}

        {/* Debug info - remove in production */}
        <div className="section debug-info" style={{backgroundColor: '#f5f5f5', padding: '10px', fontSize: '12px', display: 'none'}}>
          <h4>Debug Info</h4>
          <p>User ID: {currentUser?.uid}</p>
          <p>Institute ID: {institute?.id}</p>
          <p>Institute Status: {institute?.status}</p>
        </div>
      </div>
    </div>
  );
};

export default InstituteDashboard;
