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

    // Listen for a delete message event
    socket.on("delete-message", (message) => {
        const onlineUsers = socketStore.getOnlineUsers();

        // Find the target user socket by userId
        const targetUserSocket = onlineUsers.find(user => user.userId === message.userId);



        if (targetUserSocket) {
            // Emit the delete command to the specific user
            io.to(targetUserSocket.socketId).emit("delete-message", {
                from: "ADMIN",
                ...message
            });
        } else {
            console.log(`User ${message.userId} is not online or message cannot be deleted.`);
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
