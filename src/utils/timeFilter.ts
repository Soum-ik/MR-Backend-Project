import { ZodSchema, ZodError } from 'zod';
import { calculateDateRange } from './calculateDateRange';


interface TimeFilterParseResult {
    whereClause: Record<string, any>;
    error?: ZodError;
}

export function getTimeFilterWhereClause(
    timeFilterSchema: ZodSchema<any>,
    timeFilter: any
): TimeFilterParseResult {
    const parseResult = timeFilterSchema.safeParse(timeFilter);

    if (!parseResult.success) {
        return {
            whereClause: {},
            error: parseResult.error,
        };
    }

    const parsedFilter = parseResult.data;
    const { startDate, endDate } = calculateDateRange(parsedFilter);

    const whereClause = startDate
        ? {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        }
        : {};

    return { whereClause };
}
