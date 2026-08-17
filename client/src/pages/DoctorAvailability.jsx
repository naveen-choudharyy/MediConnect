import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DoctorAvailability = () => {
  const { profile, updateContextProfile } = useAuth();

  // Local state initialized from profile availability or default empty structure
  const [availability, setAvailability] = useState(
    DAYS.map((day) => {
      const existing = profile?.availability?.find((a) => a.day === day);
      return {
        day,
        slots: existing ? [...existing.slots] : []
      };
    })
  );

  const [selectedDay, setSelectedDay] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Add slot locally
  const handleAddSlot = (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    if (!startTime || !endTime) {
      setError('Please select start and end times.');
      return;
    }

    if (startTime >= endTime) {
      setError('Start time must be before end time.');
      return;
    }

    // Check if slot already exists for that day
    const dayIndex = availability.findIndex((d) => d.day === selectedDay);
    const dayObj = availability[dayIndex];
    const duplicate = dayObj.slots.some(
      (s) => s.startTime === startTime && s.endTime === endTime
    );

    if (duplicate) {
      setError(`Slot ${startTime} - ${endTime} is already added for ${selectedDay}.`);
      return;
    }

    // Sort slots after addition
    const updatedSlots = [...dayObj.slots, { startTime, endTime }].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    const updatedAvail = [...availability];
    updatedAvail[dayIndex] = { ...dayObj, slots: updatedSlots };
    setAvailability(updatedAvail);
    setSuccess(`Added slot locally to ${selectedDay}. Remember to save changes.`);
  };

  // Remove slot locally
  const handleRemoveSlot = (dayName, slotIndex) => {
    setSuccess('');
    setError('');
    const dayIndex = availability.findIndex((d) => d.day === dayName);
    const dayObj = availability[dayIndex];
    
    const updatedSlots = dayObj.slots.filter((_, idx) => idx !== slotIndex);
    const updatedAvail = [...availability];
    updatedAvail[dayIndex] = { ...dayObj, slots: updatedSlots };
    setAvailability(updatedAvail);
  };

  // Save to database
  const handleSave = async () => {
    setSuccess('');
    setError('');
    setSaving(true);

    try {
      // Filter out days with no slots to keep database clean
      const cleanedAvailability = availability.filter((day) => day.slots.length > 0);

      const data = await apiRequest('/doctors/availability', {
        method: 'PUT',
        body: { availability: cleanedAvailability }
      });

      if (data.success) {
        // Fetch fresh profile to sync with auth context
        const profileData = await apiRequest('/auth/me');
        if (profileData.success) {
          updateContextProfile(profileData.profile);
        }
        setSuccess('Weekly availability slots saved successfully.');
      }
    } catch (err) {
      setError(err.message || 'Failed to save availability settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1>Configure Weekly Availability</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Configure the exact days and time intervals you are available for telemedicine video consults. Patients will only see and book these configured slots.
      </p>

      {success && <div className="alert-banner alert-banner-success">{success}</div>}
      {error && <div className="alert-banner alert-banner-error">{error}</div>}

      {/* Form to add slots */}
      <div className="card">
        <h3>Add Availability Interval</h3>
        <form onSubmit={handleAddSlot} className="availability-form">
          <div>
            <label htmlFor="select-day">Day of Week</label>
            <select id="select-day" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="start-time">Start Time (24h)</label>
            <input
              type="time"
              id="start-time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="end-time">End Time (24h)</label>
            <input
              type="time"
              id="end-time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-secondary">
            Add Slot
          </button>
        </form>
      </div>

      {/* Main planner display */}
      <div style={{ marginTop: '2rem' }}>
        <h3>Weekly Planner Summary</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {availability.map((dayObj) => (
            <div key={dayObj.day} className="day-schedule-card">
              <div className="day-header">
                <span>{dayObj.day}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                  {dayObj.slots.length} slots configured
                </span>
              </div>

              {dayObj.slots.length > 0 ? (
                <div className="slot-editor-list">
                  {dayObj.slots.map((slot, idx) => (
                    <div key={idx} className="slot-pill">
                      <span>
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(dayObj.day, idx)}
                        title="Remove slot"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic', margin: 0 }}>
                  No slots scheduled for this day
                </p>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '2rem', padding: '1rem' }}
          disabled={saving}
        >
          {saving ? 'Saving changes...' : 'Save Weekly Availability Settings'}
        </button>
      </div>
    </div>
  );
};

export default DoctorAvailability;
