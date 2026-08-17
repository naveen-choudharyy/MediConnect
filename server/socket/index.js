const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

const socketSetup = (io) => {
  // Middleware to authenticate Socket.IO connections via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret_telemedicine_key_123'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket authentication error:', err.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected to socket: ${socket.user.name} (${socket.user.role}) [ID: ${socket.id}]`);

    // Handle joining a specific appointment room
    socket.on('join-room', async ({ appointmentId }) => {
      if (!appointmentId) {
        return socket.emit('error-msg', 'Appointment ID is required');
      }

      try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
          return socket.emit('error-msg', 'Appointment not found');
        }

        // Verify that the connected user is either the doctor or patient for this appointment
        const isPatient = appointment.patient.toString() === socket.user._id.toString();
        const isDoctor = appointment.doctor.toString() === socket.user._id.toString();

        if (!isPatient && !isDoctor) {
          console.warn(`Unauthorized room join attempt: User ${socket.user._id} tried to join appointment ${appointmentId}`);
          return socket.emit('error-msg', 'Unauthorized: You are not a participant in this appointment');
        }

        const roomName = `appointment_${appointmentId}`;
        socket.join(roomName);
        console.log(`User ${socket.user.name} successfully joined room: ${roomName}`);

        // Notify other participants in the room
        socket.to(roomName).emit('user-joined', {
          userId: socket.user._id,
          name: socket.user.name,
          role: socket.user.role
        });
      } catch (err) {
        console.error('Error joining room:', err.message);
        socket.emit('error-msg', 'Internal server error while joining consultation room');
      }
    });

    // Handle WebRTC Offer
    socket.on('offer', ({ offer, appointmentId }) => {
      const roomName = `appointment_${appointmentId}`;
      socket.to(roomName).emit('offer', {
        offer,
        senderId: socket.user._id
      });
    });

    // Handle WebRTC Answer
    socket.on('answer', ({ answer, appointmentId }) => {
      const roomName = `appointment_${appointmentId}`;
      socket.to(roomName).emit('answer', {
        answer,
        senderId: socket.user._id
      });
    });

    // Handle WebRTC ICE Candidates
    socket.on('ice-candidate', ({ candidate, appointmentId }) => {
      const roomName = `appointment_${appointmentId}`;
      socket.to(roomName).emit('ice-candidate', {
        candidate,
        senderId: socket.user._id
      });
    });

    // Handle leaving the room explicitly
    socket.on('leave-room', ({ appointmentId }) => {
      const roomName = `appointment_${appointmentId}`;
      socket.leave(roomName);
      console.log(`User ${socket.user.name} left room: ${roomName}`);
      socket.to(roomName).emit('user-left', {
        userId: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      });
    });

    // Handle Ending the Call (doctor completes consultation)
    socket.on('end-call', ({ appointmentId }) => {
      const roomName = `appointment_${appointmentId}`;
      console.log(`Call ended by ${socket.user.name} in room: ${roomName}`);
      socket.to(roomName).emit('call-ended', {
        endedBy: socket.user._id,
        name: socket.user.name
      });
    });

    // Clean up on disconnect
    socket.on('disconnecting', () => {
      // Find all rooms this socket belongs to (excluding its own socket.id room)
      const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
      rooms.forEach((roomName) => {
        socket.to(roomName).emit('user-left', {
          userId: socket.user._id,
          name: socket.user.name,
          role: socket.user.role
        });
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} [ID: ${socket.id}]`);
    });
  });
};

module.exports = socketSetup;
