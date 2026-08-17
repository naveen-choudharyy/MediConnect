import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      try {
        const docData = await apiRequest(`/doctors/${doctorId}`);
        if (docData.success) {
          setDoctor(docData.doctor);
        }
        
        // Fetch all appointments to cross-reference booked slots
        const appData = await apiRequest('/appointments');
        if (appData.success) {
          // Filter to only include appointments for this doctor
          const filtered = appData.appointments.filter(
            (app) => app.doctor._id.toString() === doctorId && !['cancelled', 'rejected'].includes(app.status)
          );
          setAppointments(filtered);
        }
      } catch (err) {
        setError('Failed to load doctor profile or booking information');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorDetails();
  }, [doctorId]);

  // When date is selected, find matching availability slots
  useEffect(() => {
    if (!selectedDate || !doctor) {
      setAvailableSlots([]);
      return;
    }

    const dateObj = new Date(selectedDate);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = daysOfWeek[dateObj.getUTCDay()];

    // Find slots from doctor's availability
    const dayAvail = doctor.availability.find((a) => a.day === dayName);
    if (!dayAvail || dayAvail.slots.length === 0) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }

    // Map slots and mark if they are already booked
    const slotsWithBookingStatus = dayAvail.slots.map((slot) => {
      // Check if slot overlaps with any confirmed/pending appointment on this date
      const isBooked = appointments.some((app) => {
        const appDate = new Date(app.appointmentDate).toISOString().split('T')[0];
        return appDate === selectedDate && app.startTime === slot.startTime;
      });

      return {
        ...slot,
        isBooked
      };
    });

    setAvailableSlots(slotsWithBookingStatus);
    setSelectedSlot(null);
  }, [selectedDate, doctor, appointments]);

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot) {
      setError('Please select a date and an available time slot.');
      return;
    }

    setError('');
    setBookingLoading(true);

    try {
      const data = await apiRequest('/appointments', {
        method: 'POST',
        body: {
          doctor: doctor.user._id,
          appointmentDate: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime
        }
      });

      if (data.success) {
        setSuccessMsg('Your appointment request was submitted successfully!');
        // Redirect to appointments list after 2 seconds
        setTimeout(() => {
          navigate('/patient/appointments');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <p>Loading doctor details...</p>;
  if (!doctor) return <div className="alert-banner alert-banner-error">Doctor profile not found</div>;

  const minDateString = new Date().toISOString().split('T')[0];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1>Book an Appointment</h1>
      
      {error && <div className="alert-banner alert-banner-error">{error}</div>}
      {successMsg && <div className="alert-banner alert-banner-success">{successMsg}</div>}

      <div className="grid-2">
        {/* Doctor Summary Column */}
        <div className="card">
          <h3>Dr. {doctor.user.name}</h3>
          <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem' }}>
            {doctor.specialization}
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <strong>Qualification:</strong> {doctor.qualification}
            <br />
            <strong>Experience:</strong> {doctor.experience} Years
            <br />
            <strong>Consultation Fee:</strong> ${doctor.consultationFee}
          </p>
          {doctor.bio && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--bg-muted)', borderRadius: '4px' }}>
              {doctor.bio}
            </p>
          )}
          <div style={{ marginTop: '1rem' }}>
            <Link to="/doctors" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              ← Back to Doctor Search
            </Link>
          </div>
        </div>

        {/* Date & Slot Picker Column */}
        <div className="card">
          <div className="form-group">
            <label htmlFor="booking-date">Choose Consultation Date</label>
            <input
              type="date"
              id="booking-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={minDateString}
              required
            />
          </div>

          {selectedDate && (
            <div style={{ marginTop: '1.5rem' }}>
              <label>Select Available Time Slot</label>
              {availableSlots.length > 0 ? (
                <div className="slots-grid">
                  {availableSlots.map((slot, index) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        disabled={slot.isBooked}
                        className={`slot-btn ${isSelected ? 'selected' : ''}`}
                        title={slot.isBooked ? 'Slot already booked' : 'Select slot'}
                      >
                        {slot.startTime}
                        {slot.isBooked && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>
                            [Booked]
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p style={{ color: 'var(--danger)', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '0.5rem' }}>
                  No availability slots configured by the doctor for this day of the week.
                </p>
              )}
            </div>
          )}

          {selectedSlot && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.95rem' }}>
                Selected Slot: <strong>{selectedSlot.startTime} - {selectedSlot.endTime}</strong> on <strong>{selectedDate}</strong>
              </p>
              <button
                onClick={handleBook}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={bookingLoading}
              >
                {bookingLoading ? 'Requesting Appointment...' : 'Confirm Appointment Booking'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
