import { Socket } from "socket.io";
import socketStore from "../socket-store";

const PublicMessageHandler = (socket: Socket, io: any) => {
    // Listen for an admin message event
    socket.on("send:notification", (message) => {
        const onlineUsers = socketStore.getOnlineUsers();
        const user = socket.user
        // If the sender is an admin (role check)
        if (['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            const targetUserSocket = onlineUsers.find(user => user.userId === message.userId);

            if (targetUserSocket) {
                io.to(targetUserSocket.socketId).emit('public:notification', message)
            }
            const adminUserSockets = onlineUsers.filter(user => ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role));
            adminUserSockets.forEach(adminSocket => {
                io.to(adminSocket.socketId).emit("newChatMessage", message);
            });

        } else {
            // If the sender is a user, send the message to the target user
            const adminUserSockets = onlineUsers.filter(user => ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role));
            adminUserSockets.forEach(adminSocket => {
                io.to(adminSocket.socketId).emit("newChatMessage", message);
            });
        }
    });

};

export default PublicMessageHandler;
