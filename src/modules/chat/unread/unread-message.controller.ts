import type { Request, Response } from "express";
import httpStatus from "http-status";
import { TokenCredential } from "../../../libs/authHelper";
import sendResponse from "../../../libs/sendResponse";
import { z } from "zod";
import { prisma } from "../../../libs/prismaHelper";


export const unreadMessageController = async (req: Request, res: Response) => {
    const { role } = req.user as TokenCredential;
    const { userId } = req.query

    const isAdmin = ["ADMIN", "SUPER_ADMIN", "SUB_ADMIN"].includes(role as string);

    if (!isAdmin) {
        return sendResponse(res, {
            statusCode: httpStatus.FORBIDDEN,
            success: false,
            message: "You are not authorized to view unread messages",
        });
    }

    try {
        if (userId) {
            const unreadMessagesCount = await prisma.message.count({
                where: {
                    recipientId: userId as string,
                    read: false,
                    recipient: {
                        role: { in: ["ADMIN", "SUPER_ADMIN", "SUB_ADMIN"] }, // Ensure the recipient is not any type of admin
                    },
                },
                select: {
                    id: true,
                    messageText: true,

                }
            });

            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Unread messages count retrieved successfully",
                data: unreadMessagesCount,
            });
        } else {
            const listUnreadmessageCount = await prisma.message.groupBy({
                where: {
                    read: false,
                    recipient: {
                        role: "USER", // Ensure the recipient is just a user, not an admin or sub-admin
                    },
                },
                by: ['recipientId'],
                _count: {
                    id: true,
                },

            })

            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "List of unread messages retrieved successfully",
                data: listUnreadmessageCount,
            });
        }
    } catch (error) {
        console.error("Error retrieving available users for chat: ", error);

        if (error instanceof z.ZodError) {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: "Validation failed",
                data: null,
            });
        }

        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Internal server error",
            data: error,
        });
    }
}