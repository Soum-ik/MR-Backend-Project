import type { Request, Response } from "express";
import { TokenCredential } from "../../../libs/authHelper";
import sendResponse from "../../../libs/sendResponse";
import httpStatus from "http-status";
import { prisma } from "../../../libs/prismaHelper";


// Get notifications for a user
export const getNotifications = async (req: Request, res: Response) => {
    const user_id = (req.user as TokenCredential)?.user_id;

    if (!user_id) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.UNAUTHORIZED,
            success: false,
            message: "User not authenticated!",
        });
    }

    try {
        // Fetch notifications for the recipient (current logged-in user)
        const notifications = await prisma.notification.findMany({
            where: {
                recipientId: user_id as string,
            },
            orderBy: {
                createdAt: 'desc', // Sort by most recent notifications first
            },
            include: {
                message: true, // Optionally include related message details
            },
        });

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: notifications,
        });
    } catch (error) {
        console.error(error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Error fetching notifications.",
        });
    }
};
