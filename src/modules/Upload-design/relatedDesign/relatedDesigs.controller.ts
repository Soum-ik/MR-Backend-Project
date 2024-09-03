import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import { z } from 'zod';


// const getAll = async (req: Request, res: Response) => {
//     try {

//         const { relatedDesigns } = req.params

//         // Fetch all folders from the database
//         const findAll = await prisma.uploadDesign.findMany({
//             where: {
//                 relatedDesigns: relatedDesigns
//             }
//         })


//         // Send success response with retrieved data
//         return sendResponse<any>(res, {
//             statusCode: httpStatus.OK,
//             success: true,
//             data: findAll,
//             message: `Folders retrieved successfully`,
//         });

//     } catch (error) {
//         console.error('Error fetching folders:', error);

//         // Handle validation errors
//         if (error instanceof z.ZodError) {
//             return sendResponse<any>(res, {
//                 statusCode: httpStatus.BAD_REQUEST,
//                 success: false,
//                 data: null,
//                 message: `Validation error: ${error.message}`,
//             });
//         }

//         // Handle other types of errors
//         return sendResponse<any>(res, {
//             statusCode: httpStatus.INTERNAL_SERVER_ERROR,
//             success: false,
//             data: null,
//             message: `Internal server error`,
//         });
//     }
// }
