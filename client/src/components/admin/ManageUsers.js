import React, { useState, useEffect } from 'react';

const ManageUsers = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    filterUsers();
  }, [users, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/admin/users', {
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
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      // Ensure data is an array to prevent .forEach errors
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(user => user.status === filters.status);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.fullName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert('User status updated successfully!');
        fetchUsers();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status: ' + error.message);
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        alert('User role updated successfully!');
        fetchUsers();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error updating user role: ' + error.message);
    }
  };

  const viewUserDetails = (user) => {
    const details = `
User Details:

Name: ${user.fullName || 'N/A'}
Email: ${user.email || 'N/A'}
Role: ${user.role || 'N/A'}
Status: ${user.status || 'N/A'}
User ID: ${user.id || 'N/A'}
Created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
Last Updated: ${user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
    `;
    alert(details);
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          alert('User deleted successfully!');
          fetchUsers();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user: ' + error.message);
      }
    }
  };

  const getRoleStats = () => {
    const stats = {
      student: 0,
      institute: 0,
      company: 0,
      admin: 0,
      total: users.length
    };

    users.forEach(user => {
      if (stats[user.role] !== undefined) {
        stats[user.role]++;
      }
    });

    return stats;
  };

  const getStatusStats = () => {
    const stats = {
      active: 0,
      suspended: 0,
      pending: 0,
      total: users.length
    };

    users.forEach(user => {
      if (stats[user.status] !== undefined) {
        stats[user.status]++;
      }
    });

    return stats;
  };

  const roleStats = getRoleStats();
  const statusStats = getStatusStats();

  if (loading) {
    return (
      <div className="section">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="section">
      <h1>User Management</h1>
      <p>Manage all users on the platform</p>

      {error && (
        <div className="error-message">
          <h3>Unable to Load Users</h3>
          <p>{error}</p>
          <div className="action-buttons">
            <button onClick={fetchUsers} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      )}

      {users.length === 0 && !error && (
        <div className="section">
          <div className="info-message">
            <h3>No Users Loaded</h3>
            <p>Click the button below to load users from the database.</p>
            <button onClick={fetchUsers} className="btn btn-primary">
              Load Users
            </button>
          </div>
        </div>
      )}

      {users.length > 0 && (
        <>
          <div className="dashboard-top">
            <div className="card">
              <h3>Total Users</h3>
              <p className="stat-number">{roleStats.total}</p>
            </div>
            <div className="card">
              <h3>Students</h3>
              <p className="stat-number">{roleStats.student}</p>
            </div>
            <div className="card">
              <h3>Institutes</h3>
              <p className="stat-number">{roleStats.institute}</p>
            </div>
            <div className="card">
              <h3>Companies</h3>
              <p className="stat-number">{roleStats.company}</p>
            </div>
            <div className="card">
              <h3>Admins</h3>
              <p className="stat-number">{roleStats.admin}</p>
            </div>
          </div>

          <div className="dashboard-top">
            <div className="card">
              <h3>Active Users</h3>
              <p className="stat-number">{statusStats.active}</p>
            </div>
            <div className="card">
              <h3>Suspended</h3>
              <p className="stat-number">{statusStats.suspended}</p>
            </div>
            <div className="card">
              <h3>Pending</h3>
              <p className="stat-number">{statusStats.pending}</p>
            </div>
          </div>

          <div className="section">
            <div className="filters-row">
              <div className="form-group">
                <label>Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="student">Student</option>
                  <option value="institute">Institute</option>
                  <option value="company">Company</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="form-group">
                <label>Search</label>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            <div className="users-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Registration Date</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.fullName || 'N/A'}</strong>
                        <br />
                        <small>ID: {user.id}</small>
                      </td>
                      <td>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                          className="role-select"
                        >
                          <option value="student">Student</option>
                          <option value="institute">Institute</option>
                          <option value="company">Company</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <select
                          value={user.status}
                          onChange={(e) => handleStatusUpdate(user.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                      <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => viewUserDetails(user)}
                            className="btn btn-secondary"
                          >
                            View
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="btn btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="text-center">
                  <p>No users found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>

          <div className="section">
            <h3>Bulk Actions</h3>
            <div className="bulk-actions">
              <button className="btn btn-secondary">
                Export Users CSV
              </button>
              <button className="btn btn-secondary">
                Send Bulk Email
              </button>
              <button className="btn btn-warning">
                Suspend Inactive Users
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManageUsers;
