import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const StudentProfile = () => {
  const { currentUser, updateProfile } = useAuth();
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    nationality: 'Lesotho'
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProfile(prev => ({
        ...prev,
        fullName: currentUser.displayName || '',
        phone: currentUser.phoneNumber || ''
      }));
      fetchStudentProfile();
    }
  }, [currentUser]);

  const fetchStudentProfile = async () => {
    try {
      const response = await fetch(`/api/students/${currentUser.uid}/profile`);
      const data = await response.json();
      if (data) {
        setProfile(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

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
    // Ensure phone starts with +266
    if (!value.startsWith('+266')) {
      value = '+266' + value.replace(/^\+266/, '');
    }
    // Limit to 12 characters (+266 followed by 8 digits)
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
      // Update Firebase auth profile
      await updateProfile({
        displayName: profile.fullName,
        phoneNumber: profile.phone
      });

      // Update student profile in database
      const response = await fetch('/api/students/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: currentUser.uid,
          ...profile
        })
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="section">
      <h1>Student Profile</h1>
      <p>Manage your personal information and account details</p>

      <div className="form-container">
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                required
                pattern="[A-Za-z\s]+"
                title="Name should contain only letters and spaces"
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
              <label>Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={profile.dateOfBirth}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select
                name="gender"
                value={profile.gender}
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              name="address"
              value={profile.address}
              onChange={handleChange}
              rows="3"
              placeholder="Enter your full address"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nationality</label>
              <input
                type="text"
                name="nationality"
                value={profile.nationality}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={currentUser?.email || ''}
                disabled
                className="disabled-input"
              />
              <small>Email cannot be changed</small>
            </div>
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
            <strong>Student ID:</strong>
            <span>{currentUser?.uid}</span>
          </div>
          <div className="info-item">
            <strong>Email Verified:</strong>
            <span>{currentUser?.emailVerified ? 'Yes' : 'No'}</span>
          </div>
          <div className="info-item">
            <strong>Account Created:</strong>
            <span>{currentUser?.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;