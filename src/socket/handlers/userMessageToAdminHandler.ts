import { Socket } from "socket.io";
import socketStore from "../socket-store";

const userMessageHandler = (socket: Socket, io: any) => {
    // Listen for a user message event
    socket.on("user-message", (message: { text: string; userId: number }) => {
        console.log(message, "check user message");

        const onlineUsers = socketStore.getOnlineUsers();

        // Find the admin's socket information
        const adminSocket = onlineUsers.find(user => user.role === 'ADMIN');
        console.log(adminSocket, "target socket");

        if (adminSocket) {
            // Emit the message to the admin's socket ID
            io.to(adminSocket.socketId).emit("message", {
                from: message.userId,
                text: message.text,
            });
            console.log(`Message sent to admin from user ${message.userId}: ${message.text}`);
        } else {
            console.log("Admin is not online.");
        }
    });
};

export default userMessageHandler;
