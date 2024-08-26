import type { Request, Response } from 'express'
import { prisma } from '../../libs/prismaHelper';
import { UploadDesignSchemaInterface } from './upload.inteface';
import { uploadDesignSchema } from './upload.validation';
import { z } from 'zod';
import sendResponse from '../../libs/sendResponse';
import httpStatus from 'http-status';
import { getLastSerialNumber } from '../../libs/utlitys/desginNumber';
import { designSerialGenerator } from '../../helper/SerialCodeGenerator/serialGenerator';
import { findOrCreateEntity } from './upload.utlity';


export const UploadDesign = async (req: Request, res: Response) => {
    try {
        // Validate request body using Zod and infer the correct type
        const validatedData: UploadDesignSchemaInterface = uploadDesignSchema.parse(req.body);

        // Get the last serial number from the server
        const { serialnumber } = await getLastSerialNumber();

        const convertStringIntoNumber = serialnumber && parseInt(serialnumber);

        let specialSerialCodeGenarator;
        let convertedSerialUpdateNumber;

        if (convertStringIntoNumber) {
            convertedSerialUpdateNumber = convertStringIntoNumber + 1;
            specialSerialCodeGenarator = designSerialGenerator(convertedSerialUpdateNumber);
        }

        // Check or create entities
        await findOrCreateEntity(prisma.folders, { name: validatedData.folder }, { name: validatedData.folder });
        await findOrCreateEntity(prisma.subFolders, { name: validatedData.subFolder }, { name: validatedData.subFolder });
        await findOrCreateEntity(prisma.industrys, { name: validatedData.industries }, { name: validatedData.industries });
        await findOrCreateEntity(prisma.designs, { name: validatedData.designs }, { name: validatedData.designs });


        // Create UploadDesign in the database
        const uploadDesign = await prisma.uploadDesign.create({
            data: {
                title: validatedData.title,
                description: validatedData.description,
                category: validatedData.category,
                subCategory: validatedData.subCategory,
                size: validatedData.size,
                fileFormat: validatedData.fileFormat,
                images: validatedData.images,
                tags: validatedData.tags,
                relatedDesigns: validatedData.relatedDesigns,
                designId: specialSerialCodeGenarator,
                folder: validatedData.folder,
                subFolder: validatedData.subFolder,
                industrys: validatedData.industries,
                designs: validatedData.designs
            }
        });




        await prisma.desigserialNumberGenerator.create({
            data: {
                serialnumber: convertedSerialUpdateNumber + ''
            }
        })

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
            statusCode: httpStatus.OK,
            success: true,
            data: findall,
            message: `Get data successfully`,
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

const deleteDesign = async (req: Request, res: Response) => {
    try {
        // Extract the design ID from the request parameters
        const { id } = req.params;
        console.log(id);

        // Check if the design exists in the database
        const design = await prisma.uploadDesign.delete({
            where: { id: id },
            include: { Designs: true, folders: true, Industrys: true, SubFolders: true },

        });
        return sendResponse<any>(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: design,
            message: `Design deleted successfully.`,
        });
    } catch (error) {
        console.log(error);

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: null,
            message: `Internal server error`,
        });
    }
};


export const uploaders = {
    UploadDesign, getAllUploadDesign, deleteDesign
}