import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import catchAsync from '../../../libs/utlitys/catchSynch';
import {
    timeFilterSchema,
} from '../../../utils/calculateDateRange';
import { getTimeFilterWhereClause } from '../../../utils/timeFilter';
import { CategorySummary, Project } from './Category.interface';

export const Cetagorys = catchAsync(async (req: Request, res: Response) => {
    const parseResult = getTimeFilterWhereClause(timeFilterSchema, req.query.timeFilter);

    if (parseResult.error) {
        sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'Invalid time filter',
            data: null,
        });
        return;
    }
    const { whereClause } = parseResult;

    const [Offer, Custom, MD_Porject, Direct] = await Promise.all([
        prisma.order.findMany({
            where: {
                ...whereClause,
                projectType: "OFFER",
                projectStatus: "Completed",
                paymentStatus: "PAID"
            }
        }),
        prisma.order.findMany({
            where: {
                ...whereClause,
                projectType: "CUSTOM",
                projectStatus: "Completed",
                paymentStatus: "PAID"
            }
        }),
        prisma.order.findMany({
            where: {
                ...whereClause,
                projectType: "MD_PROJECT",
                projectStatus: "Completed",
                paymentStatus: "PAID"
            }
        }),
        prisma.order.findMany({
            where: {
                ...whereClause,
                projectType: "DIRECT",
                projectStatus: "Completed",
                paymentStatus: "PAID"
            }
        })
    ])


    const offerTotal = Offer.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);
    const customTotal = Custom.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);
    const mdTotal = MD_Porject.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);


    const directs = Direct.map(item => item.items[0]).map(categoryName => (categoryName))



    // Process data to get summary
    const summary = (directs as unknown as Project[]).reduce<CategorySummary[]>((acc, project) => {
        const { categoryName, totalAmount }: Project = project;

        // Find or add the category
        const category = acc.find((item) => item.name === categoryName);
        if (category) {
            category.projects += 1;
            category.Earnings += totalAmount;
        } else {
            acc.push({
                name: categoryName,
                projects: 1,
                Earnings: totalAmount,
            });
        }

        return acc;
    }, []);

    const data = [
        { name: "Offer Project", projects: Offer.length, Earnings: offerTotal },
        { name: "Custom Offer", projects: Custom.length, Earnings: customTotal },
        { name: "M-D Project", projects: MD_Porject.length, Earnings: mdTotal },
        ...summary,

    ]

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Find Avg selling successfully',
        data: data
    });

})