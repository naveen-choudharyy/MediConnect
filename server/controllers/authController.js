const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');

// Generate JWT Helper
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'secret_telemedicine_key_123',
    { expiresIn: '30d' }
  );
};

// @desc    Register a new Patient
// @route   POST /api/auth/patient/register
// @access  Public
exports.registerPatient = async (req, res) => {
  const { name, email, password, phone, dateOfBirth, gender, address } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: 'patient',
      phone
    });

    // Create patient profile
    const profile = await PatientProfile.create({
      user: user._id,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      address,
      medicalHistory: []
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      profile
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new Doctor
// @route   POST /api/auth/doctor/register
// @access  Public
exports.registerDoctor = async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    specialization,
    qualification,
    experience,
    consultationFee,
    bio
  } = req.body;

  // Validate doctor fields
  if (!specialization || !qualification || experience === undefined || consultationFee === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Doctors must provide specialization, qualification, experience, and consultation fee'
    });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: 'doctor',
      phone
    });

    // Create doctor profile
    const profile = await DoctorProfile.create({
      user: user._id,
      specialization,
      qualification,
      experience,
      consultationFee,
      bio,
      availability: [] // Empty by default, configured via dashboard
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      profile
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user (Doctor or Patient)
// @route   POST /api/auth/patient/login or /api/auth/doctor/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password, expectedRole } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if passwords match
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify role matches expectations if specified
    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({
        success: false,
        message: `Account is registered as ${user.role}, not ${expectedRole}`
      });
    }

    const token = generateToken(user._id);

    // Fetch corresponding profile
    let profile = null;
    if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ user: user._id });
    } else if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ user: user._id });
    }

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      profile
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get currently logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    let profile = null;

    if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ user: user._id });
    } else if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ user: user._id });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      profile
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Update Patient Profile
// @route   PUT /api/auth/patient/profile
// @access  Private (Patient only)
exports.updatePatientProfile = async (req, res) => {
  const { dateOfBirth, gender, address, medicalHistory } = req.body;

  try {
    let profile = await PatientProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    if (dateOfBirth) profile.dateOfBirth = new Date(dateOfBirth);
    if (gender) profile.gender = gender;
    if (address !== undefined) profile.address = address;
    if (medicalHistory !== undefined) profile.medicalHistory = medicalHistory;

    await profile.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

