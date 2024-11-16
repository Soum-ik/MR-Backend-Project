import catchAsync from "../../../libs/utlitys/catchSynch";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { prisma } from "../../../libs/prismaHelper";
import sendResponse from "../../../libs/sendResponse";
import { PaymentStatus } from "../../payment/payment.constant";
import { ProjectStatus } from "../../Order_page/Order_page.constant";
import { countries, getCountryCode } from 'countries-list'

const getWorldDomination = catchAsync(async (req: Request, res: Response) => {
    const totalWorld = 195;

    const totalUser = await prisma.order.findMany({
        where: {
            paymentStatus: PaymentStatus.PAID,
            projectStatus: ProjectStatus.COMPLETED
        },
        select: {
            user: {
                select: {
                    country: true
                }
            }
        }
    });

    const country = totalUser.map((user) => user.user.country);



    // Filter out users without a country
    // const usersWithCountry = totalUser.filter((user): user is typeof user & { country: string } => Boolean(user.country));

    // // Count total payments per country
    // const countryPayments = usersWithCountry.reduce((acc: Record<string, number>, user) => {
    //     if (user.country) {
    //         const countryCode = getCountryCode(user.country);
    //         if (countryCode) {
    //             acc[countryCode] = (acc[countryCode] || 0) + user.Order.length;
    //         }
    //     }
    //     return acc;
    // }, {});

    // const worldDomination = Object.entries(countryPayments).map(([countryCode, paymentCount]) => ({
    //     country: countryCode,
    //     // countryName: countries[countryCode]?.name || 'Unknown',
    //     totalPaidPayments: paymentCount,
    //     percentageOfWorld: ((paymentCount / totalWorld) * 100).toFixed(2) + '%'
    // }));

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "World domination payment statistics fetched successfully",
        data: {
            country
            // totalCountries: worldDomination.length,
            // worldDominationProgress: ((worldDomination.length / totalWorld) * 100).toFixed(2) + '%',
            // countryPaymentDetails: worldDomination.sort((a, b) => b.totalPaidPayments - a.totalPaidPayments)
        }
    });
});

export const worldDomination = {
    getWorldDomination
}