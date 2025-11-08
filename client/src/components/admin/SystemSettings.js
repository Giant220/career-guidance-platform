import React, { useState, useEffect } from 'react';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Career Bridge Lesotho',
    siteDescription: 'Your pathway from education to employment in Lesotho',
    maxApplicationsPerInstitution: 2,
    allowStudentRegistrations: true,
    allowInstitutionRegistrations: true,
    allowCompanyRegistrations: true,
    requireEmailVerification: true,
    maintenanceMode: false
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setSaved(false);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        siteName: 'Career Bridge Lesotho',
        siteDescription: 'Your pathway from education to employment in Lesotho',
        maxApplicationsPerInstitution: 2,
        allowStudentRegistrations: true,
        allowInstitutionRegistrations: true,
        allowCompanyRegistrations: true,
        requireEmailVerification: true,
        maintenanceMode: false
      });
    }
  };

  return (
    <div className="section">
      <h1>System Settings</h1>
      <p>Configure platform-wide settings and preferences</p>

      <div className="section">
        <h3>General Settings</h3>
        <div className="form">
          <div className="form-row">
            <div className="form-group">
              <label>Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleSettingChange('siteName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Max Applications per Institution</label>
              <input
                type="number"
                value={settings.maxApplicationsPerInstitution}
                onChange={(e) => handleSettingChange('maxApplicationsPerInstitution', parseInt(e.target.value))}
                min="1"
                max="5"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Site Description</label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
              rows="3"
            />
          </div>
        </div>
      </div>

      <div className="section">
        <h3>Registration Settings</h3>
        <div className="settings-grid">
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.allowStudentRegistrations}
                onChange={(e) => handleSettingChange('allowStudentRegistrations', e.target.checked)}
              />
              Allow Student Registrations
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.allowInstitutionRegistrations}
                onChange={(e) => handleSettingChange('allowInstitutionRegistrations', e.target.checked)}
              />
              Allow Institution Registrations
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.allowCompanyRegistrations}
                onChange={(e) => handleSettingChange('allowCompanyRegistrations', e.target.checked)}
              />
              Allow Company Registrations
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.requireEmailVerification}
                onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
              />
              Require Email Verification
            </label>
          </div>
        </div>
      </div>

      <div className="section">
        <h3>System Status</h3>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
            />
            Maintenance Mode
          </label>
          <small>When enabled, only administrators can access the platform</small>
        </div>
      </div>

      <div className="section">
        <h3>Danger Zone</h3>
        <div className="danger-zone">
          <div className="danger-item">
            <h4>Reset All Settings</h4>
            <p>Reset all system settings to their default values</p>
            <button onClick={handleResetSettings} className="btn btn-warning">
              Reset Settings
            </button>
          </div>
          <div className="danger-item">
            <h4>Clear All Data</h4>
            <p>Permanently delete all user data (irreversible)</p>
            <button className="btn btn-danger" disabled>
              Clear Data (Disabled)
            </button>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="flex-between">
          <div>
            {saved && <div className="success">Settings saved successfully!</div>}
          </div>
          <button 
            onClick={handleSaveSettings} 
            className="btn"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;