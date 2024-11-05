import { Request } from 'express';
import { Prisma } from '@prisma/client';

export const getDateFilter = (filterType: string): Prisma.DateTimeFilter | Record<string, never> => {
  const now = new Date();
  const startDate = new Date();

  switch (filterType) {
    case 'Last 7 Days':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'Last 30 Days':
      startDate.setDate(now.getDate() - 30);
      break;
    case 'Last Month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'Last 3 Months':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'Last 6 Months':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case 'This Year':
      startDate.setMonth(0, 1); // January 1st of current year
      break;
    case '2023':
      startDate.setFullYear(2023, 0, 1);
      now.setFullYear(2023, 11, 31);
      break;
    case '2022':
      startDate.setFullYear(2022, 0, 1);
      now.setFullYear(2022, 11, 31);
      break;
    case 'All Times':
      return {};
    default:
      return {};
  }

  return {
    gte: startDate,
    lte: now
  };
};

export const getPrismaFilter = (req: Request): Record<string, any> => {
  const filterType = req.query.filterType as string;
  
  const dateFilter = getDateFilter(filterType);

  return {
    where: {
      createdAt: Object.keys(dateFilter).length ? dateFilter : undefined
    }
  };
};
