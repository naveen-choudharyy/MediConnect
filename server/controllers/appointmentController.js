const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Helper to normalize Date to YYYY-MM-DD at midnight UTC
const normalizeDate = (dateString) => {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  const normalized = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  return normalized;
};

// @desc    Book an appointment
// @route   POST /api/appointments
// @access  Private (Patient only)
exports.bookAppointment = async (req, res) => {
  const { doctor, appointmentDate, startTime, endTime } = req.body;

  if (!doctor || !appointmentDate || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: 'Please provide doctor, appointmentDate, startTime, and endTime'
    });
  }

  try {
    // 1. Verify Doctor exists
    const doctorUser = await User.findOne({ _id: doctor, role: 'doctor' });
    if (!doctorUser) {
      return res.status(404).json({ success: false, message: 'Selected doctor not found' });
    }

    const doctorProfile = await DoctorProfile.findOne({ user: doctor });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile configuration not found' });
    }

    // 2. Validate & normalize date
    const dateObj = normalizeDate(appointmentDate);
    if (!dateObj) {
      return res.status(400).json({ success: false, message: 'Invalid appointment date format' });
    }

    // Make sure booking is not in the past
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (dateObj < today) {
      return res.status(400).json({ success: false, message: 'Cannot book appointments in the past' });
    }

    // 3. Verify slot belongs to doctor's availability
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[dateObj.getUTCDay()]; // UTC Day

    const dayAvailability = doctorProfile.availability.find(
      (avail) => avail.day === dayOfWeek
    );

    if (!dayAvailability) {
      return res.status(400).json({
        success: false,
        message: `Doctor is not available on ${dayOfWeek}s`
      });
    }

    const validSlot = dayAvailability.slots.find(
      (slot) => slot.startTime === startTime && slot.endTime === endTime
    );

    if (!validSlot) {
      return res.status(400).json({
        success: false,
        message: `Requested slot ${startTime}-${endTime} is not in doctor's availability for ${dayOfWeek}`
      });
    }

    // 4. Prevent double booking
    // Look for confirmed/pending/completed bookings at the same time for this doctor
    const conflictingAppointment = await Appointment.findOne({
      doctor,
      appointmentDate: dateObj,
      startTime,
      status: { $in: ['pending', 'confirmed', 'completed'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This appointment slot is already booked'
      });
    }

    // 5. Create Appointment
    const appointmentData = {
      patient: req.user._id,
      doctor,
      appointmentDate: dateObj,
      startTime,
      endTime,
      status: 'pending' // default status
    };

    let razorpayOrder = null;
    const isRazorpayConfigured = process.env.RAZORPAY_KEY_ID && 
                                process.env.RAZORPAY_KEY_SECRET && 
                                process.env.RAZORPAY_KEY_ID !== 'rzp_test_placeholder';

    if (isRazorpayConfigured && doctorProfile.consultationFee > 0) {
      try {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const options = {
          amount: doctorProfile.consultationFee * 100, // amount in paise
          currency: 'INR',
          receipt: `receipt_apt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        razorpayOrder = {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          key: process.env.RAZORPAY_KEY_ID
        };

        appointmentData.paymentStatus = 'pending';
        appointmentData.razorpayOrderId = order.id;
      } catch (error) {
        console.error('Razorpay Order Creation Failed:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to initiate payment gateway order: ' + error.message
        });
      }
    } else {
      // Mock payment or mark paid/free directly
      appointmentData.paymentStatus = doctorProfile.consultationFee > 0 ? 'pending' : 'paid';
    }

    const appointment = await Appointment.create(appointmentData);

    return res.status(201).json({
      success: true,
      message: razorpayOrder ? 'Booking initiated. Please complete payment.' : 'Appointment booked successfully',
      appointment,
      razorpayOrder
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's appointments
// @route   GET /api/appointments
// @access  Private (Patient or Doctor)
exports.getAppointments = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }

    // Sort by date and starting time
    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone')
      .sort({ appointmentDate: 1, startTime: 1 })
      .exec();

    // Attach doctor specializations if the user is a patient
    const populated = await Promise.all(
      appointments.map(async (app) => {
        const appObj = app.toObject();
        if (req.user.role === 'patient') {
          const docProfile = await DoctorProfile.findOne({ user: app.doctor._id });
          if (docProfile) {
            appObj.doctor.specialization = docProfile.specialization;
            appObj.doctor.consultationFee = docProfile.consultationFee;
          }
        }
        return appObj;
      })
    );

    return res.json({
      success: true,
      count: populated.length,
      appointments: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed appointment by ID
// @route   GET /api/appointments/:id
// @access  Private (Patient or Doctor associated with the appointment)
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone')
      .exec();

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Verify ownership
    const isPatient = appointment.patient._id.toString() === req.user._id.toString();
    const isDoctor = appointment.doctor._id.toString() === req.user._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: you are not associated with this appointment'
      });
    }

    const appObj = appointment.toObject();
    // Add additional info
    const docProfile = await DoctorProfile.findOne({ user: appointment.doctor._id });
    if (docProfile) {
      appObj.doctor.specialization = docProfile.specialization;
      appObj.doctor.consultationFee = docProfile.consultationFee;
    }

    return res.json({
      success: true,
      appointment: appObj
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel an appointment
// @route   PATCH /api/appointments/:id/cancel
// @access  Private (Patient or Doctor associated with the appointment)
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check ownership
    const isPatient = appointment.patient.toString() === req.user._id.toString();
    const isDoctor = appointment.doctor.toString() === req.user._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: you cannot cancel this appointment'
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    return res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept or reject an appointment (Doctor only)
// @route   PATCH /api/appointments/:id/status
// @access  Private (Doctor only)
exports.updateAppointmentStatus = async (req, res) => {
  const { status } = req.body; // 'confirmed', 'rejected', 'completed'

  if (!['confirmed', 'rejected', 'completed'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Choose confirmed, rejected, or completed'
    });
  }

  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Verify that the logged-in doctor is the one assigned to this appointment
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: this appointment is assigned to a different doctor'
      });
    }

    appointment.status = status;
    await appointment.save();

    return res.json({
      success: true,
      message: `Appointment status updated to ${status}`,
      appointment
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/appointments/:id/verify-payment
// @access  Private (Patient only)
exports.verifyPayment = async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
  const { id } = req.params;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: 'Payment verification details missing'
    });
  }

  try {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret');
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
      appointment.paymentStatus = 'paid';
      appointment.razorpayPaymentId = razorpay_payment_id;
      appointment.razorpaySignature = razorpay_signature;
      await appointment.save();

      return res.json({
        success: true,
        message: 'Payment verified and appointment booking completed successfully',
        appointment
      });
    } else {
      appointment.paymentStatus = 'failed';
      await appointment.save();
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Signature mismatch'
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Razorpay payment configuration
// @route   GET /api/appointments/payment-config
// @access  Private
exports.getPaymentConfig = (req, res) => {
  res.json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
  });
};

// @desc    Get/Create Razorpay order details for an existing pending appointment
// @route   GET /api/appointments/:id/payment-payload
// @access  Private (Patient only)
exports.getPaymentPayload = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'name')
      .exec();

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (appointment.paymentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Appointment is already paid or not eligible for payment' });
    }

    const doctorProfile = await DoctorProfile.findOne({ user: appointment.doctor._id });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    const isRazorpayConfigured = process.env.RAZORPAY_KEY_ID && 
                                process.env.RAZORPAY_KEY_SECRET && 
                                process.env.RAZORPAY_KEY_ID !== 'rzp_test_placeholder';

    if (!isRazorpayConfigured) {
      return res.status(400).json({
        success: false,
        message: 'Payment gateway is not configured on the server. Cannot proceed with real payment.'
      });
    }

    let razorpayOrder = null;
    if (appointment.razorpayOrderId) {
      razorpayOrder = {
        id: appointment.razorpayOrderId,
        amount: doctorProfile.consultationFee * 100,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID
      };
    } else {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });

      const options = {
        amount: doctorProfile.consultationFee * 100, // paise
        currency: 'INR',
        receipt: `receipt_apt_${appointment._id}`
      };

      const order = await razorpay.orders.create(options);
      appointment.razorpayOrderId = order.id;
      await appointment.save();

      razorpayOrder = {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
      };
    }

    return res.json({
      success: true,
      razorpayOrder,
      doctorName: appointment.doctor.name
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
