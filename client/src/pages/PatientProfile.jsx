import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';

const PatientProfile = () => {
  const { user, profile, updateContextProfile } = useAuth();
  const [dateOfBirth, setDateOfBirth] = useState(
    profile?.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : ''
  );
  const [gender, setGender] = useState(profile?.gender || 'Male');
  const [address, setAddress] = useState(profile?.address || '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setUpdating(true);

    try {
      const data = await apiRequest('/auth/patient/profile', {
        method: 'PUT',
        body: { dateOfBirth, gender, address }
      });
      if (data.success) {
        updateContextProfile(data.profile);
        setSuccess('Profile updated successfully.');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1>My Profile</h1>

      {success && <div className="alert-banner alert-banner-success">{success}</div>}
      {error && <div className="alert-banner alert-banner-error">{error}</div>}

      <div className="card">
        <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
          Account Details
        </h3>
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email Address:</strong> {user?.email}</p>
        <p><strong>Phone Number:</strong> {user?.phone || 'Not provided'}</p>
      </div>

      <div className="card">
        <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
          Edit Personal Information
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group row">
            <div>
              <label htmlFor="dob">Date of Birth</label>
              <input
                type="date"
                id="dob"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Residential Address</label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Street name, City, State"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={updating}>
            {updating ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientProfile;
