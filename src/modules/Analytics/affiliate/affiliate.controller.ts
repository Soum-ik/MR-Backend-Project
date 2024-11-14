import { Request, Response } from "express";
import { prisma } from "../../../libs/prismaHelper";
import catchAsync from "../../../libs/utlitys/catchSynch";
import sendResponse from "../../../libs/sendResponse";
import { AFFILIATE_DEFAULT, AFFILIATE_ERRORS, AFFILIATE_SUCCESS } from "./affiliate.constant";
import { TokenCredential } from "../../../libs/authHelper";

const createAffiliate = catchAsync(async (req: Request, res: Response) => {
    const { user_id } = req.user as TokenCredential;

    // Check if user exists
    const user = await prisma.user.findUnique({
        where: { id: user_id }
    });

    if (!user) {
        return sendResponse(res, {
            statusCode: 404,
            success: false,
            message: AFFILIATE_ERRORS.USER_NOT_FOUND
        });
    }

    // Check if user is already an affiliate
    const existingAffiliate = await prisma.affiliate.findFirst({
        where: { userId: user_id }
    });

    if (existingAffiliate) {
        return sendResponse(res, {
            statusCode: 400,
            success: false,
            message: AFFILIATE_ERRORS.USER_ALREADY_AFFILIATE
        });
    }

    // Create new affiliate with default auto-generated link
    const defaultLink = `https://draft.guru/mart/333/aff-auto/${user.userName}`;

    const affiliate = await prisma.affiliate.create({
        data: {
            userId: user_id,
            amount: AFFILIATE_DEFAULT.INITIAL_AMOUNT,
            clicks: AFFILIATE_DEFAULT.INITIAL_CLICKS,
            links: [defaultLink]
        }
    });

    return sendResponse(res, {
        statusCode: 201,
        success: true,
        message: AFFILIATE_SUCCESS.CREATED,
        data: affiliate
    });
});

const getAllAffiliates = catchAsync(async (req: Request, res: Response) => {
    const affiliates = await prisma.affiliate.findMany({
        include: {
            user: {
                select: {
                    userName: true,
                    email: true
                }
            }
        }
    });

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: AFFILIATE_SUCCESS.FETCHED,
        data: affiliates
    });
});

const getAffiliateById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const affiliate = await prisma.affiliate.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    userName: true,
                    email: true
                }
            }
        }
    });

    if (!affiliate) {
        return sendResponse(res, {
            statusCode: 404,
            success: false,
            message: AFFILIATE_ERRORS.AFFILIATE_NOT_FOUND
        });
    }

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: AFFILIATE_SUCCESS.FETCHED,
        data: affiliate
    });
});

const updateAffiliate = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const affiliate = await prisma.affiliate.update({
        where: { id },
        data: updateData
    });

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: AFFILIATE_SUCCESS.UPDATED,
        data: affiliate
    });
});

const deleteAffiliate = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.affiliate.delete({
        where: { id }
    });

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: AFFILIATE_SUCCESS.DELETED
    });
});

export const AffiliateController = {
    createAffiliate,
    getAllAffiliates,
    getAffiliateById,
    updateAffiliate,
    deleteAffiliate
};
