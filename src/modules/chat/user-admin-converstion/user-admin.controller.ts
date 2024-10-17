import { Request, Response } from "express";

import httpStatus from "http-status";
import { TokenCredential } from "../../../libs/authHelper";
import { prisma } from "../../../libs/prismaHelper";
import sendResponse from "../../../libs/sendResponse";


//   senderName: user?.fullName,

// Send a message
const sendMessage = async (req: Request, res: Response) => {
    const { user_id, role } = req.user as TokenCredential;

    if (!user_id) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Token are required!",
        });
    }

    console.log(user_id, "user collection");

    const user = await prisma.user.findUnique({
        where: {
            id: user_id as string,
        },
    });

    console.log(user, "get ");

    const {
        recipientId,
        messageText,
        attachment,
        replyTo,
        customOffer,
        timeAndDate,
    } = req.body;

    // Validate required fields
    if (!recipientId) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Sender, receiver, and message text are required",
        });
    }

    try {
        const converString = timeAndDate.toString();

        const message = await prisma.message.create({
            data: {
                senderId: user_id as string,
                userImage: user?.image,
                senderName: user?.fullName,
                senderUserName: user?.userName,
                recipientId,
                messageText,
                attachment,
                replyTo,
                isFromAdmin: role as string,
                customOffer,
                timeAndDate: converString,
            },
        });

        // Create a notification for the recipient
        await prisma.notification.create({
            data: {
                senderLogo: user?.image,
                type: "message",
                senderUserName: user?.userName ?? "Unknown",
                recipientId: recipientId as string, // Notification goes to the recipient
                messageId: message.id, // Associate the message with the notification
            },
        });


        return sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            data: message,
        });
    } catch (error) {
        console.error(error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Error sending message.",
        });
    }
};

// Reply to a message
const replyToMessage = async (req: Request, res: Response) => {
    const { role, user_id } = req.user as TokenCredential;
    if (!role) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Token are required!",
        });
    }

    const {
        recipientId,
        messageText,
        attachment,
        replyTo,
        isFromAdmin,
        customOffer,
        timeAndDate,
    } = req.body;

    // Validate required fields
    if (!recipientId || !messageText) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Sender, receiver, and message text are required",
        });
    }

    try {

        const converString = timeAndDate.toString();
        const message = await prisma.message.create({
            data: {
                senderId: user_id as string,
                recipientId,
                messageText,
                attachment,
                isFromAdmin: role as string,
                replyTo,
                customOffer,
                timeAndDate: converString,
            },
        });

        const user = await prisma.user.findUnique({
            where: {
                id: user_id as string,
            },
        });

        if (user?.archive) {
            return sendResponse(res, {
                statusCode: httpStatus.CREATED,
                success: true,
                data: "user are archive, so there is no notification",
            });
        } else {
            await prisma.notification.create({
                data: {
                    senderLogo: user?.image,
                    type: "message",
                    senderUserName: user?.userName ?? "Unknown",
                    recipientId: recipientId as string, // Notification goes to the recipient
                    messageId: message.id, // Associate the message with the notification
                },
            });
        }



        return sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            data: message,
        });
    } catch (error) {
        console.error(error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Error replying to message.",
        });
    }
};

// Get messages between user and admin
const getMessages = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { user_id } = req.user as TokenCredential;

    if (!user_id) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.UNAUTHORIZED,
            success: false,
            message: "Token is required!",
        });
    }

    try {
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, recipientId: user_id as string, deletedForRecipient: false },
                    { senderId: user_id as string, recipientId: userId, deletedForSender: false },
                ],
            },
            orderBy: { createdAt: "asc" },
        });

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: messages,
        });
    } catch (error) {
        console.error(error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Error retrieving messages.",
        });
    }
};


const deleteMessage = async (req: Request, res: Response) => {
    const messageId = req.params.id;
    const { user_id, role } = req.user as TokenCredential;
    if (!user_id) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Token are required!",
        });
    }
    try {
        // Fetch the message from the database
        const message = await prisma.message.findUnique({
            where: {
                id: messageId,
                senderId: user_id as string,
            },
        });

        // Check if message exists
        if (!message) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: "this message are not for you",
            });
        }

        // Get the current time and the time the message was created
        const currentTime = new Date();
        const messageTime = new Date(message.createdAt);

        // Calculate the time difference in minutes
        const timeDifference =
            (currentTime.getTime() - messageTime.getTime()) / (1000 * 60); // Convert to minutes

        // Allow deletion if the message is less than or equal to 5 minutes old
        if (timeDifference <= 5) {
            // Check if the user is either the sender or an admin
            const isSender = message.senderId === user_id; // Assuming req.user contains the authenticated user's info
            const isUserAdmin = role === "ADMIN"; // Assuming you have a role property in user

            if (isSender || isUserAdmin) {
                // Delete the message
                await prisma.message.delete({
                    where: {
                        id: messageId,
                    },
                });

                return sendResponse(res, {
                    statusCode: httpStatus.OK,
                    success: true,
                    message: "Message deleted successfully",
                });
            } else {
                return sendResponse(res, {
                    statusCode: httpStatus.FORBIDDEN,
                    success: false,
                    message: "You are not authorized to delete this message",
                });
            }
        } else {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message:
                    "Message can only be deleted within 5 minutes of sending",
            });
        }
    } catch (error) {
        console.error(error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Error deleting message.",
        });
    }
};

const deleteConversation = async (req: Request, res: Response) => {
    const { user_id, role } = req.user as TokenCredential;
    const { userId } = req.params; // ID of the other participant in the conversation

    if (!user_id) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.UNAUTHORIZED,
            success: false,
            message: "Token is required!",
        });
    }
    try {
        const isAdmin = ["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(role as string);
        const isSenderDeleting = user_id === userId;

        // Update the messages between the user and the recipient (admin or user)
        const result = await prisma.message.updateMany({
            where: {
                OR: [
                    { senderId: user_id as string, recipientId: userId },
                    { senderId: userId, recipientId: user_id as string },
                ],
            },
            data: isSenderDeleting
                ? { deletedForSender: true }
                : { deletedForRecipient: true },
        });

        if (result.count === 0) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: "No messages found to delete.",
            });
        }

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: `Conversation deleted from ${isAdmin ? 'admin' : 'user'} side.`,
        });
    } catch (error) {
        console.error(error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Error deleting conversation.",
        });
    }
};


export const messageControlller = {
    getMessages,
    replyToMessage,
    sendMessage,
    deleteMessage,
    deleteConversation
};
