import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = ({ role }) => {
  const { registerPatient, registerDoctor } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Patient Fields
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');

  // Doctor Fields
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [bio, setBio] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (role === 'patient') {
        await registerPatient({
          name,
          email,
          password,
          phone,
          dateOfBirth,
          gender,
          address
        });
        navigate('/patient/dashboard');
      } else {
        await registerDoctor({
          name,
          email,
          password,
          phone,
          specialization,
          qualification,
          experience: Number(experience),
          consultationFee: Number(consultationFee),
          bio
        });
        navigate('/doctor/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = role === 'doctor' ? 'Doctor' : 'Patient';

  return (
    <div className="form-container" style={{ maxWidth: '600px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>{roleLabel} Registration</h2>

      {error && (
        <div className="alert-banner alert-banner-error" style={{ padding: '0.75rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group row">
          <div>
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="e.g. john@example.com"
            />
          </div>
        </div>

        <div className="form-group row">
          <div>
            <label htmlFor="password">Password (min 6 chars)</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="phone">Phone Number</label>
            <input
              type="text"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 1234567890"
            />
          </div>
        </div>

        {/* Patient Specific Fields */}
        {role === 'patient' && (
          <>
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
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Street name, City, State"
              />
            </div>
          </>
        )}

        {/* Doctor Specific Fields */}
        {role === 'doctor' && (
          <>
            <div className="form-group row">
              <div>
                <label htmlFor="specialization">Medical Specialization</label>
                <input
                  type="text"
                  id="specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  required
                  placeholder="e.g. Pediatrics, Cardiology"
                />
              </div>
              <div>
                <label htmlFor="qualification">Professional Qualification</label>
                <input
                  type="text"
                  id="qualification"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  required
                  placeholder="e.g. MBBS, MD"
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
                  placeholder="e.g. 8"
                />
              </div>
              <div>
                <label htmlFor="fee">Consultation Fee ($)</label>
                <input
                  type="number"
                  id="fee"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  required
                  min={0}
                  placeholder="e.g. 100"
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
          </>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
        <p>
          Already have an account?{' '}
          <Link to={role === 'doctor' ? '/doctor/login' : '/patient/login'}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
