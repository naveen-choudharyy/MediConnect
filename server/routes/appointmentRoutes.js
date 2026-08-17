const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getAppointments,
  getAppointmentById,
  cancelAppointment,
  updateAppointmentStatus
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

// Read list & individual details
router.get('/', protect, getAppointments);
router.get('/:id', protect, getAppointmentById);

// Create appointment (patient only)
router.post('/', protect, authorize('patient'), bookAppointment);

// Cancel appointment (either party)
router.patch('/:id/cancel', protect, cancelAppointment);

// Confirm/Reject/Complete (doctor only)
router.patch('/:id/status', protect, authorize('doctor'), updateAppointmentStatus);

module.exports = router;
