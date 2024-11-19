import { Request, Response } from "express";
import { prisma } from "../../libs/prismaHelper";
import catchAsync from "../../libs/utlitys/catchSynch";
import sendResponse from "../../libs/sendResponse";
import { TokenCredential } from "../../libs/authHelper";
import { USER_ROLE } from "../user/user.constant";
import { senderType } from "@prisma/client";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";


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
    const { userName } = req.params;

    if (!userName) {
        throw new AppError(httpStatus.NOT_ACCEPTABLE, 'User Name need');
    }

    const reviews = await prisma.user.findUnique({
        where: {
            userName: userName
        },
        select: {
            review: {
                where: {
                    senderType: 'OWNER'
                },
                select: {
                    message: true,
                    orderId: true,
                    rating: true,
                    createdAt: true,
                    thumbnail: true,
                    isThumbnail: true,
                    thumbnailWatermark: true,
                    senderType: true,
                    sender: true
                }
            },

        }
    })


    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Reviews retrieved successfully",
        data: reviews
    });
});

const getAllOwnerReviews = catchAsync(async (req: Request, res: Response) => {
    console.log('reciving data');

    const reviews = await prisma.review.findMany({
        where: {
            senderType: 'CLIENT' as senderType
        },
        select: {
            message: true,
            rating: true,
            createdAt: true,
            thumbnail: true,
            isThumbnail: true,
            thumbnailWatermark: true,
            senderType: true,
            sender: {
                select: {
                    userName: true,
                    image: true,
                    fullName: true,
                    country: true
                },
            },
            order: {
                select: {
                    projectName: true,
                    projectNumber: true,
                },
            },
        },

    });
    console.log(reviews, 'review recived');


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
