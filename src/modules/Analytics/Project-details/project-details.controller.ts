import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import catchAsync from '../../../libs/utlitys/catchSynch';
import {
  calculateDateRange,
  timeFilterSchema,
} from '../../../utils/calculateDateRange';
import { ProjectStatus } from '../../Order_page/Order_page.constant';

const ActiveProject = catchAsync(async (req: Request, res: Response) => {
  const [Revision, Ongoing, Waiting, Delivered] = await Promise.all([
    prisma.order.count({
      where: {
        projectStatus: ProjectStatus.REVISION,
      },
    }),
    prisma.order.count({
      where: {
        projectStatus: ProjectStatus.ONGOING,
      },
    }),
    prisma.order.count({
      where: {
        projectStatus: ProjectStatus.WAITING,
      },
    }),
    prisma.order.count({
      where: {
        projectStatus: ProjectStatus.DELIVERED,
      },
    }),
  ]);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Active project fetched successfully',
    data: {
      revision: Revision,
      ongoing: Ongoing,
      waiting: Waiting,
      delivered: Delivered,
    },
  });
});

const FinishedProjects = catchAsync(async (req: Request, res: Response) => {
  const parseResult = timeFilterSchema.safeParse(req.query.timeFilter);
  if (!parseResult.success) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid time filter',
      data: null,
    });
    return;
  }

  const timeFilter = parseResult.data;
  const { startDate, endDate } = calculateDateRange(timeFilter);

  const whereClause: Prisma.OrderWhereInput = startDate
    ? {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }
    : {};

  const [Completed, Cancelled] = await Promise.all([
    prisma.order.findMany({
      where: {
        ...whereClause,
        projectStatus: ProjectStatus.COMPLETED,
      },
    }),
    prisma.order.findMany({
      where: {
        ...whereClause,
        projectStatus: ProjectStatus.CANCELED,
      },
    }),
  ]);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Finished projects fetched successfully',
    data: {
      completed: Completed?.length,
      cancelled: Cancelled?.length,
    },
  });
});

const ProjectBuyers = catchAsync(async (req: Request, res: Response) => {
  const parseResult = timeFilterSchema.safeParse(req.query.timeFilter);
  if (!parseResult.success) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid time filter',
      data: null,
    });
    return;
  }

  const timeFilter = parseResult.data;
  const { startDate, endDate } = calculateDateRange(timeFilter);

  const whereClause = startDate
    ? {
        Order: {
          some: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      }
    : {};

  const buyers = await prisma.user.findMany({
    where: {
      role: 'USER',
      ...whereClause,
      Order: {
        some: {},
      },
    },
    include: {
      _count: {
        select: {
          Order: true,
        },
      },
    },
  });

  // Use _count.Order instead of totalOrder since that's what we're including
  const newBuys = buyers.filter((buyer) => buyer._count.Order === 1);
  const oldBuys = buyers.filter((buyer) => buyer._count.Order > 1);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Project buyers fetched successfully',
    data: {
      'New Buyers': newBuys.length,
      'Repeat Buyers': oldBuys.length,
    },
  });
});

const ProjectDetails = catchAsync(async (req: Request, res: Response) => {
  const parseResult = timeFilterSchema.safeParse(req.query.timeFilter);
  if (!parseResult.success) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Invalid time filter',
      data: null,
    });
    return;
  }

  const timeFilter = parseResult.data;
  const { startDate, endDate } = calculateDateRange(timeFilter);

  const whereClause: Prisma.OrderWhereInput = startDate
    ? {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      }
    : {};
  const [Completed, Cancelled, NewProjects] = await Promise.all([
    prisma.order.findMany({
      where: {
        ...whereClause,
        projectStatus: ProjectStatus.COMPLETED,
      },
    }),
    prisma.order.findMany({
      where: {
        ...whereClause,
        projectStatus: ProjectStatus.CANCELED,
      },
    }),
    prisma.order.findMany({
      where: {
        ...whereClause,
        projectStatus: {
          in: [
            ProjectStatus.REVISION,
            ProjectStatus.ONGOING,
            ProjectStatus.WAITING,
            ProjectStatus.DELIVERED,
            ProjectStatus.DISPUTE,
          ],
        },
      },
    }),
  ]);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Project options fetched successfully',
    data: {
      Completed: Completed?.length,
      Cancelled: Cancelled?.length,
      NewProjects: NewProjects?.length,
    },
  });
});

const ProjectOptions = catchAsync(async (req: Request, res: Response) => {
  // const [Completed, Cancelled, NewProjects] = await Promise.all([
  //     prisma.order.findMany({
  //         where: {
  //             projectStatus: ProjectType.MD_PROJECT
  //         }
  //     })
  // ])
});

export const ProjectDetailsController = {
  ActiveProject,
  FinishedProjects,
  ProjectBuyers,
};
