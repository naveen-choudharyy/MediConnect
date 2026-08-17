const express = require('express');
const router = express.Router();
const {
  registerPatient,
  registerDoctor,
  login,
  getMe,
  logout,
  updatePatientProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Patient Auth
router.post('/patient/register', registerPatient);
router.post('/patient/login', (req, res, next) => {
  req.body.expectedRole = 'patient';
  login(req, res, next);
});
router.put('/patient/profile', protect, updatePatientProfile);

// Doctor Auth
router.post('/doctor/register', registerDoctor);
router.post('/doctor/login', (req, res, next) => {
  req.body.expectedRole = 'doctor';
  login(req, res, next);
});

// Generic Auth Details
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
