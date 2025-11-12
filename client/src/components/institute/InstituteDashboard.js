import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // This is the correct path
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstituteData();
  }, [currentUser]);

  const fetchInstituteData = async () => {
    try {
      if (currentUser) {
        const response = await fetch(`/api/institutes/profile`);
        if (!response.ok) {
          throw new Error('Failed to fetch institute data');
        }
        const data = await response.json();
        setInstitute(data);
      }
    } catch (error) {
      console.error('Error fetching institute data:', error);
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
    return <div className="loading">Loading institute dashboard...</div>;
  }

  return (
    <div className="institute-dashboard">
      <nav className="navbar">
        <div className="logo-area">
          <div className="logo" style={{ backgroundColor: '#ffda77',opacity:0}}></div>
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
          <Route path="/" element={<InstituteHome institute={institute} />} />
          <Route path="/profile" element={<InstituteProfile institute={institute} onUpdate={fetchInstituteData} />} />
          <Route path="/courses" element={<ManageCourses institute={institute} />} />
          <Route path="/applications" element={<ViewApplications institute={institute} />} />
          <Route path="/admissions" element={<AdmissionsManagement institute={institute} />} />
          <Route path="/reports" element={<InstituteReports institute={institute} />} />
        </Routes>
      </div>
    </div>
  );
};

const InstituteHome = ({ institute }) => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    pendingApplications: 0,
    totalStudents: 0,
    admissionRate: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    fetchInstituteStats();
  }, [institute]);

  const fetchInstituteStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(false);
      
      if (!institute?.id) {
        throw new Error('Institute ID not available');
      }

      const response = await fetch(`/api/institutes/stats`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching institute stats:', error);
      setStatsError(true);
      // Set default stats to prevent redirects
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
          </div>
        )}
      </div>
    </div>
  );
};

export default InstituteDashboard;
