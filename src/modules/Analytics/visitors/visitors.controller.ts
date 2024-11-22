import { VisitorStatus } from '@prisma/client';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import catchAsync from '../../../libs/utlitys/catchSynch';
import {
  TIME_FILTER_OPTIONS,
  timeFilterSchema,
} from '../../../utils/calculateDateRange';
// import { calculateDateRange } from "../../../utils/calculateDateRange";

const increaseVisitors = catchAsync(async (req: Request, res: Response) => {
  const { status } = req.user as { status: VisitorStatus };
  const visitor = await prisma.visitors.create({
    data: {
      status: status as VisitorStatus,
    },
  });

  const totalVisitors = await prisma.visitors.count();

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Visitors increased successfully',
    data: {
      visitor,
      totalVisitors,
    },
  });
});

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

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

const getVisitors = catchAsync(async (req: Request, res: Response) => {
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

  let visitorData;

  switch (timeFilter) {
    case TIME_FILTER_OPTIONS.LAST_7_DAYS:
    case TIME_FILTER_OPTIONS.LAST_30_DAYS:
    case TIME_FILTER_OPTIONS.THIS_MONTH:
    case TIME_FILTER_OPTIONS.LAST_MONTH:
      visitorData = await getVisitorDataByPeriod(
        startDate,
        endDate,
        'day',
        formatDate,
      );
      break;
    case TIME_FILTER_OPTIONS.LAST_3_MONTHS:
      visitorData = await getVisitorDataByPeriod(
        startDate,
        endDate,
        '15days',
        formatDate,
      );
      break;
    case TIME_FILTER_OPTIONS.LAST_6_MONTHS:
      visitorData = await getVisitorDataByPeriod(startDate, endDate, 'month');
      break;
    case TIME_FILTER_OPTIONS.LAST_YEAR:
      visitorData = await getYearlyVisitorData(startDate, endDate);
      break;
    case TIME_FILTER_OPTIONS.THIS_YEAR:
      visitorData = await getYearlyVisitorData(startDate, endDate);
      break;
    case TIME_FILTER_OPTIONS.LAST2_YEAR:
      visitorData = await getYearlyVisitorData(startDate, endDate);
      break;
    case TIME_FILTER_OPTIONS.ALL_TIME:
      visitorData = await getAllTimeVisitorData(startDate, endDate);
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Visitors fetched successfully',
    data: visitorData,
  });
});

async function getVisitorDataByPeriod(
  startDate: Date,
  endDate: Date,
  aggregationType: '15days' | 'month' | 'day',
  dateFormatter?: (date: Date) => string,
) {
  const periods = calculatePeriods(startDate, endDate, aggregationType);

  return Promise.all(
    periods.map(async (period) => {
      const [totalVisitors, newVisitors, returningVisitors] = await Promise.all(
        [
          prisma.visitors.count({
            where: {
              createdAt: {
                gte: period.start,
                lt: period.end,
              },
            },
          }),
          prisma.visitors.count({
            where: {
              status: VisitorStatus.NEW_CLIENT,
              createdAt: {
                gte: period.start,
                lt: period.end,
              },
            },
          }),
          prisma.visitors.count({
            where: {
              status: VisitorStatus.REPEATED_CLIENT,
              createdAt: {
                gte: period.start,
                lt: period.end,
              },
            },
          }),
        ],
      );

      return {
        date: dateFormatter
          ? dateFormatter(period.start)
          : period.start.toLocaleString('default', { month: 'long' }),
        totalVisitors,
        newVisitors,
        returningVisitors,
      };
    }),
  );
}

async function getYearlyVisitorData(startDate: Date, endDate: Date) {
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

        return getVisitorsForPeriod(
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

async function getAllTimeVisitorData(startDate: Date, endDate: Date) {
  const yearsToFetch = Math.ceil(
    endDate.getFullYear() - startDate.getFullYear() + 1,
  );
  const yearlyData = [];

  for (let i = 0; i < yearsToFetch; i++) {
    const currentYear = startDate.getFullYear() + i;

    // Determine the start month for the current year
    let startMonth = 0;
    if (currentYear === startDate.getFullYear()) {
      startMonth = startDate.getMonth(); // start from the month of startDate in the start year
    }

    // Determine the end month for the current year
    let endMonth = 11;
    if (currentYear === endDate.getFullYear()) {
      endMonth = endDate.getMonth(); // end at the month of endDate in the end year
    }

    // Initialize total visitors for this year
    let totalVisitors = 0;

    // Loop through the months of the current year and accumulate the total visitors
    for (let monthIndex = 0; monthIndex <= 11; monthIndex++) {
      // Only fetch data for months within the startDate and endDate range
      if (
        (currentYear > startDate.getFullYear() ||
          (currentYear === startDate.getFullYear() &&
            monthIndex >= startMonth)) &&
        (currentYear < endDate.getFullYear() ||
          (currentYear === endDate.getFullYear() && monthIndex <= endMonth))
      ) {
        const monthStart = new Date(currentYear, monthIndex, 1);
        const monthEnd = new Date(currentYear, monthIndex + 1, 1); // next month's start

        // Fetch the visitors for the given month
        const monthData = await getVisitorsForPeriod(
          monthStart,
          monthEnd,
          currentYear,
          monthIndex,
        );

        // Accumulate the total visitors for the current year
        totalVisitors += monthData.totalVisitors; // Assuming monthData has a `visitors` property
      }
    }

    // Push the data for the current year to the yearlyData array
    yearlyData.push({ date: currentYear, totalVisitors });
  }

  return yearlyData;
}

async function getVisitorsForPeriod(
  monthStart: Date,
  monthEnd: Date,
  year: number,
  monthIndex: number,
) {
  const [totalVisitors, newVisitors, returningVisitors] = await Promise.all([
    prisma.visitors.count({
      where: {
        createdAt: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    }),
    prisma.visitors.count({
      where: {
        status: VisitorStatus.NEW_CLIENT,
        createdAt: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    }),
    prisma.visitors.count({
      where: {
        status: VisitorStatus.REPEATED_CLIENT,
        createdAt: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    }),
  ]);

  return {
    date: `${new Date(year, monthIndex).toLocaleString('default', { month: 'long' })} ${year}`,
    totalVisitors,
    newVisitors,
    returningVisitors,
  };
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

export const visitros = {
  increaseVisitors,
  getVisitors,
};
