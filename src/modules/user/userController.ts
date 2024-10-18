import type { Request, Response } from 'express';
import sendResponse from '../../libs/sendResponse';
import httpStatus from 'http-status';
import { prisma } from '../../libs/prismaHelper';
import { createToken } from '../../libs/authHelper';
import sendVeficationEmail from '../../helper/email/emailSend';

import { SignupRequestBody } from './user.interface';

export interface User {
    user_id?: string;
    role?: string;
    email?: string;
    iat?: number;
    exp?: number;
}
// Extend the Request interface to include the user property
interface AuthenticatedRequest extends Request {
    user?: User;
}


const SignUp = async (req: Request<{}, {}, SignupRequestBody>, res: Response) => {
    try {
        const { country, fullName, userName, email, password } = req.body;

        // Validate request body
        if (!email || !password) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                data: null,
                message: "Email and password are required"
            });
        }

        // Check if the email is already used
        const existingEmail = await prisma.user.findUnique({ where: { email } });
        if (existingEmail) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.CONFLICT,
                success: false,
                data: null,
                message: "Email is already in use"
            });
        }

        // Check if the username is already used
        const existingUserName = await prisma.user.findUnique({ where: { userName } });
        if (existingUserName) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.CONFLICT,
                success: false,
                data: null,
                message: "Username is already in use"
            });
        }


        // Create the new user
        const createUser = await prisma.user.create({
            data: {
                country,
                fullName,
                userName,
                email,
                password
            }
        });

        const { role, id, email: Useremail } = createUser;

        // Create the token
        const token = createToken({ role, user_id: id, email: Useremail });

        console.log(createUser, "User created");

        return sendResponse<any>(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            data: token,
            message: "User created successfully"
        });

    } catch (error: any) {
        console.error("Error creating user:", error.message);


        return sendResponse<any>(res, {
            statusCode: httpStatus.NOT_ACCEPTABLE,
            success: false,
            data: null,
        });
    }
};


const SignIn = async (req: Request<{}, {}, SignupRequestBody>, res: Response) => {
    try {
        const { password, email } = req.body;

        // Find user by email and password
        const user = await prisma.user.findUnique({
            where: { email, password }, select: {
                address: true,
                city: true,
                country: true,
                description: true,
                email: true,
                fullName: true,
                id: true,
                image: true,
                industryName: true,
                userName: true,
                number: true,
                SocialMediaLinks: true, role: true, language: true
            }
        });

        if (!user) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                data: null,
                message: "User not found",
            });
        }

        const { role, id, email: Useremail } = user;

        // Create the token
        const token = createToken({ role, user_id: id, email: Useremail });

        // Set cookie with the token
        res.cookie('authToken', token, {
            httpOnly: true,
            maxAge: 3600000, // 1 hour
            sameSite: 'strict', // CSRF protection
        });

        // Return successful response with token and user data
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: { token, user },
            message: "User authenticated successfully",
        });

    } catch (error) {
        // Handle error
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: error,
            message: "An error occurred",
        });
    }
};

