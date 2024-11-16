import catchAsync from "../../../libs/utlitys/catchSynch";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { prisma } from "../../../libs/prismaHelper";
import sendResponse from "../../../libs/sendResponse";
import { PaymentStatus } from "../../payment/payment.constant";
import { ProjectStatus } from "../../Order_page/Order_page.constant";
import { getCountryCode, TCountryCode } from 'countries-list'

const getWorldDomination = catchAsync(async (req: Request, res: Response) => {
    const totalWorld = 195;

    const orderWithCountry = await prisma.order.findMany({
        where: {
            paymentStatus: PaymentStatus.PAID,
            projectStatus: ProjectStatus.COMPLETED
        },
        select: {
            user: {
                select: {
                    country: true
                }
            },
            totalPrice: true
        }
    });

    // Calculate total completed orders for percentage calculations
    const totalCompletedOrders = orderWithCountry.length;

    const worldDomiation = ((orderWithCountry.length / totalWorld) * 100).toFixed(2) + '%';

    // Aggregate country-wise data
    const countryDetails: Record<string, { totalEarned: number, count: number }> = orderWithCountry.reduce((acc, user) => {
        const country = user.user.country;
        if (country) {
            if (!acc[country]) {
                acc[country] = { totalEarned: 0, count: 0 };
            }
            acc[country].totalEarned += parseFloat(user.totalPrice);
            acc[country].count++;
        }
        return acc;
    }, {} as Record<string, { totalEarned: number, count: number }>);

    // Build the final output
    const worldDominationDetails = Object.entries(countryDetails).map(([country, details]) => {
        const percentage = ((details.count / totalCompletedOrders) * 100).toFixed(2);
        return {
            country: getCountryCode(country),
            value: `Earned $${details.totalEarned.toFixed(2)} & World ${percentage}%`
        };
    }).reduce((unique, item) => {
        const existingItem = unique.find(i => i.country === item.country);
        if (existingItem) {
            existingItem.value = `Earned $${(parseFloat(existingItem.value.split('$')[1].split(' &')[0]) + parseFloat(item.value.split('$')[1].split(' &')[0])).toFixed(2)} & World ${((parseFloat(existingItem.value.split('World ')[1].split('%')[0]) + parseFloat(item.value.split('World ')[1].split('%')[0]))).toFixed(2)}%`;
        } else {
            unique.push(item);
        }
        return unique;
    }, [] as { country: false | TCountryCode; value: string; }[]);


    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "World domination payment statistics fetched successfully",
        data: {
            worldDomiation,
            worldDominationDetails
        }
    });
});

export const worldDomination = {
    getWorldDomination
}