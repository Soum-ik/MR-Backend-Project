import { USER_ROLE } from "./user.constant";

export type TUserRole = keyof typeof USER_ROLE;

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