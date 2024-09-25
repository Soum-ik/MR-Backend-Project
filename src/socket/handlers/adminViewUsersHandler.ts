import { Socket } from "socket.io";
import socketStore from "../socket-store";

const adminViewUsersHandler = (socket: Socket, io: any) => {
    // Listen for an admin request to view online users
    socket.on("view-online-users", () => {
        const onlineUsers = socketStore.getOnlineUsers();
        console.log(onlineUsers, "online user");

        // Emit the list of online users back to the admin
        io.to(socket.id).emit("online-users", onlineUsers);
    });
};

export default adminViewUsersHandler;
