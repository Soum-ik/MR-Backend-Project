export const paginationFields = ["page", "limit", "sortBy", "sortOrder"] as const;

interface PaginationQuery {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

interface PaginationOptions {
    skip: number;
    take: number;
    orderBy: Record<string, 'asc' | 'desc'>;
}

export function getPaginationOptions(query: PaginationQuery): PaginationOptions {
    // Set default values for pagination and sorting
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 20);
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'createdAt'; // Default sort field
    const sortOrder: 'asc' | 'desc' = query.sortOrder === 'asc' ? 'asc' : 'desc'; // Default is descending order

    return {
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
    };
}
