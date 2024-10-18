import { Socket } from "socket.io";
import socketStore from "../socket-store";

const userMessageHandler = (socket: Socket, io: any) => {
    // Listen for a user message event
    socket.on("user-message", (message) => {
        console.log(message, "check user message testing");

        const onlineUsers = socketStore.getOnlineUsers();

        // Find all admin's socket information
        const adminSockets = onlineUsers.filter(user => user.role !== "USER");

        if (adminSockets.length > 0) {
            // Emit the message to all admin's socket IDs
            adminSockets.forEach(adminSocket => {
                io.to(adminSocket.socketId).emit("message", {
                    from: message.userId,
                    ...message
                });
            });
        } else {
            console.log("No admin is online.");
        }
    });
};

export default userMessageHandler;
