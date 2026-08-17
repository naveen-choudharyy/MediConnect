import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorSearch from './pages/DoctorSearch';

// Patient Pages
import PatientDashboard from './pages/PatientDashboard';
import PatientAppointments from './pages/PatientAppointments';
import PatientProfile from './pages/PatientProfile';
import BookAppointment from './pages/BookAppointment';

// Doctor Pages
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorProfile from './pages/DoctorProfile';
import DoctorAvailability from './pages/DoctorAvailability';

// Video Consultation Room
import VideoCall from './pages/VideoCall';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/doctors" element={<DoctorSearch />} />
              
              <Route path="/patient/login" element={<Login role="patient" />} />
              <Route path="/patient/register" element={<Register role="patient" />} />
              
              <Route path="/doctor/login" element={<Login role="doctor" />} />
              <Route path="/doctor/register" element={<Register role="doctor" />} />

              {/* Protected Patient Routes */}
              <Route
                path="/patient/dashboard"
                element={
                  <ProtectedRoute allowedRole="patient">
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/appointments"
                element={
                  <ProtectedRoute allowedRole="patient">
                    <PatientAppointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/profile"
                element={
                  <ProtectedRoute allowedRole="patient">
                    <PatientProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/book/:doctorId"
                element={
                  <ProtectedRoute allowedRole="patient">
                    <BookAppointment />
                  </ProtectedRoute>
                }
              />

              {/* Protected Doctor Routes */}
              <Route
                path="/doctor/dashboard"
                element={
                  <ProtectedRoute allowedRole="doctor">
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/profile"
                element={
                  <ProtectedRoute allowedRole="doctor">
                    <DoctorProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/availability"
                element={
                  <ProtectedRoute allowedRole="doctor">
                    <DoctorAvailability />
                  </ProtectedRoute>
                }
              />

              {/* Secure WebRTC Video consultation Room */}
              <Route
                path="/appointments/:appointmentId/consultation"
                element={
                  <ProtectedRoute>
                    <VideoCall />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
