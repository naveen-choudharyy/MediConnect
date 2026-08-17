# MediConnect Healthcare Telemedicine Web Application

MediConnect is a full-stack, secure, human-designed telemedicine platform built on the **MERN stack**. It enables patients to search for specialized doctors, schedule appointments, and connect for encrypted, high-quality audio-video consultations directly from their browser using **WebRTC** and **Socket.IO**.

The application has a professional, functional, and manually crafted design avoiding generic AI-generated styles, prioritizing speed, accessibility, and clean aesthetics.

---

## 1. Features

### Patient Portal
* **Registration & Login:** Separate JWT authentication flows with custom inputs (DOB, gender, address).
* **Doctor Search & Filters:** Dynamic directory querying by doctor name, specialization, minimum years of experience, or maximum consultation fees.
* **Appointment Scheduler:** Visual calendar datepicker showing only unreserved, doctor-defined availability slots.
* **Double-Booking Prevention:** Atomic checks on both client and server to prevent duplicate scheduling.
* **Consultation History:** Listing of all upcoming and past consults, including access to clinician notes for completed consultations.
* **WebRTC Video consultation:** Secure peer-to-peer audio-video call room.

### Doctor Portal
* **Registration & Login:** Dedicated credentials flow requiring specialization, qualifications, experience, and fee inputs.
* **Dashboard Overview:** Displays today's schedule, pending booking request queues, and recent logs.
* **Availability Management:** Direct planner UI allowing doctors to configure active daily time slots.
* **Schedule Control:** Actions to Confirm or Reject pending patient requests.
* **Clinical Records:** Rich text area inside the consultation room for taking clinical diagnoses notes during calls.

---

## 2. Technology Stack

* **Frontend:** React, JavaScript (ES6+), Vanilla CSS, React Router DOM, Socket.IO Client.
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB, Mongoose ORM.
* **Signaling & Handshakes:** Socket.IO.
* **Video/Audio Channel:** WebRTC (RTCPeerConnection, STUN Servers).
* **Security:** JWT (JSON Web Tokens), bcryptjs password hashing.

---

## 3. Folder Structure

```
Healthcare Telemedicine Web Application/
├── package.json               # Root monorepo dev orchestrator scripts
├── server/                    # Backend Node/Express Server
│   ├── config/                # Database connection configuration
│   ├── controllers/           # Auth, Doctor, Appointment, Consultation operations
│   ├── middleware/            # JWT authentication and Role checks
│   ├── models/                # MongoDB Mongoose schemas
│   ├── routes/                # REST endpoints routing
│   ├── socket/                # Socket.IO authenticated signaling controllers
│   ├── utils/                 # Test runners and helpers
│   ├── app.js                 # Express server configuration & error handler
│   └── server.js              # Server bootstrapper & socket wrapper
└── client/                    # Frontend React SPA
    ├── index.html             # HTML layout entry
    ├── vite.config.js         # Build settings & API dev proxies
    ├── package.json           # Frontend dependencies
    └── src/
        ├── components/        # Protected routes, nav, badges, controls
        ├── context/           # AuthContext login session synchronization
        ├── pages/             # Home, logins, search, dashboards, calls
        ├── utils/             # Fetch API requester helpers
        ├── index.css          # Central Vanilla CSS design rules
        ├── App.jsx            # React route router mapping
        └── main.jsx           # ReactDOM renderer hook
```

---

## 4. Environment Variables

Create a file named `.env` inside the `server/` directory:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/telemedicine
JWT_SECRET=secret_telemedicine_key_123_456_789
CLIENT_URL=http://localhost:5173
```

---

## 5. Architectural Designs

### Authentication & Authorization Flow
```
Client Request -> Authorization: Bearer <JWT>
                       ↓
            protect (middleware/auth.js)
  Checks token verification -> Decodes user ID
                       ↓
         authorize('doctor'/'patient')
  Checks user role permissions -> Allow endpoint access
