export const USER_ROLE = {
    owner: 'owner',
    admin: 'admin',
    user: 'user',
    customer: 'customer',
    employee: 'employee',
    valet: 'valet',
} as const;


export interface SignupRequestBody {
    country?: string;
    fullName?: string;
    userName: string;
    email: string;
    password: string;
}

// Define the User interface
export interface User {
    user_id?: string;
    role?: string;
    email?: string;
    iat?: number;
    exp?: number;
}