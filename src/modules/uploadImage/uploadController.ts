import cloudinaryConfig from "../../libs/utlitys/cloudinaryConfig";
import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import sendResponse from "../../libs/sendResponse";

const uploadImage = async (req: Request, res: Response) => {
    try {
        // Check if file exists in the request
        if (!req.file || !req.file.path) {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: 'No file provided',
                data: null,
            });
        }

        console.log(req.file);
        

        // Upload image to Cloudinary
        const result = await cloudinaryConfig.uploader.upload(req.file.path, {
            folder: 'folder_name'
        });

        return sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            message: 'Upload image successfully',
            data: result,
        });
    } catch (error) {
        console.error("Error uploading image: ", error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Something went wrong while uploading the image',
            data: error,
        });
    }
}

export default uploadImage;
