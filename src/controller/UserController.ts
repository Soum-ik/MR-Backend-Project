import type { Request, Response } from 'express';
import sendResponse from '../libs/sendResponse';
import httpStatus from 'http-status';
import { prisma } from '../libs/prismaHelper';
import { createToken } from '../libs/authHelper';
import sendVeficationEmail from '../helper/email/emailSend';
// import sendEmail from '../libs/hepler/Email/emaliSend';
// import bcrypt from "bcrypt"
// import { createToken } from '../libs/hepler/auth/jwtHelper';

interface SignupRequestBody {
    country?: string;
    fullName?: string;
    userName?: string;
    email: string;
    password: string;
}

const SingUp = async (req: Request<{}, {}, SignupRequestBody>, res: Response) => {
    try {
        const {
            country,
            fullName,
            userName,
            email,
            password,
        } = req.body;

        const existingEmail = await prisma.user.findUnique({ where: { email } })
        if (existingEmail) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.NOT_ACCEPTABLE,
                success: true,
                data: null,
                message: "Email are already used"
            });
        }
        const existingUserName = await prisma.user.findUnique({ where: { userName } })
        if (existingUserName) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.NOT_ACCEPTABLE,
                success: true,
                data: null,
                message: "User name are already used"
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
        console.log(createUser, "User created");

        return sendResponse<any>(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: createUser,
            message: "User created successfully"
        });

    } catch (error) {
        console.error(error);

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: error,
            message: "User not created"
        });
    }
};


const SignIn = async (req: Request<{}, {}, SignupRequestBody>, res: Response) => {
    try {
        const { password, email } = req.body;

        const findUserByEmail = await prisma.user.findUnique({ where: { email, password } });
        if (!findUserByEmail) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.NOT_FOUND, success: false, data: null, message: "User are not found"
            });
        }

        const { role, id } = findUserByEmail


        // // Create the token
        const token = createToken({ role, user_id: id });


        // // Set the cookie with the token
        res.cookie('authToken', token, {
            httpOnly: true, // Cookie cannot be accessed via JavaScript
            // secure: process.env.NODE_ENV === 'production', // Cookie only sent over HTTPS in production
            maxAge: 3600000, // 1 hour (cookie expiration)
            sameSite: 'strict', // Protect against CSRF attacks
        });

        // // set logged in user local identifier
        // res.locals.loggedInUser = { username, semester, isVerfiyed, role, suspend, user_id: id };

        return sendResponse<any>(res, {
            statusCode: httpStatus.OK, success: true, data: { token }, message: "User authenticated successfully"
        });
    } catch (error) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR, success: false, data: error, message: "An error occurred"
        });
    }
}



// const verifiyUser = async (req: Request, res: Response) => {
//     const reqPerams = req.params.otp;
//     const findByOTP = await Users.findOne({
//         'verfiyCode': reqPerams
//     })
//     if (!findByOTP) {
//         return sendResponse<any>(res, { statusCode: httpStatus.NOT_FOUND, success: false, data: findByOTP, message: 'OTP are not matched', })
//     } else {
//         const { verfiyCodeExpier, createdAt } = findByOTP;
//         const created_date = relativeDate(createdAt)
//         const Expier_date = relativeDate(verfiyCodeExpier)

//         if (created_date >= Expier_date) {
//             return sendResponse<any>(res, { statusCode: httpStatus.EXPECTATION_FAILED, success: false, message: 'OTP are unvalid, time over', })
//         } else {
//             const verified = await Users.updateOne({
//                 'verfiyCode': reqPerams,
//             }, { isVerfiyed: true })

//             console.log(verified, 'true');

//             if (verified.modifiedCount === 1) {
//                 const verifiedData = await Users.updateOne({ 'verfiyCode': reqPerams }, { verfiyCode: null, verfiyCodeExpier: null })
//                 console.log(verifiedData, 'clear');
//                 return sendResponse<any>(res, { statusCode: httpStatus.OK, success: true, message: 'User Verifiyed Successfully', })
//             } else {
//                 return sendResponse<any>(res, { statusCode: httpStatus.NOT_ACCEPTABLE, success: false, message: 'Forbidden' })
//             }
//         }

//     }
// }

// // recover pass
const forgotPass = async (req: Request, res: Response) => {
    const { email } = req.params;

    const findByEmail = await prisma.user.findUnique({ where: { email } });

    if (!findByEmail) {
        return sendResponse<any>(res, { statusCode: httpStatus.NOT_FOUND, success: false, message: 'This email is not register', })
    } else {
        const verfiyCode = Math.floor(1000000 + Math.random() * 9000000)
        const { fullName } = findByEmail
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


// const verifyPass = async (req: Request, res: Response) => {
//     const reqParams: number = parseInt(req.params.otp, 10);

//     const findByOTP = await prisma.user.findUnique({
//         where: {
//             otp: reqParams,
//         },
//     });

//     if (!findByOTP) {
//         return sendResponse<any>(res, {
//             statusCode: httpStatus.NOT_FOUND,
//             success: false,
//             data: null,
//             message: 'OTP does not match',
//         });
//     } else {
//         // Optionally, clear the OTP after successful verification
//         await prisma.user.update({
//             where: { otp: reqParams },
//             data: { otp: null },
//         });

//         return sendResponse<any>(res, {
//             statusCode: httpStatus.OK,
//             success: true,
//             message: 'OTP matched successfully',
//         });
//     }
// };
// const setNewPass = async (req: Request, res: Response) => {
//     const { email, password } = req.params;
//     const findByEmail = await Users.findOne({
//         $or: [{
//             email: email,
//             password: password
//         }]
//     });
//     console.log(findByEmail, 'email');

//     if (!findByEmail) {
//         return sendResponse<any>(res, { statusCode: httpStatus.NOT_FOUND, success: false, message: 'Your email are not matched', })
//     } else {
//         const hashPassword: String = await bcrypt.hash(password, 10)

//         const updateNewPass = await Users.updateOne({ email: email }, { password: hashPassword });
//         if (updateNewPass.matchedCount === 1) {
//             return sendResponse<any>(res, { statusCode: httpStatus.OK, success: true, message: 'Your new password set successfully', })
//         } else {
//             return sendResponse<any>(res, { statusCode: httpStatus.NOT_FOUND, success: false, message: 'Something want wrong, your password not update', })
//         }
//     }
// }


export default { SingUp, SignIn, forgotPass }