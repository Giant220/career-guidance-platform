import React, { useState, useEffect } from 'react';

const InstituteDashboard = () => {
  const [institute, setInstitute] = useState(null);
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInstituteData();
  }, []);

  const fetchInstituteData = async () => {
    try {
      setLoading(true);
      
      // Fetch institute profile
      const profileResponse = await fetch('/api/institute/profile');
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch institute profile');
      }
      const profileData = await profileResponse.json();
      setInstitute(profileData);

      // Fetch institute stats
      const statsResponse = await fetch('/api/institute/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch institute courses
      const coursesResponse = await fetch('/api/institute/courses');
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
      }

    } catch (error) {
      console.error('Error fetching institute data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="section">
        <div className="loading">Loading institute dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section">
        <div className="error-message">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-secondary">
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <h1>Institute Dashboard</h1>
      
      {institute && (
        <div className="dashboard-welcome">
          <h2>Welcome, {institute.name}</h2>
          <p>Email: {institute.email} | Type: {institute.type} | Location: {institute.location}</p>
          <p>Status: <span className={`status-badge status-${institute.status}`}>{institute.status}</span></p>
          {institute.status === 'pending' && (
            <div className="pending-notice">
              <strong>Your institution is pending approval.</strong> You will be able to manage courses and view applications once approved by admin.
            </div>
          )}
          {institute.description && <p>{institute.description}</p>}
        </div>
      )}

      {stats && institute?.status === 'approved' && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Courses</h3>
            <p className="stat-number">{stats.totalCourses}</p>
          </div>
          <div className="stat-card">
            <h3>Total Applications</h3>
            <p className="stat-number">{stats.totalApplications}</p>
          </div>
          <div className="stat-card">
            <h3>Total Students</h3>
            <p className="stat-number">{stats.totalStudents}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Applications</h3>
            <p className="stat-number">{stats.pendingApplications}</p>
          </div>
        </div>
      )}

      {courses.length > 0 && institute?.status === 'approved' && (
        <div className="section">
          <h3>Your Courses</h3>
          <div className="courses-list">
            {courses.map(course => (
              <div key={course.id} className="course-card">
                <h4>{course.name}</h4>
                <p>{course.description}</p>
                <div className="course-details">
                  <span>Duration: {course.duration}</span>
                  <span>Fee: ${course.fee}</span>
                  <span>Status: <span className={`status-badge status-${course.status}`}>{course.status}</span></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {institute?.status === 'pending' && (
        <div className="section">
          <div className="pending-message">
            <h3>Waiting for Approval</h3>
            <p>Your institution registration is under review. You will receive an email notification once your institution is approved.</p>
            <p>Once approved, you will be able to:</p>
            <ul>
              <li>Create and manage courses</li>
              <li>View student applications</li>
              <li>Track enrollment statistics</li>
              <li>Manage your institute profile</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstituteDashboard;
