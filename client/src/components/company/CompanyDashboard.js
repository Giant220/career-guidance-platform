import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CompanyProfile from './CompanyProfile';
import PostJobs from './PostJobs';
import ViewApplications from './ViewApplications';
import CandidateManagement from './CandidateManagement';
import CompanyReports from './CompanyReports';
import './CompanyDashboard.css';

const CompanyDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      fetchCompanyData();
    }
  }, [currentUser]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const token = await currentUser.getIdToken();
      
      const response = await fetch('/api/companies/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          navigate('/company-registration');
          return;
        }
        throw new Error(`Failed to fetch company data: ${response.status}`);
      }

      const data = await response.json();
      setCompany(data);
    } catch (error) {
      console.error('Error fetching company data:', error);
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
      <div className="section">
        <div className="loading">Loading company dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section">
        <div className="error-message">
          <h3>Unable to Load Dashboard</h3>
          <p>{error}</p>
          <div className="action-buttons">
            <button onClick={fetchCompanyData} className="btn btn-primary">
              Try Again
            </button>
            <button 
              onClick={() => navigate('/company-registration')} 
              className="btn btn-secondary"
            >
              Complete Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="company-dashboard">
      <nav className="navbar">
        <div className="logo-area">
          <div className="logo" style={{ backgroundColor: '#ffda77', opacity: 0 }}></div>
          <span className="brand">
            {company?.name || 'Company Portal'}
          </span>
        </div>
        <div className="nav-links">
          <Link to="/company">Dashboard</Link>
          <Link to="/company/profile">Profile</Link>
          <Link to="/company/jobs">Jobs</Link>
          <Link to="/company/applications">Applications</Link>
          <Link to="/company/candidates">Candidates</Link>
          <Link to="/company/reports">Reports</Link>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="main-content">
        <Routes>
          <Route path="/" element={<CompanyHome company={company} currentUser={currentUser} />} />
          <Route path="/profile" element={<CompanyProfile company={company} onUpdate={fetchCompanyData} currentUser={currentUser} />} />
          <Route path="/jobs" element={<PostJobs company={company} currentUser={currentUser} />} />
          <Route path="/applications" element={<ViewApplications company={company} currentUser={currentUser} />} />
          <Route path="/candidates" element={<CandidateManagement company={company} currentUser={currentUser} />} />
          <Route path="/reports" element={<CompanyReports company={company} currentUser={currentUser} />} />
        </Routes>
      </div>
    </div>
  );
};

const CompanyHome = ({ company, currentUser }) => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    pendingApplications: 0,
    totalCandidates: 0,
    hireRate: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    if (currentUser && company) {
      fetchCompanyStats();
    }
  }, [company, currentUser]);

  const fetchCompanyStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(false);
      
      if (!company?.id || !currentUser) {
        throw new Error('Company ID or user not available');
      }

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/companies/stats/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching company stats:', error);
      setStatsError(true);
      setStats({
        totalJobs: 0,
        pendingApplications: 0,
        totalCandidates: 0,
        hireRate: 0
      });
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div className="company-home">
      <div className="section">
        <div className="company-header">
          <h1>Welcome, {company?.name || 'Company'}</h1>
          <p>{company?.description || 'Manage your job postings and candidate applications'}</p>
          <div className={`status-badge status-${company?.status || 'pending'}`}>
            {company?.status || 'Pending Approval'}
          </div>
        </div>

        {statsError && (
          <div className="warning-message">
            <p>⚠️ Statistics are temporarily unavailable. You can still manage your jobs and applications.</p>
          </div>
        )}

        <div className="dashboard-top">
          <div className="card">
            <h3>Active Jobs</h3>
            <p className="stat-number">
              {statsLoading ? '...' : stats.totalJobs}
            </p>
            <small>Current postings</small>
          </div>
          <div className="card">
            <h3>Pending Applications</h3>
            <p className="stat-number">
              {statsLoading ? '...' : stats.pendingApplications}
            </p>
            <small>Require review</small>
          </div>
          <div className="card">
            <h3>Total Candidates</h3>
            <p className="stat-number">
              {statsLoading ? '...' : stats.totalCandidates}
            </p>
            <small>All time</small>
          </div>
          <div className="card">
            <h3>Hire Rate</h3>
            <p className="stat-number">
              {statsLoading ? '...' : `${stats.hireRate}%`}
            </p>
            <small>Success rate</small>
          </div>
        </div>

        <div className="quick-actions stats-grid">
          <div className="card quick-action-card">
            <h3>Manage Jobs</h3>
            <p>Create and update job postings</p>
            <Link to="/company/jobs" className="btn">Manage Jobs</Link>
          </div>
          
          <div className="card quick-action-card">
            <h3>Review Applications</h3>
            <p>Process job applications</p>
            <Link to="/company/applications" className="btn">View Applications</Link>
          </div>
          
          <div className="card quick-action-card">
            <h3>Candidates</h3>
            <p>Manage candidate pipeline</p>
            <Link to="/company/candidates" className="btn">Manage Candidates</Link>
          </div>
          
          <div className="card quick-action-card">
            <h3>Reports</h3>
            <p>View hiring analytics</p>
            <Link to="/company/reports" className="btn">View Reports</Link>
          </div>
        </div>

        {company?.status !== 'approved' && (
          <div className="section warning-message">
            <h3>⚠️ Pending Approval</h3>
            <p>Your company is currently under review. You will be able to post jobs and receive applications once approved by the system administrator.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;
