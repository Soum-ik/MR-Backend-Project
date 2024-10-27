// import { Socket } from "socket.io";
// import socketStore from "../socket-store"; // Assumed you have a way to track online users
// import { prisma } from "../../libs/prismaHelper";

// const deleteMessageHandler = (socket: Socket, io: any) => {
//     // Listen for a message delete event
//     socket.on("delete-message", async ({ messageId, userId }) => {
//         try {
//             // 1. Delete the message from the database
//             await prisma.message.delete({
//                 where: {
//                     id: messageId
//                 }
//             });

//             // 2. Broadcast the deletion to relevant users (sender and receiver)
//             const onlineUsers = socketStore.getOnlineUsers();

//             // Find the sender and receiver based on the message
//             const message = await prisma.message.findUnique({
//                 where: {
//                     id: messageId
//                 }
//             });

//             if (!message?.senderId || !message?.recipientId) {
//                 throw new Error("Message not found");
//             }

//             const senderSocket = onlineUsers.find(user => user.userId === message?.senderId);
//             const receiverSocket = onlineUsers.find(user => user.userId === message?.recipientId);

//             // 3. Notify both sender and receiver about the deletion
//             if (senderSocket) {
//                 io.to(senderSocket.socketId).emit("messageDeleted", { messageId });
//             }
//             if (receiverSocket) {
//                 io.to(receiverSocket.socketId).emit("messageDeleted", { messageId });
//             }

//             console.log(`Message ${messageId} deleted by user ${userId}.`);

//         } catch (error) {
//             console.error("Error deleting message:", error);
//         }
//     });
// };

// export default deleteMessageHandler;
