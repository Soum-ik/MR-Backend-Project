export const AFFILIATE_ROUTES = {
    CREATE: '/create',
    GET_ALL: '/',
    GET_BY_ID: '/:id',
    UPDATE: '/:id',
    DELETE: '/:id'
} as const;

export const AFFILIATE_ERRORS = {
    USER_ALREADY_AFFILIATE: 'User is already an affiliate',
    USER_NOT_FOUND: 'User not found',
    INVALID_USER: 'Invalid user credentials',
    AFFILIATE_NOT_FOUND: 'Affiliate not found',
    UNAUTHORIZED: 'You are not authorized to perform this action'
} as const;

export const AFFILIATE_SUCCESS = {
    CREATED: 'Affiliate account created successfully',
    UPDATED: 'Affiliate account updated successfully',
    DELETED: 'Affiliate account deleted successfully',
    FETCHED: 'Affiliate data fetched successfully'
} as const;

export const AFFILIATE_DEFAULT = {
    INITIAL_AMOUNT: 0,
    INITIAL_CLICKS: 0,
    INITIAL_LINKS: []
} as const;

export const AFFILIATE_VALIDATION = {
    PAYMENT_METHOD: ['paypal', 'bank', 'stripe'],
    MIN_AMOUNT: 0,
    MAX_AMOUNT: 1000000
} as const;


