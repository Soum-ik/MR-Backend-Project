import { Socket } from "socket.io";
import socketStore from "../socket-store";

const orderChatHandler = (socket: Socket, io: any) => {
    // Listen for a user message event
    socket.on("order:user-message", (message) => {
        const onlineUsers = socketStore.getOnlineUsers();

        // Find all admin's socket information
        const adminSockets = onlineUsers.filter(user => user.role !== "USER");

        if (adminSockets.length > 0) {
            // Emit the message to all admin's socket IDs
            adminSockets.forEach(adminSocket => {
                io.to(adminSocket.socketId).emit("order:message", {
                    from: message.userId,
                    ...message
                });
            });
        } else {
            console.log("No admin is online.");
        }
    });

    // Listen for an admin message event
    socket.on("order:admin-message", (message) => {
        const onlineUsers = socketStore.getOnlineUsers();

        // Find the target user's socket information
        const targetUser = onlineUsers.find(user => user.userId === message.userId);
        console.log(targetUser, ' check  target user ');

        if (targetUser) {
            // Emit the message to the target user's socket ID
            io.to(targetUser.socketId).emit("order:message", {
                from: message.adminId,
                ...message
            });
        } else {
            console.log("Target user is not online.");
        }
    });
};

export default orderChatHandler;
