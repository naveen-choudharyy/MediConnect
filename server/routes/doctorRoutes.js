const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  updateProfile,
  updateAvailability
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

// Public Doctor list & details
router.get('/', getDoctors);
router.get('/:id', getDoctorById);

// Doctor specific modifiers
router.put('/profile', protect, authorize('doctor'), updateProfile);
router.put('/availability', protect, authorize('doctor'), updateAvailability);

module.exports = router;
