import React, { useState, useEffect } from 'react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, filters]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
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
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert('User status updated successfully!');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status');
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        alert('User role updated successfully!');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error updating user role');
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          alert('User deleted successfully!');
          fetchUsers();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
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

  const roleStats = getRoleStats();

  if (loading) {
    return <div className="section">Loading users...</div>;
  }

  return (
    <div className="section">
      <h1>User Management</h1>
      <p>Manage all system users and their permissions</p>

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
          <h3>Institutions</h3>
          <p className="stat-number">{roleStats.institute}</p>
        </div>
        <div className="card">
          <h3>Companies</h3>
          <p className="stat-number">{roleStats.company}</p>
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
              <option value="institute">Institution</option>
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
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
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
                      <option value="institute">Institution</option>
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
                        onClick={() => {
                          // View user details
                          alert(`View details for user: ${user.fullName}`);
                        }}
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
    </div>
  );
};

export default ManageUsers;