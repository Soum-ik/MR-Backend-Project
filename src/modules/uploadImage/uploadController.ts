import { Request, Response } from 'express';
import cloudinaryConfig from "../../libs/utlitys/cloudinaryConfig";
import httpStatus from 'http-status';
import sendResponse from "../../libs/sendResponse";

// Extend the Express request type to include files
interface MulterRequest extends Request {
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

const uploadImage = async (req: MulterRequest, res: Response) => {
  try {
    // Check if files exist in the request
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'No files provided',
        data: null,
      });
    }

    let filesArray: Express.Multer.File[] = [];

    // If req.files is an array
    if (Array.isArray(req.files)) {
      filesArray = req.files;
    } else {
      // If req.files is an object (upload.fields), flatten the arrays
      filesArray = Object.values(req.files).flat();
    }

    // Upload each file to Cloudinary
    const uploadPromises = filesArray.map(async (file) => {
      const result = await cloudinaryConfig.uploader.upload(file.path, {
        folder: 'folder_name', // Customize your Cloudinary folder
      });

      console.log(result);


      return {
        result
      };
    });

    // Wait for all files to be uploaded
    const uploadResults = await Promise.all(uploadPromises);

    return sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Uploaded images successfully',
      data: uploadResults,
    });
  } catch (error) {
    console.error("Error uploading images: ", error);
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Something went wrong while uploading the images',
      data: error,
    });
  }
};

export default uploadImage;
