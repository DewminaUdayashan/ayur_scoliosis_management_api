# Video Call Feature Documentation

## Overview
The video call feature enables real-time video communication between practitioners and patients during remote appointments using WebRTC technology. The backend acts as a signaling server using Socket.IO for WebSocket communication.

## Architecture

### Components
1. **VideoCallModule** - NestJS module that orchestrates the video call functionality
2. **VideoCallGateway** - WebSocket gateway for real-time signaling
3. **VideoCallService** - Business logic for room management
4. **VideoCallController** - REST API endpoints for room operations
5. **VideoCallRoom** - Database model storing video call session data

### Database Schema

```prisma
model VideoCallRoom {
  id                  String              @id @default(uuid())
  appointment         Appointment         @relation(fields: [appointmentId], references: [id])
  appointmentId       String              @unique
  roomId              String              @unique
  status              VideoCallStatus     @default(Waiting)
  practitionerJoined  Boolean             @default(false)
  patientJoined       Boolean             @default(false)
  startedAt           DateTime?
  endedAt             DateTime?
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
}

enum VideoCallStatus {
  Waiting      // Waiting for participants to join
  InProgress   // Call is active
  Ended        // Call has ended
}
```

## REST API Endpoints

### Get Room Information
**GET** `/video-call/room/appointment/:appointmentId`

Gets the video call room details for a specific appointment.

**Authorization:** JWT Bearer token required

**Response:**
```json
{
  "id": "uuid",
  "roomId": "room_1234567890_xyz",
  "appointmentId": "uuid",
  "status": "Waiting",
  "practitionerJoined": false,
  "patientJoined": false,
  "startedAt": null,
  "endedAt": null,
  "appointment": {
    "id": "uuid",
    "scheduledDate": "2025-10-15T10:00:00Z",
    "patient": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe"
    },
    "practitioner": {
      "id": "uuid",
      "firstName": "Dr. Jane",
      "lastName": "Smith"
    }
  }
}
```

### Create Room for Appointment
**POST** `/video-call/room/appointment/:appointmentId/create`

Manually creates a video call room for an appointment (normally created automatically when scheduling a remote appointment).

**Authorization:** JWT Bearer token required

**Response:**
```json
{
  "roomId": "room_1234567890_xyz"
}
```

## WebSocket Events

### Connection
**Namespace:** `/video-call`

**URL:** `ws://your-server:3000/video-call` or `wss://your-server:3000/video-call`

**Authentication:** Consider implementing Socket.IO authentication middleware in production

### Events

#### 1. Join Room
**Event:** `join-room`

**Payload:**
```json
{
  "roomId": "room_1234567890_xyz",
  "userId": "uuid"
}
```

**Response Events:**
- `joined-room` - Confirmation to the user who joined
- `user-joined` - Broadcast to other users in the room
- `error` - If join fails

#### 2. Leave Room
**Event:** `leave-room`

**Payload:**
```json
{
  "roomId": "room_1234567890_xyz",
  "userId": "uuid"
}
```

**Response Events:**
- `user-left` - Broadcast to other users

#### 3. WebRTC Signaling
**Event:** `webrtc-signal`

Used to exchange WebRTC offer, answer, and ICE candidates between peers.

**Payload:**
```json
{
  "roomId": "room_1234567890_xyz",
  "userId": "uuid",
  "signal": {
    "type": "offer|answer|candidate",
    "sdp": "...",
    "candidate": "..."
  }
}
```

**Response Events:**
- `webrtc-signal` - Forwarded to other users in the room

#### 4. Screen Share Start
**Event:** `screen-share-start`

**Payload:**
```json
{
  "roomId": "room_1234567890_xyz",
  "userId": "uuid"
}
```

**Response Events:**
- `screen-share-started` - Broadcast to other users

#### 5. Screen Share Stop
**Event:** `screen-share-stop`

**Payload:**
```json
{
  "roomId": "room_1234567890_xyz",
  "userId": "uuid"
}
```

**Response Events:**
- `screen-share-stopped` - Broadcast to other users

#### 6. Toggle Video
**Event:** `toggle-video`

Notifies other participants when a user toggles their camera on/off.

**Payload:**
```json
{
  "roomId": "room_1234567890_xyz",
  "userId": "uuid",
  "isEnabled": true
}
```

**Response Events:**
- `video-toggled` - Broadcast to other users

