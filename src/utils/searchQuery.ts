type TimeRange = {
    [key: string]: null | ((now: Date) => Date | { gte: Date; lt: Date });
};

// Define time ranges in a reusable way
const timeRanges: TimeRange = {
    'All Times': null,
    'This Month': (now: Date) => new Date(now.getFullYear(), now.getMonth(), 1),
    'Last Month': (now: Date) => new Date(now.getFullYear(), now.getMonth() - 1, 1),
    'Last 3 Months': (now: Date) => new Date(now.setMonth(now.getMonth() - 3)),
    'Last 6 Months': (now: Date) => new Date(now.setMonth(now.getMonth() - 6)),
    'This Year': (now: Date) => new Date(now.getFullYear(), 0, 1),
    '2023': () => ({
        gte: new Date(2023, 0, 1),
        lt: new Date(2024, 0, 1),
    }),
    '2022': () => ({
        gte: new Date(2022, 0, 1),
        lt: new Date(2023, 0, 1),
    }),
};

interface FilterParams {
    timeFilter: string;
    dateField?: string;
    additionalConditions?: Record<string, any>;
}

// Function that returns the where clause without executing the query
function getWhereClause({
    timeFilter,
    dateField = 'createdAt',
    additionalConditions = {},
}: FilterParams): Record<string, any> {
    const now = new Date();
    let dateCondition: Record<string, any> = {};

    if (timeFilter in timeRanges) {
        const range = timeRanges[timeFilter];
        dateCondition = typeof range === 'function' ? range(now) : {};
    } else {
        throw new Error('Invalid time filter option');
    }

    // Combine date condition with additional conditions
    return {
        ...additionalConditions,
        ...(dateCondition ? { [dateField]: dateCondition } : {}),
    };
}
