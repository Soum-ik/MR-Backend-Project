import { Socket } from "socket.io";
import socketStore from "../socket-store";

const adminMessageCheckerHandler = (socket: Socket, io: any) => {
    // Listen for an admin message event
    socket.on("admin:messagesender", (message) => {

        const onlineUsers = socketStore.getOnlineUsers();
        // Find all admin user sockets
        const adminUserSockets = onlineUsers.filter(user => ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role));

        // Broadcast the message to all admin users
        adminUserSockets.forEach(adminSocket => {
            io.to(adminSocket.socketId).emit("admin:message", {
                from: message.role,
                ...message
            });
        });
    });
};

export default adminMessageCheckerHandler;
