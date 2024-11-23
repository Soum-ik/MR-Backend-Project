import { z } from "zod";

export const TIME_FILTER_OPTIONS = {
    ALL_TIME: 'All Times',
    LAST_7_DAYS: 'Last 7 Days',
    LAST_30_DAYS: 'Last 30 Days',
    THIS_MONTH: 'This Month',
    LAST_MONTH: 'Last Month',
    LAST_3_MONTHS: 'Last 3 Months',
    LAST_6_MONTHS: 'Last 6 Months',
    THIS_YEAR: 'This Year',
    LAST_YEAR: `${new Date().getFullYear() - 1}`,
    LAST2_YEAR: `${new Date().getFullYear() - 2}`,
    TODAY: 'Today',
} as const;

export const timeFilterSchema = z.enum(Object.values(TIME_FILTER_OPTIONS) as [string, ...string[]]);

export const calculateDateRange = (timeFilter: z.infer<typeof timeFilterSchema>) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    let startDate: Date | null = null;
    let endDate: Date = new Date();

    switch (timeFilter) {
        case TIME_FILTER_OPTIONS.LAST_7_DAYS: {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            break;
        }
        case TIME_FILTER_OPTIONS.LAST_30_DAYS: {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 30);
            break;
        }
        case TIME_FILTER_OPTIONS.THIS_MONTH: {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        }
        case TIME_FILTER_OPTIONS.LAST_MONTH: {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        }
        case TIME_FILTER_OPTIONS.LAST_3_MONTHS: {
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 3);
            break;
        }
        case TIME_FILTER_OPTIONS.LAST_6_MONTHS: {
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 6);
            break;
        }
        case TIME_FILTER_OPTIONS.THIS_YEAR: {
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }
        case TIME_FILTER_OPTIONS.LAST_YEAR: {
            startDate = new Date(`${currentYear - 1}-01-01`);
            endDate = new Date(`${currentYear - 1}-12-31`);
            break;
        }
        case TIME_FILTER_OPTIONS.LAST2_YEAR: {
            startDate = new Date(`${currentYear - 2}-01-01`);
            endDate = new Date(`${currentYear - 2}-12-31`);
            break;
        }
        case TIME_FILTER_OPTIONS.TODAY: {
            const now = new Date();
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        }

        case TIME_FILTER_OPTIONS.ALL_TIME:
        default:
            break;
    }

    return { startDate, endDate };
};