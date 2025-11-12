import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Fixed import path

const InstituteDashboard = () => {
  const [institute, setInstitute] = useState(null);
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, userRole } = useAuth();

  useEffect(() => {
    if (currentUser && userRole === 'institute') {
      fetchInstituteData();
    }
  }, [currentUser, userRole]);

  const fetchInstituteData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [profileResponse, statsResponse, coursesResponse] = await Promise.all([
        fetch('/api/institute/profile'),
        fetch('/api/institute/stats'),
        fetch('/api/institute/courses')
      ]);

      // Handle profile response
      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        throw new Error(`Failed to load institution profile: ${profileResponse.status}`);
      }
      const profileData = await profileResponse.json();
      setInstitute(profileData);

      // Handle stats response
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        console.warn('Could not load stats:', statsResponse.status);
        // Set default stats if unavailable
        setStats({
          totalCourses: 0,
          totalApplications: 0,
          totalStudents: 0,
          pendingApplications: 0
        });
      }

      // Handle courses response
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
      } else {
        console.warn('Could not load courses:', coursesResponse.status);
        setCourses([]);
      }

    } catch (error) {
      console.error('Error fetching institute data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInstituteData();
  };

  // Show loading while checking auth
  if (!currentUser || userRole !== 'institute') {
    return (
      <div className="section">
        <div className="loading">
          <h3>Access Restricted</h3>
          <p>Please log in with an institute account to access this dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="section">
        <div className="loading">
          <h3>Loading Institution Dashboard</h3>
          <p>Please wait while we load your institution data...</p>
        </div>
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
            <button onClick={handleRefresh} className="btn btn-primary">
              Try Again
            </button>
            <button 
              onClick={() => window.location.href = '/institute-registration'} 
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
    <div className="section">
      <div className="dashboard-header">
        <h1>Institution Dashboard</h1>
        <button onClick={handleRefresh} className="btn btn-secondary">
          Refresh Data
        </button>
      </div>
      
      {institute && (
        <div className="dashboard-welcome">
          <div className="welcome-header">
            <h2>Welcome, {institute.name}</h2>
            <span className={`status-badge status-${institute.status}`}>
              {institute.status.toUpperCase()}
            </span>
          </div>
          
          <div className="institute-details">
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{institute.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Type:</span>
              <span className="detail-value">{institute.type}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Location:</span>
              <span className="detail-value">{institute.location}</span>
            </div>
            {institute.phone && (
              <div className="detail-row">
                <span className="detail-label">Phone:</span>
                <span className="detail-value">{institute.phone}</span>
              </div>
            )}
            {institute.website && (
              <div className="detail-row">
                <span className="detail-label">Website:</span>
                <span className="detail-value">
                  <a href={institute.website} target="_blank" rel="noopener noreferrer">
                    {institute.website}
                  </a>
                </span>
              </div>
            )}
          </div>

          {institute.description && (
            <div className="institute-description">
              <p>{institute.description}</p>
            </div>
          )}

          {institute.status === 'pending' && (
            <div className="pending-notice">
              <h4>Approval Required</h4>
              <p>
                Your institution is currently under review. Once approved by our administration team, 
                you will be able to:
              </p>
              <ul>
                <li>Create and manage courses</li>
                <li>Receive and review student applications</li>
                <li>Access detailed analytics and reports</li>
                <li>Manage your institution profile</li>
              </ul>
              <p className="notice-footer">
                You will receive an email notification once your institution is approved.
              </p>
            </div>
          )}

          {institute.status === 'rejected' && (
            <div className="rejected-notice">
              <h4>Registration Rejected</h4>
              <p>
                Your institution registration has been rejected. 
                {institute.rejectionReason && (
                  <>
                    {' '}Reason: <strong>{institute.rejectionReason}</strong>
                  </>
                )}
              </p>
              <p>
                Please contact support if you believe this was a mistake or would like to appeal.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Statistics Section - Only show if approved */}
      {stats && institute?.status === 'approved' && (
        <div className="section">
          <h3>Institution Statistics</h3>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <h4>Total Courses</h4>
              <p className="stat-number">{stats.totalCourses}</p>
              <p className="stat-label">Active courses</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <h4>Total Applications</h4>
              <p className="stat-number">{stats.totalApplications}</p>
              <p className="stat-label">All applications</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <h4>Total Students</h4>
              <p className="stat-number">{stats.totalStudents}</p>
              <p className="stat-label">Unique applicants</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <h4>Pending Applications</h4>
              <p className="stat-number">{stats.pendingApplications}</p>
              <p className="stat-label">Awaiting review</p>
            </div>
          </div>
        </div>
      )}

      {/* Courses Section - Only show if approved */}
      {courses.length > 0 && institute?.status === 'approved' && (
        <div className="section">
          <div className="section-header">
            <h3>Your Courses ({courses.length})</h3>
            <button className="btn btn-primary">
              Add New Course
            </button>
          </div>
          <div className="courses-list">
            {courses.map(course => (
              <div key={course.id} className="course-card">
                <div className="course-header">
                  <h4>{course.name}</h4>
                  <span className={`status-badge status-${course.status}`}>
                    {course.status}
                  </span>
                </div>
                <p className="course-description">{course.description}</p>
                <div className="course-details">
                  {course.duration && (
                    <div className="course-detail">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{course.duration}</span>
                    </div>
                  )}
                  {course.fee && (
                    <div className="course-detail">
                      <span className="detail-label">Fee:</span>
                      <span className="detail-value">${course.fee}</span>
                    </div>
                  )}
                  {course.enrolledStudents !== undefined && (
                    <div className="course-detail">
                      <span className="detail-label">Enrolled:</span>
                      <span className="detail-value">{course.enrolledStudents} students</span>
                    </div>
                  )}
                </div>
                <div className="course-actions">
                  <button className="btn btn-secondary btn-sm">
                    View Applications
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    Edit Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for Courses */}
      {institute?.status === 'approved' && courses.length === 0 && (
        <div className="section">
          <div className="empty-state">
            <h3>No Courses Yet</h3>
            <p>Start by creating your first course to attract students.</p>
            <button className="btn btn-primary">
              Create Your First Course
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions for Approved Institutions */}
      {institute?.status === 'approved' && (
        <div className="section">
          <h3>Quick Actions</h3>
          <div className="quick-actions">
            <button className="action-card">
              <div className="action-icon">➕</div>
              <span>Add New Course</span>
            </button>
            <button className="action-card">
              <div className="action-icon">📊</div>
              <span>View Analytics</span>
            </button>
            <button className="action-card">
              <div className="action-icon">📝</div>
              <span>Manage Applications</span>
            </button>
            <button className="action-card">
              <div className="action-icon">⚙️</div>
              <span>Institution Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstituteDashboard;
