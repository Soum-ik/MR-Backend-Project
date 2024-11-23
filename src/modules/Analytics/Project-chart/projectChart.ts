import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import catchAsync from '../../../libs/utlitys/catchSynch';
import {
    TIME_FILTER_OPTIONS,
    timeFilterSchema,
} from '../../../utils/calculateDateRange';
import AppError from '../../../errors/AppError';



const calculateDateRange = (timeFilter: string) => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (timeFilter) {
        case TIME_FILTER_OPTIONS.TODAY:
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date(now.setHours(23, 59, 59, 999));
            break;
        case TIME_FILTER_OPTIONS.LAST_7_DAYS:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = now;
            break;
        case TIME_FILTER_OPTIONS.LAST_30_DAYS:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = now;
            break;
        case TIME_FILTER_OPTIONS.THIS_MONTH:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = now;
            break;
        case TIME_FILTER_OPTIONS.LAST_MONTH:
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            startDate = lastMonth;
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        case TIME_FILTER_OPTIONS.LAST_3_MONTHS:
            startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            endDate = now;
            break;
        case TIME_FILTER_OPTIONS.LAST_6_MONTHS:
            startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
            endDate = now;
            break;
        case TIME_FILTER_OPTIONS.LAST_YEAR:
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            endDate = new Date(now.getFullYear() - 1, 11, 31);
            break;
        case TIME_FILTER_OPTIONS.LAST2_YEAR:
            startDate = new Date(now.getFullYear() - 2, 0, 1);
            endDate = new Date(now.getFullYear() - 2, 11, 31);
            break;
        case TIME_FILTER_OPTIONS.THIS_YEAR:
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = now;
            break;
        default:
            startDate = new Date(2024, 0, 1);
            endDate = now;
    }

    return { startDate, endDate };
};

const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};



const getProjectAnalytics = catchAsync(async (req: Request, res: Response) => {
    const parseResult = timeFilterSchema.safeParse(req.query.timeFilter);
    if (!parseResult.success) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'Invalid time filter',
            data: null,
        });
    }

    const timeFilter = parseResult.data;

    const { startDate, endDate } =
        timeFilter === TIME_FILTER_OPTIONS.ALL_TIME
            ? {
                startDate: new Date(2024, 0, 1),
                endDate: new Date(),
            }
            : calculateDateRange(timeFilter);

    let projectData;

    if (!startDate) {
        return new AppError(httpStatus.NOT_FOUND, 'Start date are not found')
    }

    switch (timeFilter) {
        case TIME_FILTER_OPTIONS.TODAY:
        case TIME_FILTER_OPTIONS.LAST_7_DAYS:
        case TIME_FILTER_OPTIONS.LAST_30_DAYS:
        case TIME_FILTER_OPTIONS.THIS_MONTH:
        case TIME_FILTER_OPTIONS.LAST_MONTH:
            projectData = await getOrderDataByPeriod(startDate, endDate, 'day', formatDate,);
            break;
        case TIME_FILTER_OPTIONS.LAST_3_MONTHS:
            projectData = await getOrderDataByPeriod(startDate, endDate, '15days', formatDate);
            break;
        case TIME_FILTER_OPTIONS.LAST_6_MONTHS:
            projectData = await getOrderDataByPeriod(startDate, endDate, 'month');
            break;
        case TIME_FILTER_OPTIONS.LAST_YEAR:
        case TIME_FILTER_OPTIONS.THIS_YEAR:
        case TIME_FILTER_OPTIONS.LAST2_YEAR:
            projectData = await getYearlyOrderData(startDate, endDate);
            break;
        case TIME_FILTER_OPTIONS.ALL_TIME:
            projectData = await getAllTimeOrderDataGroupedByYear(startDate, endDate);
    }

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Projects analytics fetched successfully',
        data: projectData,
    });
});


