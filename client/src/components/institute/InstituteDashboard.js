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
      
      // Try to fetch institute data
      const response = await fetch('/api/institutes/profile/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setInstitute(data);
      } else if (response.status === 404) {
        // No institute found - this is normal for new users
        console.log('No institute profile found, user needs to register');
        setInstitute(null);
      } else {
        throw new Error(`Failed to fetch institute data: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching institute data:', error);
      setError(error.message);
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
          <Route path="/" element={<InstituteHome institute={institute} currentUser={currentUser} onInstituteUpdate={fetchInstituteData} />} />
          <Route path="/profile" element={<InstituteProfile institute={institute} currentUser={currentUser} onInstituteUpdate={fetchInstituteData} />} />
          <Route path="/courses" element={<ManageCourses institute={institute} currentUser={currentUser} />} />
          <Route path="/applications" element={<ViewApplications institute={institute} currentUser={currentUser} />} />
          <Route path="/admissions" element={<AdmissionsManagement institute={institute} currentUser={currentUser} />} />
          <Route path="/reports" element={<InstituteReports institute={institute} currentUser={currentUser} />} />
        </Routes>
      </div>
    </div>
  );
};

const InstituteHome = ({ institute, currentUser, onInstituteUpdate }) => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    pendingApplications: 0,
    totalStudents: 0,
    admissionRate: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // If no institute, show setup message
  if (!institute) {
    return (
      <div className="institute-home">
        <div className="section">
          <div className="institute-header">
            <h1>Welcome to Institute Portal</h1>
            <p>Manage your educational institution and student applications</p>
          </div>

          <div className="section info-message">
            <h3>Get Started</h3>
            <p>You need to set up your institute profile before you can access other features.</p>
            <div className="action-buttons">
              <Link to="/institute/profile" className="btn btn-primary">
                Setup Institute Profile
              </Link>
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

        <div className="dashboard-top">
          <div className="card">
            <h3>Total Courses</h3>
            <p className="stat-number">0</p>
            <small>Active programs</small>
          </div>
          <div className="card">
            <h3>Pending Applications</h3>
            <p className="stat-number">0</p>
            <small>Require review</small>
          </div>
          <div className="card">
            <h3>Total Students</h3>
            <p className="stat-number">0</p>
            <small>All time</small>
          </div>
          <div className="card">
            <h3>Admission Rate</h3>
            <p className="stat-number">0%</p>
            <small>This semester</small>
          </div>
        </div>

        <div className="quick-actions stats-grid">
          <div className="card quick-action-card">
            <h3>Manage Profile</h3>
            <p>Update your institute information</p>
            <Link to="/institute/profile" className="btn">Update Profile</Link>
          </div>
          
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
            <h3>Reports</h3>
            <p>View institutional reports</p>
            <Link to="/institute/reports" className="btn">View Reports</Link>
          </div>
        </div>

        {institute?.status !== 'approved' && (
          <div className="section warning-message">
            <h3>⚠️ Pending Approval</h3>
            <p>Your institution is currently under review. You will be able to manage applications once approved by the system administrator.</p>
            <p><strong>Current Status:</strong> {institute?.status || 'pending'}</p>
            {institute?.createdAt && (
              <p><strong>Registered:</strong> {new Date(institute.createdAt).toLocaleDateString()}</p>
            )}
          </div>
        )}

        {institute?.status === 'approved' && (
          <div className="section success-message">
            <h3>✅ Institute Approved</h3>
            <p>Your institution has been approved! You can now manage courses and process student applications.</p>
            {institute?.approvedAt && (
              <p><strong>Approved On:</strong> {new Date(institute.approvedAt).toLocaleDateString()}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstituteDashboard;
