import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../libs/prismaHelper';
import sendResponse from '../libs/sendResponse';



const   upsertSocialMediaLink = async (req: Request, res: Response) => {
    if (!req.user || !req.user.email) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'User information is missing or email is required',
        });
    }
    const user = req.user
    const { email } = user
    
    if (!email) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'Email is required',
        });
    }
    const {
        facebook,
        instagram,
        linkedin,
        twitter,
        pinterest,
        google,
        tumblr,
        youtube,
        yelp,
        tiktok,
        nextdoor,
    } = req.body;



    try {
        // Find the user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: 'User not found',
            });
        }

        // Upsert social media links
        const upsertedSocialMediaLinks = await prisma.socialMediaLinks.upsert({
            where: { userId: user.id },
            update: {
                facebook,
                instagram,
                linkedin,
                twitter,
                pinterest,
                google,
                tumblr,
                youtube,
                yelp,
                tiktok,
                nextdoor,
            },
            create: {
                userId: user.id,
                facebook,
                instagram,
                linkedin,
                twitter,
                pinterest,
                google,
                tumblr,
                youtube,
                yelp,
                tiktok,
                nextdoor,
            },
        });

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: upsertedSocialMediaLinks,
            message: 'Social media links upserted successfully',
        });
    } catch (error) {
        console.error('Error upserting social media links:', error);

        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'An error occurred while upserting social media links',
        });
    }
};

const getSocialMediaLinks = async (req: Request, res: Response) => {
    if (!req.user || !req.user.email) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'User information is missing or email is required',
        });
    }
    const user = req.user
    const { email } = user
    console.log(email, 'heck');
    
    if (!email) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'Email is required',
        });
    }

    try {
        // Find the user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: 'User not found',
            });
        }

        // Find social media links for the user
        const socialMediaLinks = await prisma.socialMediaLinks.findUnique({
            where: { userId: user.id },
            include: {
                user: true
            }
        });

        if (!socialMediaLinks) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: 'Social media links not found for this user',
            });
        }

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: socialMediaLinks,
            message: 'Social media links retrieved successfully',
        });
    } catch (error) {
        console.error('Error retrieving social media links:', error);

        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'An error occurred while retrieving social media links',
        });
    }
};


export default { upsertSocialMediaLink, getSocialMediaLinks };

