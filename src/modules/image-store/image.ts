import { Request, Response } from "express";
import catchAsync from "../../libs/utlitys/catchSynch";
import sendResponse from "../../libs/sendResponse";
import httpStatus from "http-status";
import { prisma } from "../../libs/prismaHelper";



const imageController = catchAsync(async (req: Request, res: Response) => {
    // Find existing image store or create new one
    const existingImage = await prisma.imageStore.findFirst();

    const { image, requirements } = req.body;

    let image_store;
    if (existingImage) {
        // Update existing record
        image_store = await prisma.imageStore.update({
            where: {
                id: existingImage.id
            },
            data: {
                image: image,
                requirments: requirements
            }
        });
    } else {
        // Create new record
        image_store = await prisma.imageStore.create({
            data: {
                image: image,
                requirments: requirements
            }
        });
    }

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Image saved successfully",
        data: image_store
    });
});

const getImage = catchAsync(async (req: Request, res: Response) => {
    const image_store = await prisma.imageStore.findMany();

    const imageObejct = image_store[0]

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Image fetched successfully",
        data: imageObejct
    });
});

export const ImageStoreController = {
    imageController,
    getImage
}


