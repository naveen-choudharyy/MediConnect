const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String, // HH:MM in 24h format
    required: true
  },
  endTime: {
    type: String, // HH:MM in 24h format
    required: true
  }
}, { _id: false });

const dayAvailabilitySchema = new mongoose.Schema({
  day: {
    type: String, // e.g., 'Monday', 'Tuesday', ...
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  slots: [timeSlotSchema]
}, { _id: false });

const doctorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true,
    index: true
  },
  qualification: {
    type: String,
    required: [true, 'Qualification is required'],
    trim: true
  },
  experience: {
    type: Number,
    required: [true, 'Experience in years is required'],
    min: [0, 'Experience cannot be negative']
  },
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required'],
    min: [0, 'Consultation fee cannot be negative']
  },
  bio: {
    type: String,
    trim: true
  },
  availability: [dayAvailabilitySchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
