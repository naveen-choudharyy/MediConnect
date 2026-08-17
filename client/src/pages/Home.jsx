import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div>
      <div className="home-hero">
        <h1>Direct & Professional Telemedicine</h1>
        <p>
          Consult verified doctors online from the comfort of your home. Search specializations, book appointment slots, and connect instantly via secure audio-video calls.
        </p>
        
        {!user && (
          <div className="home-actions">
            <Link to="/patient/login" className="btn btn-primary">
              Patient Portal
            </Link>
            <Link to="/doctor/login" className="btn btn-secondary">
              Doctor Portal
            </Link>
          </div>
        )}
        
        {user && user.role === 'patient' && (
          <div className="home-actions">
            <Link to="/patient/dashboard" className="btn btn-primary">
              Go to Patient Dashboard
            </Link>
            <Link to="/doctors" className="btn btn-outline">
              Find Doctors
            </Link>
          </div>
        )}

        {user && user.role === 'doctor' && (
          <div className="home-actions">
            <Link to="/doctor/dashboard" className="btn btn-primary">
              Go to Doctor Dashboard
            </Link>
          </div>
        )}
      </div>

      <div style={{ margin: '3rem 0' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>How the Platform Works</h2>
        <div className="grid-3">
          <div className="card" style={{ height: '100%' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>1. Find a Specialist</h3>
            <p style={{ fontSize: '0.95rem' }}>
              Search for doctors by name, medical specialization, experience, or consultation fees. Filter profiles to match your preferences.
            </p>
          </div>
          <div className="card" style={{ height: '100%' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>2. Book a Time Slot</h3>
            <p style={{ fontSize: '0.95rem' }}>
              Select a date and click any of the doctor's open, pre-approved availability slots. Your booking request will be confirmed instantly.
            </p>
          </div>
          <div className="card" style={{ height: '100%' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>3. Secure Video Call</h3>
            <p style={{ fontSize: '0.95rem' }}>
              At the scheduled time, join the consultation from your browser. Doctors can take private notes and mark the session completed.
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '2.5rem', backgroundColor: 'var(--bg-muted)', border: 'none' }}>
        <h3>Clinical Consultation Standards</h3>
        <p style={{ fontSize: '0.9rem', marginBottom: 0 }}>
          This application utilizes WebRTC technology to establish direct peer-to-peer encryption for your video calls. All appointment scheduling, availability configurations, and consultation logs are validated on our secure backend server to protect your data privacy.
        </p>
      </div>
    </div>
  );
};

export default Home;
