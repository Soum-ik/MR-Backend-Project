import { Socket } from "socket.io";
import socketStore from "../socket-store";

const adminMessageHandler = (socket: Socket, io: any) => {
    socket.on("available-for-chat", (message) => {
        const onlineUsers = socketStore.getOnlineUsers();

        // Check if the sender is an admin or a regular user
        const sender = onlineUsers.find(user => user.socketId === socket.id);

        if (!sender) {
            // If sender is not found in the online users, return
            return;
        }

        // If the sender is an admin (role check)
        if (['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(sender.role)) {
            // Send to all admins
            const adminUserSockets = onlineUsers.filter(user => ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role));
            adminUserSockets.forEach(adminSocket => {
                if (adminSocket.socketId !== socket.id) { // Don't send back to the sender
                    io.to(adminSocket.socketId).emit("newChatMessage", message);
                }
            });
            const targetUserSocket = onlineUsers.find(user => user.userId === message.userId);
            if (targetUserSocket) {
                io.to(targetUserSocket.socketId).emit('newChatMessage', message)
            }
        } else {
            // If the sender is a user, send the message to the target user
            const adminUserSockets = onlineUsers.filter(user => ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role));
            adminUserSockets.forEach(adminSocket => {
                if (adminSocket.socketId !== socket.id) { // Don't send back to the sender
                    io.to(adminSocket.socketId).emit("newChatMessage", message);
                }
            });
        }
    });
};

export default adminMessageHandler;
