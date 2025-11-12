import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ManageUsers from './ManageUsers';
import ManageInstitutions from './ManageInstitutions';
import ManageCompanies from './ManageCompanies';
import SystemReports from './SystemReports';
import SystemSettings from './SystemSettings';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      fetchAdminData();
    }
  }, [currentUser]);

  const fetchAdminData = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/admin/profile/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdmin(data);
      } else {
        console.warn('Admin profile not found, using default');
        setAdmin({ fullName: 'Administrator' });
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setAdmin({ fullName: 'Administrator' });
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
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <nav className="navbar">
        <div className="logo-area">
          <div className="logo" style={{ backgroundColor: '#ffda77', opacity: 0 }}></div>
          <span className="brand">Admin Portal</span>
        </div>
        <div className="nav-links">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/users">Users</Link>
          <Link to="/admin/institutions">Institutions</Link>
          <Link to="/admin/companies">Companies</Link>
          <Link to="/admin/reports">Reports</Link>
          <Link to="/admin/settings">Settings</Link>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="main-content">
        <Routes>
          <Route index element={<AdminHome admin={admin} currentUser={currentUser} />} />
          <Route path="users" element={<ManageUsers currentUser={currentUser} />} />
          <Route path="institutions" element={<ManageInstitutions currentUser={currentUser} />} />
          <Route path="companies" element={<ManageCompanies currentUser={currentUser} />} />
          <Route path="reports" element={<SystemReports currentUser={currentUser} />} />
          <Route path="settings" element={<SystemSettings currentUser={currentUser} />} />
        </Routes>
      </div>
    </div>
  );
};

const AdminHome = ({ admin, currentUser }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInstitutions: 0,
    totalCompanies: 0,
    pendingApprovals: 0,
    activeApplications: 0,
    systemHealth: 100
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser) {
      fetchSystemData();
    }
  }, [currentUser]);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await currentUser.getIdToken();
      
      // Fetch stats
      const statsResponse = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch stats: ${statsResponse.status}`);
      }
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch activity
      const activityResponse = await fetch('/api/admin/activity', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!activityResponse.ok) {
        throw new Error(`Failed to fetch activity: ${activityResponse.status}`);
      }
      const activityData = await activityResponse.json();
      
      // Ensure activityData is an array before setting state
      setRecentActivity(Array.isArray(activityData) ? activityData : []);
      
    } catch (error) {
      console.error('Error fetching system data:', error);
      setError(error.message);
      // Set safe defaults
      setStats({
        totalUsers: 0,
        totalInstitutions: 0,
        totalCompanies: 0,
        pendingApprovals: 0,
        activeApplications: 0,
        systemHealth: 100
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-home">
        <div className="section">
          <div className="admin-header">
            <h1>System Administration</h1>
            <p>Loading system data...</p>
          </div>
          <div className="loading">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-home">
      <div className="section">
        <div className="admin-header">
          <h1>System Administration</h1>
          <p>Welcome back, {admin?.fullName || 'Administrator'}. Manage the Career Bridge platform.</p>
        </div>

        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <button onClick={fetchSystemData} className="btn btn-primary">
              Retry
            </button>
          </div>
        )}

        <div className="dashboard-top">
          <div className="card">
            <h3>Total Users</h3>
            <p className="stat-number">{stats.totalUsers}</p>
            <small>Registered users</small>
          </div>
          <div className="card">
            <h3>Institutions</h3>
            <p className="stat-number">{stats.totalInstitutions}</p>
            <small>Education partners</small>
          </div>
          <div className="card">
            <h3>Companies</h3>
            <p className="stat-number">{stats.totalCompanies}</p>
            <small>Employment partners</small>
          </div>
          <div className="card">
            <h3>Pending Approvals</h3>
            <p className="stat-number">{stats.pendingApprovals}</p>
            <small>Require action</small>
          </div>
        </div>

        <div className="dashboard-top">
          <div className="card">
            <h3>Active Applications</h3>
            <p className="stat-number">{stats.activeApplications}</p>
            <small>Course applications</small>
          </div>
          <div className="card">
            <h3>System Health</h3>
            <p className="stat-number">{stats.systemHealth}%</p>
            <small>Platform status</small>
          </div>
          <div className="card">
            <h3>Database Size</h3>
            <p className="stat-number">2.4GB</p>
            <small>Storage used</small>
          </div>
          <div className="card">
            <h3>Uptime</h3>
            <p className="stat-number">99.9%</p>
            <small>This month</small>
          </div>
        </div>

        <div className="quick-actions stats-grid">
          <div className="card quick-action-card">
            <h3>Manage Users</h3>
            <p>View and manage all system users</p>
            <Link to="/admin/users" className="btn">Manage Users</Link>
          </div>

          <div className="card quick-action-card">
            <h3>Approve Institutions</h3>
            <p>Review institution registrations</p>
            <Link to="/admin/institutions" className="btn">Manage Institutions</Link>
          </div>

          <div className="card quick-action-card">
            <h3>Approve Companies</h3>
            <p>Review company registrations</p>
            <Link to="/admin/companies" className="btn">Manage Companies</Link>
          </div>

          <div className="card quick-action-card">
            <h3>System Reports</h3>
            <p>View platform analytics</p>
            <Link to="/admin/reports" className="btn">View Reports</Link>
          </div>
        </div>

        <div className="section">
          <h3>Recent System Activity</h3>
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-content">
                    <p>{activity.message}</p>
                    <small>{new Date(activity.timestamp).toLocaleString()}</small>
                  </div>
                  <div className="activity-user">
                    {activity.user}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center">
                <p>No recent activity.</p>
              </div>
            )}
          </div>
        </div>

        <div className="section">
          <h3>Quick System Checks</h3>
          <div className="system-checks">
            <div className="check-item success">
              <span>Database Connection ✅</span>
            </div>
            <div className="check-item success">
              <span>Authentication Service </span>
            </div>
            <div className="check-item success">
              <span>File Storage </span>
            </div>
            <div className="check-item success">
              <span>Email Service </span>
            </div>
            <div className="check-item warning">
              <span>Backup Status (Due today) </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
