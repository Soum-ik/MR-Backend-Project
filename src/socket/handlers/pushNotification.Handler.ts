import { Socket } from "socket.io";
import socketStore from "../socket-store";
import { prisma } from "../../libs/prismaHelper";

const pushNotificationHandler = (socket: Socket, io: any) => {
    // Listen for an admin request to view online users
    socket.on("push-notification", async (data: any) => {
        const onlineUsers = socketStore.getOnlineUsers();
        console.log(onlineUsers, "online user");

        const user = await prisma.user.findUnique({
            where: {
                id: data.userId
            }
        })
        if (user) {
            io.to(user.id).emit("get-notification", data);
        }
    });
};

export default pushNotificationHandler;
