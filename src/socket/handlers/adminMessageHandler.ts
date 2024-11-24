import { Socket } from "socket.io";
import socketStore from "../socket-store";

const adminMessageHandler = (socket: Socket, io: any) => {
    // Listen for an admin message event
    socket.on("admin-message", (message) => {
        const onlineUsers = socketStore.getOnlineUsers();

        // Find the target user socket by userId
        const targetUserSocket = onlineUsers.find(user => user.userId === message.userId);

        // Find all admin user sockets
        const adminUserSockets = onlineUsers.filter(user => ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role));

        if (targetUserSocket) {
            // Emit the message to the specific user
            io.to(targetUserSocket.socketId).emit("message", {
                from: "ADMIN",
                ...message
            });
        } else {
            console.log(`User ${message.userId} is not online.`);
        }

        // Notify other admins about the message sent
        adminUserSockets.forEach(adminSocket => {
            if (adminSocket.socketId !== socket.id) { // Ensure the admin who sent the message does not receive it
                io.to(adminSocket.socketId).emit("admin-notification", {
                    text: `Message sent to user ${message.userId}: ${message.text}`,
                    from: "ADMIN",
                    targetUser: targetUserSocket, // Include target user socket info
                    ...message
                });
            }
        });
    });

    socket.on("delete-message", (message) => {
        const onlineUsers = socketStore.getOnlineUsers();

        // Get the target user's socket
        const targetUserSocket = onlineUsers.find(user => user.userId === message.userId);

        // Get all admin user sockets
        const adminUserSockets = onlineUsers.filter(user =>
            ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role)
        );

        if (message.role === 'USER') {
            // If the sender is a user, notify all admins
            adminUserSockets.forEach(adminSocket => {
                io.to(adminSocket.socketId).emit("delete-message", {
                    text: `Message deleted by user ${message.userId}: ${message.text}`,
                    from: "USER",
                    ...message
                });
            });
        } else if (['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(message.role)) {
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


    // Handle typing indication
    socket.on("typing", (isTyping, userId) => {
        if (isTyping) {
            io.emit("displayTyping", { userId: userId, text: "Admin is typing..." });
        } else {
            io.emit("hideTyping", { userId: userId });
        }
    });
};

export default adminMessageHandler;
