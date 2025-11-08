import React, { useState, useEffect } from 'react';

const InstituteReports = ({ institute }) => {
  const [reports, setReports] = useState({});
  const [timeRange, setTimeRange] = useState('current_year');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (institute) {
      fetchReports();
    }
  }, [institute, timeRange]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/institutes/${institute.id}/reports?range=${timeRange}`);
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (type) => {
    // This would generate and download a report in a real implementation
    alert(`Exporting ${type} report for ${timeRange}...`);
  };

  if (loading) {
    return <div className="section">Loading reports...</div>;
  }

  return (
    <div className="section">
      <div className="flex-between mb-1">
        <div>
          <h1>Institutional Reports</h1>
          <p>Analytics and insights about your institution's performance</p>
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
          <h3>Admission Rate</h3>
          <p className="stat-number">{reports.admissionRate || 0}%</p>
          <small>Acceptance ratio</small>
        </div>
        <div className="card">
          <h3>Popular Course</h3>
          <p className="stat-number">{reports.popularCourse || 'N/A'}</p>
          <small>Most applications</small>
        </div>
        <div className="card">
          <h3>Completion Rate</h3>
          <p className="stat-number">{reports.completionRate || 0}%</p>
          <small>Estimated</small>
        </div>
      </div>

      <div className="section">
        <h3>Course-wise Applications</h3>
        <div className="course-stats">
          {reports.courseStats?.map((course, index) => (
            <div key={index} className="course-stat-card">
              <h4>{course.courseName}</h4>
              <div className="stat-details">
                <div className="stat-item">
                  <span>Applications:</span>
                  <strong>{course.applicationCount}</strong>
                </div>
                <div className="stat-item">
                  <span>Admitted:</span>
                  <strong>{course.admittedCount}</strong>
                </div>
                <div className="stat-item">
                  <span>Admission Rate:</span>
                  <strong>{course.admissionRate}%</strong>
                </div>
              </div>
            </div>
          )) || <p>No course statistics available.</p>}
        </div>
      </div>

      <div className="section">
        <h3>Monthly Applications</h3>
        <div className="monthly-stats">
          {reports.monthlyStats?.map((month, index) => (
            <div key={index} className="month-stat">
              <div className="month-name">{month.month}</div>
              <div className="stat-bar">
                <div 
                  className="bar-fill"
                  style={{ width: `${(month.applications / (reports.maxMonthlyApplications || 1)) * 100}%` }}
                ></div>
              </div>
              <div className="stat-count">{month.applications}</div>
            </div>
          )) || <p>No monthly statistics available.</p>}
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
            onClick={() => exportReport('admissions')}
            className="btn btn-secondary"
          >
            Export Admissions Report
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
        <h3>Quick Insights</h3>
        <div className="insights-list">
          {reports.insights?.map((insight, index) => (
            <div key={index} className="insight-card">
              <div className="insight-icon">💡</div>
              <div className="insight-content">
                <p>{insight.message}</p>
                <small>{insight.type}</small>
              </div>
            </div>
          )) || <p>No insights available yet. Data will appear as you process more applications.</p>}
        </div>
      </div>
    </div>
  );
};

export default InstituteReports;