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

  // Don't fetch institute data on load - we'll let the profile component handle it
  useEffect(() => {
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // Function to update institute data from child components
  const updateInstitute = (instituteData) => {
    setInstitute(instituteData);
  };

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
          <Route path="/profile" element={<InstituteProfile institute={institute} currentUser={currentUser} onInstituteUpdate={updateInstitute} />} />
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
  // If no institute, show setup message
  if (!institute) {
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
              <h3>Setup Profile</h3>
              <p>Set up your institute information to get started</p>
              <Link to="/institute/profile" className="btn btn-primary">Setup Profile</Link>
            </div>
            
            <div className="card quick-action-card">
              <h3>Manage Courses</h3>
              <p>Add or update your course offerings</p>
              <Link to="/institute/courses" className="btn" disabled>Manage Courses</Link>
            </div>
            
            <div className="card quick-action-card">
              <h3>Review Applications</h3>
              <p>Process student applications</p>
              <Link to="/institute/applications" className="btn" disabled>View Applications</Link>
            </div>
            
            <div className="card quick-action-card">
              <h3>Reports</h3>
              <p>View institutional reports</p>
              <Link to="/institute/reports" className="btn" disabled>View Reports</Link>
            </div>
          </div>

          <div className="section info-message">
            <h3>Getting Started</h3>
            <p>To begin using the institute portal:</p>
            <ol>
              <li>Go to <strong>Profile</strong> to set up your institute information</li>
              <li>Wait for admin approval (usually within 24-48 hours)</li>
              <li>Once approved, you'll be able to add courses and manage applications</li>
            </ol>
            <div className="action-buttons">
              <Link to="/institute/profile" className="btn btn-primary">Start Setup</Link>
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
