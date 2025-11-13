import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AdmissionsResults = () => {
  const { currentUser } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    try {
      // ✅ ADD AUTHENTICATION TOKEN
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/students/${currentUser.uid}/admissions`, {
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
        setAdmissions(data);
      } else {
        console.error('Invalid response format:', data);
        setAdmissions([]);
      }
    } catch (error) {
      console.error('Error fetching admissions:', error);
      setAdmissions([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAdmission = async (admissionId, institutionId) => {
    try {
      // ✅ ADD AUTHENTICATION TOKEN
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/students/accept-admission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: currentUser.uid,
          admissionId: admissionId,
          institutionId: institutionId
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Admission accepted successfully!');
        fetchAdmissions();
      } else {
        alert(`Error: ${result.error || 'Failed to accept admission'}`);
      }
    } catch (error) {
      console.error('Error accepting admission:', error);
      alert('Error accepting admission');
    }
  };

  // ✅ SAFE ARRAY FILTERING
  const admittedApplications = Array.isArray(admissions) 
    ? admissions.filter(app => app.status === 'admitted')
    : [];
  
  const pendingApplications = Array.isArray(admissions) 
    ? admissions.filter(app => app.status === 'pending')
    : [];
  
  const rejectedApplications = Array.isArray(admissions) 
    ? admissions.filter(app => app.status === 'rejected')
    : [];

  if (loading) {
    return <div className="section">Loading admissions...</div>;
  }

  return (
    <div className="section">
      <h1>Admissions Results</h1>
      <p>Track your application status across all institutions</p>

      {admittedApplications.length > 0 && (
        <div className="section">
          <h2 className="text-gold">🎉 Congratulations! You've Been Admitted</h2>
          <div className="admissions-grid">
            {admittedApplications.map(admission => (
              <div key={admission.id} className="admission-card admitted">
                <div className="admission-header">
                  <h3>{admission.courseName || 'Unknown Course'}</h3>
                  <span className="status-badge status-admitted">Admitted</span>
                </div>
                <p className="institution">{admission.institutionName || 'Unknown Institution'}</p>
                <p className="admission-date">
                  Admitted on: {admission.admissionDate ? new Date(admission.admissionDate).toLocaleDateString() : 'Unknown date'}
                </p>
                <div className="admission-actions">
                  {!admission.accepted ? (
                    <button 
                      onClick={() => handleAcceptAdmission(admission.id, admission.institutionId)}
                      className="btn"
                    >
                      Accept Admission
                    </button>
                  ) : (
                    <span className="success">✓ Admission Accepted</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingApplications.length > 0 && (
        <div className="section">
          <h3>Pending Applications</h3>
          <div className="applications-list">
            {pendingApplications.map(application => (
              <div key={application.id} className="application-card pending">
                <div className="application-info">
                  <h4>{application.courseName || 'Unknown Course'}</h4>
                  <p>{application.institutionName || 'Unknown Institution'}</p>
                  <span className="status-badge status-pending">Under Review</span>
                </div>
                <div className="application-date">
                  Applied: {application.applicationDate ? new Date(application.applicationDate).toLocaleDateString() : 'Unknown date'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rejectedApplications.length > 0 && (
        <div className="section">
          <h3>Application Decisions</h3>
          <div className="applications-list">
            {rejectedApplications.map(application => (
              <div key={application.id} className="application-card rejected">
                <div className="application-info">
                  <h4>{application.courseName || 'Unknown Course'}</h4>
                  <p>{application.institutionName || 'Unknown Institution'}</p>
                  <span className="status-badge status-rejected">Not Admitted</span>
                </div>
                {application.rejectionReason && (
                  <p className="rejection-reason">Reason: {application.rejectionReason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {admissions.length === 0 && (
        <div className="text-center">
          <p>No applications found.</p>
          <p>Apply to courses to see your admission status here.</p>
          <button onClick={fetchAdmissions} className="btn btn-secondary mt-1">
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default AdmissionsResults;
