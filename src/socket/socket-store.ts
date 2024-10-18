import { Socket } from "socket.io";
import { print } from "../helper/colorConsolePrint.ts/colorizedConsole";
import { prisma } from "../libs/prismaHelper";

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
const addNewConnectedUser = async ({
    socketId,
    userId,
    role,
}: {
    socketId: string;
    userId: any;
    role: string;
}) => {
    connectedUsers.set(socketId, { userId, role });
    print.yellow("user connected 💥" + socketId);

    // Check if the user is already in connectedUsers map to update their lastSeen
    const existingUser = [...connectedUsers.values()].find(user => user.userId === userId);

    if (existingUser) {
        // Update lastSeen to "now" or set to null
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { lastSeen: null },
            });
            print.green(`Updated last seen for user ${userId} to "Online"`);
        } catch (error) {
            print.red(`Error updating last seen for user ${userId}: `, error);
        }
    } else {
        // If user is new, add to connectedUsers map
        connectedUsers.set(socketId, { userId, role });
        print.yellow("User connected 💥" + socketId);
    }
};

// remove connected user
const removeConnectedUser = async (socketId: string) => {
    if (connectedUsers.has(socketId)) {
        const user = connectedUsers.get(socketId);
        if (user) {
            try {
                // Update lastSeen in the Prisma database
                await prisma.user.update({
                    where: { id: user.userId },
                    data: { lastSeen: new Date().toISOString() },
                });

            } catch (error) {
                print.red(
                    `Error updating last seen for user ${user.userId}: `,
                    error
                );
            }
        }

        connectedUsers.delete(socketId);
        print.yellow("user disconnected 💥" + socketId);
    }
};

// Function to get online users
const getOnlineUsers = () => {
    const onlineUsers: {
        socketId: string;
        userId: number;
        role: string;
        email: string;
    }[] = [];

    connectedUsers.forEach((value, key) => {
        onlineUsers.push({
            socketId: key,
            userId: value.userId,
            role: value.role,
            email: value.email,
        });
    });

    return onlineUsers;
};

// socket store
const socketStore = {
    addNewConnectedUser,
    removeConnectedUser,
    setSocketServerInstance,
    getSocketServerInstance,
    getOnlineUsers,
};

export default socketStore;
