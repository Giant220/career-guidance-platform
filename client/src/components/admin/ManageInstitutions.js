import React, { useState, useEffect } from 'react';

const ManageInstitutions = () => {
  const [institutions, setInstitutions] = useState([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: ''
  });

  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    filterInstitutions();
  }, [institutions, filters]);

  const fetchInstitutions = async () => {
    try {
      const response = await fetch('/api/admin/institutions');
      const data = await response.json();
      setInstitutions(data);
    } catch (error) {
      console.error('Error fetching institutions:', error);
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
        inst.name.toLowerCase().includes(searchLower) ||
        inst.location.toLowerCase().includes(searchLower)
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

  const handleStatusUpdate = async (institutionId, newStatus) => {
    try {
      const response = await fetch(`/api/admin/institutions/${institutionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert('Institution status updated successfully!');
        fetchInstitutions();
      }
    } catch (error) {
      console.error('Error updating institution status:', error);
      alert('Error updating institution status');
    }
  };

  const viewInstitutionDetails = (institution) => {
    // This would open a detailed view in a real implementation
    alert(`Institution Details:\n\nName: ${institution.name}\nType: ${institution.type}\nLocation: ${institution.location}\nStatus: ${institution.status}\nEmail: ${institution.email}\nPhone: ${institution.phone}`);
  };

  const deleteInstitution = async (institutionId) => {
    if (window.confirm('Are you sure you want to delete this institution? This will also remove all associated courses and applications.')) {
      try {
        const response = await fetch(`/api/admin/institutions/${institutionId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          alert('Institution deleted successfully!');
          fetchInstitutions();
        }
      } catch (error) {
        console.error('Error deleting institution:', error);
        alert('Error deleting institution');
      }
    }
  };

  const getStatusStats = () => {
    const stats = {
      approved: 0,
      pending: 0,
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
    return <div className="section">Loading institutions...</div>;
  }

  return (
    <div className="section">
      <h1>Institution Management</h1>
      <p>Approve and manage educational institutions on the platform</p>

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
          <p className="stat-number">{statusStats.pending}</p>
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
            <div key={institution.id} className="institution-card">
              <div className="institution-info">
                <div className="institution-header">
                  <h3>{institution.name}</h3>
                  <span className={`status-badge status-${institution.status}`}>
                    {institution.status}
                  </span>
                </div>
                <p className="institution-meta">{institution.type} • {institution.location}</p>
                <p className="institution-contact">
                  {institution.email} • {institution.phone}
                </p>
                <p className="institution-description">
                  {institution.description}
                </p>
                <div className="institution-stats">
                  <span>Courses: {institution.courseCount || 0}</span>
                  <span>Students: {institution.studentCount || 0}</span>
                  <span>Applications: {institution.applicationCount || 0}</span>
                </div>
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
                      onClick={() => handleStatusUpdate(institution.id, 'approved')}
                      className="btn success"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(institution.id, 'suspended')}
                      className="btn btn-danger"
                    >
                      Reject
                    </button>
                  </>
                )}
                
                {institution.status === 'approved' && (
                  <button
                    onClick={() => handleStatusUpdate(institution.id, 'suspended')}
                    className="btn btn-warning"
                  >
                    Suspend
                  </button>
                )}
                
                {institution.status === 'suspended' && (
                  <button
                    onClick={() => handleStatusUpdate(institution.id, 'approved')}
                    className="btn success"
                  >
                    Reactivate
                  </button>
                )}
                
                <button
                  onClick={() => deleteInstitution(institution.id)}
                  className="btn btn-danger"
                >
                  Delete
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

      <div className="section">
        <h3>Pending Approvals ({statusStats.pending})</h3>
        <div className="pending-approvals">
          {institutions
            .filter(inst => inst.status === 'pending')
            .map(institution => (
              <div key={institution.id} className="approval-card">
                <div className="approval-info">
                  <h4>{institution.name}</h4>
                  <p>{institution.type} • {institution.location}</p>
                  <p>Applied: {new Date(institution.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="approval-actions">
                  <button
                    onClick={() => handleStatusUpdate(institution.id, 'approved')}
                    className="btn success"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(institution.id, 'suspended')}
                    className="btn btn-danger"
                  >
                    Reject
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

        {statusStats.pending === 0 && (
          <div className="text-center">
            <p>No pending approvals.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageInstitutions;