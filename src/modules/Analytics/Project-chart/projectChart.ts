// import { Request, Response } from 'express';
// import httpStatus from 'http-status';
// import { prisma } from '../../../libs/prismaHelper'; // Assuming Prisma helper exists
// import sendResponse from '../../../libs/sendResponse'; // Assuming sendResponse utility exists
// import catchAsync from '../../../libs/utlitys/catchSynch'; // Assuming catchAsync utility exists
// import {
//   TIME_FILTER_OPTIONS,
//   timeFilterSchema,
// } from '../../../utils/calculateDateRange'; // Assuming timeFilterSchema exists

// // Function to get project analytics based on time filters
// const getProjectAnalytics = catchAsync(async (req: Request, res: Response) => {
//   const parseResult = timeFilterSchema.safeParse(req.query.timeFilter);
//   if (!parseResult.success) {
//     return sendResponse(res, {
//       statusCode: httpStatus.BAD_REQUEST,
//       success: false,
//       message: 'Invalid time filter',
//       data: null,
//     });
//   }

//   const timeFilter = parseResult.data;

//   const { startDate, endDate } =
//     timeFilter === TIME_FILTER_OPTIONS.ALL_TIME
//       ? {
//           startDate: new Date(2024, 0, 1),
//           endDate: new Date(),
//         }
//       : calculateDateRange(timeFilter);

//   let projectData;

//   switch (timeFilter) {
//     case TIME_FILTER_OPTIONS.TODAY:
//     case TIME_FILTER_OPTIONS.LAST_7_DAYS:
//     case TIME_FILTER_OPTIONS.LAST_30_DAYS:
//     case TIME_FILTER_OPTIONS.THIS_MONTH:
//     case TIME_FILTER_OPTIONS.LAST_MONTH:
//       projectData = await getOrderDataByPeriod(startDate, endDate, 'day');
//       break;
//     case TIME_FILTER_OPTIONS.LAST_3_MONTHS:
//       projectData = await getOrderDataByPeriod(startDate, endDate, '15days');
//       break;
//     case TIME_FILTER_OPTIONS.LAST_6_MONTHS:
//       projectData = await getOrderDataByPeriod(startDate, endDate, 'month');
//       break;
//     case TIME_FILTER_OPTIONS.LAST_YEAR:
//     case TIME_FILTER_OPTIONS.THIS_YEAR:
//     case TIME_FILTER_OPTIONS.LAST2_YEAR:
//       projectData = await getYearlyOrderData(startDate, endDate);
//       break;
//     case TIME_FILTER_OPTIONS.ALL_TIME:
//       projectData = await getAllTimeOrderData(startDate, endDate);
//   }

//   return sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'Projects analytics fetched successfully',
//     data: projectData,
//   });
// });

// // Function to fetch order data grouped by periods (day, 15 days, etc.)
// async function getOrderDataByPeriod(
//   startDate: Date,
//   endDate: Date,
//   aggregationType: '15days' | 'month' | 'day',
// ) {
//   const periods = calculatePeriods(startDate, endDate, aggregationType);

//   return Promise.all(
//     periods.map(async (period) => {
//       const [newOrders, completedOrders, canceledOrders] = await Promise.all([
//         prisma.order.count({
//           where: {
//             createdAt: {
//               gte: period.start,
//               lt: period.end,
//             },
//             orderStatus: 'new', // Assuming "new" status for new orders
//           },
//         }),
//         prisma.order.count({
//           where: {
//             createdAt: {
//               gte: period.start,
//               lt: period.end,
//             },
//             orderStatus: 'completed', // Assuming "completed" status
//           },
//         }),
//         prisma.order.count({
//           where: {
//             createdAt: {
//               gte: period.start,
//               lt: period.end,
//             },
//             orderStatus: 'canceled', // Assuming "canceled" status
//           },
//         }),
//       ]);

//       const newOrdersEarnings = await prisma.order.aggregate({
//         _sum: {
//           totalPrice: true,
//         },
//         where: {
//           createdAt: {
//             gte: period.start,
//             lt: period.end,
//           },
//           orderStatus: 'new',
//         },
//       });

