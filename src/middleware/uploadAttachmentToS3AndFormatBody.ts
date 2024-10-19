import { NextFunction, Request, Response } from 'express';

import { uploadFileToS3, uploadMultipleFilesToS3 } from '../utils/sendFiletoS3';

export const uploadAttachmentToS3AndFormatBody = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body: any = {};
            const files = req.files as Express.Multer.File[];
            console.log('Received files:', files);

            const bucketName = 'mr-backend';

            if (files && files.length === 1) {
                const file = files[0];
                const fileName = `mr-backend-${Date.now()}-${file.originalname}`;
                const filePath = file.path;
                await uploadFileToS3(bucketName, filePath, fileName, 'public-read');
                body.file = `https://${bucketName}.s3.amazonaws.com/${fileName}`;
                console.log('File uploaded to S3:', body.file);
            } else if (files && files.length > 1) {
                const uploadedFiles = await uploadMultipleFilesToS3(
                    bucketName,
                    files.map(file => {
                        const fileName = `mr-backend-${Date.now()}-${file.originalname}`;
                        const filePath = file.path;
                        return {
                            filePath: filePath,
                            fileName: fileName
                        };
                    }),
                    'public-read'
                );

                body.files = uploadedFiles.map(fileName => {
                    // This assumes uploadedFiles returns the exact names you want for the URL
                    // If not, you'll need to strip '/mr-backend/' in the name you are getting back
                    const cleanFileName = fileName.replace('mr-backend/', ''); // Ensure to remove the prefix if it's there
                    console.log(cleanFileName, "cleanFileName");
                    return `https://${bucketName}.s3.amazonaws.com/${cleanFileName}`;
                });
                console.log('Files uploaded to S3:', body.files);
            } else {
                console.log('No files received');
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
