const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentDate: {
    type: Date, // Normalized to YYYY-MM-DD at 00:00:00 UTC
    required: true
  },
  startTime: {
    type: String, // HH:MM
    required: true
  },
  endTime: {
    type: String, // HH:MM
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  consultationType: {
    type: String,
    enum: ['video'],
    default: 'video'
  }
}, {
  timestamps: true
});

// Indexes for query performance and preventing double bookings
appointmentSchema.index({ doctor: 1, appointmentDate: 1, startTime: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
