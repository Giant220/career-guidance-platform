import React, { useState, useEffect } from 'react';

const ManageInstitutions = ({ currentUser }) => {
  const [institutions, setInstitutions] = useState([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: ''
  });

  useEffect(() => {
    filterInstitutions();
  }, [institutions, filters]);

  const fetchInstitutions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/admin/institutions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`Failed to fetch institutions: ${response.status}`);
      }

      const data = await response.json();
      setInstitutions(data);
    } catch (error) {
      console.error('Error fetching institutions:', error);
      setError(error.message);
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterInstitutions = () => {
    let filtered = institutions;

    if (filters.status !== 'all') {
      filtered = filtered.filter(inst => inst.status === filters.status);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(inst => inst.type === filters.type);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(inst => 
        inst.name?.toLowerCase().includes(searchLower) ||
        inst.location?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredInstitutions(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleApprove = async (institutionId) => {
    try {
      setActionLoading(institutionId);
      
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/admin/institutions/${institutionId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve institute');
      }

      if (result.success) {
        setInstitutions(prev => 
          prev.map(inst => 
            inst.id === institutionId 
              ? { 
                  ...inst, 
                  status: 'approved', 
                  approvedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              : inst
          )
        );
        alert(`Institute approved successfully! ${result.approvedCourses} courses are now visible to students.`);
      }
    } catch (error) {
      console.error('Error approving institute:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (institutionId) => {
    const reason = prompt('Please enter a reason for rejection:');
    if (!reason) return;

    try {
      setActionLoading(institutionId);
      
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/admin/institutions/${institutionId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject institute');
      }

      if (result.success) {
        setInstitutions(prev => 
          prev.map(inst => 
            inst.id === institutionId 
              ? { 
                  ...inst, 
                  status: 'rejected', 
                  rejectionReason: reason,
                  rejectedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
              : inst
          )
        );
        alert(`Institute rejected successfully! ${result.rejectedCourses} courses are now hidden.`);
      }
    } catch (error) {
      console.error('Error rejecting institute:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (institutionId, newStatus) => {
    try {
      setActionLoading(institutionId);
      
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/admin/institutions/${institutionId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setInstitutions(prev => 
          prev.map(inst => 
            inst.id === institutionId 
              ? { ...inst, status: newStatus, updatedAt: new Date().toISOString() }
              : inst
          )
        );
        alert('Institution status updated successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating institution status:', error);
      alert('Error updating institution status: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const viewInstitutionDetails = (institution) => {
    const details = `
Institution Details:

Name: ${institution.name || 'N/A'}
Type: ${institution.type || 'N/A'}
Location: ${institution.location || 'N/A'}
Status: ${institution.status || 'N/A'}
Email: ${institution.email || 'N/A'}
Phone: ${institution.phone || 'N/A'}
Description: ${institution.description || 'No description provided'}
Created: ${institution.createdAt ? new Date(institution.createdAt).toLocaleDateString() : 'N/A'}
${institution.approvedAt ? `Approved: ${new Date(institution.approvedAt).toLocaleDateString()}` : ''}
${institution.rejectionReason ? `Rejection Reason: ${institution.rejectionReason}` : ''}

Courses: ${institution.courseCount || 0}
Students: ${institution.studentCount || 0}
Applications: ${institution.applicationCount || 0}
    `;
    alert(details);
  };

  const deleteInstitution = async (institutionId) => {
    if (window.confirm('Are you sure you want to delete this institution? This will also remove all associated courses and applications.')) {
      try {
        setActionLoading(institutionId);
        
        const token = await currentUser.getIdToken();
        const response = await fetch(`/api/admin/institutions/${institutionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          setInstitutions(prev => prev.filter(inst => inst.id !== institutionId));
          alert('Institution deleted successfully!');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete institution');
        }
      } catch (error) {
        console.error('Error deleting institution:', error);
        alert('Error deleting institution: ' + error.message);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const getStatusStats = () => {
    const stats = {
      approved: 0,
      pending: 0,
      rejected: 0,
      suspended: 0,
      total: institutions.length
    };

    institutions.forEach(inst => {
      if (stats[inst.status] !== undefined) {
        stats[inst.status]++;
      }
    });

    return stats;
  };

  const statusStats = getStatusStats();

  if (loading) {
    return (
      <div className="section">
        <div className="loading">Loading institutions...</div>
      </div>
    );
  }

  return (
    <div className="section">
      <h1>Institution Management</h1>
      <p>Approve and manage educational institutions on the platform</p>

      {error && (
        <div className="error-message">
          <h3>Unable to Load Institutions</h3>
          <p>{error}</p>
          <div className="action-buttons">
            <button onClick={fetchInstitutions} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      )}

      {institutions.length === 0 && !error && (
        <div className="section">
          <div className="info-message">
            <h3>No Institutions Loaded</h3>
            <p>Click the button below to load institutions from the database.</p>
            <button onClick={fetchInstitutions} className="btn btn-primary">
              Load Institutions
            </button>
          </div>
        </div>
      )}

      {institutions.length > 0 && (
        <>
          <div className="dashboard-top">
            <div className="card">
              <h3>Total Institutions</h3>
              <p className="stat-number">{statusStats.total}</p>
            </div>
            <div className="card">
              <h3>Approved</h3>
              <p className="stat-number">{statusStats.approved}</p>
            </div>
            <div className="card">
              <h3>Pending Approval</h3>
              <p className="stat-number pending-count">{statusStats.pending}</p>
            </div>
            <div className="card">
              <h3>Rejected</h3>
              <p className="stat-number">{statusStats.rejected}</p>
            </div>
            <div className="card">
              <h3>Suspended</h3>
              <p className="stat-number">{statusStats.suspended}</p>
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
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="University">University</option>
                  <option value="College">College</option>
                  <option value="Polytechnic">Polytechnic</option>
                  <option value="Institute">Institute</option>
                </select>
              </div>

              <div className="form-group">
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Search by name or location..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            <div className="institutions-list">
              {filteredInstitutions.map(institution => (
                <div key={institution.id} className={`institution-card status-${institution.status}`}>
                  <div className="institution-info">
                    <div className="institution-header">
                      <h3>{institution.name || 'Unnamed Institute'}</h3>
                      <span className={`status-badge status-${institution.status}`}>
                        {institution.status}
                        {institution.status === 'pending' && ''}
                      </span>
                    </div>
                    <p className="institution-meta">{institution.type || 'N/A'} • {institution.location || 'N/A'}</p>
                    <p className="institution-contact">
                      {institution.email || 'No email'} • {institution.phone || 'No phone'}
                    </p>
                    <p className="institution-description">
                      {institution.description || 'No description provided'}
                    </p>
                    <div className="institution-stats">
                      <span>Courses: {institution.courseCount || 0}</span>
                      <span>Students: {institution.studentCount || 0}</span>
                      <span>Applications: {institution.applicationCount || 0}</span>
                    </div>
                    {institution.rejectionReason && (
                      <div className="rejection-reason">
                        <strong>Rejection Reason:</strong> {institution.rejectionReason}
                      </div>
                    )}
                    {institution.status === 'pending' && (
                      <div className="pending-notice">
                        <strong>Attention Needed:</strong> This institution is waiting for approval
                      </div>
                    )}
                  </div>
                  
                  <div className="institution-actions">
                    <button
                      onClick={() => viewInstitutionDetails(institution)}
                      className="btn btn-secondary"
                    >
                      View Details
                    </button>
                    
                    {institution.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(institution.id)}
                          className="btn success"
                          disabled={actionLoading === institution.id}
                        >
                          {actionLoading === institution.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(institution.id)}
                          className="btn btn-danger"
                          disabled={actionLoading === institution.id}
                        >
                          {actionLoading === institution.id ? 'Rejecting...' : 'Reject'}
                        </button>
                      </>
                    )}
                    
                    {institution.status === 'approved' && (
                      <button
                        onClick={() => handleStatusUpdate(institution.id, 'suspended')}
                        className="btn btn-warning"
                        disabled={actionLoading === institution.id}
                      >
                        {actionLoading === institution.id ? 'Suspending...' : 'Suspend'}
                      </button>
                    )}
                    
                    {institution.status === 'suspended' && (
                      <button
                        onClick={() => handleStatusUpdate(institution.id, 'approved')}
                        className="btn success"
                        disabled={actionLoading === institution.id}
                      >
                        {actionLoading === institution.id ? 'Reactivating...' : 'Reactivate'}
                      </button>
                    )}

                    {institution.status === 'rejected' && (
                      <button
                        onClick={() => handleApprove(institution.id)}
                        className="btn success"
                        disabled={actionLoading === institution.id}
                      >
                        {actionLoading === institution.id ? 'Approving...' : 'Approve'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteInstitution(institution.id)}
                      className="btn btn-danger"
                      disabled={actionLoading === institution.id}
                    >
                      {actionLoading === institution.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredInstitutions.length === 0 && (
              <div className="text-center">
                <p>No institutions found matching your criteria.</p>
              </div>
            )}
          </div>

          {/* Pending Approvals Section */}
          {statusStats.pending > 0 && (
            <div className="section pending-section">
              <div className="section-header">
                <h3>Pending Approvals ({statusStats.pending})</h3>
                <p className="section-subtitle">These institutions are waiting for your approval</p>
              </div>
              <div className="pending-approvals">
                {institutions
                  .filter(inst => inst.status === 'pending')
                  .map(institution => (
                    <div key={institution.id} className="approval-card">
                      <div className="approval-info">
                        <h4>{institution.name || 'Unnamed Institute'}</h4>
                        <p>{institution.type || 'N/A'} • {institution.location || 'N/A'}</p>
                        <p>Applied: {institution.createdAt ? new Date(institution.createdAt).toLocaleDateString() : 'N/A'}</p>
                        <p className="institution-contact">
                          {institution.email || 'No email'} • {institution.phone || 'No phone'}
                        </p>
                      </div>
                      <div className="approval-actions">
                        <button
                          onClick={() => handleApprove(institution.id)}
                          className="btn success"
                          disabled={actionLoading === institution.id}
                        >
                          {actionLoading === institution.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(institution.id)}
                          className="btn btn-danger"
                          disabled={actionLoading === institution.id}
                        >
                          {actionLoading === institution.id ? 'Rejecting...' : 'Reject'}
                        </button>
                        <button
                          onClick={() => viewInstitutionDetails(institution)}
                          className="btn btn-secondary"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManageInstitutions;
