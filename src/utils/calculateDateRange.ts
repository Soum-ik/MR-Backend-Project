import { z } from "zod";

export const TIME_FILTER_OPTIONS = {
    ALL_TIME: 'All Times',
    LAST_7_DAYS: 'Last 7 Days',
    LAST_30_DAYS: 'Last 30 Days', 
    THIS_MONTH: 'This Month',
    LAST_MONTH: 'Last Month',
    LAST_3_MONTH: 'Last 3 Month',
    LAST_6_MONTHS: 'Last 6 Months',
    THIS_YEAR: 'This Year',
    YEAR_2023: '2023',
    YEAR_2022: '2022',
} as const;

export const timeFilterSchema = z.enum(Object.values(TIME_FILTER_OPTIONS) as [string, ...string[]]);

export const calculateDateRange = (timeFilter: z.infer<typeof timeFilterSchema>) => {
    const now = new Date();
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
        case TIME_FILTER_OPTIONS.LAST_3_MONTH: {
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
        case TIME_FILTER_OPTIONS.YEAR_2023: {
            startDate = new Date('2023-01-01');
            endDate = new Date('2023-12-31');
            break;
        }
        case TIME_FILTER_OPTIONS.YEAR_2022: {
            startDate = new Date('2022-01-01');
            endDate = new Date('2022-12-31');
            break;
        }
        case TIME_FILTER_OPTIONS.ALL_TIME:
        default:
            break;
    }

    return { startDate, endDate };
};