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

const ViewApplications = ({ institute }) => {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    course: 'all',
    search: ''
  });

  useEffect(() => {
    if (institute) {
      fetchApplications();
    }
  }, [institute]);

  useEffect(() => {
    filterApplications();
  }, [applications, filters]);

  const fetchApplications = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/applications?instituteId=${institute.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
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

    if (filters.course !== 'all') {
      filtered = filtered.filter(app => app.courseId === filters.course);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(app => 
        app.studentName.toLowerCase().includes(searchLower) ||
        app.courseName.toLowerCase().includes(searchLower)
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

  const handleStatusUpdate = async (applicationId, newStatus, rejectionReason = '') => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          rejectionReason: rejectionReason,
          decisionDate: new Date().toISOString()
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

  const getCourses = () => {
    const courseSet = new Set();
    applications.forEach(app => {
      courseSet.add(JSON.stringify({ id: app.courseId, name: app.courseName }));
    });
    return Array.from(courseSet).map(str => JSON.parse(str));
  };

  const getStatusStats = () => {
    const stats = {
      pending: 0,
      admitted: 0,
      rejected: 0,
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
  const courses = getCourses();

  if (loading) {
    return <div className="section">Loading applications...</div>;
  }

  return (
    <ComponentWrapper institute={institute}>
      <div className="section">
        <h1>Student Applications</h1>
        <p>Review and process student applications for your courses</p>

        {institute?.status !== 'approved' && (
          <div className="warning-message">
            <p>You cannot process applications until your institution is approved by the administrator.</p>
          </div>
        )}

        {institute?.status === 'approved' && (
          <>
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
                <h3>Admitted</h3>
                <p className="stat-number">{statusStats.admitted}</p>
              </div>
              <div className="card">
                <h3>Rejected</h3>
                <p className="stat-number">{statusStats.rejected}</p>
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
                    <option value="admitted">Admitted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Course</label>
                  <select
                    value={filters.course}
                    onChange={(e) => handleFilterChange('course', e.target.value)}
                  >
                    <option value="all">All Courses</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Search</label>
                  <input
                    type="text"
                    placeholder="Search by student or course name..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>

              <div className="applications-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Course</th>
                      <th>Application Date</th>
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
                        <td>{application.courseName}</td>
                        <td>{new Date(application.applicationDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge status-${application.status}`}>
                            {application.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {application.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(application.id, 'admitted')}
                                  className="btn success"
                                >
                                  Admit
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Enter rejection reason:');
                                    if (reason) {
                                      handleStatusUpdate(application.id, 'rejected', reason);
                                    }
                                  }}
                                  className="btn btn-danger"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {application.status === 'admitted' && (
                              <button
                                onClick={() => handleStatusUpdate(application.id, 'pending')}
                                className="btn btn-secondary"
                              >
                                Revoke
                              </button>
                            )}
                            {application.status === 'rejected' && (
                              <button
                                onClick={() => handleStatusUpdate(application.id, 'pending')}
                                className="btn btn-secondary"
                              >
                                Reconsider
                              </button>
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
          </>
        )}
      </div>
    </ComponentWrapper>
  );
};

export default ViewApplications;
