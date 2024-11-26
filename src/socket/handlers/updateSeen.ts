import { Socket } from "socket.io";
import socketStore from "../socket-store";

const UpdateUnseen = (socket: Socket, io: any) => {
    socket.on("update:seen", (message) => {
        const onlineUsers = socketStore.getOnlineUsers();
        const user = socket.user


        // Get the target user's socket
        // const targetUserSocket = onlineUsers.find(user => user.userId === message.userId);
        // if (!targetUserSocket) {
        //     // If sender is not found in the online users, return
        //     return;
        // }

        // If the sender is an admin (role check)
        if (['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
            const targetUserSocket = onlineUsers.find(user => user.userId === message.userId);
            
            if (targetUserSocket) {
                io.to(targetUserSocket.socketId).emit('recive:seen', message)
            }
            const adminUserSockets = onlineUsers.filter(user => ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role));
            adminUserSockets.forEach(adminSocket => {
                io.to(adminSocket.socketId).emit("recive:seen", message);
            });

        } else {
            // If the sender is a user, send the message to the target user
            const adminUserSockets = onlineUsers.filter(user => ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role));
            adminUserSockets.forEach(adminSocket => {
                io.to(adminSocket.socketId).emit("recive:seen", message);
            });
        }
    });
};

export default UpdateUnseen;
