import { Server } from 'http';
import { Socket } from 'socket.io';
import disconnectHandler from './handlers/disconnectHandler';
// import { emitOnlineUsers } from './handlers/emitOnlineUserHandler';
import newConnectionHandler from './handlers/newConnectionHandler';
import { print } from '../helper/colorConsolePrint.ts/colorizedConsole'
import { authSocket } from '../socket/middleware/authSocket'

import socketStore from './socket-store';

const registerSocketServer = (server: Server) => {
    const io = require('socket.io')(server, {
        cors: {
            origin: [
                'http://localhost:3000',
                'http://localhost:5173',
                'https://mr-project-fiverr-system.vercel.app'
            ],
            methods: ["GET", "POST"],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    // set socket server instance at store
    socketStore.setSocketServerInstance(io);

    // authenticate socket
    io.use((socket: Socket, next: any) => {
        authSocket(socket, next);
    });

    io.on('connection', (socket: Socket) => {
        // add connected user to online users list
        newConnectionHandler(socket, io);

        // disconnect socket
        socket.on('disconnect', () => {
            // remove connected user from online users list
            disconnectHandler(socket);
            // stop emitting online users after disconnection
            // clearInterval(interval);
        });
    });
    // print all socket connected users in log every 8 seconds
    setInterval(() => {
        const onlineUsers = socketStore.getOnlineUsers();
        print.blue('online users: ' + onlineUsers.length);
        for (let i = 0; i < onlineUsers.length; i++) {
            const user = onlineUsers[i];
            console.log(i, user);
        }
    }, 8000);
};

const socketServer = {
    registerSocketServer,
};

export default socketServer;
