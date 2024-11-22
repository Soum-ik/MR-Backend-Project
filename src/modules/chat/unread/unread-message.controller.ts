import type { Request, Response } from "express";
import httpStatus from "http-status";
import sendResponse from "../../../libs/sendResponse";
import { prisma } from "../../../libs/prismaHelper";
import { Role } from "@prisma/client";
import { TokenCredential } from "../../../libs/authHelper";
import catchAsync from "../../../libs/utlitys/catchSynch";
import AppError from "../../../errors/AppError";


const getUnseenMessageController = catchAsync(async (req: Request, res: Response) => {
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

})


const updateUnseenMessageController = catchAsync(async (req: Request, res: Response) => {
    const { role } = req.user as TokenCredential

    const { userId } = req.params


    const findMessage = await prisma.message.findMany({
        where: {
            seen: false,
            OR: [
                {
                    senderId: userId,
                },
                {
                    recipientId: userId
                }

            ]

            // senderId: userId,
            // recipientId :  userId
        }
    })
    if (findMessage.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "No message found")
    }


    const update = await prisma.message.updateMany({
        where: {
            OR: [
                {
                    senderId: userId, recipient: {
                        role: {
                            in: ['ADMIN', "SUB_ADMIN", 'SUPER_ADMIN']
                        }
                    }
                },
                {
                    recipientId: userId, sender: {
                        role: {
                            in: ['ADMIN', "SUB_ADMIN", 'SUPER_ADMIN']
                        }
                    }
                },
            ]
        },
        data: {
            seen: true
        }
    })


    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Unseen messages updated successfully",
        data: update
    });
})

const getUnseenMessageControllerList = catchAsync(async (req: Request, res: Response) => {
    const { commonkey } = req.params
    const { role } = req.user as TokenCredential

    let unseenMessages;
    if (role === Role.ADMIN || role === Role.SUPER_ADMIN || role === Role.SUB_ADMIN) {
        unseenMessages = await prisma.message.findMany({
            where: { commonkey: commonkey, seen: false, isFromAdmin: Role.USER },
        })
    } else if (role === Role.USER) {
        unseenMessages = await prisma.message.findMany({
            where: { commonkey: commonkey, seen: false, isFromAdmin: { in: [Role.ADMIN, Role.SUPER_ADMIN, Role.SUB_ADMIN] } },
        })
    }

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Unseen messages retrieved successfully",
        data: { unseenMessagesCount: unseenMessages ? unseenMessages.length : 0 },
    });
})

export const unreadMessageController = {
    getUnseenMessageController,
    getUnseenMessageControllerList,
    updateUnseenMessageController,
}

