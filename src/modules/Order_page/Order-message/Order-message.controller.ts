import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import httpStatus from "http-status";
import { TokenCredential } from "../../../libs/authHelper";
import { prisma } from "../../../libs/prismaHelper";
import sendResponse from "../../../libs/sendResponse";
import { USER_ROLE } from "../../user/user.constant";
import catchAsync from "../../../libs/utlitys/catchSynch";
import { Role } from "@prisma/client";

// Controller: Send a message
const sendMessage = async (req: Request, res: Response) => {
    const { user_id, role } = req.user as TokenCredential;

    if (!user_id) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: 'Token are required!',
        });
    }
    const user = await prisma.user.findUnique({
        where: {
            id: user_id as string,
        },
    });
    const { messageText, attachment, replyTo, customOffer,  recipientId, projectNumber } = req.body;

    // If the role is admin, recipientId is required
    if (
        ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(role as string) &&
        !recipientId
    ) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'Recipient ID is required for admin roles.',
        });
    }

    const admins = await prisma.user.findMany({
        where: {
            role: {
                in: ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'],
            },
        },
        select: {
            id: true,
            userName: true,
            role: true,
        },
    });

    try {
 
        const commonkey = uuidv4();

        if (role === 'USER') {
            // Send message to all admins if the role is USER
            for (const admin of admins) {
                const message = await prisma.orderMessage.create({
                    data: {
                        senderId: user_id as string,
                        userImage: user?.image,
                        senderName: user?.fullName,
                        senderUserName: user?.userName,
                        recipientId: admin.id,
                        messageText,
                        attachment,
                        replyTo,
                        isFromAdmin: role as Role,
                        customOffer,
                         
                        commonKey: commonkey,
                        projectNumber: projectNumber
                    },
                });

                await prisma.notification.create({
                    data: {
                        senderLogo: user?.image,
                        type: 'message',
                        senderUserName: user?.userName ?? 'Unknown',
                        recipientId: admin.id, // Notification goes to each admin
                        messageId: message.id, // Associate the message with the notification
                    },
                });
            }

            return sendResponse(res, {
                statusCode: httpStatus.CREATED,
                success: true,
                message: 'Messages sent to all admins successfully.',
            });
        } else {
            const message = await prisma.orderMessage.create({
                data: {
                    senderId: user_id as string,
                    userImage: user?.image,
                    senderName: user?.fullName,
                    senderUserName: user?.userName,
                    recipientId,
                    messageText,
                    attachment,
                    replyTo,
                    isFromAdmin: role as Role,
                    customOffer, 
                    commonKey: commonkey,
                    projectNumber: projectNumber
                },
            });

            await prisma.notification.create({
                data: {
                    senderLogo: user?.image,
                    type: 'message',
                    senderUserName: user?.userName ?? 'Unknown',
                    recipientId: recipientId as string, // Notification goes to the recipient
                    messageId: message.id, // Associate the message with the notification
                },
            });

            // Send message to all admins
            for (const admin of admins) {
                if (admin.id !== user_id) {
                    // If the admin is not the sender
                    const messageToAdmin = await prisma.orderMessage.create({
                        data: {
                            senderId: user_id as string,
                            userImage: user?.image,
                            senderName: user?.fullName,
                            senderUserName: user?.userName,
                            recipientId: admin.id,
                            messageText,
                            attachment,
                            replyTo,
                            isFromAdmin: role as Role,
                            customOffer, 
                            commonKey: commonkey,
                            projectNumber: projectNumber,
                        },
                    });

                    await prisma.notification.create({
                        data: {
                            senderLogo: user?.image,
                            type: 'message',
                            senderUserName: user?.userName ?? 'Unknown',
                            recipientId: admin.id, // Notification goes to each admin
                            messageId: messageToAdmin.id, // Associate the message with the notification
                        },
                    });
                }
            }

            return sendResponse(res, {
                statusCode: httpStatus.CREATED,
                success: true,
                data: message,
                message: `Message sent to recipient ID: ${recipientId}`,
            });
        }

        // Create a notification for the recipient
    } catch (error) {
        console.error(error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Error sending message.',
        });
    }
};

