const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const consultationRoutes = require('./routes/consultationRoutes');

const app = express();

// Configure CORS
let clientUrl = process.env.CLIENT_URL || '*';
if (clientUrl !== '*' && clientUrl.endsWith('/')) {
  clientUrl = clientUrl.slice(0, -1);
}

app.use(cors({
  origin: clientUrl,
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mounting API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consultations', consultationRoutes);

// Base route test
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Telemedicine API is up and running' });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Error Stack:', err.stack);

  let statusCode = err.statusCode || res.statusCode;
  if (statusCode === 200) statusCode = 500;

  let message = err.message || 'An unexpected server error occurred';

  // Handle Mongoose DB Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    statusCode = 400;
    message = 'An account with this information already exists';
  }

  // Handle cast errors (e.g. invalid MongoDB ObjectIDs)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with id of ${err.value}`;
  }

  res.status(statusCode).json({
    success: false,
    message: message
  });
});

module.exports = app;
