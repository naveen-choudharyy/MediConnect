import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import StatusBadge from '../components/StatusBadge';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAppointments = async () => {
    try {
      const data = await apiRequest('/appointments');
      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      setError('Failed to fetch doctor appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (appId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this appointment as ${newStatus}?`)) return;
    try {
      const data = await apiRequest(`/appointments/${appId}/status`, {
        method: 'PATCH',
        body: { status: newStatus }
      });
      if (data.success) {
        setAppointments((prev) =>
          prev.map((app) => (app._id === appId ? { ...app, status: newStatus } : app))
        );
      }
    } catch (err) {
      alert(err.message || 'Failed to update appointment status');
    }
  };

  // Grouping appointments
  const pendingRequests = appointments.filter((app) => app.status === 'pending');
  const confirmedSchedule = appointments.filter((app) => app.status === 'confirmed');
  const pastHistory = appointments.filter((app) => ['completed', 'cancelled', 'rejected'].includes(app.status));

  return (
    <div>
      <h1>Doctor Dashboard</h1>

      {error && <div className="alert-banner alert-banner-error">{error}</div>}

      {/* Pending requests panel */}
      <div className="card">
        <h3>Pending Appointment Requests ({pendingRequests.length})</h3>
        {loading ? (
          <p>Loading requests...</p>
        ) : pendingRequests.length > 0 ? (
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Contact</th>
                  <th>Requested Date & Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((app) => (
                  <tr key={app._id}>
                    <td>
                      <strong>{app.patient.name}</strong>
                    </td>
                    <td>
                      {app.patient.email}
                      <br />
                      <span style={{ fontSize: '0.85rem' }}>{app.patient.phone || 'No phone'}</span>
                    </td>
                    <td>
                      {new Date(app.appointmentDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                      <br />
                      <span style={{ fontSize: '0.85rem' }}>{app.startTime} - {app.endTime}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleUpdateStatus(app._id, 'confirmed')}
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app._id, 'rejected')}
                          className="btn btn-danger"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No pending requests.</p>
        )}
      </div>

      {/* Grid for confirmed schedule and past history */}
      <div className="grid-2" style={{ marginTop: '2rem' }}>
        <div className="card">
          <h3>Confirmed Consultations ({confirmedSchedule.length})</h3>
          {loading ? (
            <p>Loading...</p>
          ) : confirmedSchedule.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {confirmedSchedule.map((app) => (
                <div key={app._id} style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: '4px', backgroundColor: 'var(--bg-muted)' }}>
                  <p style={{ fontWeight: 600, margin: 0 }}>Patient: {app.patient.name}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Date: {new Date(app.appointmentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })} | Time: {app.startTime} - {app.endTime}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/appointments/${app._id}/consultation`} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      Join Room & Start Call
                    </Link>
                    <button
                      onClick={() => handleUpdateStatus(app._id, 'cancelled')}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No confirmed appointments scheduled.</p>
          )}
        </div>

        <div className="card">
          <h3>Consultation History ({pastHistory.length})</h3>
          {loading ? (
            <p>Loading...</p>
          ) : pastHistory.length > 0 ? (
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pastHistory.map((app) => (
                    <tr key={app._id}>
                      <td>{app.patient.name}</td>
                      <td>
                        {new Date(app.appointmentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}
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
            <p style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No past records.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
