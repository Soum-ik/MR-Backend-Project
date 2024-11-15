import { Request, Response } from "express";
import { prisma } from "../../libs/prismaHelper";
import catchAsync from "../../libs/utlitys/catchSynch";
import sendResponse from "../../libs/sendResponse";
import { AFFILIATE_DEFAULT, AFFILIATE_ERRORS, AFFILIATE_SUCCESS } from "./affiliate.constant";
import { TokenCredential } from "../../libs/authHelper";
import AppError from "../../errors/AppError";
import { PaymentStatus, ProjectStatus } from "@prisma/client";

const createAffiliate = catchAsync(async (req: Request, res: Response) => {
    const { user_id } = req.user as TokenCredential;

    const { link }: { link: string } = req.body;
    const user = await prisma.user.findUnique({
        where: { id: user_id }
    });

    const trimLink = link.split(" ").join("-");

    if (!user) {
        return sendResponse(res, {
            statusCode: 404,
            success: false,
            message: AFFILIATE_ERRORS.USER_NOT_FOUND
        });
    }

    const Link = await prisma.affiliate.findFirst({
        where: {
            link: trimLink
        }
    })

    if (Link) {
        throw new AppError(400, " This link is already used");
    }

    const affiliate = await prisma.affiliate.create({
        data: {
            userId: user_id,
            link: trimLink
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
    const { link, affiliate_id } = req.query;


    if (!affiliate_id && !link) {
        throw new AppError(400, "At least one of Affiliate ID or Link is required");
    }

    // First find the affiliate
    const existingAffiliate = await prisma.affiliate.findFirst({
        where: {
            OR: [
                { id: affiliate_id?.toString() },
                { link: link?.toString() }
            ]
        }
    });

    if (!existingAffiliate) {
        throw new AppError(404, "Affiliate not found");
    }

    // Then update using the found ID
    const affiliate = await prisma.affiliate.update({
        where: {
            id: existingAffiliate.id
        },
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
    const { affiliate_link, user_id } = req.query;

    if (!affiliate_link || !user_id) {
        throw new AppError(400, "Affiliate ID and User ID are required");
    }

    await prisma.affiliate.delete({
        where: { link: affiliate_link?.toString(), userId: user_id?.toString() }
    });

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: AFFILIATE_SUCCESS.DELETED
    });
});

const getAllAffiliates = catchAsync(async (req: Request, res: Response) => {
    const affiliates = await prisma.affiliate.findMany({
        include: {
            AffiliateJoin: {
                select: {
                    id: true,
                    createdAt: true,
                    userId: true,
                    user: {
                        select: {
                            Order: {
                                select: {
                                    totalPrice: true
                                }
                            }
                        }
                    }
                }
            },
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    userName: true,
                    totalOrder: true,
                    Order: {
                        select: {
                            totalPrice: true
                        },
                        where: {
                            projectStatus: "Completed",
                        }
                    }
                }
            }
        }
    });
    async function getUserName(user_id: string) {
        const user = await prisma.user.findUnique({
            where: { id: user_id }
        });
        return user?.userName;
    }

    // Transform data to show who joined with whom
    const formattedAffiliates = await Promise.all(affiliates.map(async affiliate => ({
        affiliateOwner: {
            id: affiliate.user.id,
            fullName: affiliate.user.fullName,
            email: affiliate.user.email,
            userName: affiliate.user.userName,
        },
        affiliateLink: affiliate.link,
        clicks: affiliate.clicks,
        amount: affiliate.amount,
        joinedUsers: await Promise.all(affiliate.AffiliateJoin.map(async join => ({
            joinId: join.userId,
            createdAt: join.createdAt,
            userName: await getUserName(join.userId),
            totalOrders: join.user.Order.length,
            totalAmount: join.user.Order.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0)
        })))
    })));

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: AFFILIATE_SUCCESS.FETCHED,
        data: formattedAffiliates
    });
});

const usersAffiliate = catchAsync(async (req: Request, res: Response) => {
    const { user_id } = req.user as TokenCredential;

    const affiliates = await prisma.affiliate.findMany({
        where: { userId: user_id },
        include: {
            AffiliateJoin: {
                include: {
                    user: {
                        select: {
                            Order: {
                                where: {
                                    projectStatus: "Completed"
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const formattedAffiliates = affiliates.map(affiliate => ({
        links: affiliate.link,
        totalClicks: affiliate.clicks,
        join: affiliate.AffiliateJoin.length,
        sales: affiliate.AffiliateJoin.reduce((acc, join) => acc + join.user.Order.length, 0)
    }));

    const totalAmount = await prisma.affiliateJoin.findMany({
        select: {
            user: {
                include: {
                    Order: {
                        where: {
                            projectStatus: ProjectStatus.Completed,
                            paymentStatus: PaymentStatus.PAID
                        },
                        select: {
                            totalPrice: true
                        }
                    }
                }
            }
        }
    })

    const totalEarnings = totalAmount.reduce((acc, join) => acc + join.user.Order.length * 5, 0);






    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: AFFILIATE_SUCCESS.FETCHED,
        data: { totalEarnings, formattedAffiliates }
    });
});

export const AffiliateController = {
    createAffiliate,
    deleteAffiliate,
    updateAffiliateClicks,
    getAllAffiliates,
    usersAffiliate
};
