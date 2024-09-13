import { Socket } from 'socket.io';
import { USER_ROLE } from '../../modules/user/user.interface';
import { socketEvents } from '../../constants/socketEvent';
import socketStore from '../socket-store';
export const emitOnlineUser = (socket?: Socket) => {
  const io = socketStore.getSocketServerInstance();
  const onlineUsers = socketStore.getOnlineUsers();

  if (!io) {
    console.error('Socket server instance not found');
    return;
  }

  if (socket?.user) {
    const userId = socket.user.id as number;
    const userRole = socket.user.role;
    const onlineConnections = socketStore.getActiveConnections(userId);

    if (onlineConnections.length > 0 && 
        (userRole === USER_ROLE.admin || userRole === USER_ROLE.owner)) {
      // Emit to specific connections
      io.to(onlineConnections).emit(socketEvents.onlineUsers, {
        onlineUser: socket.user, // Emit current user's details
      });
    }
  }
};