#### 7. Toggle Audio
**Event:** `toggle-audio`

Notifies other participants when a user toggles their microphone on/off.

**Payload:**
```json
{
  "roomId": "room_1234567890_xyz",
  "userId": "uuid",
  "isEnabled": true
}
```

**Response Events:**
- `audio-toggled` - Broadcast to other users

#### 8. End Call
**Event:** `end-call`

**Payload:**
```json
{
  "roomId": "room_1234567890_xyz",
  "userId": "uuid"
}
```

**Response Events:**
- `call-ended` - Broadcast to all users before disconnecting

## Client-Side Integration Guide

### Flutter/Dart Example

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_webrtc/flutter_webrtc.dart';

class VideoCallService {
  IO.Socket? socket;
  RTCPeerConnection? peerConnection;
  
  void connect(String serverUrl, String token) {
    socket = IO.io(serverUrl + '/video-call', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      // Add authentication if implemented
    });
    
    socket?.on('connect', (_) {
      print('Connected to signaling server');
    });
    
    socket?.on('user-joined', (data) {
      handleUserJoined(data);
    });
    
    socket?.on('webrtc-signal', (data) {
      handleSignal(data);
    });
    
    socket?.on('screen-share-started', (data) {
      handleScreenShareStarted(data);
    });
    
    socket?.on('video-toggled', (data) {
      handleVideoToggled(data);
    });
    
    socket?.on('audio-toggled', (data) {
      handleAudioToggled(data);
    });
    
    socket?.on('call-ended', (data) {
      handleCallEnded(data);
    });
    
    socket?.connect();
  }
  
  void joinRoom(String roomId, String userId) {
    socket?.emit('join-room', {
      'roomId': roomId,
      'userId': userId,
    });
  }
  
  void sendSignal(String roomId, String userId, dynamic signal) {
    socket?.emit('webrtc-signal', {
      'roomId': roomId,
      'userId': userId,
      'signal': signal,
    });
  }
  
  void startScreenShare(String roomId, String userId) {
    socket?.emit('screen-share-start', {
      'roomId': roomId,
      'userId': userId,
    });
  }
  
  void toggleVideo(String roomId, String userId, bool isEnabled) {
    socket?.emit('toggle-video', {
      'roomId': roomId,
      'userId': userId,
      'isEnabled': isEnabled,
    });
  }
  
  void toggleAudio(String roomId, String userId, bool isEnabled) {
    socket?.emit('toggle-audio', {
      'roomId': roomId,
      'userId': userId,
      'isEnabled': isEnabled,
    });
  }
  
  void endCall(String roomId, String userId) {
    socket?.emit('end-call', {
      'roomId': roomId,
      'userId': userId,
    });
  }
  
  // Implement WebRTC peer connection logic
  // ...
}
```

### JavaScript Example

```javascript
import io from 'socket.io-client';

const socket = io('http://your-server:3000/video-call', {
  transports: ['websocket']
});

// Join a room
socket.emit('join-room', {
  roomId: 'room_1234567890_xyz',
  userId: 'user-uuid'
});

// Listen for events
socket.on('user-joined', (data) => {
  console.log('User joined:', data.userId);
  // Initiate WebRTC connection
});

socket.on('webrtc-signal', (data) => {
  console.log('Received signal from:', data.userId);
  // Handle WebRTC signaling (offer/answer/candidate)
});

socket.on('video-toggled', (data) => {
  console.log(`User ${data.userId} toggled video: ${data.isEnabled}`);
  // Update UI to show/hide remote video
});

socket.on('audio-toggled', (data) => {
  console.log(`User ${data.userId} toggled audio: ${data.isEnabled}`);
  // Update UI to show mute/unmute indicator
});

// Send WebRTC offer/answer/candidate
socket.emit('webrtc-signal', {
  roomId: 'room_1234567890_xyz',
  userId: 'user-uuid',
  signal: {
    type: 'offer',
    sdp: '...'
  }
});

// Start screen sharing
socket.emit('screen-share-start', {
  roomId: 'room_1234567890_xyz',
  userId: 'user-uuid'
});

// Toggle video (camera on/off)
socket.emit('toggle-video', {
  roomId: 'room_1234567890_xyz',
  userId: 'user-uuid',
  isEnabled: false // false = camera off
});

