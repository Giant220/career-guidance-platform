import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const JobApplications = () => {
  const { currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [checkingQualification, setCheckingQualification] = useState(null);

  useEffect(() => {
    fetchJobs();
    fetchJobApplications();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`/api/students/${currentUser.uid}/jobs`);
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
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

  const checkQualification = async (jobId) => {
    setCheckingQualification(jobId);
    try {
      const response = await fetch(`/api/students/${currentUser.uid}/jobs/${jobId}/qualify`);
      const data = await response.json();
      
      if (data.qualified) {
        await handleApply(jobId);
      } else {
        alert(`You do not qualify for this job:\n\n${data.reason}`);
      }
    } catch (error) {
      console.error('Error checking qualification:', error);
      alert('Error checking your qualifications');
    } finally {
      setCheckingQualification(null);
    }
  };

  const handleApply = async (jobId) => {
    try {
      const response = await fetch(`/api/students/${currentUser.uid}/jobs/${jobId}/apply`, {
        method: 'POST'
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || 'Job application submitted successfully!');
        fetchJobs();
        fetchJobApplications();
      } else {
        alert(result.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      alert('Error submitting application');
    }
  };

  const hasApplied = (jobId) => {
    return applications.some(app => app.jobId === jobId);
  };

  const hasTranscripts = async () => {
    try {
      const response = await fetch(`/api/students/${currentUser.uid}/transcripts`);
      const transcripts = await response.json();
      return transcripts.length > 0;
    } catch (error) {
      console.error('Error checking transcripts:', error);
      return false;
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'applied') return hasApplied(job.id);
    if (filter === 'new') return !hasApplied(job.id);
    return true;
  });

  if (loading) {
    return <div className="section">Loading jobs...</div>;
  }

  return (
    <div className="section">
      <h1>Job Opportunities</h1>
      <p>Browse and apply for jobs. Upload your transcripts to qualify for relevant positions.</p>

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
          {filteredJobs.map(job => {
            const applied = hasApplied(job.id);
            
            return (
              <div key={job.id} className="job-card">
                <div className="job-header">
                  <h3>{job.title}</h3>
                  {applied && (
                    <span className="status-badge status-applied">Applied</span>
                  )}
                </div>
                
                <p className="company">{job.companyName}</p>
                <p className="location">{job.location}</p>
                <p className="salary">Salary: {job.salary}</p>
                <p className="job-type">Type: {job.type}</p>
                
                {job.deadline && (
                  <p className="deadline">
                    <strong>Apply by:</strong> {new Date(job.deadline).toLocaleDateString()}
                  </p>
                )}
                
                <div className="job-description">
                  <p>{job.description}</p>
                </div>

                <div className="requirements">
                  <h4>Requirements:</h4>
                  <ul>
                    {job.requirements && job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>

                {job.qualifications && job.qualifications.length > 0 && (
                  <div className="qualifications">
                    <h4>Preferred Qualifications:</h4>
                    <ul>
                      {job.qualifications.map((qual, index) => (
                        <li key={index}>{qual}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="job-actions">
                  {applied ? (
                    <button className="btn btn-secondary" disabled>
                      ✓ Applied
                    </button>
                  ) : (
                    <button 
                      onClick={() => checkQualification(job.id)}
                      disabled={checkingQualification === job.id}
                      className="btn"
                    >
                      {checkingQualification === job.id ? 'Checking...' : 'Apply Now'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center">
            <p>No jobs found matching your criteria.</p>
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

      <div className="section info-message">
        <h3>📝 How Job Applications Work</h3>
        <ul>
          <li><strong>View all jobs</strong> - Browse all available opportunities</li>
          <li><strong>Upload transcripts first</strong> - Your academic records are used to check qualifications</li>
          <li><strong>Automatic qualification check</strong> - We verify if your education matches job requirements</li>
          <li><strong>Apply with confidence</strong> - Only apply to jobs you're qualified for</li>
        </ul>
        <p>
          <strong>Don't have transcripts uploaded?</strong>{' '}
          <a href="/student/transcript" style={{color: '#ffda77'}}>Upload them here</a> to qualify for jobs.
        </p>
      </div>
    </div>
  );
};

export default JobApplications;
