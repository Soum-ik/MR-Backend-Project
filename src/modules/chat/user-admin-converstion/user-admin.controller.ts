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

    const { recipientId, messageText, attachment, replyTo, customOffer } =
        req.body;

    // Validate required fields
    if (!recipientId || !messageText) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Sender, receiver, and message text are required",
        });
    }

    try {
        const date = new Date();
        const msgDate = date.toLocaleDateString([], {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
        const msgTime = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
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
                msgDate,
                msgTime,
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
        const message = await prisma.message.create({
            data: {
                senderId: user_id as string,
                recipientId,
                messageText,
                attachment,
                isFromAdmin: role as string,
                replyTo,
                customOffer,
                msgDate: new Date().toDateString(),
                msgTime: new Date().toLocaleTimeString(),
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
            message: "Error replying to message.",
        });
    }
};

// Get messages between user and admin
const getMessages = async (req: Request, res: Response) => {
    const { userId } = req.params;

    const { user_id, role } = req.user as TokenCredential;
    if (!user_id) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Token are required!",
        });
    }

    try {
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, recipientId: user_id as string },
                    { senderId: user_id as string, recipientId: userId },
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
            },
        });

        // Check if message exists
        if (!message) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: "Message not found",
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
                message: "Message can only be deleted within 5 minutes of sending",
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

export const messageControlller = {
    getMessages,
    replyToMessage,
    sendMessage,
    deleteMessage,
};
