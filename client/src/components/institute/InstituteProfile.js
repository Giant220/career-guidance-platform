import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const InstituteProfile = ({ institute, onInstituteUpdate, onRefresh }) => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    type: '',
    location: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    established: '',
    accreditation: ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (institute) {
      setProfile(institute);
    } else if (currentUser?.email) {
      setProfile(prev => ({
        ...prev,
        email: currentUser.email
      }));
    }
  }, [institute, currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
    setSaved(false);
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value;
    if (!value.startsWith('+266')) {
      value = '+266' + value.replace(/^\+266/, '');
    }
    if (value.length <= 12) {
      setProfile(prev => ({
        ...prev,
        phone: value
      }));
      setSaved(false);
    }
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\+266[0-9]{8}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePhone(profile.phone)) {
      alert('Please enter a valid Lesotho phone number starting with +266 followed by 8 digits');
      return;
    }

    setSaving(true);
    try {
      const token = await currentUser.getIdToken();
      
      let response;
      let url;
      let method;
      
      if (institute) {
        url = `/api/institutes/${institute.id}`;
        method = 'PUT';
      } else {
        url = '/api/institutes';
        method = 'POST';
      }

      const requestBody = {
        ...profile,
        userId: currentUser.uid
      };

      response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        
        if (onInstituteUpdate) {
          if (institute) {
            onInstituteUpdate({ ...institute, ...profile });
          } else {
            onInstituteUpdate({ id: result.id, ...profile, userId: currentUser.uid, status: 'pending' });
          }
        }
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to save profile: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert(`Error saving profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="section">
      <div className="flex-between">
        <div>
          <h1>Institute Profile</h1>
          <p>Manage your institution information and contact details</p>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} className="btn btn-secondary">
            Refresh Status
          </button>
        )}
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <div className="form-group">
              <label>Institution Name *</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Institution Type *</label>
              <select
                name="type"
                value={profile.type}
                onChange={handleChange}
                required
              >
                <option value="">Select Type</option>
                <option value="University">University</option>
                <option value="College">College</option>
                <option value="Polytechnic">Polytechnic</option>
                <option value="Institute">Institute</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location *</label>
              <input
                type="text"
                name="location"
                value={profile.location}
                onChange={handleChange}
                required
                placeholder="e.g., Maseru, Lesotho"
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handlePhoneChange}
                required
                placeholder="+266"
              />
              <small>Format: +266 followed by 8 digits</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                name="website"
                value={profile.website}
                onChange={handleChange}
                placeholder="https://"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Year Established</label>
              <input
                type="number"
                name="established"
                value={profile.established}
                onChange={handleChange}
                min="1900"
                max="2030"
              />
            </div>

            <div className="form-group">
              <label>Accreditation Body</label>
              <input
                type="text"
                name="accreditation"
                value={profile.accreditation}
                onChange={handleChange}
                placeholder="e.g., Lesotho Council on Higher Education"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={profile.description}
              onChange={handleChange}
              rows="4"
              required
              placeholder="Describe your institution, programs, and mission..."
            />
          </div>

          <div className="flex-between">
            <div>
              {saved && <div className="success">Profile saved successfully!</div>}
            </div>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving...' : (institute ? 'Update Profile' : 'Create Profile')}
            </button>
          </div>
        </form>
      </div>

      {institute && (
        <div className="section mt-1">
          <h3>Account Information</h3>
          <div className="account-info">
            <div className="info-item">
              <strong>Institute ID:</strong>
              <span>{institute.id}</span>
            </div>
            <div className="info-item">
              <strong>Status:</strong>
              <span className={`status-badge status-${institute.status}`}>
                {institute.status}
              </span>
            </div>
            <div className="info-item">
              <strong>Registration Date:</strong>
              <span>{institute.createdAt ? new Date(institute.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            {institute.approvedAt && (
              <div className="info-item">
                <strong>Approved Date:</strong>
                <span>{new Date(institute.approvedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstituteProfile;
