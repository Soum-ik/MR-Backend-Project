import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../libs/prismaHelper';
import sendResponse from '../libs/sendResponse';



const upsertSocialMediaLink = async (req: Request, res: Response) => {

    const { email,
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

    if (!email) {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'Email is required to upsert social media links',
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
    const { email } = req.params;
    console.log(email);
    
    if (!email || typeof email !== 'string') {
        return sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'Valid email query parameter is required',
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

