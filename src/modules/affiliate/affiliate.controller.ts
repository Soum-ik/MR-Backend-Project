import { WEB_CACHE } from './../../config/config';
import { Request, Response } from "express";
import { prisma } from "../../libs/prismaHelper";
import catchAsync from "../../libs/utlitys/catchSynch";
import sendResponse from "../../libs/sendResponse";
import { AFFILIATE_ERRORS, AFFILIATE_SUCCESS } from "./affiliate.constant";
import { TokenCredential } from "../../libs/authHelper";
import AppError from "../../errors/AppError";
import { affiliateWithdrawType, PaymentStatus, ProjectStatus } from "@prisma/client";
import affiliateNumberCreator from "../Order_page/projectNumberGenarator.ts/affiliateNumberCreator";
import httpStatus from 'http-status';

const createAffiliate = catchAsync(async (req: Request, res: Response) => {
    const { user_id } = req.user as TokenCredential;
    const affiliateNumber = await affiliateNumberCreator();
    console.log(affiliateNumber, 'affiliateNumber');

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
            link: trimLink + affiliateNumber
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
        where: { userId: user_id, },
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

    await prisma.user.update({
        where: {
            id: user_id as string
        },
        data: {
            totalEaring: totalEarnings
        }
    })

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: AFFILIATE_SUCCESS.FETCHED,
        data: { totalEarnings, formattedAffiliates }
    });
});

const paymentMethod = catchAsync(async (req: Request, res: Response) => {
    const { user_id } = req.user as TokenCredential;
    const {
        fullname,
        email,
        accountHolderName,
        bankName,
        accountNumber,
        SWIFTCode,
        bankAddress,
        recipientAddress,
    } = req.body;

    // Check if an affiliate profile already exists for this user
    const existingProfile = await prisma.affiliateProfile.findUnique({
        where: { userId: user_id },
    });

    let affiliateProfile;

    if (existingProfile) {
        // Update the existing profile
        affiliateProfile = await prisma.affiliateProfile.update({
            where: { userId: user_id },
            data: {
                fullname,
                email,
                accountHolderName,
                bankName,
                accountNumber,
                SWIFTCode,
                bankAddress,
                recipientAddress,
            },
        });
    } else {
        // Create a new profile
        affiliateProfile = await prisma.affiliateProfile.create({
            data: {
                fullname,
                email,
                accountHolderName,
                bankName,
                accountNumber,
                SWIFTCode,
                bankAddress,
                recipientAddress,
                userId: user_id,
            },
        });
    }

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: existingProfile
            ? 'Affiliate payment method updated successfully'
            : 'Affiliate payment method added successfully',
        data: affiliateProfile,
    });
});

const affiliateProfile = catchAsync(async (req: Request, res: Response) => {
    const { user_id } = req.user as TokenCredential;
    const profile = await prisma.affiliateProfile.findUnique({
        where: {
            userId: user_id
        }
    })

    if (!profile) {
        throw new AppError(httpStatus.NOT_FOUND, 'Affiliate profile not found');
    }

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Profile get successfully",
        data: profile
    });

})


const withDrawRequest = catchAsync(async (req: Request, res: Response) => {
    const { user_id } = req.user as TokenCredential;
    const { ammount } = req.body;
    if (!user_id) {
        throw new AppError(httpStatus.NOT_ACCEPTABLE, 'user_id is required');
    }

    if (ammount < 10) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Withdrawal amount must be greater than or equal to 10');
    }

    if (!ammount || ammount <= 0) {
        throw new AppError(httpStatus.BAD_REQUEST, 'A valid withdrawal amount is required');
    }

    // Query the affiliate record for the user
    const findingUser = await prisma.user.findUnique({
        where: {
            id: user_id,
        },
    });

    if (!findingUser) {
        throw new AppError(httpStatus.NOT_FOUND, 'Affiliate user not found');
    }

    if (findingUser.totalEaring < ammount) {
        throw new AppError(httpStatus.FORBIDDEN, `Insufficient balance to withdraw the requested amount, your balance is ${findingUser.totalEaring} `);
    }

    const userProfile = await prisma.affiliateProfile.findUnique({
        where: {
            userId: user_id
        }
    })

    if (!userProfile) {
        throw new AppError(httpStatus.NOT_ACCEPTABLE, 'User must be have there affilete profile before withdraw');
    }


    // Deduct the amount and update the record
    const updatedAffiliate = await prisma.user.update({
        where: {
            id: findingUser.id,
        },
        data: {
            totalEaring: {
                decrement: ammount
            }
        },
        select: {
            id: true,
        }
    })

    await prisma.affiliateWithdraw.create({
        data: {
            affiliateProfileId: updatedAffiliate.id,
            userId: user_id,
            ammount: ammount
        }
    })

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Withdrawal request processed successfully',
        data: updatedAffiliate,
    });
})

const requestPaymentList = catchAsync(async (req: Request, res: Response) => {
    const findList = await prisma.affiliateWithdraw.findMany({
        select: {
            AffiliateProfile: true,
            status: true,
            ammount: true,
            id: true,
            createdAt :true
        }
    })

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Withdrawal request processed successfully',
        data: findList,
    });
})

const withDrawRequestUpdateAction = catchAsync(async (req: Request, res: Response) => {
    const { id, action } = req.body;

    if (!id || !action) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Both id and action are required');
    }
    if (![affiliateWithdrawType.APPROVED, affiliateWithdrawType.REJECTED].includes(action)) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid action, should be either "APPROVED" or "REJECTED"');
    }

    const findWithdrawRequest = await prisma.affiliateWithdraw.update({
        where: {
            id,
        },
        data: {
            status: action as affiliateWithdrawType
        }
    });

    if (action === 'REJECTED' && findWithdrawRequest) {

        const userTotalAmmount = await prisma.user.findUnique({
            where: {
                id: findWithdrawRequest.userId as string
            },
            select: {
                totalEaring: true
            }
        })

        if (userTotalAmmount) {
            const totalPrice = findWithdrawRequest.ammount as number + userTotalAmmount.totalEaring as number

            await prisma.user.update({
                where: {
                    id: findWithdrawRequest.userId
                },
                data: {
                    totalEaring: {
                        set: totalPrice
                    }
                }
            })
        }
    }

    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: `Withdrawal request with ID ${id} ${action}d successfully`,
        data: findWithdrawRequest,
    });
})

export const AffiliateController = {
    createAffiliate,
    deleteAffiliate,
    updateAffiliateClicks,
    getAllAffiliates,
    usersAffiliate,
    paymentMethod,
    withDrawRequest,
    requestPaymentList,
    affiliateProfile,
    withDrawRequestUpdateAction
};
