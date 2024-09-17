import { Socket } from "socket.io";
import { print } from "../../helper/colorConsolePrint.ts/colorizedConsole";
import socketStore from "../socket-store";

const newConnectionHandler = async (socket: Socket, io: any) => {
  print.green("user connected 💥" + socket.id);
  const userDetails = socket.user;
  console.log(userDetails);

  socket.on("message", (msg) => {
    console.log("Message received: " + JSON.stringify(msg));
    io.emit("message", msg); // Broadcast message to all connected clients
  });

  socketStore.addNewConnectedUser({
    socketId: socket.id,
    userId: userDetails?.id,
    role: userDetails?.role,
  });
};

export default newConnectionHandler;
