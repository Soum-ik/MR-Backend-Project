import type { Request, Response } from 'express'
import { prisma } from '../../libs/prismaHelper';
import { UploadDesign } from './upload.inteface';
import { uploadDesignSchema } from './upload.validation';
import { z } from 'zod';
import sendResponse from '../../libs/sendResponse';
import httpStatus from 'http-status';
import { checkNameExists } from './upload.utlity';


const UploadDesign = async (req: Request, res: Response) => {
    try {
        // Validate request body using Zod and infer the correct type
        const validatedData: UploadDesign = uploadDesignSchema.parse(req.body);

        // Additional server-side logic (e.g., checking if the folder exists)
        const folderExists = await checkNameExists('folders', validatedData.folder);
        const subFolderExists = await checkNameExists('subFolders', validatedData.subFolder);
        const industryExists = await checkNameExists('industries', validatedData.industrie);
        const designExists = await checkNameExists('designs', validatedData.design);
        if (folderExists || subFolderExists || industryExists || designExists) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.NOT_ACCEPTABLE,
                success: false,
                data: null,
                message: 'This name already exists',
            });
        }

        // Create UploadDesign in the database
        const uploadDesign = await prisma.uploadDesign.create({
            data: validatedData,
        });

        return sendResponse<any>(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: uploadDesign,
            message: `Great! You're design are upload successfull`,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                data: null,
                message: `${error}`,
            });
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: null,
            message: `Internal server error`,
        });
    }
} 