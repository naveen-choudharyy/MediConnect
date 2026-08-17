require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const socketSetup = require('./socket');

// PORT Configuration
const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database
connectDB();

// Create HTTP Server
const server = http.createServer(app);

let clientUrl = process.env.CLIENT_URL || '*';
if (clientUrl !== '*' && clientUrl.endsWith('/')) {
  clientUrl = clientUrl.slice(0, -1);
}

// Initialize Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST']
  }
});

// Configure signaling and permissions handlers
socketSetup(io);

// Start server
server.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
