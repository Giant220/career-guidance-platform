import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const CompanyReports = ({ company, currentUser }) => {
  const [reports, setReports] = useState({
    totalApplications: 0,
    totalJobs: 0,
    hiredCandidates: 0,
    pendingApplications: 0,
    applicationStats: [],
    jobStats: []
  });
  const [timeRange, setTimeRange] = useState('current_year');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company && currentUser) {
      fetchReports();
    }
  }, [company, currentUser, timeRange]);

  const fetchReports = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/companies/${company.id}/reports?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process real data from API
      const processedData = processReportData(data, company.id);
      setReports(processedData);
    } catch (error) {
      console.error('Error fetching reports:', error);
      // If API fails, calculate from available data
      calculateReportsFromData();
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (apiData, companyId) => {
    // This function processes the API data to extract real metrics
    // In a real implementation, this would come from the backend
    return {
      totalApplications: apiData.totalApplications || 0,
      totalJobs: apiData.activeJobs || 0,
      hiredCandidates: apiData.hiredCandidates || 0,
      pendingApplications: apiData.pendingApplications || 0,
      applicationStats: apiData.applicationStats || [],
      jobStats: apiData.jobStats || []
    };
  };

  const calculateReportsFromData = async () => {
    try {
      const token = await currentUser.getIdToken();
      
      // Fetch actual company data to calculate real statistics
      const [jobsResponse, applicationsResponse] = await Promise.all([
        fetch(`/api/companies/${company.id}/jobs`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`/api/companies/${company.id}/applications`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (jobsResponse.ok && applicationsResponse.ok) {
        const jobs = await jobsResponse.json();
        const applications = await applicationsResponse.json();
        
        // Calculate real statistics
        const totalJobs = Array.isArray(jobs) ? jobs.length : 0;
        const totalApplications = Array.isArray(applications) ? applications.length : 0;
        const hiredCandidates = Array.isArray(applications) ? 
          applications.filter(app => app.status === 'hired').length : 0;
        const pendingApplications = Array.isArray(applications) ? 
          applications.filter(app => app.status === 'pending').length : 0;

        // Calculate job-specific statistics
        const jobStats = Array.isArray(jobs) ? jobs.map(job => {
          const jobApplications = Array.isArray(applications) ? 
            applications.filter(app => app.jobId === job.id) : [];
          
          return {
            jobTitle: job.title,
            totalApplications: jobApplications.length,
            hired: jobApplications.filter(app => app.status === 'hired').length,
            pending: jobApplications.filter(app => app.status === 'pending').length
          };
        }) : [];

        // Calculate application status distribution
        const applicationStats = Array.isArray(applications) ? [
          { status: 'Pending', count: applications.filter(app => app.status === 'pending').length },
          { status: 'Shortlisted', count: applications.filter(app => app.status === 'shortlisted').length },
          { status: 'Interviewed', count: applications.filter(app => app.status === 'interviewed').length },
          { status: 'Hired', count: applications.filter(app => app.status === 'hired').length },
          { status: 'Rejected', count: applications.filter(app => app.status === 'rejected').length }
        ] : [];

        setReports({
          totalApplications,
          totalJobs,
          hiredCandidates,
          pendingApplications,
          applicationStats,
          jobStats
        });
      }
    } catch (error) {
      console.error('Error calculating reports:', error);
    }
  };

  const exportReport = (type) => {
    // Simple CSV export functionality
    let csvContent = "data:text/csv;charset=utf-8,";
    
    switch(type) {
      case 'applications':
        csvContent += "Application Report\n";
        csvContent += "Status,Count\n";
        reports.applicationStats.forEach(stat => {
          csvContent += `${stat.status},${stat.count}\n`;
        });
        break;
      case 'jobs':
        csvContent += "Job Performance Report\n";
        csvContent += "Job Title,Total Applications,Hired Candidates,Pending Applications\n";
        reports.jobStats.forEach(stat => {
          csvContent += `"${stat.jobTitle}",${stat.totalApplications},${stat.hired},${stat.pending}\n`;
        });
        break;
      default:
        csvContent += "Company Overview\n";
        csvContent += `Total Jobs,${reports.totalJobs}\n`;
        csvContent += `Total Applications,${reports.totalApplications}\n`;
        csvContent += `Hired Candidates,${reports.hiredCandidates}\n`;
        csvContent += `Pending Applications,${reports.pendingApplications}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${company.name}_${type}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getHireRate = () => {
    return reports.totalApplications > 0 ? 
      Math.round((reports.hiredCandidates / reports.totalApplications) * 100) : 0;
  };

  const getAverageApplicationsPerJob = () => {
    return reports.totalJobs > 0 ? 
      Math.round(reports.totalApplications / reports.totalJobs) : 0;
  };

  if (loading) {
    return <div className="section">Loading reports...</div>;
  }

  return (
    <div className="section">
      <div className="flex-between mb-1">
        <div>
          <h1>Company Reports</h1>
          <p>Analytics and insights about your hiring process</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="form-select"
          style={{ width: 'auto' }}
        >
          <option value="current_year">Current Year</option>
          <option value="last_year">Last Year</option>
          <option value="last_6_months">Last 6 Months</option>
          <option value="all_time">All Time</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="dashboard-top">
        <div className="card">
          <h3>Total Jobs Posted</h3>
          <p className="stat-number">{reports.totalJobs}</p>
          <small>Active job postings</small>
        </div>
        <div className="card">
          <h3>Total Applications</h3>
          <p className="stat-number">{reports.totalApplications}</p>
          <small>All applications received</small>
        </div>
        <div className="card">
          <h3>Hired Candidates</h3>
          <p className="stat-number">{reports.hiredCandidates}</p>
          <small>Successful hires</small>
        </div>
        <div className="card">
          <h3>Hire Rate</h3>
          <p className="stat-number">{getHireRate()}%</p>
          <small>Application to hire ratio</small>
        </div>
      </div>

      {/* Application Statistics */}
      <div className="section">
        <h3>Application Status Distribution</h3>
        <div className="applications-stats">
          {reports.applicationStats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-header">
                <h4>{stat.status}</h4>
                <span className="stat-count">{stat.count}</span>
              </div>
              <div className="stat-bar">
                <div 
                  className="stat-fill"
                  style={{ 
                    width: `${reports.totalApplications > 0 ? (stat.count / reports.totalApplications) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <div className="stat-percentage">
                {reports.totalApplications > 0 ? 
                  Math.round((stat.count / reports.totalApplications) * 100) : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job Performance */}
      {reports.jobStats.length > 0 && (
        <div className="section">
          <h3>Job Performance</h3>
          <div className="job-performance-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Total Applications</th>
                  <th>Hired</th>
                  <th>Pending</th>
                  <th>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {reports.jobStats.map((job, index) => (
                  <tr key={index}>
                    <td>{job.jobTitle}</td>
                    <td>{job.totalApplications}</td>
                    <td>{job.hired}</td>
                    <td>{job.pending}</td>
                    <td>
                      <span className={`rate-badge ${job.totalApplications > 0 && (job.hired / job.totalApplications) > 0.1 ? 'high' : 'low'}`}>
                        {job.totalApplications > 0 ? 
                          Math.round((job.hired / job.totalApplications) * 100) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hiring Insights */}
      <div className="section">
        <h3>Hiring Insights</h3>
        <div className="insights-list">
          {reports.totalApplications === 0 ? (
            <div className="insight-card">
              <div className="insight-content">
                <p>No applications received yet. Consider promoting your job postings to attract more candidates.</p>
                <small>Recommendation</small>
              </div>
            </div>
          ) : (
            <>
              {reports.hiredCandidates > 0 && (
                <div className="insight-card">
                  <div className="insight-content">
                    <p>Your hiring success rate is {getHireRate()}%. {getHireRate() > 20 ? 'This is above average for the industry.' : 'Consider reviewing your candidate selection process.'}</p>
                    <small>Performance Metric</small>
                  </div>
                </div>
              )}
              
              {getAverageApplicationsPerJob() > 0 && (
                <div className="insight-card">
                  <div className="insight-content">
                    <p>You receive an average of {getAverageApplicationsPerJob()} applications per job posting.</p>
                    <small>Engagement Metric</small>
                  </div>
                </div>
              )}

              {reports.pendingApplications > 0 && (
                <div className="insight-card">
                  <div className="insight-content">
                    <p>You have {reports.pendingApplications} applications awaiting review. Timely responses improve candidate experience.</p>
                    <small>Action Required</small>
                  </div>
                </div>
              )}

              {reports.jobStats.some(job => job.totalApplications === 0) && (
                <div className="insight-card">
                  <div className="insight-content">
                    <p>Some of your job postings have not received applications. Consider updating job descriptions or requirements.</p>
                    <small>Optimization Suggestion</small>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Export Options */}
      <div className="section">
        <h3>Export Reports</h3>
        <div className="export-actions">
          <button 
            onClick={() => exportReport('overview')}
            className="btn btn-secondary"
            disabled={reports.totalApplications === 0}
          >
            Export Overview CSV
          </button>
          <button 
            onClick={() => exportReport('applications')}
            className="btn btn-secondary"
            disabled={reports.totalApplications === 0}
          >
            Export Applications Report
          </button>
          <button 
            onClick={() => exportReport('jobs')}
            className="btn btn-secondary"
            disabled={reports.jobStats.length === 0}
          >
            Export Job Performance
          </button>
        </div>
      </div>

      {/* Data Last Updated */}
      <div className="section text-center">
        <p className="text-muted">
          Reports generated based on your company's actual hiring data. 
          {timeRange !== 'all_time' && ` Data filtered for: ${timeRange.replace('_', ' ')}`}
        </p>
      </div>
    </div>
  );
};

export default CompanyReports;
