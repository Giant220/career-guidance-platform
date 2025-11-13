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
      // ✅ ADD AUTHENTICATION TOKEN
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/students/${currentUser.uid}/qualified-courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // ✅ ENSURE DATA IS ALWAYS AN ARRAY
      if (Array.isArray(data)) {
        setQualifiedCourses(data);
        
        // Get unique institutions for filter
        const institutions = [...new Set(data.map(course => course.institutionName))];
        if (institutions.length > 0) {
          setSelectedInstitution(institutions[0]);
        }
      } else {
        console.error('Invalid response format:', data);
        setQualifiedCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setQualifiedCourses([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      // ✅ ADD AUTHENTICATION TOKEN
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/students/${currentUser.uid}/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // ✅ ENSURE DATA IS ALWAYS AN ARRAY
      if (Array.isArray(data)) {
        setApplications(data);
      } else {
        console.error('Invalid response format:', data);
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]); // Set empty array on error
    }
  };

  const handleApply = async (courseId, courseName, institutionId) => {
    try {
      // ✅ VALIDATE ALL FIELDS BEFORE SENDING
      if (!courseId || !courseName || !institutionId) {
        alert('Missing required application information. Please try again.');
        return;
      }

      // ✅ ADD AUTHENTICATION TOKEN
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: currentUser.uid,
          courseId: courseId,
          instituteId: institutionId, // ✅ CHANGED: institutionId → instituteId
          courseName: courseName,
          studentName: currentUser.displayName || 'Student', // ✅ ADDED: Required by backend
          studentEmail: currentUser.email || '', // ✅ ADDED: Required by backend
          applicationDate: new Date().toISOString(),
          status: 'pending',
          createdAt: new Date().toISOString()
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Application submitted successfully!');
        fetchApplications();
        fetchQualifiedCourses();
      } else {
        alert(`Failed to submit application: ${result.error || 'You may have reached the limit for this institution.'}`);
      }
    } catch (error) {
      console.error('Error applying:', error);
      alert('Error submitting application: ' + error.message);
    }
  };

  const hasAppliedToInstitution = (institutionId) => {
    if (!Array.isArray(applications)) return false;
    
    return applications.filter(app => 
      app.instituteId === institutionId && app.status !== 'rejected' // ✅ CHANGED: institutionId → instituteId
    ).length >= 2;
  };

  const hasAppliedToCourse = (courseId) => {
    if (!Array.isArray(applications)) return false;
    
    return applications.some(app => app.courseId === courseId && app.status !== 'rejected');
  };

  // ✅ SAFE FILTERING - Ensure qualifiedCourses is always an array
  const filteredCourses = Array.isArray(qualifiedCourses) 
    ? qualifiedCourses.filter(course => 
        selectedInstitution ? course.institutionName === selectedInstitution : true
      )
    : [];

  // ✅ SAFE INSTITUTION EXTRACTION
  const institutions = Array.isArray(qualifiedCourses) 
    ? [...new Set(qualifiedCourses.map(course => course.institutionName))].filter(Boolean)
    : [];

  if (loading) {
    return <div className="section">Loading courses...</div>;
  }

  return (
    <div className="section">
      <h1>Course Applications</h1>
      <p>Browse courses you qualify for and apply (max 2 per institution)</p>

      {Array.isArray(applications) && applications.length > 0 && (
        <div className="section">
          <h3>Your Applications</h3>
          <div className="applications-list">
            {applications.map(application => (
              <div key={application.id} className="application-card">
                <div className="application-info">
                  <h4>{application.courseName || 'Unknown Course'}</h4>
                  <p>{application.institutionName || 'Unknown Institution'}</p>
                  <span className={`status-badge status-${application.status || 'pending'}`}>
                    {application.status || 'pending'}
                  </span>
                </div>
                <div className="application-date">
                  Applied: {application.applicationDate ? new Date(application.applicationDate).toLocaleDateString() : 'Unknown date'}
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
              (Array.isArray(applications) ? applications.filter(app => app.instituteId === course.institutionId).length < 2 : true); // ✅ CHANGED: institutionId → instituteId

            return (
              <div key={course.id} className="course-card">
                <h3>{course.name || 'Unnamed Course'}</h3>
                <p className="institution">{course.institutionName || 'Unknown Institution'}</p>
                <p className="duration">Duration: {course.duration || 'Not specified'}</p>
                <p className="fees">Fees: {course.fees || 'Not specified'}</p>
                <p className="description">{course.description || 'No description available'}</p>
                
                <div className="requirements">
                  <h4>Requirements:</h4>
                  {Array.isArray(course.requirements) ? course.requirements.map((req, index) => (
                    <div key={index} className="requirement-item">
                      <span>{req}</span>
                    </div>
                  )) : <p>No specific requirements</p>}
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
                      onClick={() => handleApply(
                        course.id, 
                        course.name, 
                        course.institutionId
                      )}
                      className="btn"
                      disabled={!course.institutionId} // Disable if no institutionId
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
            <button onClick={fetchQualifiedCourses} className="btn btn-secondary mt-1">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseApplication;
