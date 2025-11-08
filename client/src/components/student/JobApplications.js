import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const JobApplications = () => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchJobs();
    fetchJobApplications();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`/api/students/${currentUser.uid}/qualified-jobs`);
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchJobApplications = async () => {
    try {
      const response = await fetch(`/api/students/${currentUser.uid}/job-applications`);
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching job applications:', error);
    }
  };

  const handleApply = async (jobId) => {
    try {
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: jobId,
          studentId: currentUser.uid,
          applicationDate: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('Job application submitted successfully!');
        fetchJobs();
        fetchJobApplications();
      }
    } catch (error) {
      console.error('Error applying for job:', error);
    }
  };

  const hasApplied = (jobId) => {
    return applications.some(app => app.jobId === jobId);
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'applied') return hasApplied(job.id);
    if (filter === 'new') return !hasApplied(job.id);
    return true;
  });

  return (
    <div className="section">
      <h1>Job Opportunities</h1>
      <p>Browse and apply for jobs that match your qualifications</p>

      <div className="section">
        <div className="flex-between mb-1">
          <h3>Available Jobs</h3>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="all">All Jobs</option>
            <option value="new">New Jobs</option>
            <option value="applied">Applied Jobs</option>
          </select>
        </div>

        <div className="jobs-grid">
          {filteredJobs.map(job => (
            <div key={job.id} className="job-card">
              <div className="job-header">
                <h3>{job.title}</h3>
                <span className="status-badge status-qualified">You Qualify</span>
              </div>
              
              <p className="company">{job.companyName}</p>
              <p className="location">{job.location}</p>
              <p className="salary">Salary: {job.salary}</p>
              
              <div className="job-description">
                <p>{job.description}</p>
              </div>

              <div className="requirements">
                <h4>Requirements:</h4>
                <ul>
                  {job.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="job-actions">
                {hasApplied(job.id) ? (
                  <button className="btn btn-secondary" disabled>
                    Applied
                  </button>
                ) : (
                  <button 
                    onClick={() => handleApply(job.id)}
                    className="btn"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center">
            <p>No jobs found matching your criteria.</p>
            <p>Make sure your transcripts are uploaded to see qualified jobs.</p>
          </div>
        )}
      </div>

      {applications.length > 0 && (
        <div className="section">
          <h3>Your Job Applications</h3>
          <div className="applications-list">
            {applications.map(application => (
              <div key={application.id} className="application-card">
                <div className="application-info">
                  <h4>{application.jobTitle}</h4>
                  <p>{application.companyName}</p>
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
    </div>
  );
};

export default JobApplications;