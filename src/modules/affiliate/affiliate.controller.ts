import { Request, Response } from "express";
import { prisma } from "../../libs/prismaHelper";
import catchAsync from "../../libs/utlitys/catchSynch";
import sendResponse from "../../libs/sendResponse";
import { AFFILIATE_DEFAULT, AFFILIATE_ERRORS, AFFILIATE_SUCCESS } from "./affiliate.constant";
import { TokenCredential } from "../../libs/authHelper";
import AppError from "../../errors/AppError";

const createAffiliate = catchAsync(async (req: Request, res: Response) => {
    const { user_id } = req.user as TokenCredential;

    const { link, } = req.body;
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

    const Link = await prisma.affiliate.findFirst({
        where: {
            links: link
        }
    })

    if (Link) {
        throw new AppError(400, " This link is already used");
    }

    const affiliate = await prisma.affiliate.create({
        data: {
            userId: user_id,
            links: link
        }
    });

    return sendResponse(res, {
        statusCode: 201,
        success: true,
        message: AFFILIATE_SUCCESS.CREATED,
        data: affiliate
    });
});

const updateAffiliateClicks = catchAsync(async (req: Request, res: Response) => {
    const { link, affiliate_id } = req.params;

    const affiliate = await prisma.affiliate.update({
        where: { id: affiliate_id, links: link },
        data: {
            clicks: {
                increment: 1
            }
        }
    });

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: AFFILIATE_SUCCESS.UPDATED,
        data: affiliate
    });
});

const deleteAffiliate = catchAsync(async (req: Request, res: Response) => {
    const { affiliate_id, user_id } = req.params;

    if (!affiliate_id || !user_id) {
        throw new AppError(400, "Affiliate ID and User ID are required");
    }

    await prisma.affiliate.delete({
        where: { id: affiliate_id, userId: user_id }
    });

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: AFFILIATE_SUCCESS.DELETED
    });
});

const joinAffiliate = catchAsync(async (req: Request, res: Response) => {
    const { affiliate_id, user_id } = req.body;

    const affiliate = await prisma.affiliateJoin.create({
        data: {
            affiliateId: affiliate_id,
            userId: user_id
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
            AffiliateJoin: {
                select: {
                    id: true,
                    createdAt: true
                }
            },
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    userName: true
                }
            }
        }
    });

    // Transform data to show who joined with whom
    const formattedAffiliates = affiliates.map(affiliate => ({
        affiliateOwner: {
            id: affiliate.user.id,
            fullName: affiliate.user.fullName,
            email: affiliate.user.email,
            userName: affiliate.user.userName
        },
        affiliateLink: affiliate.links,
        clicks: affiliate.clicks,
        amount: affiliate.amount,
        joinedUsers: affiliate.AffiliateJoin.map(join => ({
            joinId: join.id,
            joinedAt: join.createdAt
        }))
    }));

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: AFFILIATE_SUCCESS.FETCHED,
        data: formattedAffiliates
    });
});

export const AffiliateController = {
    createAffiliate,
    deleteAffiliate,
    updateAffiliateClicks,
    joinAffiliate,
    getAllAffiliates
};
