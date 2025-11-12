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

const AdmissionsManagement = ({ institute }) => {
  const { currentUser } = useAuth();
  const [admittedStudents, setAdmittedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (institute) {
      fetchAdmittedStudents();
    }
  }, [institute]);

  const fetchAdmittedStudents = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/applications?instituteId=${institute.id}&status=admitted`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAdmittedStudents(data);
      }
    } catch (error) {
      console.error('Error fetching admissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptance = async (studentId, courseId, accept) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/applications/acceptance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId,
          courseId,
          instituteId: institute.id,
          accepted: accept
        })
      });

      if (response.ok) {
        alert(`Student ${accept ? 'confirmed' : 'removed'} successfully!`);
        fetchAdmittedStudents();
      }
    } catch (error) {
      console.error('Error updating acceptance:', error);
      alert('Error updating student acceptance');
    }
  };

  const generateAdmissionLetter = (student) => {
    const letterContent = `
      ADMISSION LETTER
      
      Dear ${student.studentName},
      
      We are pleased to inform you that you have been admitted to the 
      ${student.courseName} program at ${institute.name}.
      
      Program: ${student.courseName}
      Start Date: ${student.intake || 'Next Academic Year'}
      
      Please confirm your acceptance within 14 days.
      
      Congratulations!
      
      ${institute.name}
      ${institute.location}
      ${institute.phone}
    `;
    
    alert('Admission letter content:\n\n' + letterContent);
  };

  if (loading) {
    return <div className="section">Loading admissions data...</div>;
  }

  const confirmedStudents = admittedStudents.filter(s => s.accepted);
  const pendingConfirmations = admittedStudents.filter(s => !s.accepted && s.status === 'admitted');

  return (
    <ComponentWrapper institute={institute}>
      <div className="section">
        <h1>Admissions Management</h1>
        <p>Manage admitted students and track acceptances</p>

        {institute?.status !== 'approved' && (
          <div className="warning-message">
            <p>You cannot manage admissions until your institution is approved by the administrator.</p>
          </div>
        )}

        {institute?.status === 'approved' && (
          <>
            <div className="dashboard-top">
              <div className="card">
                <h3>Total Admitted</h3>
                <p className="stat-number">{admittedStudents.length}</p>
              </div>
              <div className="card">
                <h3>Confirmed</h3>
                <p className="stat-number">{confirmedStudents.length}</p>
              </div>
              <div className="card">
                <h3>Pending Confirmation</h3>
                <p className="stat-number">{pendingConfirmations.length}</p>
              </div>
              <div className="card">
                <h3>Acceptance Rate</h3>
                <p className="stat-number">
                  {admittedStudents.length > 0 
                    ? Math.round((confirmedStudents.length / admittedStudents.length) * 100)
                    : 0
                  }%
                </p>
              </div>
            </div>

            <div className="section">
              <h3>Pending Student Confirmations ({pendingConfirmations.length})</h3>
              <div className="admissions-list">
                {pendingConfirmations.map(student => (
                  <div key={student.id} className="admission-card pending">
                    <div className="student-info">
                      <h4>{student.studentName}</h4>
                      <p><strong>Course:</strong> {student.courseName}</p>
                      <p><strong>Email:</strong> {student.studentEmail}</p>
                      <p><strong>Admitted On:</strong> {new Date(student.admissionDate).toLocaleDateString()}</p>
                    </div>
                    <div className="admission-actions">
                      <button
                        onClick={() => generateAdmissionLetter(student)}
                        className="btn btn-secondary"
                      >
                        Generate Letter
                      </button>
                      <button
                        onClick={() => handleAcceptance(student.studentId, student.courseId, true)}
                        className="btn success"
                      >
                        Mark as Confirmed
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to revoke this admission?')) {
                            handleAcceptance(student.studentId, student.courseId, false);
                          }
                        }}
                        className="btn btn-danger"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {pendingConfirmations.length === 0 && (
                <div className="text-center">
                  <p>No pending confirmations.</p>
                </div>
              )}
            </div>

            <div className="section">
              <h3>Confirmed Students ({confirmedStudents.length})</h3>
              <div className="confirmed-students-list">
                {confirmedStudents.map(student => (
                  <div key={student.id} className="admission-card confirmed">
                    <div className="student-info">
                      <h4>{student.studentName}</h4>
                      <p><strong>Course:</strong> {student.courseName}</p>
                      <p><strong>Email:</strong> {student.studentEmail}</p>
                      <p><strong>Confirmed On:</strong> {new Date(student.acceptanceDate).toLocaleDateString()}</p>
                    </div>
                    <div className="admission-actions">
                      <span className="status-badge status-admitted">Confirmed</span>
                      <button
                        onClick={() => generateAdmissionLetter(student)}
                        className="btn btn-secondary"
                      >
                        View Letter
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {confirmedStudents.length === 0 && (
                <div className="text-center">
                  <p>No confirmed students yet.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ComponentWrapper>
  );
};

export default AdmissionsManagement;
