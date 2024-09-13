import { Socket } from 'socket.io';
import { print } from '../helper/colorConsolePrint.ts/colorizedConsole';

// map instance to store connected users
const connectedUsers = new Map();
//socket server instance
let io: Socket;
// set socket server instance
const setSocketServerInstance = (ioInstance: Socket) => {
    io = ioInstance;
};
// get socket server instance
const getSocketServerInstance = () => {
    return io;
};
// add new connected user
const addNewConnectedUser = ({
    socketId,
    userId,
    role,
}: {
    socketId: string;
    userId: number;
    role: string;
}) => {
    connectedUsers.set(socketId, { userId, role, });
    print.yellow('user connected 💥' + socketId);

};
// remove connected user
const removeConnectedUser = async (socketId: string) => {
    if (connectedUsers.has(socketId)) {
        connectedUsers.delete(socketId);

        print.yellow('user disconnected 💥' + socketId);
    }
};
// get active connections
const getActiveConnections = (userId: number): any[] => {
    const activeConnections: any[] = [];

    connectedUsers.forEach(function (value, key) {
        if (value.userId === userId) {
            activeConnections.push(key);
        }
    });
    return activeConnections;
};
// get online users
const getOnlineUsers = () => {
    const onlineUsers: {
        socketId: string;
        userId: number;
        role: string;
    }[] = [];

    connectedUsers.forEach((value, key) => {
        onlineUsers.push({
            socketId: key,
            userId: value.userId,
            role: value.role, 
        });
    });

    return onlineUsers;
};

// socket store
const socketStore = {
    addNewConnectedUser,
    removeConnectedUser,
    getActiveConnections,
    setSocketServerInstance,
    getSocketServerInstance,
    getOnlineUsers,
};

export default socketStore;
