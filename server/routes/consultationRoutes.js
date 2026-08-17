const express = require('express');
const router = express.Router();
const {
  startConsultation,
  endConsultation,
  getConsultation
} = require('../controllers/consultationController');
const { protect, authorize } = require('../middleware/auth');

router.get('/:appointmentId', protect, getConsultation);
router.post('/:appointmentId/start', protect, startConsultation);
router.post('/:appointmentId/end', protect, authorize('doctor'), endConsultation);

module.exports = router;
