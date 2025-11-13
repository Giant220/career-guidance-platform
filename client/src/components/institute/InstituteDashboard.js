import React, { useState, useEffect, useRef } from 'react';
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
  const navigate = useNavigate();
  const [institute, setInstitute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const pollIntervalRef = useRef();

  // Function to fetch course statistics
  const fetchInstituteStats = async (instituteId) => {
    if (!currentUser || !instituteId) return null;
    
    try {
      const token = await currentUser.getIdToken();
      const BACKEND_URL = 'https://career-guidance-platform-3c0y.onrender.com';
      
      const response = await fetch(`${BACKEND_URL}/api/courses/quick-stats/${instituteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const stats = await response.json();
        return stats;
      }
    } catch (error) {
      console.error('Error fetching institute stats:', error);
    }
    return null;
  };

  const fetchUserInstitute = async (showLoading = true) => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);
      const token = await currentUser.getIdToken();

      const BACKEND_URL = 'https://career-guidance-platform-3c0y.onrender.com';
      const response = await fetch(`${BACKEND_URL}/api/institutes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const allInstitutes = await response.json();
        const userInstitute = allInstitutes.find(inst => 
          inst.userId === currentUser.uid || inst.email === currentUser.email
        );

        // If institute found, fetch its statistics
        let instituteWithStats = userInstitute;
        if (userInstitute) {
          const stats = await fetchInstituteStats(userInstitute.id);
          instituteWithStats = {
            ...userInstitute,
            coursesCount: stats?.coursesCount || 0,
            pendingApplications: stats?.pendingApplications || 0,
            totalStudents: stats?.totalStudents || 0,
            admissionRate: stats?.admissionRate || '0%'
          };
        }

        // Detect status changes
        if (institute && instituteWithStats && instituteWithStats.status !== institute.status) {
          if (instituteWithStats.status === 'approved') {
            alert('🎉 Your institute has been approved! You can now manage courses and applications.');
          } else if (instituteWithStats.status === 'rejected') {
            alert(`❌ Your institute has been rejected. Reason: ${instituteWithStats.rejectionReason || 'No reason provided'}`);
          }
        }

        setInstitute(prev => {
          if (!prev || JSON.stringify(prev) !== JSON.stringify(instituteWithStats)) {
            return instituteWithStats || null;
          }
          return prev;
        });

        setLastUpdate(new Date().toISOString());
      } else {
        console.error('Failed to fetch institutes:', response.status);
      }
    } catch (error) {
      console.error('Error fetching institutes:', error);
      setInstitute(null);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Polling
  const startPolling = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    const interval = institute?.status === 'pending' ? 5000 : 30000;

    pollIntervalRef.current = setInterval(() => {
      fetchUserInstitute(false);
    }, interval);
  };

  useEffect(() => {
    fetchUserInstitute();
    startPolling();

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [currentUser]);

  useEffect(() => {
    startPolling();
  }, [institute?.status]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const updateInstitute = (instituteData) => {
    setInstitute(prev => ({
      ...prev,
      ...instituteData,
      status: instituteData.status || prev?.status
    }));
  };

  const refreshInstituteData = () => {
    fetchUserInstitute(true);
  };

  if (loading) {
    return (
      <div className="institute-dashboard">
        <div className="loading-spinner">
          <p>Loading institute data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="institute-dashboard">
      <nav className="navbar">
        <div className="logo-area">
          <div className="logo" style={{ backgroundColor: '#ffda77', opacity: 0 }}></div>
          <span className="brand">{institute?.name || 'Institute Portal'}</span>
        </div>
        <div className="nav-links">
          <Link to="/institute">Dashboard</Link>
          <Link to="/institute/profile">Profile</Link>
          <Link to="/institute/courses" className={!institute || institute?.status !== 'approved' ? 'disabled-link' : ''}>Courses</Link>
          <Link to="/institute/applications" className={!institute || institute?.status !== 'approved' ? 'disabled-link' : ''}>Applications</Link>
          <Link to="/institute/admissions" className={!institute || institute?.status !== 'approved' ? 'disabled-link' : ''}>Admissions</Link>
          <Link to="/institute/reports" className={!institute || institute?.status !== 'approved' ? 'disabled-link' : ''}>Reports</Link>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="main-content">
        <Routes>
          <Route path="/" element={
            <InstituteHome 
              institute={institute} 
              currentUser={currentUser} 
              onRefresh={refreshInstituteData}
              lastUpdate={lastUpdate}
            />
          } />
          <Route path="/profile" element={
            <InstituteProfile 
              institute={institute} 
              currentUser={currentUser} 
              onInstituteUpdate={updateInstitute} 
              onRefresh={refreshInstituteData}
            />
          } />
          <Route path="/courses" element={
            <ManageCourses 
              institute={institute} 
              currentUser={currentUser} 
              onRefresh={refreshInstituteData}
            />
          } />
          <Route path="/applications" element={
            <ViewApplications 
              institute={institute} 
              currentUser={currentUser} 
              onRefresh={refreshInstituteData}
            />
          } />
          <Route path="/admissions" element={
            <AdmissionsManagement 
              institute={institute} 
              currentUser={currentUser} 
              onRefresh={refreshInstituteData}
            />
          } />
          <Route path="/reports" element={
            <InstituteReports 
              institute={institute} 
              currentUser={currentUser} 
              onRefresh={refreshInstituteData}
            />
          } />
        </Routes>
      </div>
    </div>
  );
};

const InstituteHome = ({ institute, currentUser, onRefresh, lastUpdate }) => {
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
              <span className="btn btn-disabled">Manage Courses</span>
            </div>
            
            <div className="card quick-action-card">
              <h3>Review Applications</h3>
              <p>Process student applications</p>
              <span className="btn btn-disabled">View Applications</span>
            </div>
            
            <div className="card quick-action-card">
              <h3>Reports</h3>
              <p>View institutional reports</p>
              <span className="btn btn-disabled">View Reports</span>
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
          <div className="flex-between">
            <div>
              <h1>Welcome, {institute?.name || 'Institute'}</h1>
              <p>{institute?.description || 'Manage your institution and student applications'}</p>
              {lastUpdate && <small>Last updated: {new Date(lastUpdate).toLocaleTimeString()}</small>}
            </div>
            <div className="header-actions">
              <button onClick={onRefresh} className="btn btn-secondary">🔄 Refresh Now</button>
            </div>
          </div>
          <div className={`status-badge status-${institute?.status || 'pending'}`}>
            {institute?.status ? institute.status.charAt(0).toUpperCase() + institute.status.slice(1) : 'Pending Approval'}
          </div>
        </div>

        <div className="dashboard-top">
          <div className="card">
            <h3>Total Courses</h3>
            <p className="stat-number">{institute?.coursesCount || 0}</p>
            <small>Active programs</small>
          </div>
          <div className="card">
            <h3>Pending Applications</h3>
            <p className="stat-number">{institute?.pendingApplications || 0}</p>
            <small>Require review</small>
          </div>
          <div className="card">
            <h3>Total Students</h3>
            <p className="stat-number">{institute?.totalStudents || 0}</p>
            <small>All time</small>
          </div>
          <div className="card">
            <h3>Admission Rate</h3>
            <p className="stat-number">{institute?.admissionRate || '0%'}</p>
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
            <Link to="/institute/courses" className={institute?.status === 'approved' ? 'btn' : 'btn btn-disabled'}>
              Manage Courses
            </Link>
          </div>
          
          <div className="card quick-action-card">
            <h3>Review Applications</h3>
            <p>Process student applications</p>
            <Link to="/institute/applications" className={institute?.status === 'approved' ? 'btn' : 'btn btn-disabled'}>
              View Applications
            </Link>
          </div>
          
          <div className="card quick-action-card">
            <h3>Reports</h3>
            <p>View institutional reports</p>
            <Link to="/institute/reports" className={institute?.status === 'approved' ? 'btn' : 'btn btn-disabled'}>
              View Reports
            </Link>
          </div>
        </div>

        {institute?.status !== 'approved' && (
          <div className="section warning-message">
            <div className="flex-between">
              <div>
                <h3>⚠️ Pending Approval</h3>
                <p>Your institution is currently under review. You will be able to manage applications once approved by the system administrator.</p>
                <p><strong>Current Status:</strong> {institute?.status || 'pending'}</p>
                {institute?.createdAt && <p><strong>Registered:</strong> {new Date(institute.createdAt).toLocaleDateString()}</p>}
              </div>
              <button onClick={onRefresh} className="btn">🔄 Check Status</button>
            </div>
            <div className="refresh-info">
              <small>Status updates automatically every 5 seconds, or click "Check Status" to refresh now.</small>
              {lastUpdate && <small>Last checked: {new Date(lastUpdate).toLocaleTimeString()}</small>}
            </div>
          </div>
        )}

        {institute?.status === 'approved' && (
          <div className="section success-message">
            <h3>✅ Institute Approved</h3>
            <p>Your institution has been approved! You can now manage courses and process student applications.</p>
            {institute?.approvedAt && <p><strong>Approved On:</strong> {new Date(institute.approvedAt).toLocaleDateString()}</p>}
            <div className="action-buttons">
              <Link to="/institute/courses" className="btn btn-primary">Start Managing Courses</Link>
            </div>
          </div>
        )}

        <div className="section debug-info" style={{background: '#f8f9fa', fontSize: '0.8rem'}}>
          <h4>Debug Information</h4>
          <p><strong>Institute ID:</strong> {institute.id}</p>
          <p><strong>Status:</strong> {institute.status}</p>
          <p><strong>Courses Count:</strong> {institute.coursesCount || 0}</p>
          <p><strong>Pending Applications:</strong> {institute.pendingApplications || 0}</p>
          <p><strong>Total Students:</strong> {institute.totalStudents || 0}</p>
          <p><strong>Admission Rate:</strong> {institute.admissionRate || '0%'}</p>
          <p><strong>User ID:</strong> {currentUser?.uid}</p>
          <p><strong>Last Update:</strong> {lastUpdate}</p>
          <button onClick={onRefresh} className="btn btn-secondary" style={{fontSize: '0.8rem'}}>Force Refresh</button>
        </div>
      </div>
    </div>
  );
};

export default InstituteDashboard;