```

### Double-Booking Conflict Prevention
1. **Normalization:** The appointment date is normalized on the server to `00:00:00.000 UTC` to eliminate timezone offsets.
2. **Weekly availability check:** The day of the week is evaluated (e.g., "Monday"). The server verifies that the doctor has configured this slot under their availability.
3. **Database unique search:** The server executes a query for active appointments (status is `pending`, `confirmed`, or `completed`) on that date, time, and doctor. If a matching record is found, the transaction is rejected with a `400 Bad Request`.

### Socket.IO Room Authorization
To prevent unauthorized users from joining calls, room security is enforced:
1. When connecting, the Socket.IO client passes the JWT token in `socket.handshake.auth.token`.
2. Socket middleware verifies the token and binds the authenticated user model to `socket.user`.
3. When joining a room `appointment_<appointmentId>`, the socket controller queries the `Appointment` model.
4. It checks that `socket.user.id` is equal to either `appointment.patient` or `appointment.doctor`.
5. If unauthorized, the socket emits an error event and denies entry.

### WebRTC Signaling Connection
```
User A (Patient)                              User B (Doctor)
       │                                             │
       ├────────────── Join Room socket ─────────────┤
       │                                             │
       │  ←─────── "user-joined" broadcast ──────────┤ (A knows B is here)
       │                                             │
       ├───────── SDP Offer (socket relay) ─────────→│ (B answers)
       │                                             │
       │←──────── SDP Answer (socket relay) ─────────┤ (Handshake done)
       │                                             │
       ├───── ICE Candidate (socket relay) ─────────→│
       │←──── ICE Candidate (socket relay) ──────────┤
       │                                             │
       ▼                                             ▼
  [WebRTC encrypted direct Peer-to-Peer media channel established]
```

---

## 6. REST API Documentation

### Authentication
* `POST /api/auth/patient/register` - Registers a patient and initializes a profile.
* `POST /api/auth/doctor/register` - Registers a doctor and profile.
* `POST /api/auth/patient/login` - Authenticates patient, returns JWT.
* `POST /api/auth/doctor/login` - Authenticates doctor, returns JWT.
* `GET /api/auth/me` - Verifies token and returns current user details.
* `POST /api/auth/logout` - Clears authentication session.
* `PUT /api/auth/patient/profile` - Modifies patient's DOB, gender, or address.

### Doctors
* `GET /api/doctors` - Open search and filters list.
* `GET /api/doctors/:id` - Fetch doctor details.
* `PUT /api/doctors/profile` - Doctor modifies professional credentials.
* `PUT /api/doctors/availability` - Doctor configures weekly availability slots.

### Appointments
* `POST /api/appointments` - Book a slot (checked against doctor schedule and double bookings).
* `GET /api/appointments` - Get user-specific appointments list.
* `GET /api/appointments/:id` - Get appointment details (restricted to participants).
* `PATCH /api/appointments/:id/cancel` - Cancel appointment.
* `PATCH /api/appointments/:id/status` - Confirm or reject requests (doctor only).

### Consultations
* `POST /api/consultations/:appointmentId/start` - Initialize session timer log.
* `POST /api/consultations/:appointmentId/end` - Record clinical notes and set appointment status to Completed.
* `GET /api/consultations/:appointmentId` - Retrieve clinical notes.

---

## 7. Extensible AI/ML Integration Architecture

This application is designed to support the integration of future AI and machine learning features (such as symptom checking, risk predictions, or scheduling optimization) without modifying the core MERN architecture:

```
[React Client] ────→ [Express API Gateway] ────→ [MongoDB]
                            │
                            ▼
                    [services/aiService.js] (Modular Wrapper)
                            │
                            ▼
                [External AI Engine / ML API] (e.g. Python microservice)
```

1. **Isolation:** All AI functionality is kept separate from standard CRUD database logic.
2. **Fallbacks:** In `server/services/aiService.js`, methods should gracefully return default responses or fail silently if the ML server is unreachable, ensuring core scheduling and calling features continue to function normally.

---

## 8. Running the Application Locally

### Prerequisites
* **Node.js** (v16+)
* **MongoDB** (Running on `127.0.0.1:27017`)

### Setup and Install
1. Clone the repository and navigate to the project directory:
   ```bash
   cd "Healthcare Telemedicine Web Application"
   ```

2. Run the monorepo installation script:
   ```bash
   npm run install-all
   ```

3. Launch the test suite to verify the database and scheduling calculations:
   ```bash
   npm run test
   ```
   *(Ensure local MongoDB is active before running tests)*

### Launch Development Servers
Run the dev task to launch the backend Express app (port 5000) and the frontend Vite server (port 5173) simultaneously:
```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.
