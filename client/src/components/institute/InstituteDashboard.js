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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Don't fetch institute data on load - let the user navigate manually
  useEffect(() => {
    // You can add any initialization logic here if needed
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <div className="institute-dashboard">
      <nav className="navbar">
        <div className="logo-area">
          <div className="logo" style={{ backgroundColor: '#ffda77', opacity: 0 }}></div>
          <span className="brand">Institute Portal</span>
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
          <Route path="/" element={<InstituteHome currentUser={currentUser} />} />
          <Route path="/profile" element={<InstituteProfile currentUser={currentUser} />} />
          <Route path="/courses" element={<ManageCourses currentUser={currentUser} />} />
          <Route path="/applications" element={<ViewApplications currentUser={currentUser} />} />
          <Route path="/admissions" element={<AdmissionsManagement currentUser={currentUser} />} />
          <Route path="/reports" element={<InstituteReports currentUser={currentUser} />} />
        </Routes>
      </div>
    </div>
  );
};

const InstituteHome = ({ currentUser }) => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    pendingApplications: 0,
    totalStudents: 0,
    admissionRate: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);

  return (
    <div className="institute-home">
      <div className="section">
        <div className="institute-header">
          <h1>Welcome to Institute Portal</h1>
          <p>Manage your educational institution and student applications</p>
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
            <p>Set up your institute information</p>
            <Link to="/institute/profile" className="btn">Setup Profile</Link>
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

        <div className="section info-message">
          <h3>Getting Started</h3>
          <p>To begin using the institute portal:</p>
          <ol>
            <li>Go to <strong>Profile</strong> to set up your institute information</li>
            <li>Add your courses in the <strong>Courses</strong> section</li>
            <li>Once approved, you'll be able to manage student applications</li>
          </ol>
          <div className="action-buttons">
            <Link to="/institute/profile" className="btn btn-primary">Start Setup</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstituteDashboard;
