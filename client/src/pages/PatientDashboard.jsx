import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import StatusBadge from '../components/StatusBadge';

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await apiRequest('/appointments');
        if (data.success) {
          setAppointments(data.appointments);
        }
      } catch (err) {
        setError('Failed to load appointments history');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  // Filter appointments
  const upcoming = appointments.filter(
    (app) => ['pending', 'confirmed'].includes(app.status)
  );

  const previous = appointments.filter(
    (app) => ['completed', 'rejected', 'cancelled'].includes(app.status)
  );

  // Next appointment is the earliest upcoming one
  const nextApp = upcoming.length > 0 ? upcoming[0] : null;

  return (
    <div>
      <h1>Patient Dashboard</h1>

      {error && <div className="alert-banner alert-banner-error">{error}</div>}

      {/* Hero Next Appointment */}
      {nextApp ? (
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', backgroundColor: '#f0fdfa' }}>
          <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <h3>Next Scheduled Appointment</h3>
            <StatusBadge status={nextApp.status} />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
              Dr. {nextApp.doctor.name}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Specialization: {nextApp.doctor.specialization || 'General'}
            </p>
            <div className="grid-3" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <strong>Date:</strong> {new Date(nextApp.appointmentDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
              </div>
              <div>
                <strong>Time:</strong> {nextApp.startTime} - {nextApp.endTime}
              </div>
              <div>
                <strong>Type:</strong> Video Consultation
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {nextApp.status === 'confirmed' ? (
                <Link to={`/appointments/${nextApp._id}/consultation`} className="btn btn-primary">
                  Join Video Consultation
                </Link>
              ) : (
                <button className="btn btn-primary" disabled title="Waiting for doctor to confirm appointment">
                  Join Consultation (Pending Confirmation)
                </button>
              )}
              <Link to={`/patient/appointments`} className="btn btn-secondary">
                Manage Bookings
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <h3>No Upcoming Consultations</h3>
          <p>Schedule a video call with one of our specialized doctors today.</p>
          <Link to="/doctors" className="btn btn-primary">
            Find and Book a Doctor
          </Link>
        </div>
      )}

      {/* Main Listings */}
      <div className="grid-2" style={{ marginTop: '2rem' }}>
        {/* Upcoming List */}
        <div className="card">
          <h3>Upcoming Appointments ({upcoming.length})</h3>
          {loading ? (
            <p>Loading...</p>
          ) : upcoming.length > 0 ? (
            <div className="table-container" style={{ border: 'none' }}>
              <table style={{ minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Date / Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((app) => (
                    <tr key={app._id}>
                      <td>
                        <strong>Dr. {app.doctor.name}</strong>
                        <br />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                          {app.doctor.specialization}
                        </span>
                      </td>
                      <td>
                        {new Date(app.appointmentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                        <br />
                        <span style={{ fontSize: '0.85rem' }}>{app.startTime}</span>
                      </td>
                      <td>
                        <StatusBadge status={app.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No upcoming appointments scheduled.</p>
          )}
        </div>

        {/* Previous List */}
        <div className="card">
          <h3>Consultation History ({previous.length})</h3>
          {loading ? (
            <p>Loading...</p>
          ) : previous.length > 0 ? (
            <div className="table-container" style={{ border: 'none' }}>
              <table style={{ minWidth: '100%' }}>
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Record</th>
                  </tr>
                </thead>
                <tbody>
                  {previous.map((app) => (
                    <tr key={app._id}>
                      <td>
                        <strong>Dr. {app.doctor.name}</strong>
                      </td>
                      <td>
                        {new Date(app.appointmentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <StatusBadge status={app.status} />
                          {app.status === 'completed' && (
                            <Link to={`/patient/appointments#notes-${app._id}`} style={{ fontSize: '0.85rem', textDecoration: 'underline' }}>
                              View Notes
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No past consultations found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
