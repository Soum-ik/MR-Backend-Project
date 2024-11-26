import { Socket } from "socket.io";
import socketStore from "../socket-store";

const deleteMessage = (socket: Socket, io: any) => {
    socket.on("notifi:delete-message", (message) => {
        const onlineUsers = socketStore.getOnlineUsers();
        const user = socket.user
  

        // Get the target user's socket
        const targetUserSocket = onlineUsers.find(user => user.userId === message.userId);

        // Get all admin user sockets
        const adminUserSockets = onlineUsers.filter(user =>
            ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role)
        );

        if (user?.role === 'USER') {
            // If the sender is a user, notify all admins
            adminUserSockets.forEach(adminSocket => {
                io.to(adminSocket.socketId).emit("delete-message", {
                    text: `Message deleted by user ${message.userId}: ${message.text}`,
                    from: "USER",
                    ...message
                });
            });
        } else if (['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            // If the sender is an admin, send the message to the target user and notify all admins
            if (targetUserSocket) {
                io.to(targetUserSocket.socketId).emit("delete-message", {
                    from: "ADMIN",
                    ...message
                });
            }

            adminUserSockets.forEach(adminSocket => {
                if (adminSocket.socketId !== socket.id) {
                    io.to(adminSocket.socketId).emit("delete-message", {
                        text: `Message sent to user ${message.userId}: ${message.text}`,
                        from: "ADMIN",
                        targetUser: { userId: targetUserSocket?.userId || null },
                        ...message
                    });
                }
            });
        }
    });
}

export default deleteMessage