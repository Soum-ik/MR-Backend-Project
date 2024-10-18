import { Socket } from "socket.io";
import socketStore from "../socket-store";

const adminMessageHandler = (socket: Socket, io: any) => {
    // Listen for an admin message event
    socket.on("admin-message", (message) => {
 


        const onlineUsers = socketStore.getOnlineUsers();

        // Find the target user socket by userId
        const targetUserSocket = onlineUsers.find(user => user.userId === message.userId);


        if (targetUserSocket) {
            // Emit the message to the specific user
            io.to(targetUserSocket.socketId).emit("message", {
                from: "ADMIN",
                ...message
            });
            // console.log(`Message sent to user ${message.userId}: ${message.text}`);
        } else {
            console.log(`User ${message.userId} is not online.`);
        }
    });
};

export default adminMessageHandler;
