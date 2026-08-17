const mongoose = require('mongoose');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const { registerPatient, registerDoctor, login } = require('../controllers/authController');
const { bookAppointment } = require('../controllers/appointmentController');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/telemedicine_test';

const runTests = async () => {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected to test DB.');

  // Clean DB
  console.log('Cleaning test database collections...');
  await User.deleteMany({});
  await PatientProfile.deleteMany({});
  await DoctorProfile.deleteMany({});
  await Appointment.deleteMany({});
  await Consultation.deleteMany({});
  console.log('Collections cleared.');

  // Helper response builders
  const mockRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.body = data;
      return res;
    };
    return res;
  };

  try {
    // Test 1: Register Patient
    console.log('\n--- Running Test 1: Patient Registration ---');
    const patientReq = {
      body: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890',
        dateOfBirth: '1990-05-15',
        gender: 'Male',
        address: '123 Main St'
      }
    };
    const patientRes = mockRes();
    await registerPatient(patientReq, patientRes);

    if (patientRes.statusCode === 201 && patientRes.body.success) {
      console.log('✅ Patient registered successfully.');
    } else {
      throw new Error(`Failed to register patient: ${JSON.stringify(patientRes.body)}`);
    }

    // Test 2: Double Registration Prevention
    console.log('\n--- Running Test 2: Duplicate Email Registration Prevention ---');
    const duplicateRes = mockRes();
    await registerPatient(patientReq, duplicateRes);

    if (duplicateRes.statusCode === 400 && !duplicateRes.body.success) {
      console.log('✅ Duplicate registration blocked correctly.');
    } else {
      throw new Error(`Duplicate registration succeeded incorrectly: ${duplicateRes.statusCode}`);
    }

    // Test 3: Register Doctor
    console.log('\n--- Running Test 3: Doctor Registration ---');
    const doctorReq = {
      body: {
        name: 'Dr. Smith',
        email: 'smith@example.com',
        password: 'password123',
        phone: '0987654321',
        specialization: 'Cardiology',
        qualification: 'M.D. Cardiology',
        experience: 10,
        consultationFee: 150,
        bio: 'Experienced cardiologist'
      }
    };
    const doctorRes = mockRes();
    await registerDoctor(doctorReq, doctorRes);

    if (doctorRes.statusCode === 201 && doctorRes.body.success) {
      console.log('Dr. Smith registered successfully.');
    } else {
      throw new Error(`Failed to register doctor: ${JSON.stringify(doctorRes.body)}`);
    }

    // Setup doctor availability programmatically for scheduling tests
    console.log('Setting availability for Dr. Smith on Mondays...');
    const doctorUser = await User.findOne({ email: 'smith@example.com' });
    const doctorProfile = await DoctorProfile.findOne({ user: doctorUser._id });
    doctorProfile.availability = [
      {
        day: 'Monday',
        slots: [
          { startTime: '09:00', endTime: '09:30' },
          { startTime: '10:00', endTime: '10:30' }
        ]
      }
    ];
    await doctorProfile.save();
    console.log('✅ Doctor availability saved.');

    // Test 4: Doctor Login
    console.log('\n--- Running Test 4: Doctor Login Verification ---');
    const loginReq = {
      body: {
        email: 'smith@example.com',
        password: 'password123',
        expectedRole: 'doctor'
      }
    };
    const loginRes = mockRes();
    await login(loginReq, loginRes);

    if (loginRes.body.success && loginRes.body.user.role === 'doctor') {
      console.log('✅ Doctor login verified with correct role JWT payload.');
    } else {
      throw new Error(`Doctor login failed: ${JSON.stringify(loginRes.body)}`);
    }

    // Test 5: Booking Appointment
    console.log('\n--- Running Test 5: Booking Available Slot ---');
    // Fetch patient
    const patientUser = await User.findOne({ email: 'john@example.com' });
    
    // Choose a Monday: August 17th, 2026 is a Monday (our local time says August 17th, 2026 is current time)
    const bookingReq = {
      user: patientUser,
      body: {
        doctor: doctorUser._id.toString(),
        appointmentDate: '2026-08-17',
        startTime: '09:00',
        endTime: '09:30'
      }
    };
    const bookingRes = mockRes();
    await bookAppointment(bookingReq, bookingRes);

    if (bookingRes.statusCode === 201 && bookingRes.body.success) {
      console.log('✅ Appointment booked successfully on August 17th (Monday).');
    } else {
      throw new Error(`Failed to book appointment: ${JSON.stringify(bookingRes.body)}`);
    }

    // Test 6: Double Booking Conflict Prevention
    console.log('\n--- Running Test 6: Double Booking Prevention ---');
    const doubleBookingRes = mockRes();
    // Attempting same slot
    await bookAppointment(bookingReq, doubleBookingRes);

    if (doubleBookingRes.statusCode === 400 && !doubleBookingRes.body.success) {
      console.log('✅ Double booking blocked correctly.');
    } else {
      throw new Error(`Double booking was allowed: ${JSON.stringify(doubleBookingRes.body)}`);
    }

    // Test 7: Non-existent Slot Booking Prevention
    console.log('\n--- Running Test 7: Booking Undefined Slot Prevention ---');
    const invalidSlotReq = {
      user: patientUser,
      body: {
        doctor: doctorUser._id.toString(),
        appointmentDate: '2026-08-17',
        startTime: '11:00', // Doctor doesn't have 11:00 slot
        endTime: '11:30'
      }
    };
    const invalidSlotRes = mockRes();
    await bookAppointment(invalidSlotReq, invalidSlotRes);

    if (invalidSlotRes.statusCode === 400 && !invalidSlotRes.body.success) {
      console.log('✅ Undefined slot booking blocked correctly.');
    } else {
      throw new Error(`Booking undefined slot succeeded incorrectly: ${JSON.stringify(invalidSlotRes.body)}`);
    }

    console.log('\n⭐⭐ ALL CORE BACKEND LOGIC VERIFICATION TESTS PASSED ⭐⭐');

  } catch (err) {
    console.error('\n❌ Verification test suite failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

runTests();