// Controller: Reply to a message
export const replyToMessage = async (req: Request, res: Response) => {
    const { role, user_id } = req.user as TokenCredential;

    if (!role) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Token is required!",
        });
    }

    const { messageId, ...replyData } = req.body;

    if (!messageId) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Message ID is required to reply.",
        });
    }

    try {
        const message = await prisma.orderMessage.findUnique({ where: { id: messageId } });

        if (!message) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: "Message not found!",
            });
        }

        const replyMessage = await prisma.orderMessage.update({
            where: { id: messageId },
            data: { replyTo: replyData },
        });

        const user = await prisma.user.findUnique({ where: { id: user_id as string } });

        if (!user?.archive) {
            await prisma.notification.create({
                data: {
                    senderLogo: user?.image,
                    type: "message",
                    senderUserName: user?.userName ?? "Unknown",
                    recipientId: message.recipientId as string,
                    messageId: message.id,
                },
            });
        }

        return sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            data: replyMessage,
            message: `Message replied successfully to recipient ID: ${message.recipientId}`,
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

// Controller: Get messages between user and admin
export const getMessages = async (req: Request, res: Response) => {
    const { userId, projectNumber } = req.query;
    const { user_id, role } = req.user as TokenCredential;

    if (!user_id) {
        return sendResponse(res, {
            statusCode: httpStatus.UNAUTHORIZED,
            success: false,
            message: "Token is required!",
        });
    }

    try {
        const roleCondition = role === "USER" ? "asc" : "desc";
        const messages = await prisma.orderMessage.findMany({
            where: {
                OR: [
                    { senderId: user_id as string, recipient: { role: { in: [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.USER] } } },
                    { recipientId: user_id as string, sender: { role: { in: [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.USER] } } },
                ],
                AND: [
                    {
                        projectNumber: projectNumber as string
                    }
                ]
            },
            orderBy: { createdAt: roleCondition },
        });

        const uniqueMessages = messages.filter((msg, i, arr) =>
            i === arr.findIndex(t => t.commonKey === msg.commonKey)
        ).map(({ commonKey, ...rest }) => rest);

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: uniqueMessages,
            message: `Messages retrieved${messages.length ? "" : " (none found)"} between user ${user_id} and admins.`,
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

// Controller: Delete a message
export const deleteMessage = async (req: Request, res: Response) => {
    const { id: messageId, projectNumber } = req.params;
    const { user_id, role } = req.user as TokenCredential;

    if (!user_id) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Token is required!",
        });
    }

    try {
        const message = await prisma.orderMessage.findUnique({
            where: { id: messageId, senderId: user_id as string, projectNumber: projectNumber as string },
        });

        if (!message) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: "This message is not yours.",
            });
        }

        const timeElapsed = (new Date().getTime() - new Date(message.createdAt).getTime()) / (1000 * 60);

        if (timeElapsed <= 5) {
            await prisma.orderMessage.delete({ where: { id: messageId } });
            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Message deleted successfully.",
            });
        } else {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: "Message deletion time limit exceeded.",
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




export const updateProjectMessage = catchAsync(async (req: Request, res: Response) => {

    const { messageText, attachment, replyTo, customOffer, timeAndDate, recipientId, projectNumber, orderMessageId } = req.body;

    if (!orderMessageId) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'Order message id is required'
        });
    }

    const updateMessage = await prisma.orderMessage.update({
        where: { id: orderMessageId }, data: { messageText, attachment, replyTo, customOffer, timeAndDate, recipientId, projectNumber }
    })

    if (!updateMessage) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: 'Message not found'
        });
    }

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: updateMessage,
        message: 'Message updated successfully'
    });
})



export const orderMessageController = {
    sendMessage,
    replyToMessage,
    getMessages,
    deleteMessage,
    updateProjectMessage
}   
