import type { Request, Response } from 'express'
import { prisma } from '../../libs/prismaHelper';
import { UploadDesignSchemaInterface } from './upload.inteface';
import { uploadDesignSchema } from './upload.validation';
import { z } from 'zod';
import sendResponse from '../../libs/sendResponse';
import httpStatus from 'http-status';
import { getLastSerialNumber } from '../../libs/utlitys/desginNumber';
import { designSerialGenerator } from '../../helper/SerialCodeGenerator/serialGenerator';


export const UploadDesign = async (req: Request, res: Response) => {
    try {
        // Validate request body using Zod and infer the correct type
        const validatedData: UploadDesignSchemaInterface = uploadDesignSchema.parse(req.body);

        // Get the last serial number from the server
        const { serialnumber } = await getLastSerialNumber();
        const convertStringIntoNumber = serialnumber && parseInt(serialnumber);

        let specialSerialCodeGenarator;
        let convertedSerialUpdateNumber;

        // Generate special serial number if last serial number exists
        if (convertStringIntoNumber) {
            convertedSerialUpdateNumber = convertStringIntoNumber + 1;
            specialSerialCodeGenarator = designSerialGenerator(convertedSerialUpdateNumber);
        }

        // Create UploadDesign in the database
        const uploadDesign = await prisma.uploadDesign.create({
            data: {
                title: validatedData.title,
                description: validatedData.description,
                category: validatedData.category,
                subCategory: validatedData.subCategory,
                size: validatedData.size,
                fileFormat: validatedData.fileFormat,
                image: validatedData.image,
                tags: validatedData.tags,
                relatedDesign: validatedData.relatedDesign,
                folder: validatedData.folder,
                subFolder: validatedData.subFolder,
                industrie: validatedData.industrie,
                design: validatedData.design,
                designSerialGenerator: specialSerialCodeGenarator,
            }
        });

        return sendResponse<any>(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: uploadDesign,
            message: `Great! Your design was uploaded successfully.`,
        });

    } catch (error) {
        console.error(error);

        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                data: null,
                message: `${error.message}`,
            });
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: null,
            message: `Internal server error`,
        });
    }
};

const getAllUploadDesign = async (req: Request, res: Response) => {
    try {
        const findall = await prisma.uploadDesign.findMany({})
        if (!findall) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.INTERNAL_SERVER_ERROR,
                success: false,
                data: null,
                message: `Upload design are not found!`,
            });
        }
        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: findall,
            message: `Internal server error`,
        });
    } catch (error) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: error,
            message: `Internal server error`,
        });
    }
}

export const uploaders = {
    UploadDesign, getAllUploadDesign
}