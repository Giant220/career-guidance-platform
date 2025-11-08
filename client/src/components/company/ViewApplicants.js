import React, { useState, useEffect } from 'react';

const ViewApplicants = ({ company }) => {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    job: 'all',
    search: ''
  });

  useEffect(() => {
    if (company) {
      fetchApplications();
    }
  }, [company]);

  useEffect(() => {
    filterApplications();
  }, [applications, filters]);

  const fetchApplications = async () => {
    try {
      const response = await fetch(`/api/companies/${company.id}/applications`);
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    if (filters.job !== 'all') {
      filtered = filtered.filter(app => app.jobId === filters.job);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(app => 
        app.studentName.toLowerCase().includes(searchLower) ||
        app.jobTitle.toLowerCase().includes(searchLower)
      );
    }

    setFilteredApplications(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      const response = await fetch(`/api/companies/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          updatedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('Application status updated successfully!');
        fetchApplications();
      }
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Error updating application status');
    }
  };

  const viewCandidateDetails = async (application) => {
    try {
      const response = await fetch(`/api/companies/applications/${application.id}/details`);
      const candidateDetails = await response.json();
      setSelectedApplication({ ...application, ...candidateDetails });
    } catch (error) {
      console.error('Error fetching candidate details:', error);
      setSelectedApplication(application);
    }
  };

  const getJobs = () => {
    const jobSet = new Set();
    applications.forEach(app => {
      jobSet.add(JSON.stringify({ id: app.jobId, title: app.jobTitle }));
    });
    return Array.from(jobSet).map(str => JSON.parse(str));
  };

  const getStatusStats = () => {
    const stats = {
      pending: 0,
      shortlisted: 0,
      interviewed: 0,
      rejected: 0,
      hired: 0,
      total: applications.length
    };

    applications.forEach(app => {
      if (stats[app.status] !== undefined) {
        stats[app.status]++;
      }
    });

    return stats;
  };

  const statusStats = getStatusStats();
  const jobs = getJobs();

  if (loading) {
    return <div className="section">Loading applications...</div>;
  }

  return (
    <div className="section">
      <h1>Candidate Applications</h1>
      <p>Review and manage job applications from qualified graduates</p>

      <div className="dashboard-top">
        <div className="card">
          <h3>Total Applications</h3>
          <p className="stat-number">{statusStats.total}</p>
        </div>
        <div className="card">
          <h3>Pending Review</h3>
          <p className="stat-number">{statusStats.pending}</p>
        </div>
        <div className="card">
          <h3>Shortlisted</h3>
          <p className="stat-number">{statusStats.shortlisted}</p>
        </div>
        <div className="card">
          <h3>Interviewed</h3>
          <p className="stat-number">{statusStats.interviewed}</p>
        </div>
      </div>

      <div className="section">
        <div className="filters-row">
          <div className="form-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interviewed">Interviewed</option>
              <option value="rejected">Rejected</option>
              <option value="hired">Hired</option>
            </select>
          </div>

          <div className="form-group">
            <label>Job</label>
            <select
              value={filters.job}
              onChange={(e) => handleFilterChange('job', e.target.value)}
            >
              <option value="all">All Jobs</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by candidate or job title..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        <div className="applications-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate Name</th>
                <th>Job Title</th>
                <th>Application Date</th>
                <th>Qualification Match</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map(application => (
                <tr key={application.id}>
                  <td>
                    <strong>{application.studentName}</strong>
                    <br />
                    <small>{application.studentEmail}</small>
                  </td>
                  <td>{application.jobTitle}</td>
                  <td>{new Date(application.applicationDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`match-badge ${application.qualificationMatch > 80 ? 'high' : application.qualificationMatch > 60 ? 'medium' : 'low'}`}>
                      {application.qualificationMatch}% Match
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${application.status}`}>
                      {application.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => viewCandidateDetails(application)}
                        className="btn btn-secondary"
                      >
                        View Details
                      </button>
                      {application.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'shortlisted')}
                            className="btn success"
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                            className="btn btn-danger"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {application.status === 'shortlisted' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'interviewed')}
                            className="btn success"
                          >
                            Mark Interviewed
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                            className="btn btn-danger"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {application.status === 'interviewed' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'hired')}
                            className="btn success"
                          >
                            Hire
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(application.id, 'rejected')}
                            className="btn btn-danger"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredApplications.length === 0 && (
            <div className="text-center">
              <p>No applications found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Candidate Details Modal */}
      {selectedApplication && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Candidate Details</h2>
              <button 
                onClick={() => setSelectedApplication(null)}
                className="btn btn-danger"
              >
                Close
              </button>
            </div>
            
            <div className="candidate-details">
              <div className="detail-section">
                <h3>Personal Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Full Name:</strong>
                    <span>{selectedApplication.studentName}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Email:</strong>
                    <span>{selectedApplication.studentEmail}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Phone:</strong>
                    <span>{selectedApplication.studentPhone || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Applied For:</strong>
                    <span>{selectedApplication.jobTitle}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Education & Qualifications</h3>
                {selectedApplication.transcripts?.length > 0 ? (
                  selectedApplication.transcripts.map((transcript, index) => (
                    <div key={index} className="qualification-item">
                      <h4>{transcript.program}</h4>
                      <p>{transcript.institution} • {transcript.yearCompleted}</p>
                      <span className="document-type">{transcript.type}</span>
                      {transcript.verified && (
                        <span className="verification-badge">Verified</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No transcripts uploaded by candidate.</p>
                )}
              </div>

              <div className="detail-section">
                <h3>Application Status</h3>
                <div className="status-actions">
                  <select
                    value={selectedApplication.status}
                    onChange={(e) => {
                      handleStatusUpdate(selectedApplication.id, e.target.value);
                      setSelectedApplication(prev => ({ ...prev, status: e.target.value }));
                    }}
                    className="form-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interviewed">Interviewed</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => {
                    // Send email functionality would go here
                    alert(`Email would be sent to ${selectedApplication.studentEmail}`);
                  }}
                  className="btn btn-secondary"
                >
                  Send Email
                </button>
                <button
                  onClick={() => {
                    // Schedule interview functionality
                    alert('Interview scheduling functionality would open here');
                  }}
                  className="btn success"
                >
                  Schedule Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewApplicants;