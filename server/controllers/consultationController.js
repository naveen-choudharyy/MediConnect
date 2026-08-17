const Consultation = require('../models/Consultation');
const Appointment = require('../models/Appointment');

// @desc    Start/join a consultation session
// @route   POST /api/consultations/:appointmentId/start
// @access  Private (Patient or Doctor associated with the appointment)
exports.startConsultation = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Verify ownership
    const isPatient = appointment.patient.toString() === req.user._id.toString();
    const isDoctor = appointment.doctor.toString() === req.user._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: you are not authorized to start this consultation'
      });
    }

    // Check if consultation record already exists
    let consultation = await Consultation.findOne({ appointment: appointmentId });

    if (!consultation) {
      consultation = await Consultation.create({
        appointment: appointmentId,
        doctor: appointment.doctor,
        patient: appointment.patient,
        startedAt: new Date()
      });
    }

    return res.json({
      success: true,
      message: 'Consultation session active',
      consultation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    End consultation session and record doctor notes
// @route   POST /api/consultations/:appointmentId/end
// @access  Private (Doctor only)
exports.endConsultation = async (req, res) => {
  const { appointmentId } = req.params;
  const { notes } = req.body;

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Only the doctor assigned to the appointment can submit notes and end it
    if (appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: only the assigned doctor can end this consultation'
      });
    }

    let consultation = await Consultation.findOne({ appointment: appointmentId });

    if (!consultation) {
      consultation = new Consultation({
        appointment: appointmentId,
        doctor: appointment.doctor,
        patient: appointment.patient,
        startedAt: new Date()
      });
    }

    consultation.notes = notes || '';
    consultation.endedAt = new Date();
    await consultation.save();

    // Mark appointment as completed
    appointment.status = 'completed';
    await appointment.save();

    return res.json({
      success: true,
      message: 'Consultation completed and notes saved successfully',
      consultation,
      appointment
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get consultation records for an appointment
// @route   GET /api/consultations/:appointmentId
// @access  Private (Patient or Doctor associated with the appointment)
exports.getConsultation = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const consultation = await Consultation.findOne({ appointment: appointmentId });
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'No consultation records found for this appointment'
      });
    }

    // Verify ownership
    const isPatient = consultation.patient.toString() === req.user._id.toString();
    const isDoctor = consultation.doctor.toString() === req.user._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: you are not authorized to view this consultation record'
      });
    }

    return res.json({
      success: true,
      consultation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