const forgotPass = async (req: Request, res: Response) => {
    const { email } = req.params;

    const findByEmail = await prisma.user.findUnique({ where: { email } });

    if (!findByEmail) {
        return sendResponse<any>(res, { statusCode: httpStatus.NOT_FOUND, success: false, message: 'This email is not register', })
    } else {
        const verfiyCode = Math.floor(1000000 + Math.random() * 9000000)
        const { fullName } = findByEmail
        console.log(fullName, 'check full');
        if (!fullName) {
            return console.log('full name need');
        }
        const updateUserOtp = await prisma.user.update({
            where: { email }, // Specify the user to update
            data: { otp: verfiyCode }, // Update the OTP field
        });
        // Send verification email
        await sendVeficationEmail({ name: fullName, receiver: email, subject: "Email Verfication", code: verfiyCode })
        return sendResponse<any>(res, {
            statusCode: httpStatus.OK, success: true, data: updateUserOtp, message: "Email are matched, Check your mail & verify user code",
        })
    }
}
const verifyOtp = async (req: Request, res: Response) => {
    const { email } = req.params;

    const { code } = req.query

    const findByEmail = await prisma.user.findUnique({ where: { email } });

    if (!findByEmail) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: 'User not found', data: null
        });
    }

    const { otp } = findByEmail

    try {
        if (code === otp?.toString()) {
            await prisma.user.update({
                where: { email },
                data: { otp: 0 },
            });
            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: 'OTP matched successfully'
            });
        } else {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_ACCEPTABLE,
                success: false,
                message: 'Code does not match', data: null
            });
        }
    } catch (error) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_ACCEPTABLE,
            success: false,
            message: 'Something want wrong', data: null
        });
    }

};
const setNewPass = async (req: Request, res: Response) => {
    const { email }: any = req.params
    if (!email) {
        return sendResponse<any>(res, { statusCode: httpStatus.NOT_FOUND, success: false, message: 'Email are required!', })
    }
    const { password, currentPassword } = req.body;

    try {
        const findByEmail = await prisma.user.findUnique({ where: { email: email, password: currentPassword } })
        if (!findByEmail) {
            return sendResponse<any>(res, { statusCode: httpStatus.NOT_FOUND, success: false, message: 'Your current password is wrong!', })
        } else {
            const updateNewPass = await prisma.user.update({ where: { email }, data: { password } })
            console.log(updateNewPass, "update new password");
            return sendResponse<any>(res, { statusCode: httpStatus.OK, success: true, message: 'Your new password set successfully', })
        }
    } catch (error) {
        console.log(error);
        return sendResponse<any>(res, { data: error, statusCode: httpStatus.OK, success: false, message: 'Some thing want wrong!', })
    }
}
const getAllUser = async (req: Request, res: Response) => {
    const allUser = await prisma.user.findMany({
        select: {
            address: true,
            city: true,
            country: true,
            description: true,
            email: true,
            fullName: true,
            id: true,
            image: true,
            industryName: true,
            userName: true,
            number: true,
            SocialMediaLinks: true, role: true, language: true,
            createdAt: true, updateAt: true, otp: true, lastSeen: true,
        }
    })
    return sendResponse<any>(res, { statusCode: httpStatus.OK, success: true, data: allUser, message: 'all user successfully get', })

}
const updateUser = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'Email is required',
        });
    }

    try {
        const { fullName, country, city, industryName, address, number, language, image, description } = req.body;

        const updatedUser = await prisma.user.update({
            where: { email },
            data: {
                fullName,
                country,
                city,
                industryName,
                address,
                number,
                language,
                image, description
            },
            select: {
                address: true,
                city: true,
                country: true,
                description: true,
                email: true,
                fullName: true,
                id: true,
                image: true,
                industryName: true,
                userName: true,
                number: true,
                SocialMediaLinks: true, role: true, language: true
            }
        });

        console.log('User updated:', updatedUser);

        return sendResponse<any>(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: updatedUser,
            message: 'User updated successfully',
        });
    } catch (error) {
        console.error('Error updating user:', error);

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'An error occurred while updating the user',
        });
    }
};

const getSingelUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user || !req.user.email) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'User information is missing or email is required',
        });
    }
    const user = req.user
    const { email, } = user

    if (!email) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'Email is required',
        });
    }

    try {
        const findByEmail = await prisma.user.findUnique({ where: { email }, include: { SocialMediaLinks: true } })
        if (findByEmail) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.OK,
                success: true,
                data: findByEmail,
                message: 'User found',
            });
        } else {
            return sendResponse<any>(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                data: null,
                message: 'User not found',
            });
        }
    } catch (error) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.NOT_ACCEPTABLE,
            success: false,
            data: null,
            message: 'Some want wrong',
        });
    }

}

export const User = { SignUp, SignIn, forgotPass, verifyOtp, setNewPass, getAllUser, updateUser, getSingelUser }