// Toggle audio (mic on/off)
socket.emit('toggle-audio', {
  roomId: 'room_1234567890_xyz',
  userId: 'user-uuid',
  isEnabled: true // true = mic on
});

// End the call
socket.emit('end-call', {
  roomId: 'room_1234567890_xyz',
  userId: 'user-uuid'
});
```

## WebRTC Setup

The client must implement WebRTC peer connections. Basic flow:

1. **Create RTCPeerConnection** with STUN/TURN servers
```javascript
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // Add TURN servers for production
  ]
};
const pc = new RTCPeerConnection(configuration);
```

2. **Get local media stream**
```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
});
stream.getTracks().forEach(track => pc.addTrack(track, stream));
```

3. **Handle ICE candidates**
```javascript
pc.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('webrtc-signal', {
      roomId: roomId,
      userId: userId,
      signal: event.candidate
    });
  }
};
```

4. **Create and send offer** (caller)
```javascript
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
socket.emit('webrtc-signal', {
  roomId: roomId,
  userId: userId,
  signal: { type: 'offer', sdp: offer.sdp }
});
```

5. **Receive and answer** (receiver)
```javascript
socket.on('webrtc-signal', async (data) => {
  if (data.signal.type === 'offer') {
    await pc.setRemoteDescription(data.signal);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('webrtc-signal', {
      roomId: roomId,
      userId: userId,
      signal: { type: 'answer', sdp: answer.sdp }
    });
  }
});
```

## Screen Sharing (Practitioner Only)

To enable screen sharing:

```javascript
const screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: {
    cursor: 'always'
  },
  audio: false
});

// Replace video track
const videoTrack = screenStream.getVideoTracks()[0];
const sender = pc.getSenders().find(s => s.track.kind === 'video');
sender.replaceTrack(videoTrack);

// Notify other participants
socket.emit('screen-share-start', {
  roomId: roomId,
  userId: userId
});

// Handle screen share stop
videoTrack.onended = () => {
  socket.emit('screen-share-stop', {
    roomId: roomId,
    userId: userId
  });
  // Switch back to camera
};
```

## Automatic Room Creation

When a practitioner creates a remote appointment, a video call room is automatically created:

```typescript
// In appointment.service.ts
const newAppointment = await this.prisma.appointment.create({
  data: {
    // ... appointment data
  },
});

// If appointment is remote, create a video call room
if (type === 'Remote') {
  await this.videoCallService.createRoomForAppointment(newAppointment.id);
}
```

## Security Considerations

### Current Implementation
- JWT authentication required for REST endpoints
- Room access verified by checking appointment participants

### Production Recommendations
1. **Socket.IO Authentication** - Implement middleware to validate JWT tokens on WebSocket connections
2. **TURN Servers** - Deploy TURN servers for NAT traversal in production
3. **SSL/TLS** - Use WSS (secure WebSocket) in production
4. **Rate Limiting** - Implement rate limiting on socket events
5. **Room Cleanup** - Add scheduled jobs to clean up ended rooms
6. **CORS Configuration** - Configure proper CORS origins (currently set to `*`)

## Testing

### Using Postman/HTTP Client

1. Create a remote appointment
2. Get room info: `GET /video-call/room/appointment/{appointmentId}`
3. Note the `roomId` from the response

### Using Socket.IO Client

```bash
npm install -g socket.io-client
```

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:3000/video-call');

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('join-room', {
    roomId: 'your-room-id',
    userId: 'your-user-id'
  });
});

socket.on('joined-room', (data) => {
  console.log('Joined room:', data);
});
```

## Troubleshooting

### Common Issues

1. **Cannot connect to WebSocket**
   - Verify Socket.IO client version compatibility
   - Check CORS settings
   - Ensure using correct namespace `/video-call`

2. **WebRTC connection fails**
   - Check STUN/TURN server configuration
   - Verify firewall settings
   - Test on different networks

3. **Room not found**
   - Verify appointment is type "Remote"
   - Check that room was created (automatically on appointment creation)
   - Use create room endpoint manually if needed

## Future Enhancements

- [ ] Add recording functionality
- [ ] Implement waiting room feature
- [ ] Add chat messaging during calls
- [ ] Support for multiple participants (group calls)
- [ ] Call quality monitoring and analytics
- [ ] Automatic reconnection on network issues
- [ ] Virtual backgrounds
- [ ] Picture-in-picture mode
