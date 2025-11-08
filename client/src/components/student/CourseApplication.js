import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const CourseApplication = () => {
  const { currentUser } = useAuth();
  const [qualifiedCourses, setQualifiedCourses] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstitution, setSelectedInstitution] = useState('');

  useEffect(() => {
    fetchQualifiedCourses();
    fetchApplications();
  }, []);

  const fetchQualifiedCourses = async () => {
    try {
      const response = await fetch(`/api/students/${currentUser.uid}/qualified-courses`);
      const data = await response.json();
      setQualifiedCourses(data);
      
      // Get unique institutions for filter
      const institutions = [...new Set(data.map(course => course.institutionName))];
      if (institutions.length > 0) {
        setSelectedInstitution(institutions[0]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch(`/api/students/${currentUser.uid}/applications`);
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleApply = async (courseId, courseName, institutionId) => {
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: currentUser.uid,
          courseId: courseId,
          institutionId: institutionId,
          courseName: courseName,
          applicationDate: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('Application submitted successfully!');
        fetchApplications();
        fetchQualifiedCourses();
      } else {
        alert('Failed to submit application. You may have reached the limit for this institution.');
      }
    } catch (error) {
      console.error('Error applying:', error);
      alert('Error submitting application');
    }
  };

  const hasAppliedToInstitution = (institutionId) => {
    return applications.filter(app => 
      app.institutionId === institutionId && app.status !== 'rejected'
    ).length >= 2;
  };

  const hasAppliedToCourse = (courseId) => {
    return applications.some(app => app.courseId === courseId && app.status !== 'rejected');
  };

  const filteredCourses = qualifiedCourses.filter(course => 
    selectedInstitution ? course.institutionName === selectedInstitution : true
  );

  const institutions = [...new Set(qualifiedCourses.map(course => course.institutionName))];

  if (loading) {
    return <div className="section">Loading courses...</div>;
  }

  return (
    <div className="section">
      <h1>Course Applications</h1>
      <p>Browse courses you qualify for and apply (max 2 per institution)</p>

      {applications.length > 0 && (
        <div className="section">
          <h3>Your Applications</h3>
          <div className="applications-list">
            {applications.map(application => (
              <div key={application.id} className="application-card">
                <div className="application-info">
                  <h4>{application.courseName}</h4>
                  <p>{application.institutionName}</p>
                  <span className={`status-badge status-${application.status}`}>
                    {application.status}
                  </span>
                </div>
                <div className="application-date">
                  Applied: {new Date(application.applicationDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <div className="flex-between mb-1">
          <h3>Available Courses</h3>
          <select 
            value={selectedInstitution} 
            onChange={(e) => setSelectedInstitution(e.target.value)}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="">All Institutions</option>
            {institutions.map(inst => (
              <option key={inst} value={inst}>{inst}</option>
            ))}
          </select>
        </div>

        <div className="courses-grid">
          {filteredCourses.map(course => {
            const appliedToInstitution = hasAppliedToInstitution(course.institutionId);
            const appliedToCourse = hasAppliedToCourse(course.id);
            const canApply = !appliedToCourse && 
              (applications.filter(app => app.institutionId === course.institutionId).length < 2);

            return (
              <div key={course.id} className="course-card">
                <h3>{course.name}</h3>
                <p className="institution">{course.institutionName}</p>
                <p className="duration">Duration: {course.duration}</p>
                <p className="fees">Fees: {course.fees}</p>
                <p className="description">{course.description}</p>
                
                <div className="requirements">
                  <h4>Requirements:</h4>
                  {course.requirements.map((req, index) => (
                    <div key={index} className="requirement-item">
                      <span>{req}</span>
                    </div>
                  ))}
                </div>

                <div className="course-actions">
                  {appliedToCourse ? (
                    <button className="btn btn-secondary" disabled>
                      Already Applied
                    </button>
                  ) : appliedToInstitution ? (
                    <button className="btn btn-secondary" disabled>
                      Max Applications Reached
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleApply(course.id, course.name, course.institutionId)}
                      className="btn"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center">
            <p>No courses found matching your criteria.</p>
            <p>Make sure you've entered your grades to see qualified courses.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseApplication;