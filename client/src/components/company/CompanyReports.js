import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const CompanyReports = ({ company, currentUser }) => {
  const [reports, setReports] = useState({
    totalApplications: 0,
    totalJobs: 0,
    hiredCandidates: 0,
    pendingApplications: 0,
    shortlistedApplications: 0,
    interviewedApplications: 0,
    rejectedApplications: 0,
    applicationStats: [],
    jobStats: []
  });
  const [timeRange, setTimeRange] = useState('all_time');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company && currentUser) {
      fetchReports();
    }
  }, [company, currentUser, timeRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Fetch actual applications data for the company
      await calculateReportsFromData();
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateReportsFromData = async () => {
    try {
      const token = await currentUser.getIdToken();
      
      // Fetch actual company data
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
        
        // Calculate real statistics from actual data
        const totalJobs = Array.isArray(jobs) ? jobs.length : 0;
        const totalApplications = Array.isArray(applications) ? applications.length : 0;
        
        // Count applications by status
        const hiredCandidates = Array.isArray(applications) ? 
          applications.filter(app => app.status === 'hired').length : 0;
        const pendingApplications = Array.isArray(applications) ? 
          applications.filter(app => app.status === 'pending').length : 0;
        const shortlistedApplications = Array.isArray(applications) ? 
          applications.filter(app => app.status === 'shortlisted').length : 0;
        const interviewedApplications = Array.isArray(applications) ? 
          applications.filter(app => app.status === 'interviewed').length : 0;
        const rejectedApplications = Array.isArray(applications) ? 
          applications.filter(app => app.status === 'rejected').length : 0;

        // Calculate job-specific statistics
        const jobStats = Array.isArray(jobs) ? jobs.map(job => {
          const jobApplications = Array.isArray(applications) ? 
            applications.filter(app => app.jobId === job.id) : [];
          
          const hired = jobApplications.filter(app => app.status === 'hired').length;
          const successRate = jobApplications.length > 0 ? 
            Math.round((hired / jobApplications.length) * 100) : 0;
          
          return {
            jobTitle: job.title || 'Unknown Job',
            jobId: job.id,
            totalApplications: jobApplications.length,
            hired: hired,
            pending: jobApplications.filter(app => app.status === 'pending').length,
            shortlisted: jobApplications.filter(app => app.status === 'shortlisted').length,
            interviewed: jobApplications.filter(app => app.status === 'interviewed').length,
            rejected: jobApplications.filter(app => app.status === 'rejected').length,
            successRate: successRate
          };
        }).filter(job => job.totalApplications > 0) : [];

        // Calculate application status distribution
        const applicationStats = [
          { status: 'Pending', count: pendingApplications, color: '#ffc107' },
          { status: 'Shortlisted', count: shortlistedApplications, color: '#17a2b8' },
          { status: 'Interviewed', count: interviewedApplications, color: '#007bff' },
          { status: 'Hired', count: hiredCandidates, color: '#28a745' },
          { status: 'Rejected', count: rejectedApplications, color: '#dc3545' }
        ];

        setReports({
          totalApplications,
          totalJobs,
          hiredCandidates,
          pendingApplications,
          shortlistedApplications,
          interviewedApplications,
          rejectedApplications,
          applicationStats,
          jobStats
        });
      }
    } catch (error) {
      console.error('Error calculating reports:', error);
    }
  };

  const exportReport = (type) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    switch(type) {
      case 'applications':
        csvContent += "Application Status Report\n";
        csvContent += "Status,Count,Percentage\n";
        reports.applicationStats.forEach(stat => {
          const percentage = reports.totalApplications > 0 ? 
            ((stat.count / reports.totalApplications) * 100).toFixed(1) : 0;
          csvContent += `${stat.status},${stat.count},${percentage}%\n`;
        });
        break;
      case 'jobs':
        csvContent += "Job Performance Report\n";
        csvContent += "Job Title,Total Applications,Hired,Shortlisted,Interviewed,Pending,Rejected,Success Rate\n";
        reports.jobStats.forEach(stat => {
          csvContent += `"${stat.jobTitle}",${stat.totalApplications},${stat.hired},${stat.shortlisted},${stat.interviewed},${stat.pending},${stat.rejected},${stat.successRate}%\n`;
        });
        break;
      default:
        csvContent += "Company Hiring Overview Report\n";
        csvContent += `Company,${company.name}\n`;
        csvContent += `Report Period,${timeRange.replace('_', ' ')}\n\n`;
        csvContent += "Metric,Value\n";
        csvContent += `Total Jobs Posted,${reports.totalJobs}\n`;
        csvContent += `Total Applications,${reports.totalApplications}\n`;
        csvContent += `Hired Candidates,${reports.hiredCandidates}\n`;
        csvContent += `Pending Applications,${reports.pendingApplications}\n`;
        csvContent += `Shortlisted Applications,${reports.shortlistedApplications}\n`;
        csvContent += `Interviewed Candidates,${reports.interviewedApplications}\n`;
        csvContent += `Rejected Applications,${reports.rejectedApplications}\n`;
        csvContent += `Overall Hire Rate,${getHireRate()}%\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${company.name}_${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
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

  const getTopPerformingJob = () => {
    if (reports.jobStats.length === 0) return null;
    return reports.jobStats.reduce((top, job) => 
      job.successRate > top.successRate ? job : top
    );
  };

  if (loading) {
    return <div className="section">Loading reports...</div>;
  }

  const topJob = getTopPerformingJob();

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
          <option value="all_time">All Time</option>
          <option value="current_year">Current Year</option>
          <option value="last_year">Last Year</option>
          <option value="last_6_months">Last 6 Months</option>
        </select>
      </div>

      {/* Key Metrics - Focus on Total Applications */}
      <div className="dashboard-top">
        <div className="card highlight-card">
          <h3>Total Applications</h3>
          <p className="stat-number large">{reports.totalApplications}</p>
          <small>All applications received by your company</small>
        </div>
        <div className="card">
          <h3>Active Job Postings</h3>
          <p className="stat-number">{reports.totalJobs}</p>
          <small>Current job openings</small>
        </div>
        <div className="card">
          <h3>Successful Hires</h3>
          <p className="stat-number">{reports.hiredCandidates}</p>
          <small>Candidates hired</small>
        </div>
        <div className="card">
          <h3>Overall Hire Rate</h3>
          <p className="stat-number">{getHireRate()}%</p>
          <small>Application to hire conversion</small>
        </div>
      </div>

      {/* Application Breakdown */}
      <div className="section">
        <h3>Application Breakdown</h3>
        <div className="applications-breakdown">
          <div className="breakdown-grid">
            <div className="breakdown-item pending">
              <h4>Pending Review</h4>
              <p className="count">{reports.pendingApplications}</p>
              <div className="percentage">
                {reports.totalApplications > 0 ? 
                  Math.round((reports.pendingApplications / reports.totalApplications) * 100) : 0}%
              </div>
            </div>
            <div className="breakdown-item shortlisted">
              <h4>Shortlisted</h4>
              <p className="count">{reports.shortlistedApplications}</p>
              <div className="percentage">
                {reports.totalApplications > 0 ? 
                  Math.round((reports.shortlistedApplications / reports.totalApplications) * 100) : 0}%
              </div>
            </div>
            <div className="breakdown-item interviewed">
              <h4>Interviewed</h4>
              <p className="count">{reports.interviewedApplications}</p>
              <div className="percentage">
                {reports.totalApplications > 0 ? 
                  Math.round((reports.interviewedApplications / reports.totalApplications) * 100) : 0}%
              </div>
            </div>
            <div className="breakdown-item hired">
              <h4>Hired</h4>
              <p className="count">{reports.hiredCandidates}</p>
              <div className="percentage">
                {reports.totalApplications > 0 ? 
                  Math.round((reports.hiredCandidates / reports.totalApplications) * 100) : 0}%
              </div>
            </div>
            <div className="breakdown-item rejected">
              <h4>Not Selected</h4>
              <p className="count">{reports.rejectedApplications}</p>
              <div className="percentage">
                {reports.totalApplications > 0 ? 
                  Math.round((reports.rejectedApplications / reports.totalApplications) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Status Distribution */}
      {reports.totalApplications > 0 && (
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
                      width: `${reports.totalApplications > 0 ? (stat.count / reports.totalApplications) * 100 : 0}%`,
                      backgroundColor: stat.color
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
      )}

      {/* Job Performance */}
      {reports.jobStats.length > 0 && (
        <div className="section">
          <h3>Job Performance by Applications</h3>
          <div className="job-performance-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Total Applications</th>
                  <th>Shortlisted</th>
                  <th>Interviewed</th>
                  <th>Hired</th>
                  <th>Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {reports.jobStats.map((job, index) => (
                  <tr key={index}>
                    <td>{job.jobTitle}</td>
                    <td><strong>{job.totalApplications}</strong></td>
                    <td>{job.shortlisted}</td>
                    <td>{job.interviewed}</td>
                    <td>{job.hired}</td>
                    <td>
                      <span className={`rate-badge ${job.successRate >= 20 ? 'high' : job.successRate >= 10 ? 'medium' : 'low'}`}>
                        {job.successRate}%
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
                <p>No applications received yet. Start by creating job postings and promoting them to attract candidates.</p>
                <small>Getting Started</small>
              </div>
            </div>
          ) : (
            <>
              <div className="insight-card">
                <div className="insight-content">
                  <p>Your company has received <strong>{reports.totalApplications} total applications</strong> across {reports.totalJobs} job postings.</p>
                  <small>Application Volume</small>
                </div>
              </div>

              {reports.hiredCandidates > 0 && (
                <div className="insight-card">
                  <div className="insight-content">
                    <p>You've successfully hired <strong>{reports.hiredCandidates} candidates</strong> with an overall hire rate of <strong>{getHireRate()}%</strong>.</p>
                    <small>Hiring Success</small>
                  </div>
                </div>
              )}

              {reports.pendingApplications > 0 && (
                <div className="insight-card">
                  <div className="insight-content">
                    <p>You have <strong>{reports.pendingApplications} applications pending review</strong>. Timely responses improve candidate experience.</p>
                    <small>Action Required</small>
                  </div>
                </div>
              )}

              {topJob && (
                <div className="insight-card">
                  <div className="insight-content">
                    <p>Your top-performing job is "<strong>{topJob.jobTitle}</strong>" with {topJob.totalApplications} applications and a {topJob.successRate}% hire rate.</p>
                    <small>Best Performing Role</small>
                  </div>
                </div>
              )}

              {getAverageApplicationsPerJob() > 0 && (
                <div className="insight-card">
                  <div className="insight-content">
                    <p>On average, each job posting receives <strong>{getAverageApplicationsPerJob()} applications</strong>.</p>
                    <small>Application Distribution</small>
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

      {/* Summary */}
      <div className="section summary-card">
        <h3>Summary</h3>
        <div className="summary-content">
          <p>
            <strong>Total Applications:</strong> {reports.totalApplications} | 
            <strong> Successful Hires:</strong> {reports.hiredCandidates} | 
            <strong> Overall Hire Rate:</strong> {getHireRate()}%
          </p>
          <p className="text-muted">
            Report generated on {new Date().toLocaleDateString()} for {company.name}. 
            {timeRange !== 'all_time' && ` Data filtered for: ${timeRange.replace('_', ' ')}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanyReports;
