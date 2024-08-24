import type { Request, Response } from 'express'
import { UploadDesign } from './folders.inteface';
import { uploadDesignSchema } from './upload.validation';
import httpStatus from 'http-status';
import { checkNameExists } from './upload.utlity';
import { prisma } from '../../../libs/prismaHelper';

// const create = async (req: Request, res: Response) => {
//     try {
//         const { folderName, UploadDesignId }: any = req.body;
//         const data = await prisma.folders.create({
//             data: {
//                 name: folderName,
//                 UploadDesignId
//             }
//         })
//     } catch (error) {

//     }
// }

const getByname = async (req: Request, res: Response) => {
    try {
        
    } catch (error) {

    }
} 