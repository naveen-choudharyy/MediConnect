import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          ✚ MediConnect
        </Link>
        <div className="navbar-links">
          <Link to="/" className={`navbar-item ${isActive('/')}`}>
            Home
          </Link>

          {!user && (
            <>
              <Link to="/doctors" className={`navbar-item ${isActive('/doctors')}`}>
                Find Doctors
              </Link>
              <Link to="/patient/login" className={`navbar-item ${isActive('/patient/login')}`}>
                Patient Login
              </Link>
              <Link to="/doctor/login" className={`navbar-item ${isActive('/doctor/login')}`}>
                Doctor Login
              </Link>
            </>
          )}

          {user && user.role === 'patient' && (
            <>
              <Link to="/patient/dashboard" className={`navbar-item ${isActive('/patient/dashboard')}`}>
                Dashboard
              </Link>
              <Link to="/doctors" className={`navbar-item ${isActive('/doctors')}`}>
                Find Doctors
              </Link>
              <Link to="/patient/appointments" className={`navbar-item ${isActive('/patient/appointments')}`}>
                My Appointments
              </Link>
              <Link to="/patient/profile" className={`navbar-item ${isActive('/patient/profile')}`}>
                Profile
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                Logout
              </button>
            </>
          )}

          {user && user.role === 'doctor' && (
            <>
              <Link to="/doctor/dashboard" className={`navbar-item ${isActive('/doctor/dashboard')}`}>
                Dashboard
              </Link>
              <Link to="/doctor/availability" className={`navbar-item ${isActive('/doctor/availability')}`}>
                Manage Availability
              </Link>
              <Link to="/doctor/profile" className={`navbar-item ${isActive('/doctor/profile')}`}>
                Profile
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
