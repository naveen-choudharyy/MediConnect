import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { apiRequest, getAuthToken } from '../utils/api';

const pcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const VideoCall = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Initializing media...');
  const [peerConnected, setPeerConnected] = useState(false);
  const [userRole, setUserRole] = useState(''); // 'patient' or 'doctor'
  
  // Media states
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  
  // Clinical Notes (Doctor only)
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  // Refs for WebRTC & Socket
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  
  // HTML Video Elements refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // 1. Fetch Appointment Details & Verify Auth
  useEffect(() => {
    const initCallData = async () => {
      try {
        const data = await apiRequest(`/appointments/${appointmentId}`);
        if (data.success) {
          setAppointment(data.appointment);
          // Set role based on matching patient/doctor ID
          const meData = await apiRequest('/auth/me');
          if (meData.success) {
            setUserRole(meData.user.role);
          }
        }
      } catch (err) {
        setError(err.message || 'Access denied: unable to join this room');
      } finally {
        setLoading(false);
      }
    };
    initCallData();
  }, [appointmentId]);

  // 2. Setup WebRTC Media, PeerConnection, and WebSockets Signaling
  useEffect(() => {
    if (!appointment || !userRole) return;

    const startMediaAndConnect = async () => {
      try {
        setConnectionStatus('Requesting camera/microphone permissions...');
        // Capture camera & microphone
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize Socket.IO connection
        setConnectionStatus('Connecting to signaling server...');
        const token = getAuthToken();
        const socketUrl = import.meta.env.VITE_SOCKET_URL || `${window.location.protocol}//${window.location.hostname}:5000`;
        
        socketRef.current = io(socketUrl, {
          auth: { token }
        });

        // Initialize RTCPeerConnection
        pcRef.current = new RTCPeerConnection(pcConfig);

        // Add local tracks to PeerConnection
        stream.getTracks().forEach((track) => {
          pcRef.current.addTrack(track, stream);
        });

        // ICE Candidate handling
        pcRef.current.onicecandidate = (event) => {
          if (event.candidate && socketRef.current) {
            socketRef.current.emit('ice-candidate', {
              candidate: event.candidate,
              appointmentId
            });
          }
        };

        // Remote track arrival
        pcRef.current.ontrack = (event) => {
          console.log('Received remote media stream track');
          if (event.streams && event.streams[0] && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setPeerConnected(true);
            setConnectionStatus('Connected');
          }
        };

        // Notify backend that consultation has started
        await apiRequest(`/consultations/${appointmentId}/start`, { method: 'POST' });

        // Join the WebSocket signaling room
        socketRef.current.emit('join-room', { appointmentId });
        setConnectionStatus('Waiting for other participant to join...');

        // SOCKET EVENT LISTENERS
        
        // Another user joins the room -> we initiate the offer
        socketRef.current.on('user-joined', async (peerInfo) => {
          console.log(`Peer joined: ${peerInfo.name} (${peerInfo.role})`);
          setConnectionStatus(`Connecting with ${peerInfo.role}...`);
          
          try {
            const offer = await pcRef.current.createOffer();
            await pcRef.current.setLocalDescription(offer);
            
            socketRef.current.emit('offer', {
              offer,
              appointmentId
            });
          } catch (err) {
            console.error('Error creating SDP Offer:', err.message);
          }
        });

        // Receive offer from the caller -> answer it
        socketRef.current.on('offer', async ({ offer, senderId }) => {
          console.log('Received SDP Offer');
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            
            socketRef.current.emit('answer', {
              answer,
              appointmentId
            });
          } catch (err) {
            console.error('Error answering SDP Offer:', err.message);
          }
        });

        // Receive answer from receiver -> complete handshake
        socketRef.current.on('answer', async ({ answer, senderId }) => {
          console.log('Received SDP Answer');
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          } catch (err) {
            console.error('Error completing SDP connection:', err.message);
          }
        });

        // Receive ICE candidate from peer
        socketRef.current.on('ice-candidate', async ({ candidate, senderId }) => {
          try {
            if (pcRef.current) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
          } catch (err) {
            console.error('Error adding ICE candidate:', err.message);
          }
        });

        // Peer leaves room
        socketRef.current.on('user-left', () => {
          console.log('Other participant disconnected from room');
          setPeerConnected(false);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          setConnectionStatus('Participant has left the consultation');
        });

        // Call ended (doctor ends consultation)
        socketRef.current.on('call-ended', () => {
          alert('This consultation has been closed by the doctor.');
          cleanUpSession();
          navigate(userRole === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
        });

        // Socket error messages
        socketRef.current.on('error-msg', (msg) => {
          setError(msg);
        });

      } catch (err) {
        console.error('Media or signaling setup error:', err);
        setError('Could not access camera or microphone. Please enable permissions.');
      }
    };

    startMediaAndConnect();

    // Clean up connections on unmount
    return () => {
      cleanUpSession();
    };
  }, [appointment, userRole, appointmentId]);

  // Session Disconnection & Clean up Helper
  const cleanUpSession = () => {
    // Stop local camera/mic tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Close PeerConnection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // Leave socket room and disconnect
    if (socketRef.current) {
      socketRef.current.emit('leave-room', { appointmentId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setPeerConnected(false);
  };

  // Toggle Microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
      }
    }
  };

  // Toggle Video Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
      }
    }
  };

  // End call handlers
  const handleEndCall = async () => {
    // If patient, they just leave the room
    if (userRole === 'patient') {
      if (window.confirm('Leave this consultation room?')) {
        cleanUpSession();
        navigate('/patient/dashboard');
      }
    }
    // If doctor, they must complete notes and end call
    if (userRole === 'doctor') {
      if (window.confirm('End this consultation and save diagnostic notes?')) {
        setNotesSaving(true);
        try {
          // Submit notes and end call backend status
          await apiRequest(`/consultations/${appointmentId}/end`, {
            method: 'POST',
            body: { notes: clinicalNotes }
          });

          // Notify socket peer that call is ended
          if (socketRef.current) {
            socketRef.current.emit('end-call', { appointmentId });
          }

          cleanUpSession();
          navigate('/doctor/dashboard');
        } catch (err) {
          alert('Failed to complete consultation: ' + err.message);
        } finally {
          setNotesSaving(false);
        }
      }
    }
  };

  if (loading) return <p>Loading consultation details...</p>;
  if (error) return <div className="alert-banner alert-banner-error">{error}</div>;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>
        Consultation Room: Appointment #{appointmentId.substring(appointmentId.length - 6)}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Participant Profile: <strong>{userRole === 'doctor' ? `Patient: ${appointment?.patient.name}` : `Doctor: Dr. ${appointment?.doctor.name}`}</strong>
      </p>

      <div className="video-consultation-layout">
        {/* Main Video Box */}
        <div className="video-call-area">
          <div className="connection-status-overlay">
            {connectionStatus}
          </div>

          <div className={`video-grid ${peerConnected ? 'peer-connected' : ''}`}>
            {/* Local Feed */}
            <div className="video-container">
              <video ref={localVideoRef} autoPlay playsInline muted />
              <div className="video-label">Local stream (You)</div>
            </div>

            {/* Remote Feed */}
            {peerConnected && (
              <div className="video-container">
                <video ref={remoteVideoRef} autoPlay playsInline />
                <div className="video-label">
                  {userRole === 'doctor' ? appointment?.patient.name : `Dr. ${appointment?.doctor.name}`}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="call-controls-bar">
            <button
              onClick={toggleMute}
              className={`control-btn ${!micEnabled ? 'active' : ''}`}
              title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
            >
              {micEnabled ? '🎙️' : '🔇'}
            </button>
            <button
              onClick={toggleVideo}
              className={`control-btn ${!cameraEnabled ? 'active' : ''}`}
              title={cameraEnabled ? 'Stop Video' : 'Start Video'}
            >
              {cameraEnabled ? '📹' : '❌'}
            </button>
            <button
              onClick={handleEndCall}
              className="control-btn active"
              style={{ padding: '0', borderRadius: '50%', fontSize: '1.4rem' }}
              title="End Call"
            >
              📞
            </button>
          </div>
        </div>

        {/* Sidebar Information / Note taking */}
        <div className="call-sidebar">
          <div className="card" style={{ margin: 0 }}>
            <h3>Consultation Details</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <strong>Date:</strong> {new Date(appointment?.appointmentDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}
              <br />
              <strong>Time Slot:</strong> {appointment?.startTime} - {appointment?.endTime}
            </p>
          </div>

          {userRole === 'doctor' ? (
            <div className="card" style={{ margin: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3>Clinical Notes</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Write clinical diagnoses, advice, or prescription notes here. They will be saved in the patient's record after you end the call.
              </p>
              <textarea
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Enter consultation notes, medical advice, and treatments..."
                style={{ flex: 1, marginTop: '0.75rem', minHeight: '200px' }}
              />
              <button
                onClick={handleEndCall}
                className="btn btn-danger"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={notesSaving}
              >
                {notesSaving ? 'Ending Call...' : 'Complete & Save Notes'}
              </button>
            </div>
          ) : (
            <div className="card" style={{ margin: 0, flex: 1, backgroundColor: 'var(--bg-muted)', border: 'none' }}>
              <h3>Patient Guidelines</h3>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>Ensure you have a stable internet connection.</li>
                <li>Stay in a quiet, well-lit room for correct evaluation.</li>
                <li>Your camera and microphone feeds are encrypted directly peer-to-peer using WebRTC.</li>
                <li>The doctor will conclude the session when finished and post diagnostic notes.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
