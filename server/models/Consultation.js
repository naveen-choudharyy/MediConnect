const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Consultation', consultationSchema);
