import catchAsync from "../../../libs/utlitys/catchSynch";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { prisma } from "../../../libs/prismaHelper";
import sendResponse from "../../../libs/sendResponse";
import { PaymentStatus } from "../../payment/payment.constant";
import { ProjectStatus } from "../../Order_page/Order_page.constant";

const getWorldDomination = catchAsync(async (req: Request, res: Response) => {
    const totalWorld = 195;

    const totalUser = await prisma.user.findMany({
        select: {
            country: true,
            Order: {
                where: {
                    projectStatus: ProjectStatus.COMPLETED,
                    paymentStatus: PaymentStatus.PAID
                }
            }
        }
    });

    // Filter out users without a country
    const usersWithCountry = totalUser.filter(user => user.country);

    // Count total payments per country
    const countryPayments = usersWithCountry.reduce((acc: Record<string, number>, user) => {
        if (user.country) {
            acc[user.country] = (acc[user.country] || 0) + user.Order.length;
        }
        return acc;
    }, {});

    const worldDomination = Object.entries(countryPayments).map(([country, paymentCount]) => ({
        country,
        totalPaidPayments: paymentCount,
        percentageOfWorld: ((paymentCount / totalWorld) * 100).toFixed(2) + '%'
    }));

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "World domination payment statistics fetched successfully",
        data: {
            totalCountries: totalWorld,
            // countriesWithPayments: Object.keys(countryPayments).length,
            worldDominationProgress: ((Object.keys(countryPayments).length / totalWorld) * 100).toFixed(2) + '%',
            countryPaymentDetails: worldDomination
        }
    });
});

export const worldDomination = {
    getWorldDomination
}