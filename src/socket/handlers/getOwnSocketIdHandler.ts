import { Socket } from "socket.io";
import socketStore from "../socket-store";
const getOwnSocketIdHandler = (socket: Socket) => {
    // Listen for a request to get own socket ID
    socket.on("get-own-socket-id", () => {

        const onlineUsers = socketStore.getOnlineUsers();

        // Find the admin's socket information
        const user = onlineUsers.find(user => user.socketId === socket.id);
        console.log(user, "target socket");
        // Emit back the user's own socket ID
        socket.emit("your-socket-id", { socketId: socket.id, text: 'This is your own socket id', info: user });
        console.log(`Socket ID sent to user: ${socket.id}`);
    });
};

export default getOwnSocketIdHandler;
