import socketStore from "../socket-store";

export const ADMINLOGO = 'https://mr-backend.s3.ap-south-1.amazonaws.com/MR+Logo+Icon.png'

const PublicMessageHandler = async (msg: any, userData: string) => {
    const onlineUsers = socketStore.getOnlineUsers();
    const socket = socketStore.getSocketServerInstance();

    if (userData === "ADMINS") {
        const adminUserSockets = onlineUsers.filter(user => ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role) && user.userId !== msg.admindId);
        adminUserSockets.forEach(adminSocket => {
            socket.to(adminSocket.socketId).emit("get:notification", msg);
        });
        return;
    }

    // 
    if (['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(userData)) {
        const targetUserSocket = onlineUsers.find(user => user.userId === msg.userId);
        if (targetUserSocket) {
            socket.to(targetUserSocket.socketId).emit('get:notification', msg);
        }

    } else {
        const adminUserSockets = onlineUsers.filter(user => ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(user.role));
        adminUserSockets.forEach(adminSocket => {
            socket.to(adminSocket.socketId).emit("get:notification", msg);
        });

    }
};

export default PublicMessageHandler;
