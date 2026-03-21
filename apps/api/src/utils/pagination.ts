/**
 * Pagination utility — parses query params into skip/limit/sort.
 * Default: page=1, limit=20, max limit=100.
 */
export interface PaginationOptions {
    page: number;
    limit: number;
    skip: number;
    sort: Record<string, 1 | -1>;
}

export function parsePagination(query: Record<string, any>): PaginationOptions {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    let limit = parseInt(query.limit, 10) || 20;
    limit = Math.min(Math.max(1, limit), 100); // clamp 1-100

    const skip = (page - 1) * limit;

    // Sort: ?sort=-createdAt,price → { createdAt: -1, price: 1 }
    const sort: Record<string, 1 | -1> = {};
    if (query.sort) {
        const fields = (query.sort as string).split(',');
        for (const field of fields) {
            if (field.startsWith('-')) {
                sort[field.substring(1)] = -1;
            } else {
                sort[field] = 1;
            }
        }
    } else {
        sort.createdAt = -1; // default
    }

    return { page, limit, skip, sort };
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
