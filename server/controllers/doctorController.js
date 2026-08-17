const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');

// @desc    Update Doctor Profile (details)
// @route   PUT /api/doctors/profile
// @access  Private (Doctor only)
exports.updateProfile = async (req, res) => {
  const { specialization, qualification, experience, consultationFee, bio } = req.body;

  try {
    let profile = await DoctorProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    // Update fields
    if (specialization) profile.specialization = specialization;
    if (qualification) profile.qualification = qualification;
    if (experience !== undefined) profile.experience = experience;
    if (consultationFee !== undefined) profile.consultationFee = consultationFee;
    if (bio !== undefined) profile.bio = bio;

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

// @desc    Update Doctor Availability
// @route   PUT /api/doctors/availability
// @access  Private (Doctor only)
exports.updateAvailability = async (req, res) => {
  const { availability } = req.body; // Array of { day: String, slots: [{ startTime: String, endTime: String }] }

  if (!Array.isArray(availability)) {
    return res.status(400).json({ success: false, message: 'Availability must be an array' });
  }

  // Basic validation of slot formats
  for (const dayAvail of availability) {
    if (!dayAvail.day || !Array.isArray(dayAvail.slots)) {
      return res.status(400).json({
        success: false,
        message: 'Each availability day must contain a day string and a slots array'
      });
    }
    for (const slot of dayAvail.slots) {
      if (!slot.startTime || !slot.endTime) {
        return res.status(400).json({
          success: false,
          message: 'Each slot must contain a startTime and endTime'
        });
      }
    }
  }

  try {
    let profile = await DoctorProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    profile.availability = availability;
    await profile.save();

    return res.json({
      success: true,
      message: 'Availability updated successfully',
      availability: profile.availability
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get/Search all Doctor Profiles
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = async (req, res) => {
  const { search, specialization, minExperience, maxFee, day } = req.query;

  try {
    let userIds = [];
    let isSearchByNameEnabled = false;

    // If search text is provided, find matching users by name
    if (search) {
      const matchingUsers = await User.find({
        role: 'doctor',
        name: { $regex: search, $options: 'i' }
      });
      userIds = matchingUsers.map(u => u._id);
      isSearchByNameEnabled = true;
    }

    // Build the query criteria for DoctorProfile
    let query = {};

    if (search) {
      if (isSearchByNameEnabled) {
        // Match either user names OR specialization
        query.$or = [
          { user: { $in: userIds } },
          { specialization: { $regex: search, $options: 'i' } }
        ];
      } else {
        query.specialization = { $regex: search, $options: 'i' };
      }
    }

    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    if (minExperience) {
      query.experience = { $gte: Number(minExperience) };
    }

    if (maxFee) {
      query.consultationFee = { $lte: Number(maxFee) };
    }

    if (day) {
      query['availability.day'] = day;
    }

    // Fetch and populate doctor details
    const doctors = await DoctorProfile.find(query)
      .populate('user', 'name email phone')
      .exec();

    return res.json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Doctor Profile by User/Profile ID
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctorById = async (req, res) => {
  try {
    // Check if ID matches User ID or Profile ID
    let doctor = await DoctorProfile.findOne({
      $or: [
        { _id: req.params.id },
        { user: req.params.id }
      ]
    }).populate('user', 'name email phone');

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    return res.json({
      success: true,
      doctor
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
