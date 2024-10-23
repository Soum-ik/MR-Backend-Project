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

    // Handle typing indication for user to admin
    socket.on("typing", (data) => {
        const onlineUsers = socketStore.getOnlineUsers();
        const adminSockets = onlineUsers.filter(user => user.role !== "USER");

        adminSockets.forEach(adminSocket => {
            io.to(adminSocket.socketId).emit("displayTyping", {
                userId: socket.id,
                text: "User is typing...",
                ...data
            });
        });
    });

    socket.on("stopTyping", (data) => {
        const onlineUsers = socketStore.getOnlineUsers();
        const adminSockets = onlineUsers.filter(user => user.role !== "USER");

        adminSockets.forEach(adminSocket => {
            io.to(adminSocket.socketId).emit("hideTyping", {
                userId: socket.id,
                ...data
            });
        });
    });
};

export default userMessageHandler;
