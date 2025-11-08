import React, { useState, useEffect } from 'react';

const PostJobs = ({ company }) => {
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const [jobForm, setJobForm] = useState({
    title: '',
    type: 'Full-time',
    location: '',
    salary: '',
    description: '',
    requirements: [''],
    qualifications: [''],
    deadline: ''
  });

  useEffect(() => {
    if (company) {
      fetchJobs();
    }
  }, [company]);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`/api/companies/${company.id}/jobs`);
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJobForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequirementChange = (index, value) => {
    const newRequirements = [...jobForm.requirements];
    newRequirements[index] = value;
    setJobForm(prev => ({
      ...prev,
      requirements: newRequirements
    }));
  };

  const addRequirement = () => {
    setJobForm(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const removeRequirement = (index) => {
    const newRequirements = jobForm.requirements.filter((_, i) => i !== index);
    setJobForm(prev => ({
      ...prev,
      requirements: newRequirements
    }));
  };

  const handleQualificationChange = (index, value) => {
    const newQualifications = [...jobForm.qualifications];
    newQualifications[index] = value;
    setJobForm(prev => ({
      ...prev,
      qualifications: newQualifications
    }));
  };

  const addQualification = () => {
    setJobForm(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, '']
    }));
  };

  const removeQualification = (index) => {
    const newQualifications = jobForm.qualifications.filter((_, i) => i !== index);
    setJobForm(prev => ({
      ...prev,
      qualifications: newQualifications
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const jobData = {
      ...jobForm,
      companyId: company.id,
      companyName: company.name,
      requirements: jobForm.requirements.filter(req => req.trim() !== ''),
      qualifications: jobForm.qualifications.filter(qual => qual.trim() !== ''),
      status: 'active'
    };

    try {
      const url = editingJob ? 
        `/api/companies/jobs/${editingJob.id}` : 
        '/api/companies/jobs';
      
      const method = editingJob ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData)
      });

      if (response.ok) {
        alert(editingJob ? 'Job updated successfully!' : 'Job posted successfully!');
        setShowForm(false);
        setEditingJob(null);
        setJobForm({
          title: '',
          type: 'Full-time',
          location: '',
          salary: '',
          description: '',
          requirements: [''],
          qualifications: [''],
          deadline: ''
        });
        fetchJobs();
      }
    } catch (error) {
      console.error('Error saving job:', error);
      alert('Error saving job');
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      type: job.type,
      location: job.location,
      salary: job.salary,
      description: job.description,
      requirements: job.requirements.length > 0 ? job.requirements : [''],
      qualifications: job.qualifications.length > 0 ? job.qualifications : [''],
      deadline: job.deadline ? job.deadline.split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      try {
        const response = await fetch(`/api/companies/jobs/${jobId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          alert('Job deleted successfully!');
          fetchJobs();
        }
      } catch (error) {
        console.error('Error deleting job:', error);
        alert('Error deleting job');
      }
    }
  };

  const toggleJobStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    
    try {
      const response = await fetch(`/api/companies/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert(`Job ${newStatus === 'active' ? 'activated' : 'closed'} successfully!`);
        fetchJobs();
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      alert('Error updating job status');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingJob(null);
    setJobForm({
      title: '',
      type: 'Full-time',
      location: '',
      salary: '',
      description: '',
      requirements: [''],
      qualifications: [''],
      deadline: ''
    });
  };

  if (loading) {
    return <div className="section">Loading jobs...</div>;
  }

  const activeJobs = jobs.filter(job => job.status === 'active');
  const closedJobs = jobs.filter(job => job.status === 'closed');

  return (
    <div className="section">
      <div className="flex-between mb-1">
        <div>
          <h1>Job Postings</h1>
          <p>Create and manage job opportunities for graduates</p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="btn"
          disabled={company?.status !== 'approved'}
        >
          + Post New Job
        </button>
      </div>

      {company?.status !== 'approved' && (
        <div className="warning-message">
          <p>You cannot post jobs until your company is approved by the administrator.</p>
        </div>
      )}

      {showForm && (
        <div className="section form-container">
          <h2>{editingJob ? 'Edit Job' : 'Post New Job'}</h2>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-row">
              <div className="form-group">
                <label>Job Title *</label>
                <input
                  type="text"
                  name="title"
                  value={jobForm.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Software Developer"
                />
              </div>
              <div className="form-group">
                <label>Job Type *</label>
                <select
                  name="type"
                  value={jobForm.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  name="location"
                  value={jobForm.location}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Maseru, Lesotho"
                />
              </div>
              <div className="form-group">
                <label>Salary Range *</label>
                <input
                  type="text"
                  name="salary"
                  value={jobForm.salary}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., M8,000 - M12,000"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Application Deadline</label>
              <input
                type="date"
                name="deadline"
                value={jobForm.deadline}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label>Job Description *</label>
              <textarea
                name="description"
                value={jobForm.description}
                onChange={handleInputChange}
                rows="4"
                required
                placeholder="Describe the job responsibilities, expectations, and what makes your company great..."
              />
            </div>

            <div className="form-group">
              <label>Requirements *</label>
              {jobForm.requirements.map((requirement, index) => (
                <div key={index} className="requirement-input">
                  <input
                    type="text"
                    value={requirement}
                    onChange={(e) => handleRequirementChange(index, e.target.value)}
                    placeholder="e.g., BSc Computer Science or equivalent"
                    required
                  />
                  {jobForm.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="btn btn-danger"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addRequirement}
                className="btn btn-secondary"
              >
                + Add Requirement
              </button>
            </div>

            <div className="form-group">
              <label>Preferred Qualifications</label>
              {jobForm.qualifications.map((qualification, index) => (
                <div key={index} className="qualification-input">
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => handleQualificationChange(index, e.target.value)}
                    placeholder="e.g., 2 years experience in software development"
                  />
                  {jobForm.qualifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQualification(index)}
                      className="btn btn-danger"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addQualification}
                className="btn btn-secondary"
              >
                + Add Qualification
              </button>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn">
                {editingJob ? 'Update Job' : 'Post Job'}
              </button>
              <button type="button" onClick={cancelForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="section">
        <h3>Active Job Postings ({activeJobs.length})</h3>
        <div className="jobs-list">
          {activeJobs.map(job => (
            <div key={job.id} className="job-management-card">
              <div className="job-info">
                <div className="job-header">
                  <h4>{job.title}</h4>
                  <span className={`status-badge status-${job.status}`}>
                    {job.status}
                  </span>
                </div>
                <p className="job-meta">{job.type} • {job.location} • {job.salary}</p>
                <p className="job-description">{job.description}</p>
                
                <div className="job-details">
                  <div className="detail-item">
                    <strong>Requirements:</strong>
                    <ul>
                      {job.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                  {job.qualifications.length > 0 && (
                    <div className="detail-item">
                      <strong>Preferred Qualifications:</strong>
                      <ul>
                        {job.qualifications.map((qual, index) => (
                          <li key={index}>{qual}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {job.deadline && (
                  <p className="deadline">
                    <strong>Application Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}
                  </p>
                )}
                <p className="post-date">
                  Posted: {new Date(job.postedDate).toLocaleDateString()}
                </p>
              </div>
              
              <div className="job-actions">
                <button 
                  onClick={() => handleEdit(job)}
                  className="btn btn-secondary"
                >
                  Edit
                </button>
                <button 
                  onClick={() => toggleJobStatus(job.id, job.status)}
                  className="btn btn-warning"
                >
                  Close Job
                </button>
                <button 
                  onClick={() => handleDelete(job.id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {activeJobs.length === 0 && (
          <div className="text-center">
            <p>No active job postings. Create your first job to attract candidates.</p>
          </div>
        )}
      </div>

      {closedJobs.length > 0 && (
        <div className="section">
          <h3>Closed Jobs ({closedJobs.length})</h3>
          <div className="jobs-list">
            {closedJobs.map(job => (
              <div key={job.id} className="job-management-card closed">
                <div className="job-info">
                  <div className="job-header">
                    <h4>{job.title}</h4>
                    <span className="status-badge status-closed">Closed</span>
                  </div>
                  <p className="job-meta">{job.type} • {job.location} • {job.salary}</p>
                </div>
                <div className="job-actions">
                  <button 
                    onClick={() => toggleJobStatus(job.id, job.status)}
                    className="btn btn-secondary"
                  >
                    Reopen
                  </button>
                  <button 
                    onClick={() => handleDelete(job.id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostJobs;