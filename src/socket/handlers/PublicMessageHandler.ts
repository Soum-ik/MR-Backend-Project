import socketStore from "../socket-store";

const PublicMessageHandler = async (msg: any, userData: string) => {
    const onlineUsers = socketStore.getOnlineUsers();
    const socket = socketStore.getSocketServerInstance();


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
        console.log(adminUserSockets, 'admin socket');
        
    }
};

export default PublicMessageHandler;
