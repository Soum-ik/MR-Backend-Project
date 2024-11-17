import { Request, Response } from "express";
import { prisma } from "../../libs/prismaHelper";
import catchAsync from "../../libs/utlitys/catchSynch";
import sendResponse from "../../libs/sendResponse";
import { TokenCredential } from "../../libs/authHelper";
import { USER_ROLE } from "../user/user.constant";
import { senderType } from "@prisma/client";


const createReview = catchAsync(async (req: Request, res: Response) => {
    const { message, rating, orderId } = req.body;
    const { role, user_id } = req.user as TokenCredential;

    const senderType = role === USER_ROLE.USER ? "CLIENT" : "OWNER";

    const review = await prisma.review.create({
        data: {
            message,
            rating,
            senderType,
            senderId: user_id,
            orderId: orderId,
        },
    });

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Review created successfully",
        data: review,
    });
});


const getReviewsByOrderId = catchAsync(async (req: Request, res: Response) => {
    const { role } = req.user as TokenCredential;
    const { orderId } = req.params;

    // If user is CLIENT, show OWNER reviews and vice versa
    const senderTypeToShow = role === USER_ROLE.USER ? "OWNER" : "CLIENT";

    const reviews = await prisma.review.findMany({
        where: {
            orderId: orderId,
            senderType: senderTypeToShow
        },
        include: {
            sender: {
                select: {
                    userName: true,
                    image: true
                }
            }
        }
    });

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Reviews retrieved successfully",
        data: reviews
    });
});

const getAllOwnerReviews = catchAsync(async (req: Request, res: Response) => {
    const reviews = await prisma.review.findMany({
        where: {
            senderType: "OWNER" as senderType
        },
        // include: {
        //     sender: {
        //         select: {
        //             userName: true,
        //             image: true
        //         }
        //     },
        //     order: {
        //         select: {
        //             projectName: true,
        //             projectNumber: true
        //         }
        //     }
        // },
        
    });

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Owner reviews retrieved successfully",
        data: reviews
    });
});


export const ReviewController = {
    createReview,
    getReviewsByOrderId,
    getAllOwnerReviews
};
