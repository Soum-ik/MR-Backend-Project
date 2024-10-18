import { NextFunction, Request, Response } from 'express';

import { uploadFileToS3 } from '../utils/sendFiletoS3';

export const uploadAttachmentToS3AndFormatBody = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body: any = {};
            const file = req.file as Express.Multer.File;
            console.log('Received file:', file);

            if (file) {
                const fileName = `mr-project-${Date.now()}-${file.originalname}`;
                const filePath = file.path;

                const bucketName = 'mr-project';
                await uploadFileToS3(bucketName, filePath, fileName, 'public-read');

                body.file = `https://${bucketName}.s3.amazonaws.com/${fileName}`;
                console.log('File uploaded to S3:', body.file);
            } else {
                console.log('No file received');
            }

            if (req.body.data) {
                const payload = JSON.parse(req.body.data);
                Object.keys(payload).forEach((key) => {
                    body[key] = payload[key];
                });
            }

            req.body = { ...body };
            next();
        } catch (error) {
            console.error('Error in uploadAttachmentToS3AndFormatBody:', error);
            res.status(500).json({ error: 'An error occurred while processing the file upload' });
        }
    };
};
