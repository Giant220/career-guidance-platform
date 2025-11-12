import React, { useState, useEffect } from 'react';

const ManageCompanies = ({ currentUser }) => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    industry: 'all',
    search: ''
  });

  useEffect(() => {
    filterCompanies();
  }, [companies, filters]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/admin/companies', {
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
        throw new Error(`Failed to fetch companies: ${response.status}`);
      }

      const data = await response.json();
      // Ensure data is an array to prevent .forEach errors
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError(error.message);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = companies;

    if (filters.status !== 'all') {
      filtered = filtered.filter(company => company.status === filters.status);
    }

    if (filters.industry !== 'all') {
      filtered = filtered.filter(company => company.industry === filters.industry);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(company => 
        company.name?.toLowerCase().includes(searchLower) ||
        company.location?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredCompanies(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleStatusUpdate = async (companyId, newStatus) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/admin/companies/${companyId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert('Company status updated successfully!');
        fetchCompanies();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update company status');
      }
    } catch (error) {
      console.error('Error updating company status:', error);
      alert('Error updating company status: ' + error.message);
    }
  };

  const viewCompanyDetails = (company) => {
    const details = `
Company Details:

Name: ${company.name || 'N/A'}
Industry: ${company.industry || 'N/A'}
Location: ${company.location || 'N/A'}
Status: ${company.status || 'N/A'}
Email: ${company.email || 'N/A'}
Phone: ${company.phone || 'N/A'}
Description: ${company.description || 'No description provided'}
Created: ${company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}

Jobs: ${company.jobCount || 0}
Applications: ${company.applicationCount || 0}
    `;
    alert(details);
  };

  const deleteCompany = async (companyId) => {
    if (window.confirm('Are you sure you want to delete this company? This will also remove all associated jobs and applications.')) {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`/api/admin/companies/${companyId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          alert('Company deleted successfully!');
          fetchCompanies();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete company');
        }
      } catch (error) {
        console.error('Error deleting company:', error);
        alert('Error deleting company: ' + error.message);
      }
    }
  };

  const getStatusStats = () => {
    const stats = {
      approved: 0,
      pending: 0,
      suspended: 0,
      total: companies.length
    };

    companies.forEach(company => {
      if (stats[company.status] !== undefined) {
        stats[company.status]++;
      }
    });

    return stats;
  };

  const statusStats = getStatusStats();

  if (loading) {
    return (
      <div className="section">
        <div className="loading">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="section">
      <h1>Company Management</h1>
      <p>Approve and manage companies on the platform</p>

      {error && (
        <div className="error-message">
          <h3>Unable to Load Companies</h3>
          <p>{error}</p>
          <div className="action-buttons">
            <button onClick={fetchCompanies} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      )}

      {companies.length === 0 && !error && (
        <div className="section">
          <div className="info-message">
            <h3>No Companies Loaded</h3>
            <p>Click the button below to load companies from the database.</p>
            <button onClick={fetchCompanies} className="btn btn-primary">
              Load Companies
            </button>
          </div>
        </div>
      )}

      {companies.length > 0 && (
        <>
          <div className="dashboard-top">
            <div className="card">
              <h3>Total Companies</h3>
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
                <label>Industry</label>
                <select
                  value={filters.industry}
                  onChange={(e) => handleFilterChange('industry', e.target.value)}
                >
                  <option value="all">All Industries</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Finance">Finance</option>
                  <option value="Manufacturing">Manufacturing</option>
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

            <div className="companies-list">
              {filteredCompanies.map(company => (
                <div key={company.id} className="company-card">
                  <div className="company-info">
                    <div className="company-header">
                      <h3>{company.name || 'Unnamed Company'}</h3>
                      <span className={`status-badge status-${company.status}`}>
                        {company.status}
                      </span>
                    </div>
                    <p className="company-meta">{company.industry || 'N/A'} • {company.location || 'N/A'}</p>
                    <p className="company-contact">
                      {company.email || 'No email'} • {company.phone || 'No phone'}
                    </p>
                    <p className="company-description">
                      {company.description || 'No description provided'}
                    </p>
                    <div className="company-stats">
                      <span>Jobs: {company.jobCount || 0}</span>
                      <span>Applications: {company.applicationCount || 0}</span>
                    </div>
                  </div>
                  
                  <div className="company-actions">
                    <button
                      onClick={() => viewCompanyDetails(company)}
                      className="btn btn-secondary"
                    >
                      View Details
                    </button>
                    
                    {company.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(company.id, 'approved')}
                          className="btn success"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(company.id, 'suspended')}
                          className="btn btn-danger"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    
                    {company.status === 'approved' && (
                      <button
                        onClick={() => handleStatusUpdate(company.id, 'suspended')}
                        className="btn btn-warning"
                      >
                        Suspend
                      </button>
                    )}
                    
                    {company.status === 'suspended' && (
                      <button
                        onClick={() => handleStatusUpdate(company.id, 'approved')}
                        className="btn success"
                      >
                        Reactivate
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteCompany(company.id)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredCompanies.length === 0 && (
              <div className="text-center">
                <p>No companies found matching your criteria.</p>
              </div>
            )}
          </div>

          <div className="section">
            <h3>Pending Approvals ({statusStats.pending})</h3>
            <div className="pending-approvals">
              {companies
                .filter(company => company.status === 'pending')
                .map(company => (
                  <div key={company.id} className="approval-card">
                    <div className="approval-info">
                      <h4>{company.name || 'Unnamed Company'}</h4>
                      <p>{company.industry || 'N/A'} • {company.location || 'N/A'}</p>
                      <p>Applied: {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div className="approval-actions">
                      <button
                        onClick={() => handleStatusUpdate(company.id, 'approved')}
                        className="btn success"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(company.id, 'suspended')}
                        className="btn btn-danger"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => viewCompanyDetails(company)}
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
        </>
      )}
    </div>
  );
};

export default ManageCompanies;
