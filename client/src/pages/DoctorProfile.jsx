import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';

const DoctorProfile = () => {
  const { user, profile, updateContextProfile } = useAuth();
  const [specialization, setSpecialization] = useState(profile?.specialization || '');
  const [qualification, setQualification] = useState(profile?.qualification || '');
  const [experience, setExperience] = useState(profile?.experience || '');
  const [consultationFee, setConsultationFee] = useState(profile?.consultationFee || '');
  const [bio, setBio] = useState(profile?.bio || '');
  
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setUpdating(true);

    try {
      const data = await apiRequest('/doctors/profile', {
        method: 'PUT',
        body: {
          specialization,
          qualification,
          experience: Number(experience),
          consultationFee: Number(consultationFee),
          bio
        }
      });
      if (data.success) {
        updateContextProfile(data.profile);
        setSuccess('Professional profile updated successfully.');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1>Doctor Profile</h1>

      {success && <div className="alert-banner alert-banner-success">{success}</div>}
      {error && <div className="alert-banner alert-banner-error">{error}</div>}

      <div className="card">
        <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
          Account Details
        </h3>
        <p><strong>Name:</strong> Dr. {user?.name}</p>
        <p><strong>Email Address:</strong> {user?.email}</p>
        <p><strong>Phone Number:</strong> {user?.phone || 'Not provided'}</p>
      </div>

      <div className="card">
        <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
          Edit Professional Credentials
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group row">
            <div>
              <label htmlFor="specialization">Specialization</label>
              <input
                type="text"
                id="specialization"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="qualification">Qualification</label>
              <input
                type="text"
                id="qualification"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group row">
            <div>
              <label htmlFor="experience">Years of Experience</label>
              <input
                type="number"
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                required
                min={0}
              />
            </div>
            <div>
              <label htmlFor="fee">Consultation Fee (INR)</label>
              <input
                type="number"
                id="fee"
                value={consultationFee}
                onChange={(e) => setConsultationFee(e.target.value)}
                required
                min={0}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bio">Professional Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write a brief professional summary..."
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

export default DoctorProfile;
