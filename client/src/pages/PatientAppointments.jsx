import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeNotesId, setActiveNotesId] = useState(null);
  const [notesContent, setNotesContent] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      const data = await apiRequest('/appointments');
      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      setError('Failed to fetch appointments list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const data = await apiRequest(`/appointments/${id}/cancel`, {
        method: 'PATCH'
      });
      if (data.success) {
        setAppointments((prev) =>
          prev.map((app) => (app._id === id ? { ...app, status: 'cancelled' } : app))
        );
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment');
    }
  };

  const handleToggleNotes = async (appId) => {
    if (activeNotesId === appId) {
      setActiveNotesId(null);
      setNotesContent('');
      return;
    }

    setActiveNotesId(appId);
    setNotesContent('');
    setNotesLoading(true);

    try {
      const data = await apiRequest(`/consultations/${appId}`);
      if (data.success) {
        setNotesContent(data.consultation.notes || 'No consultation notes recorded by the doctor.');
      }
    } catch (err) {
      setNotesContent('No consultation notes found.');
    } finally {
      setNotesLoading(false);
    }
  };

  return (
    <div>
      <h1>My Booked Appointments</h1>

      {error && <div className="alert-banner alert-banner-error">{error}</div>}

      {loading ? (
        <p>Loading bookings...</p>
      ) : appointments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {appointments.map((app) => {
            const isCancelable = ['pending', 'confirmed'].includes(app.status);
            const isJoinable = app.status === 'confirmed';

            return (
              <div key={app._id} className="card" id={`notes-${app._id}`}>
                <div className="card-header">
                  <div>
                    <h3 style={{ margin: 0 }}>Dr. {app.doctor.name}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Specialization: {app.doctor.specialization}
                    </span>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                <div className="grid-3" style={{ gap: '1rem', fontSize: '0.95rem' }}>
                  <div>
                    <strong>Date:</strong> {new Date(app.appointmentDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                  </div>
                  <div>
                    <strong>Time:</strong> {app.startTime} - {app.endTime}
                  </div>
                  <div>
                    <strong>Consultation Fee:</strong> ${app.doctor.consultationFee}
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {isJoinable && (
                    <Link to={`/appointments/${app._id}/consultation`} className="btn btn-primary">
                      Join Video Consultation
                    </Link>
                  )}
                  {isCancelable && (
                    <button onClick={() => handleCancel(app._id)} className="btn btn-danger">
                      Cancel Appointment
                    </button>
                  )}
                  {app.status === 'completed' && (
                    <button onClick={() => handleToggleNotes(app._id)} className="btn btn-secondary">
                      {activeNotesId === app._id ? 'Hide Clinical Notes' : 'View Clinical Notes'}
                    </button>
                  )}
                </div>

                {activeNotesId === app._id && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-muted)', borderRadius: '4px', borderLeft: '3px solid var(--primary)' }}>
                    <strong>Clinical Consultation Record:</strong>
                    {notesLoading ? (
                      <p style={{ marginTop: '0.25rem' }}>Loading notes...</p>
                    ) : (
                      <p style={{ marginTop: '0.25rem', whiteSpace: 'pre-wrap', marginBottom: 0, fontSize: '0.95rem' }}>
                        {notesContent}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>You do not have any appointments booked.</p>
          <div style={{ marginTop: '1rem' }}>
            <Link to="/doctors" className="btn btn-primary">
              Book Doctor Consultation
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
