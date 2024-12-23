
import socketStore from "../socket-store";
import { JwtPayload } from "jsonwebtoken";

interface Message {
    userId: string;
    content: string;
    timestamp: Date;
    type: string;
}




const PublicMessageHandler = async (msg: any, userData: JwtPayload) => {
    const onlineUsers = socketStore.getOnlineUsers();
    const socket = socketStore.getSocketServerInstance();

    if (['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(userData.role)) {
        const targetUserSocket = onlineUsers.find(user => user.userId === msg.userId);
        if (targetUserSocket) {
            socket.to(targetUserSocket.socketId).emit('get:notification', msg)
        }
        const adminUserSockets = onlineUsers.filter(user => ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role));
        adminUserSockets.forEach(adminSocket => {
            socket.to(adminSocket.socketId).emit("get:notification", msg);
        });

    } else {
        // If the sender is a user, send the message to the target user
        const adminUserSockets = onlineUsers.filter(user => ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role));
        adminUserSockets.forEach(adminSocket => {
            socket.to(adminSocket.socketId).emit("get:notification", msg);
        });
    }
};

export default PublicMessageHandler;