async function getOrderDataByPeriod(
    startDate: Date, endDate: Date, aggregationType: '15days' | 'month' | 'day', dateFormatter?: (date: Date) => string,
) {
    const periods = calculatePeriods(startDate, endDate, aggregationType);

    return Promise.all(
        periods.map(async (period) => {
            const [newOrders, completedOrders, canceledOrders] = await Promise.all([
                prisma.order.count({
                    where: {
                        createdAt: {
                            gte: period.start,
                            lt: period.end,
                        },
                        projectStatus: 'Ongoing', // Assuming "new" status for new orders
                    },
                }),
                prisma.order.count({
                    where: {
                        createdAt: {
                            gte: period.start,
                            lt: period.end,
                        },
                        projectStatus: "Completed"
                    },
                }),
                prisma.order.count({
                    where: {
                        createdAt: {
                            gte: period.start,
                            lt: period.end,
                        },
                        projectStatus: "Canceled"
                    },
                }),
            ]);

            const newOrdersEarnings = await prisma.order.findMany({
                select: {
                    totalPrice: true
                },
                where: {
                    createdAt: {
                        gte: period.start,
                        lt: period.end,
                    },
                    projectStatus: "Ongoing"
                },
            });

            const completedOrdersEarnings = await prisma.order.findMany({
                select: {
                    totalPrice: true
                },
                where: {
                    createdAt: {
                        gte: period.start,
                        lt: period.end,
                    },
                    projectStatus: "Completed"
                },

            });

            const canceledOrdersEarnings = await prisma.order.findMany({
                select: {
                    totalPrice: true
                },
                where: {
                    createdAt: {
                        gte: period.start,
                        lt: period.end,
                    },



                    projectStatus: "Canceled"
                },
            });

            return {
                date: dateFormatter
                    ? dateFormatter(period.start)
                    : period.start.toLocaleString('default', { month: 'long' }),
                newOrders,
                newOrdersEarnings: calculateTotalPrice(newOrdersEarnings) || 0,
                completedOrders,
                completedOrdersEarnings: calculateTotalPrice(completedOrdersEarnings) || 0,
                canceledOrders,
                canceledOrdersEarnings: calculateTotalPrice(canceledOrdersEarnings) || 0,
            };
        }),
    );
}

// Function to fetch yearly order data
async function getYearlyOrderData(startDate: Date, endDate: Date) {
    const yearsToFetch = Math.ceil(
        endDate.getFullYear() - startDate.getFullYear() + 1,
    );
    const yearlyData = [];

    for (let i = 0; i < yearsToFetch; i++) {
        const currentYear = startDate.getFullYear() + i;

        const yearData = await Promise.all(
            Array.from({ length: 12 }, (_, monthIndex) => {
                const monthStart = new Date(currentYear, monthIndex, 1);
                const monthEnd = new Date(currentYear, monthIndex + 1, 1);

                return getOrdersForPeriod(
                    monthStart,
                    monthEnd,
                    currentYear,
                    monthIndex,
                );
            }),
        );

        yearlyData.push(...yearData);
    }

    return yearlyData;
}

// Helper function to fetch orders for a given period (month, year)
async function getOrdersForPeriod(
    monthStart: Date,
    monthEnd: Date,
    year: number,
    monthIndex: number,
) {
    const [newOrders, completedOrders, canceledOrders] = await Promise.all([
        prisma.order.count({
            where: {
                createdAt: {
                    gte: monthStart,
                    lt: monthEnd,
                },
                projectStatus: "Ongoing"
            },
        }),
        prisma.order.count({
            where: {
                createdAt: {
                    gte: monthStart,
                    lt: monthEnd,
                },
                projectStatus: "Completed"
            },
        }),
        prisma.order.count({
            where: {
                createdAt: {
                    gte: monthStart,
                    lt: monthEnd,
                },
                projectStatus: "Canceled"
            },
        }),
    ]);

    const newOrdersEarnings = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: monthStart,
                lt: monthEnd,
            },
            projectStatus: "Ongoing",
        },
        select: {
            totalPrice: true
        }
    });

    const completedOrdersEarnings = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: monthStart,
                lt: monthEnd,
            },
            projectStatus: "Completed"
        },
        select: {
            totalPrice: true
        }
    });

    const canceledOrdersEarnings = await prisma.order.findMany({
        where: {
            createdAt: {
                gte: monthStart,
                lt: monthEnd,
            },
            projectStatus: "Canceled"
        },
        select: {
            totalPrice: true
        }
    });

    return {
        date: `${new Date(year, monthIndex).toLocaleString('default', {
            month: 'long',
        })} ${year}`,
        newOrders,
        newOrdersEarnings: calculateTotalPrice(newOrdersEarnings) || 0,
        completedOrders,
        completedOrdersEarnings: calculateTotalPrice(completedOrdersEarnings) || 0,
        canceledOrders,
        canceledOrdersEarnings: calculateTotalPrice(canceledOrdersEarnings) || 0,
    };
}

