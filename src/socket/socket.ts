import { Server } from 'socket.io';
import { createServer } from 'http';
import { app } from '../app'; // Importing your Express app

// Create HTTP server with Express app
const httpServer = createServer(app);

// Initialize Socket.IO server
const io = new Server(httpServer, {
    cors: {
        origin: [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://mr-project-fiverr-system.vercel.app'
        ],
        methods: ["GET", "POST"],
        credentials: true,
    }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
    console.log('A user connected', socket.id);

    socket.on('message', (message) => {
        console.log('Message received: ', message);
        // Broadcast the message to all connected clients
        io.emit('message', message);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    });
});

export { httpServer, io };
