import { Socket } from "socket.io";
import { print } from "../../helper/colorConsolePrint.ts/colorizedConsole";
import socketStore from "../socket-store";

const newConnectionHandler = async (socket: Socket, io: any) => {
  print.green("user connected 💥" + socket.id);
  const userDetails = socket.user;

  socket.on("message", (msg) => {
    console.log("Message received: " + JSON.stringify(msg));
    io.emit("message", msg); // Broadcast message to all connected clients
  });

  socket.on('typing', (data) => {
    socket.broadcast.emit('displayTyping', data);
  });

  socket.on('stopTyping', (data) => {
    socket.broadcast.emit('hideTyping', data);
  });

  socketStore.addNewConnectedUser({
    socketId: socket.id,
    userId: userDetails?.user_id,
    role: userDetails?.role,
  });
};

export default newConnectionHandler;