async function getAllTimeOrderDataGroupedByYear(startDate: Date, endDate: Date) {
    try {

      // Get the list of years in the range
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
  
      const results = [];
      for (let year = startYear; year <= endYear; year++) {
        const yearStart = new Date(`${year}-01-01`);
        const yearEnd = new Date(`${year + 1}-01-01`);
  
        // Fetch orders counts for each project status
        const [newOrders, completedOrders, canceledOrders] = await Promise.all([
          prisma.order.count({
            where: {
              createdAt: { gte: yearStart, lt: yearEnd },
              projectStatus: "Ongoing",
            },
          }),
          prisma.order.count({
            where: {
              createdAt: { gte: yearStart, lt: yearEnd },
              projectStatus: "Completed",
            },
          }),
          prisma.order.count({
            where: {
              createdAt: { gte: yearStart, lt: yearEnd },
              projectStatus: "Canceled",
            },
          }),
        ]);
  
        // Fetch earnings for each project status
        const [
          newOrdersEarnings,
          completedOrdersEarnings,
          canceledOrdersEarnings,
        ] = await Promise.all([
          prisma.order.findMany({
            where: {
              createdAt: { gte: yearStart, lt: yearEnd },
              projectStatus: "Ongoing",
            },
            select: { totalPrice: true },
          }),
          prisma.order.findMany({
            where: {
              createdAt: { gte: yearStart, lt: yearEnd },
              projectStatus: "Completed",
            },
            select: { totalPrice: true },
          }),
          prisma.order.findMany({
            where: {
              createdAt: { gte: yearStart, lt: yearEnd },
              projectStatus: "Canceled",
            },
            select: { totalPrice: true },
          }),
        ]);
  
        // Push the results for the year
        results.push({
          date: year.toString(),
          newOrders,
          newOrdersEarnings: calculateTotalPrice(newOrdersEarnings) || 0,
          completedOrders,
          completedOrdersEarnings: calculateTotalPrice(completedOrdersEarnings) || 0,
          canceledOrders,
          canceledOrdersEarnings: calculateTotalPrice(canceledOrdersEarnings) || 0,
        });
      }
  
      return results;
    } catch (error) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Error fetching all-time order data grouped by year"
      );
    }
  }

function calculatePeriods(
    startDate: Date,
    endDate: Date,
    type: '15days' | 'month' | 'day',
) {
    const periods = [];
    let currentStart = new Date(startDate);

    while (currentStart < endDate) {
        let currentEnd;

        switch (type) {
            case '15days':
                currentEnd = new Date(currentStart);
                currentEnd.setDate(currentStart.getDate() + 15);
                break;
            case 'month':
                currentEnd = new Date(
                    currentStart.getFullYear(),
                    currentStart.getMonth() + 1,
                    1,
                );
                break;
            default:
                currentEnd = new Date(currentStart);
                currentEnd.setDate(currentStart.getDate() + 1);
        }

        if (currentEnd > endDate) {
            currentEnd = endDate;
        }

        periods.push({ start: new Date(currentStart), end: currentEnd });
        currentStart = currentEnd;
    }

    return periods;
}


const calculateTotalPrice = (orders: { totalPrice: string }[]) => {
    return Number(
        orders.reduce((sum, order) => {
            const price = parseInt(order.totalPrice.replace(/[^0-9.-]+/g, ""));
            return sum + (isNaN(price) ? 0 : price);
        }, 0).toFixed(2)
    );
};

export default getProjectAnalytics


