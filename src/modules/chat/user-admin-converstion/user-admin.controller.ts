// import { Request, Response } from "express";
// import { PrismaClient } from "@prisma/client";
// import { sendResponse } from "../../../libs/sendResponse";
// import httpStatus from "http-status";

// const prisma = new PrismaClient();

// // Admin sends a message to a user
// export const adminSendMessage = async (req: Request, res: Response) => {
//     try {
//         const {
//             senderId,
//             receiverId,
//             messageText,
//             senderName,
//             senderImage,
//             attachments = [],
//             customOffer = null,
//             contactForm = null,
//         } = req.body;

//         if (!senderId || !receiverId || !messageText) {
//             return sendResponse(res, {
//                 statusCode: httpStatus.BAD_REQUEST,
//                 success: false,
//                 message: "Sender, receiver, and message text are required",
//             });
//         }

//         // Check if there's an existing conversation between the sender and receiver
//         let conversation = await prisma.conversation.findFirst({
//             where: {
//                 participants: {
//                     some: { id: senderId },
//                 },
//             },
//             include: {
//                 participants: true,
//                 messages: {
//                     orderBy: { createdAt: "asc" },
//                 },
//             },
//         });

//         // If no conversation exists, create a new one
//         if (!conversation) {
//             conversation = await prisma.conversation.create({
//                 data: {
//                     participants: {
//                         connect: [{ id: senderId }, { id: receiverId }],
//                     },
//                 },
//                 include: {
//                     participants: true,
//                 },
//             });
//         }

//         // Create a new message within the conversation
//         const newMessage = await prisma.message.create({
//             data: {
//                 conversationId: conversation.id,
//                 senderId,
//                 senderName,
//                 senderImage,
//                 messageText,
//                 attachments,
//                 customOffer,
//                 contactForm,
//             },
//         });

//         // Formatting response as expected by the frontend
//         const formattedResponse = {
//             userImage: newMessage.senderImage,
//             senderName: newMessage.senderName,
//             messageId: newMessage.id,
//             msgDate: newMessage.createdAt.toLocaleDateString("en-US", {
//                 month: "short",
//                 day: "2-digit",
//                 year: "numeric",
//             }),
//             msgTime: newMessage.createdAt.toLocaleTimeString("en-US", {
//                 hour: "2-digit",
//                 minute: "2-digit",
//                 hour12: true,
//             }),
//             messageText: newMessage.messageText,
//             attachment: newMessage.attachments,
//             customOffer: newMessage.customOffer,
//             contactForm: newMessage.contactForm,
//         };

//         return sendResponse(res, {
//             statusCode: httpStatus.CREATED,
//             success: true,
//             message: "Message sent successfully",
//             data: formattedResponse,
//         });
//     } catch (error) {
//         console.error("Error sending message:", error);
//         return sendResponse(res, {
//             statusCode: httpStatus.INTERNAL_SERVER_ERROR,
//             success: false,
//             message: "Internal server error",
//         });
//     }
// };

// // Get all messages in a conversation between admin and user
// export const getAdminMessages = async (req: Request, res: Response) => {
//     try {
//         const { userId, adminId } = req.query;

//         if (!userId || !adminId) {
//             return sendResponse(res, {
//                 statusCode: httpStatus.BAD_REQUEST,
//                 success: false,
//                 message: "User ID and Admin ID are required",
//             });
//         }

//         // Find the existing conversation between the user and admin
//         const conversation = await prisma.conversation.findFirst({
//             where: {
//                 participants: {
//                     every: {
//                         id: {
//                             in: [userId as string, adminId as string],
//                         },
//                     },
//                 },
//             },
//             include: {
//                 messages: {
//                     orderBy: {
//                         createdAt: "asc",
//                     },
//                 },
//             },
//         });

//         if (!conversation) {
//             return sendResponse(res, {
//                 statusCode: httpStatus.NOT_FOUND,
//                 success: false,
//                 message: "Conversation not found",
//             });
//         }

//         // Format messages for the frontend
//         const formattedMessages = conversation.messages.map((msg) => ({
//             userImage: msg.senderImage,
//             senderName: msg.senderName,
//             messageId: msg.id,
//             msgDate: msg.createdAt.toLocaleDateString("en-US", {
//                 month: "short",
//                 day: "2-digit",
//                 year: "numeric",
//             }),
//             msgTime: msg.createdAt.toLocaleTimeString("en-US", {
//                 hour: "2-digit",
//                 minute: "2-digit",
//                 hour12: true,
//             }),
//             messageText: msg.messageText,
//             attachment: msg.attachments,
//             customOffer: msg.customOffer,
//             contactForm: msg.contactForm,
//         }));

//         return sendResponse(res, {
//             statusCode: httpStatus.OK,
//             success: true,
//             message: "Messages retrieved successfully",
//             data: formattedMessages,
//         });
//     } catch (error) {
//         console.error("Error retrieving messages:", error);
//         return sendResponse(res, {
//             statusCode: httpStatus.INTERNAL_SERVER_ERROR,
//             success: false,
//             message: "Internal server error",
//         });
//     }
// };
