import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import CompanyProfile from './CompanyProfile';
import PostJobs from './PostJobs';
import ViewApplicants from './ViewApplicants';
import CompanyReports from './CompanyReports';
import './CompanyDashboard.css';

const CompanyDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanyData();
  }, [currentUser]);

  const fetchCompanyData = async () => {
    try {
      if (currentUser) {
        const response = await fetch(`/api/companies/${currentUser.uid}/profile`);
        const data = await response.json();
        setCompany(data);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
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
    return <div className="loading">Loading company dashboard...</div>;
  }

  return (
    <div className="company-dashboard">
      <nav className="navbar">
        <div className="logo-area">
          <div className="logo" style={{ backgroundColor: '#ffda77' }}></div>
          <span className="brand">
            {company?.name || 'Company Portal'}
          </span>
        </div>
        <div className="nav-links">
          <Link to="/company" onClick={() => window.location.reload()}>Dashboard</Link>
          <Link to="/company/profile">Profile</Link>
          <Link to="/company/jobs">Jobs</Link>
          <Link to="/company/applicants">Applicants</Link>
          <Link to="/company/reports">Reports</Link>
          <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="main-content">
        <Routes>
          <Route path="/" element={<CompanyHome company={company} />} />
          <Route path="/profile" element={<CompanyProfile company={company} onUpdate={fetchCompanyData} />} />
          <Route path="/jobs" element={<PostJobs company={company} />} />
          <Route path="/applicants" element={<ViewApplicants company={company} />} />
          <Route path="/reports" element={<CompanyReports company={company} />} />
        </Routes>
      </div>
    </div>
  );
};

const CompanyHome = ({ company }) => {
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    qualifiedCandidates: 0,
    interviewRate: 0
  });

  useEffect(() => {
    fetchCompanyStats();
  }, [company]);

  const fetchCompanyStats = async () => {
    try {
      const response = await fetch(`/api/companies/${company?.id}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="company-home">
      <div className="section">
        <div className="company-header">
          <h1>Welcome, {company?.name}</h1>
          <p>{company?.description || 'Find qualified graduates and manage job applications'}</p>
          <div className={`status-badge status-${company?.status || 'pending'}`}>
            {company?.status || 'Pending Approval'}
          </div>
        </div>

        <div className="dashboard-top">
          <div className="card">
            <h3>Active Jobs</h3>
            <p className="stat-number">{stats.activeJobs}</p>
            <small>Currently posted</small>
          </div>
          <div className="card">
            <h3>Total Applications</h3>
            <p className="stat-number">{stats.totalApplications}</p>
            <small>All time</small>
          </div>
          <div className="card">
            <h3>Qualified Candidates</h3>
            <p className="stat-number">{stats.qualifiedCandidates}</p>
            <small>Ready for interview</small>
          </div>
          <div className="card">
            <h3>Interview Rate</h3>
            <p className="stat-number">{stats.interviewRate}%</p>
            <small>Conversion rate</small>
          </div>
        </div>

        <div className="quick-actions stats-grid">
          <div className="card quick-action-card">
            <h3>Post New Job</h3>
            <p>Create a new job posting</p>
            <Link to="/company/jobs" className="btn">Post Job</Link>
          </div>
          
          <div className="card quick-action-card">
            <h3>View Applicants</h3>
            <p>Review candidate applications</p>
            <Link to="/company/applicants" className="btn">View Applicants</Link>
          </div>
          
          <div className="card quick-action-card">
            <h3>Company Profile</h3>
            <p>Update company information</p>
            <Link to="/company/profile" className="btn">Update Profile</Link>
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
            <p>Your company is currently under review. You will be able to post jobs and view candidates once approved by the system administrator.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;