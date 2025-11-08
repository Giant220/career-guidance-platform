import React, { useState, useEffect } from 'react';

const SystemReports = () => {
  const [reports, setReports] = useState({});
  const [timeRange, setTimeRange] = useState('current_year');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [timeRange]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/admin/reports?range=${timeRange}`);
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
          <h1>System Reports</h1>
          <p>Platform-wide analytics and insights</p>
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
          <h3>Total Users</h3>
          <p className="stat-number">{reports.totalUsers || 0}</p>
          <small>{timeRange}</small>
        </div>
        <div className="card">
          <h3>Active Applications</h3>
          <p className="stat-number">{reports.activeApplications || 0}</p>
          <small>Course applications</small>
        </div>
        <div className="card">
          <h3>Admission Rate</h3>
          <p className="stat-number">{reports.admissionRate || 0}%</p>
          <small>System average</small>
        </div>
        <div className="card">
          <h3>Platform Growth</h3>
          <p className="stat-number">{reports.platformGrowth || 0}%</p>
          <small>User growth</small>
        </div>
      </div>

      <div className="section">
        <h3>User Registration Trends</h3>
        <div className="monthly-stats">
          {reports.registrationStats?.map((month, index) => (
            <div key={index} className="month-stat">
              <div className="month-name">{month.month}</div>
              <div className="stat-bar">
                <div 
                  className="bar-fill"
                  style={{ width: `${(month.registrations / (reports.maxRegistrations || 1)) * 100}%` }}
                ></div>
              </div>
              <div className="stat-count">{month.registrations}</div>
            </div>
          )) || <p>No registration statistics available.</p>}
        </div>
      </div>

      <div className="section">
        <h3>Institution Performance</h3>
        <div className="institution-stats">
          {reports.institutionStats?.map((institution, index) => (
            <div key={index} className="institution-stat-card">
              <h4>{institution.name}</h4>
              <div className="stat-details">
                <div className="stat-item">
                  <span>Applications:</span>
                  <strong>{institution.applicationCount}</strong>
                </div>
                <div className="stat-item">
                  <span>Admission Rate:</span>
                  <strong>{institution.admissionRate}%</strong>
                </div>
                <div className="stat-item">
                  <span>Popular Course:</span>
                  <strong>{institution.popularCourse}</strong>
                </div>
              </div>
            </div>
          )) || <p>No institution statistics available.</p>}
        </div>
      </div>

      <div className="section">
        <h3>Export Reports</h3>
        <div className="export-actions">
          <button 
            onClick={() => exportReport('users')}
            className="btn btn-secondary"
          >
            Export Users CSV
          </button>
          <button 
            onClick={() => exportReport('applications')}
            className="btn btn-secondary"
          >
            Export Applications Report
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
        <h3>System Insights</h3>
        <div className="insights-list">
          {reports.insights?.map((insight, index) => (
            <div key={index} className="insight-card">
              <div className="insight-icon">📊</div>
              <div className="insight-content">
                <p>{insight.message}</p>
                <small>{insight.type}</small>
              </div>
            </div>
          )) || <p>No insights available yet. Data will appear as the platform grows.</p>}
        </div>
      </div>
    </div>
  );
};

export default SystemReports;