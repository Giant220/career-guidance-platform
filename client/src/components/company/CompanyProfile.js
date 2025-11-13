import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const CompanyProfile = ({ company, onUpdate }) => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    type: '',
    industry: '',
    email: '',
    phone: '',
    website: '',
    location: '',
    description: '',
    contactPerson: '',
    size: ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (company) {
      setProfile(company);
    }
  }, [company]);

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
      const response = await fetch('/api/companies/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          companyId: currentUser.uid,
          ...profile
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        onUpdate();
      } else {
        alert(`Error: ${result.error || 'Failed to save profile'}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="section">
      <h1>Company Profile</h1>
      <p>Manage your company information and contact details</p>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Company Type *</label>
              <select
                name="type"
                value={profile.type}
                onChange={handleChange}
                required
              >
                <option value="">Select Type</option>
                <option value="Private">Private Company</option>
                <option value="Public">Public Company</option>
                <option value="Government">Government</option>
                <option value="NGO">NGO</option>
                <option value="Startup">Startup</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Industry *</label>
              <select
                name="industry"
                value={profile.industry}
                onChange={handleChange}
                required
              >
                <option value="">Select Industry</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Finance">Finance</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Mining">Mining</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Company Size</label>
              <select
                name="size"
                value={profile.size}
                onChange={handleChange}
              >
                <option value="">Select Size</option>
                <option value="1-10 employees">1-10 employees</option>
                <option value="11-50 employees">11-50 employees</option>
                <option value="51-200 employees">51-200 employees</option>
                <option value="201-500 employees">201-500 employees</option>
                <option value="501-1000 employees">501-1000 employees</option>
                <option value="1000+ employees">1000+ employees</option>
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
              <label>Contact Person *</label>
              <input
                type="text"
                name="contactPerson"
                value={profile.contactPerson}
                onChange={handleChange}
                required
                placeholder="Full name of contact person"
              />
            </div>

            <div className="form-group">
              <label>Contact Person Role</label>
              <input
                type="text"
                name="contactRole"
                value={profile.contactRole}
                onChange={handleChange}
                placeholder="e.g., HR Manager"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Company Description *</label>
            <textarea
              name="description"
              value={profile.description}
              onChange={handleChange}
              rows="4"
              required
              placeholder="Describe your company, mission, and values..."
            />
          </div>

          <div className="flex-between">
            <div>
              {saved && <div className="success">Profile saved successfully!</div>}
            </div>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      <div className="section mt-1">
        <h3>Account Information</h3>
        <div className="account-info">
          <div className="info-item">
            <strong>Company ID:</strong>
            <span>{company?.id}</span>
          </div>
          <div className="info-item">
            <strong>Status:</strong>
            <span className={`status-badge status-${company?.status}`}>
              {company?.status}
            </span>
          </div>
          <div className="info-item">
            <strong>Registration Date:</strong>
            <span>{company?.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
