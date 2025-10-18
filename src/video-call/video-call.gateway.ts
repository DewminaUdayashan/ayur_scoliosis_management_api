import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { VideoCallService } from './video-call.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface JoinRoomDto {
  roomId: string;
  userId: string;
}

interface SignalingData {
  roomId: string;
  signal: any; // WebRTC offer, answer, or ICE candidate
  userId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this properly in production
    credentials: true,
  },
  namespace: '/video-call',
})
export class VideoCallGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly videoCallService: VideoCallService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // Handle user leaving room
    const roomId = Array.from(client.rooms).find((room) => room !== client.id);
    if (roomId) {
      this.handleLeaveRoom(client, { roomId, userId: client.data.userId });
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomDto,
  ) {
    const { roomId, userId } = data;

    try {
      // Verify user can join this room
      const canJoin = await this.videoCallService.canUserJoinRoom(
        roomId,
        userId,
      );

      if (!canJoin) {
        client.emit('error', { message: 'Not authorized to join this room' });
        return;
      }

      // Join the Socket.IO room
      client.join(roomId);
      client.data.userId = userId;

      // Update room status
      await this.videoCallService.userJoinedRoom(roomId, userId);

      // Notify other users in the room
      client.to(roomId).emit('user-joined', { userId });

      // Send confirmation to the user
      client.emit('joined-room', { roomId, userId });

      console.log(`User ${userId} joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomDto,
  ) {
    const { roomId, userId } = data;

    try {
      client.leave(roomId);

      // Update room status
      await this.videoCallService.userLeftRoom(roomId, userId);

      // Notify other users
      client.to(roomId).emit('user-left', { userId });

      console.log(`User ${userId} left room ${roomId}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }

  @SubscribeMessage('webrtc-signal')
  handleWebRTCSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SignalingData,
  ) {
    const { roomId, signal, userId } = data;

    // Forward the signal to all other users in the room
    client.to(roomId).emit('webrtc-signal', {
      signal,
      userId,
    });

    console.log(`WebRTC signal from ${userId} in room ${roomId}`);
  }

  @SubscribeMessage('screen-share-start')
  handleScreenShareStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string },
  ) {
    const { roomId, userId } = data;

    // Notify all users in the room that screen sharing started
    client.to(roomId).emit('screen-share-started', { userId });

    console.log(`Screen sharing started by ${userId} in room ${roomId}`);
  }

  @SubscribeMessage('screen-share-stop')
  handleScreenShareStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string },
  ) {
    const { roomId, userId } = data;

    // Notify all users in the room that screen sharing stopped
    client.to(roomId).emit('screen-share-stopped', { userId });

    console.log(`Screen sharing stopped by ${userId} in room ${roomId}`);
  }

  @SubscribeMessage('end-call')
  async handleEndCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string },
  ) {
    const { roomId, userId } = data;

    try {
      // End the call
      await this.videoCallService.endCall(roomId);

      // Notify all users in the room
      this.server.to(roomId).emit('call-ended', { userId });

      // Disconnect all clients from the room
      const sockets = await this.server.in(roomId).fetchSockets();
      sockets.forEach((socket) => {
        socket.leave(roomId);
      });

      console.log(`Call ended in room ${roomId} by ${userId}`);
    } catch (error) {
      console.error('Error ending call:', error);
      client.emit('error', { message: 'Failed to end call' });
    }
  }

  @SubscribeMessage('toggle-video')
  handleToggleVideo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string; isEnabled: boolean },
  ) {
    const { roomId, userId, isEnabled } = data;

    // Broadcast to all other participants in the room
    client.to(roomId).emit('video-toggled', {
      userId,
      isEnabled,
    });

    console.log(
      `User ${userId} toggled video to ${isEnabled ? 'ON' : 'OFF'} in room ${roomId}`,
    );
  }

  @SubscribeMessage('toggle-audio')
  handleToggleAudio(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; userId: string; isEnabled: boolean },
  ) {
    const { roomId, userId, isEnabled } = data;

    // Broadcast to all other participants in the room
    client.to(roomId).emit('audio-toggled', {
      userId,
      isEnabled,
    });

    console.log(
      `User ${userId} toggled audio to ${isEnabled ? 'ON' : 'OFF'} in room ${roomId}`,
    );
  }
}