//       const completedOrdersEarnings = await prisma.order.aggregate({
//         _sum: {
//           totalPrice: true,
//         },
//         where: {
//           createdAt: {
//             gte: period.start,
//             lt: period.end,
//           },
//           orderStatus: 'completed',
//         },
//       });

//       const canceledOrdersEarnings = await prisma.order.aggregate({
//         _sum: {
//           totalPrice: true,
//         },
//         where: {
//           createdAt: {
//             gte: period.start,
//             lt: period.end,
//           },
//           orderStatus: 'canceled',
//         },
//       });

//       return {
//         date: period.start.toLocaleDateString('en-US', {
//           month: 'short',
//           day: 'numeric',
//           year: 'numeric',
//         }),
//         newOrders,
//         newOrdersEarnings: newOrdersEarnings._sum.totalPrice || 0,
//         completedOrders,
//         completedOrdersEarnings: completedOrdersEarnings._sum.totalPrice || 0,
//         canceledOrders,
//         canceledOrdersEarnings: canceledOrdersEarnings._sum.totalPrice || 0,
//       };
//     }),
//   );
// }

// // Function to fetch yearly order data
// async function getYearlyOrderData(startDate: Date, endDate: Date) {
//   const yearsToFetch = Math.ceil(
//     endDate.getFullYear() - startDate.getFullYear() + 1,
//   );
//   const yearlyData = [];

//   for (let i = 0; i < yearsToFetch; i++) {
//     const currentYear = startDate.getFullYear() + i;

//     const yearData = await Promise.all(
//       Array.from({ length: 12 }, (_, monthIndex) => {
//         const monthStart = new Date(currentYear, monthIndex, 1);
//         const monthEnd = new Date(currentYear, monthIndex + 1, 1);

//         return getOrdersForPeriod(
//           monthStart,
//           monthEnd,
//           currentYear,
//           monthIndex,
//         );
//       }),
//     );

//     yearlyData.push(...yearData);
//   }

//   return yearlyData;
// }

// // Helper function to fetch orders for a given period (month, year)
// async function getOrdersForPeriod(
//   monthStart: Date,
//   monthEnd: Date,
//   year: number,
//   monthIndex: number,
// ) {
//   const [newOrders, completedOrders, canceledOrders] = await Promise.all([
//     prisma.order.count({
//       where: {
//         createdAt: {
//           gte: monthStart,
//           lt: monthEnd,
//         },
//         orderStatus: 'new',
//       },
//     }),
//     prisma.order.count({
//       where: {
//         createdAt: {
//           gte: monthStart,
//           lt: monthEnd,
//         },
//         orderStatus: 'completed',
//       },
//     }),
//     prisma.order.count({
//       where: {
//         createdAt: {
//           gte: monthStart,
//           lt: monthEnd,
//         },
//         orderStatus: 'canceled',
//       },
//     }),
//   ]);

//   const newOrdersEarnings = await prisma.order.aggregate({
//     _sum: { totalPrice: true },
//     where: {
//       createdAt: {
//         gte: monthStart,
//         lt: monthEnd,
//       },
//       orderStatus: 'new',
//     },
//   });

//   const completedOrdersEarnings = await prisma.order.aggregate({
//     _sum: { totalPrice: true },
//     where: {
//       createdAt: {
//         gte: monthStart,
//         lt: monthEnd,
//       },
//       orderStatus: 'completed',
//     },
//   });

//   const canceledOrdersEarnings = await prisma.order.aggregate({
//     _sum: { totalPrice: true },
//     where: {
//       createdAt: {
//         gte: monthStart,
//         lt: monthEnd,
//       },
//       orderStatus: 'canceled',
//     },
//   });

//   return {
//     date: `${new Date(year, monthIndex).toLocaleString('default', {
//       month: 'long',
//     })} ${year}`,
//     newOrders,
//     newOrdersEarnings: newOrdersEarnings._sum.totalPrice || 0,
//     completedOrders,
//     completedOrdersEarnings: completedOrdersEarnings._sum.totalPrice || 0,
//     canceledOrders,
//     canceledOrdersEarnings: canceledOrdersEarnings._sum.totalPrice || 0,
//   };
// }
