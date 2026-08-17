const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getAppointments,
  getAppointmentById,
  cancelAppointment,
  updateAppointmentStatus,
  verifyPayment,
  getPaymentConfig,
  getPaymentPayload
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

// Read list & individual details
router.get('/', protect, getAppointments);
router.get('/payment-config', protect, getPaymentConfig);
router.get('/:id', protect, getAppointmentById);

// Create appointment (patient only)
router.post('/', protect, authorize('patient'), bookAppointment);

// Get payment details/order for existing pending appointment
router.get('/:id/payment-payload', protect, authorize('patient'), getPaymentPayload);

// Verify signature
router.post('/:id/verify-payment', protect, authorize('patient'), verifyPayment);

// Cancel appointment (either party)
router.patch('/:id/cancel', protect, cancelAppointment);

// Confirm/Reject/Complete (doctor only)
router.patch('/:id/status', protect, authorize('doctor'), updateAppointmentStatus);

module.exports = router;
