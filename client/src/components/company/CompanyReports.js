import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const CompanyReports = ({ company, currentUser }) => {
  const [reports, setReports] = useState({});
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
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (type) => {
    alert(`Exporting ${type} report for ${timeRange}...`);
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

      <div className="dashboard-top">
        <div className="card">
          <h3>Total Applications</h3>
          <p className="stat-number">{reports.totalApplications || 0}</p>
          <small>{timeRange}</small>
        </div>
        <div className="card">
          <h3>Hire Rate</h3>
          <p className="stat-number">{reports.hireRate || 0}%</p>
          <small>Application to hire</small>
        </div>
        <div className="card">
          <h3>Avg. Time to Hire</h3>
          <p className="stat-number">{reports.avgTimeToHire || 0}</p>
          <small>Days</small>
        </div>
        <div className="card">
          <h3>Top Job</h3>
          <p className="stat-number">{reports.topJob || 'N/A'}</p>
          <small>Most applications</small>
        </div>
      </div>

      <div className="section">
        <h3>Application Funnel</h3>
        <div className="funnel-container">
          <div className="funnel-stage">
            <div className="stage-label">Applications</div>
            <div className="stage-count">{reports.funnel?.applications || 0}</div>
            <div className="stage-bar" style={{ height: '100px' }}></div>
          </div>
          <div className="funnel-stage">
            <div className="stage-label">Shortlisted</div>
            <div className="stage-count">{reports.funnel?.shortlisted || 0}</div>
            <div className="stage-bar" style={{ height: '70px' }}></div>
          </div>
          <div className="funnel-stage">
            <div className="stage-label">Interviewed</div>
            <div className="stage-count">{reports.funnel?.interviewed || 0}</div>
            <div className="stage-bar" style={{ height: '40px' }}></div>
          </div>
          <div className="funnel-stage">
            <div className="stage-label">Hired</div>
            <div className="stage-count">{reports.funnel?.hired || 0}</div>
            <div className="stage-bar" style={{ height: '20px' }}></div>
          </div>
        </div>
      </div>

      <div className="section">
        <h3>Job-wise Statistics</h3>
        <div className="job-stats">
          {Array.isArray(reports.jobStats) && reports.jobStats.length > 0 ? (
            reports.jobStats.map((job, index) => (
              <div key={index} className="job-stat-card">
                <h4>{job.jobTitle}</h4>
                <div className="stat-details">
                  <div className="stat-item">
                    <span>Applications:</span>
                    <strong>{job.applicationCount}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Shortlisted:</span>
                    <strong>{job.shortlistedCount}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Hired:</span>
                    <strong>{job.hiredCount}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Success Rate:</span>
                    <strong>{job.successRate}%</strong>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No job statistics available.</p>
          )}
        </div>
      </div>

      <div className="section">
        <h3>Candidate Quality Metrics</h3>
        <div className="quality-metrics">
          <div className="metric-card">
            <h4>Average Qualification Match</h4>
            <div className="metric-value">{reports.avgQualificationMatch || 0}%</div>
            <div className="metric-bar">
              <div 
                className="metric-fill"
                style={{ width: `${reports.avgQualificationMatch || 0}%` }}
              ></div>
            </div>
          </div>
          <div className="metric-card">
            <h4>Interview Success Rate</h4>
            <div className="metric-value">{reports.interviewSuccessRate || 0}%</div>
            <div className="metric-bar">
              <div 
                className="metric-fill"
                style={{ width: `${reports.interviewSuccessRate || 0}%` }}
              ></div>
            </div>
          </div>
          <div className="metric-card">
            <h4>Candidate Retention</h4>
            <div className="metric-value">{reports.candidateRetention || 0}%</div>
            <div className="metric-bar">
              <div 
                className="metric-fill"
                style={{ width: `${reports.candidateRetention || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <h3>Export Reports</h3>
        <div className="export-actions">
          <button 
            onClick={() => exportReport('applications')}
            className="btn btn-secondary"
          >
            Export Applications CSV
          </button>
          <button 
            onClick={() => exportReport('hiring')}
            className="btn btn-secondary"
          >
            Export Hiring Report
          </button>
          <button 
            onClick={() => exportReport('analytics')}
            className="btn btn-secondary"
          >
            Export Analytics PDF
          </button>
        </div>
      </div>

      <div className="section">
        <h3>Hiring Insights</h3>
        <div className="insights-list">
          {Array.isArray(reports.insights) && reports.insights.length > 0 ? (
            reports.insights.map((insight, index) => (
              <div key={index} className="insight-card">
                <div className="insight-icon">📊</div>
                <div className="insight-content">
                  <p>{insight.message}</p>
                  <small>{insight.type}</small>
                </div>
              </div>
            ))
          ) : (
            <p>No insights available yet. Data will appear as you process more applications.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyReports;
