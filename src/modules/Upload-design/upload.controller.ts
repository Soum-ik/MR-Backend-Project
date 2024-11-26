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
import { getPaginationOptions } from '../../paginations/paginations'

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

        await prisma.desigserialNumberGenerator.create({
            data: {
                serialnumber: convertedSerialUpdateNumber + ''
            }
        })

        if (specialSerialCodeGenarator) {

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
                    folder: validatedData.folder,
                    subFolder: validatedData.subFolder,
                    industrys: validatedData.industries,
                    designs: validatedData.designs,
                    designId: specialSerialCodeGenarator
                }
            });

            for (const tag of validatedData.tags) {
                await prisma.tags.create({
                    data: {
                        name: tag,
                    }
                })
            }


            const folder_check = await prisma.folders.findUnique({
                where: {
                    name: validatedData.folder
                }
            })

            if (!folder_check) {

                const folder = await prisma.folders.create({
                    data: {
                        name: validatedData.folder
                    },
                    include: {
                        subFolders: true,
                    },
                })

                const subFolder_check = await prisma.subFolders.findUnique({
                    where: {
                        name: validatedData.subFolder
                    }
                })

                if (!subFolder_check) {
                    await prisma.subFolders.create({
                        data: {
                            name: validatedData.subFolder,
                            folderId: folder.id
                        }
                    })
                }

            } else {
                const subFolder_check = await prisma.subFolders.findUnique({
                    where: {
                        name: validatedData.subFolder
                    }
                })


                if (!subFolder_check) {
                    await prisma.subFolders.create({
                        data: {
                            name: validatedData.subFolder,
                            folderId: folder_check?.id as string
                        }
                    })
                }

            }



            await prisma.industrys.create({
                data: {
                    name: validatedData.industries
                }
            })

            await prisma.designs.create({
                data: {
                    name: validatedData.designs
                }
            })



            return sendResponse<any>(res, {
                statusCode: httpStatus.OK,
                success: true,
                data: uploadDesign,
                message: `Great! Your design was uploaded successfully.`,
            });
        } else {
            return sendResponse<any>(res, {
                statusCode: httpStatus.OK,
                success: true,
                data: null,
                message: `Something probelm in serial number`,
            });
        }



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
        const paginationOptions = getPaginationOptions(req.query);
        const findall = await prisma.uploadDesign.findMany({ ...paginationOptions })
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


export const UpdateDesign = async (req: Request, res: Response) => {
    try {
        // Validate request body using Zod and infer the correct type
        const validatedData = uploadDesignSchema.parse(req.body);

        // Find the existing design by designId
        const { designId } = req.params;

        const existingDesign = await prisma.uploadDesign.findUnique({
            where: { designId: designId },
        });


        if (!existingDesign) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                data: null,
                message: `Design with ID ${designId} not found`,
            });
        }

        // Update the design in the database
        const updatedDesign = await prisma.uploadDesign.update({
            where: { designId: designId },
            data: {
                title: validatedData.title,
                description: validatedData.description,
                category: validatedData.category,
                subCategory: validatedData.subCategory,
                size: validatedData.size,
                fileFormat: validatedData.fileFormat,
                images: validatedData.images,
                tags: validatedData.tags,
                folder: validatedData.folder,
                subFolder: validatedData.subFolder,
                industrys: validatedData.industries,
                designs: validatedData.designs,
                relatedDesigns: validatedData.relatedDesigns,
            },
        });

        return sendResponse<any>(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: updatedDesign,
            message: `Design with ID ${designId} updated successfully.`,
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


const getSingelUploadDesign = async (req: Request, res: Response) => {
    try {

        // Find the existing design by designId
        const { designId } = req.params;
        const findall = await prisma.uploadDesign.findMany({
            where: {
                designId: designId
            }
        })
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
export const uploaders = {
    UploadDesign, getAllUploadDesign, deleteDesign, UpdateDesign, getSingelUploadDesign
}