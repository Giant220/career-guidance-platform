import React, { useState, useEffect } from 'react';

const ManageCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    industry: 'all',
    search: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, filters]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies');
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
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
        company.name.toLowerCase().includes(searchLower) ||
        company.location.toLowerCase().includes(searchLower)
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
      const response = await fetch(`/api/admin/companies/${companyId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert('Company status updated successfully!');
        fetchCompanies();
      }
    } catch (error) {
      console.error('Error updating company status:', error);
      alert('Error updating company status');
    }
  };

  const viewCompanyDetails = (company) => {
    alert(`Company Details:\n\nName: ${company.name}\nIndustry: ${company.industry}\nLocation: ${company.location}\nStatus: ${company.status}\nEmail: ${company.email}\nPhone: ${company.phone}`);
  };

  const deleteCompany = async (companyId) => {
    if (window.confirm('Are you sure you want to delete this company? This will also remove all associated jobs and applications.')) {
      try {
        const response = await fetch(`/api/admin/companies/${companyId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          alert('Company deleted successfully!');
          fetchCompanies();
        }
      } catch (error) {
        console.error('Error deleting company:', error);
        alert('Error deleting company');
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
    return <div className="section">Loading companies...</div>;
  }

  return (
    <div className="section">
      <h1>Company Management</h1>
      <p>Approve and manage companies on the platform</p>

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
                  <h3>{company.name}</h3>
                  <span className={`status-badge status-${company.status}`}>
                    {company.status}
                  </span>
                </div>
                <p className="company-meta">{company.industry} • {company.location}</p>
                <p className="company-contact">
                  {company.email} • {company.phone}
                </p>
                <p className="company-description">
                  {company.description}
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
                  <h4>{company.name}</h4>
                  <p>{company.industry} • {company.location}</p>
                  <p>Applied: {new Date(company.createdAt).toLocaleDateString()}</p>
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
    </div>
  );
};

export default ManageCompanies;