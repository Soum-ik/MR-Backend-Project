import { Server } from "http";
import { Socket } from "socket.io";
import disconnectHandler from "./handlers/disconnectHandler";
import { print } from "../helper/colorConsolePrint.ts/colorizedConsole";
import { authSocket } from "../socket/middleware/authSocket";
import newConnectionHandler from "./handlers/newConnectionHandler";

import socketStore from "./socket-store";
import adminMessageHandler from "./handlers/adminMessageHandler";
import adminViewUsersHandler from "./handlers/adminViewUsersHandler";
import userMessageHandler from "./handlers/userMessageToAdminHandler";
import getOwnSocketIdHandler from "./handlers/getOwnSocketIdHandler";
import orderChatHandler from "./handlers/orderChatHandler";
import adminMessageCheckerHandler from "./handlers/adminsMessageChecker";
import availableForChat from "./handlers/availableForChat";

const registerSocketServer = (server: Server) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://mr-project-fiverr-system.vercel.app",
        "https://mahfujurrahm535.com/",
        "https://dev.mahfujurrahm535.com/",
        "wss://dev.mahfujurrahm535.com/",
        "https://www.mahfujurrahm535.com/",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // set socket server instance at store
  socketStore.setSocketServerInstance(io);

  // authenticate socket
  io.use((socket: Socket, next: any) => {
    authSocket(socket, next);
  });

  io.on("connection", (socket: Socket) => {

    // add connected user to online users list
    newConnectionHandler(socket, io);

    // send message to user
    adminMessageHandler(socket, io)
    adminViewUsersHandler(socket, io)
    userMessageHandler(socket, io)

    availableForChat(socket, io)

    // order-chat
    orderChatHandler(socket, io)

    // get your own socket id
    getOwnSocketIdHandler(socket)

    adminMessageCheckerHandler(socket, io)

    // disconnect 
    socket.on("disconnect", () => {
      // remove connected user from online users list
      disconnectHandler(socket);
      // stop emitting online users after disconnection
      clearInterval(onlineUsersInterval);
    });
  });

  const onlineUsersInterval = setInterval(() => {
    const onlineUsers = socketStore.getOnlineUsers();
    // print.blue("online users: " + onlineUsers.length);
    for (let i = 0; i < onlineUsers.length; i++) {
      const user = onlineUsers[i];
    }
  }, 8000);
};

const socketServer = {
  registerSocketServer,
};

export default socketServer;
