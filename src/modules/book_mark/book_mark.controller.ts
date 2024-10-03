import { prisma } from '../../libs/prismaHelper'
import { Request, Response } from "express";
import httpStatus from "http-status"; // You can replace this with hardcoded status codes if needed
import sendResponse from '../../libs/sendResponse';



// Function to get the bookmark status of a user
export const getBookmarkStatus = async (req: Request, res: Response) => {


    try {
        const user = await prisma.user.findMany({
            select: {
                book_mark: true, id: true
            }
        });

        if (!user) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: "User not found",
            });
        }

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Bookmark status retrieved successfully",
            data: { user },
        });
    } catch (error) {
        console.error("Error fetching bookmark status:", error);
        sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Internal server error",
        });
    }
};

// Function to toggle the bookmark status
export const toggleBookmarkStatus = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: "User not found",
            });
        }

        // Toggle the bookmark state
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                book_mark: !user.book_mark, // Toggle bookmark state
            },
        });

        sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Bookmark status updated successfully",
            data: { book_mark: updatedUser.book_mark },
        });
    } catch (error) {
        console.error("Error toggling bookmark status:", error);
        sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Internal server error",
        });
    }
};
