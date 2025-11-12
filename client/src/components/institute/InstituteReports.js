import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ComponentWrapper = ({ institute, children }) => {
  if (!institute) {
    return (
      <div className="section">
        <div className="error-message">
          <h3>Institute Profile Required</h3>
          <p>Please set up your institute profile first to access this feature.</p>
        </div>
      </div>
    );
  }
  return children;
};

const InstituteReports = ({ institute }) => {
  const { currentUser } = useAuth();
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
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/reports/institute?instituteId=${institute.id}&range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
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
    <ComponentWrapper institute={institute}>
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

        {institute?.status !== 'approved' && (
          <div className="warning-message">
            <p>You cannot view reports until your institution is approved by the administrator.</p>
          </div>
        )}

        {institute?.status === 'approved' && (
          <>
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
          </>
        )}
      </div>
    </ComponentWrapper>
  );
};

export default InstituteReports;
