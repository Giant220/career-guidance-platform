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
  const [loading, setLoading] = useState(true);

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
      // ✅ ADD AUTHENTICATION TOKEN
      const token = await currentUser.getIdToken();
      const response = await fetch(`/api/students/${currentUser.uid}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && typeof data === 'object') {
        setProfile(prev => ({ 
          ...prev, 
          ...data,
          // Ensure phone format
          phone: data.phone || currentUser.phoneNumber || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
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

  const validateName = (name) => {
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateName(profile.fullName)) {
      alert('Name should contain only letters and spaces');
      return;
    }

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

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/students/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: currentUser.uid,
          ...profile
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
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

  if (loading) {
    return <div className="section">Loading profile...</div>;
  }

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
                placeholder="Enter your full name"
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
                placeholder="+266XXXXXXXX"
                pattern="\+266[0-9]{8}"
                title="+266 followed by 8 digits"
              />
              <small>Format: +266 followed by 8 digits (e.g., +26612345678)</small>
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
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select
                name="gender"
                value={profile.gender}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
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
              placeholder="Enter your full residential address"
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
                placeholder="Your nationality"
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
            <span className="monospace">{currentUser?.uid || 'N/A'}</span>
          </div>
          <div className="info-item">
            <strong>Email Verified:</strong>
            <span className={currentUser?.emailVerified ? 'success' : 'warning'}>
              {currentUser?.emailVerified ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="info-item">
            <strong>Account Created:</strong>
            <span>
              {currentUser?.metadata?.creationTime ? 
                new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'N/A'
              }
            </span>
          </div>
          <div className="info-item">
            <strong>Last Login:</strong>
            <span>
              {currentUser?.metadata?.lastSignInTime ? 
                new Date(currentUser.metadata.lastSignInTime).toLocaleDateString() : 'N/A'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
