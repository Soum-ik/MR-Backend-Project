import { NextFunction, Request, Response } from 'express';
import { uploadFileToS3, uploadMultipleFilesToS3 } from '../utils/sendFiletoS3';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

interface FileData {
    url: string;
    originalName: string;
    fileType: string;
    fileSize: number;
}

export const uploadAttachmentToS3AndFormatBody = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body: { file?: FileData; files?: FileData[] } = {};
            const files = req.files as Express.Multer.File[];
            const bucketNameWatermark = 'mr-backend-watermark-resized';
            const bucketName = 'mr-backend';


            // Updated watermark path to use current directory
            const watermarkPath = path.join(__dirname, 'watermark.png');

            // Ensure processed directory exists
            const processedDir = path.join(process.cwd(), 'processed');


            await fs.mkdir(processedDir, { recursive: true });

            // Process a single image with watermark using Sharp
            const processImageWithWatermark = async (file: Express.Multer.File) => {
                const inputPath = file.path;
                const outputPath = path.join(processedDir, `${bucketNameWatermark}-${file.filename}`);
                const fileName = `${bucketNameWatermark}-${file.filename}`;
                console.log('fileName checking 1', fileName);

                try {

                    // Read dimensions of the main image with type safety
                    const mainImage = sharp(inputPath);
                    const metadata = await mainImage.metadata();

                    if (!metadata.width || !metadata.height) {
                        throw new Error('Failed to retrieve image dimensions');
                    }

                    const { width, height } = metadata;

                    // Resize watermark to match the main image dimensions
                    const watermark = await sharp(watermarkPath)
                        .resize(width, height, { fit: 'cover' })
                        .toBuffer();

                    // Process the main image with the resized watermark
                    await mainImage
                        .composite([{
                            input: watermark,
                            blend: 'over'
                        }])
                        .toFile(outputPath);

                    // Close the sharp instance after processing
                    mainImage.destroy();

                    // Clean up the original uploaded file

                    return {
                        outputPath,
                        fileName: fileName
                    };
                } catch (error) {
                    throw new Error(`Failed to process image ${file.originalname}: ${error}`);
                }
            };

            if (files && files.length === 1) {
                const file = files[0];
                const originalFileName = `${bucketName}-${file.filename}`;




                await uploadFileToS3(bucketName, file.path, originalFileName, 'public-read');

                if (file.mimetype.includes('image')) {
                    const { outputPath, fileName } = await processImageWithWatermark(file);
                    await uploadFileToS3(bucketNameWatermark, outputPath, fileName, 'public-read');
                    body.file = {
                        url: `https://${bucketNameWatermark}.s3.amazonaws.com/${fileName}`,
                        originalName: file.originalname,
                        fileType: file.mimetype,
                        fileSize: (await fs.stat(outputPath)).size
                    };
                } else {
                    body.file = {
                        url: `https://${bucketName}.s3.amazonaws.com/${originalFileName}`,
                        originalName: file.originalname,
                        fileType: file.mimetype,
                        fileSize: (await fs.stat(file.path)).size
                    };
                }

            } else if (files && files.length > 1) {



                if (files.every(file => file.mimetype.includes('image'))) {
                    const processedFiles = await Promise.all(files.map(processImageWithWatermark));
                    const uploadedFiles = await uploadMultipleFilesToS3(bucketNameWatermark,
                        processedFiles.map(({ outputPath, fileName }) => ({
                            filePath: outputPath,
                            fileName: fileName
                        })),
                        'public-read'
                    );

                    body.files = await Promise.all(uploadedFiles.map(async (fileName, index) => {
                        const file = files[index];
                        return {
                            url: `https://${bucketNameWatermark}.s3.amazonaws.com/${fileName}`,
                            originalName: file.originalname,
                            fileType: file.mimetype,
                            fileSize: (await fs.stat(processedFiles[index].outputPath)).size
                        };
                    }));
                } else {
                    const uploadedFiles = await uploadMultipleFilesToS3(
                        bucketName,
                        files.map((file) => ({
                            filePath: file.path,
                            fileName: `${bucketName}-${file.filename}`
                        })),
                        'public-read'
                    );

                    body.files = await Promise.all(uploadedFiles.map(async (fileName, index) => {
                        const file = files[index];
                        return {
                            url: `https://${bucketName}.s3.amazonaws.com/${fileName}`,
                            originalName: file.originalname,
                            fileType: file.mimetype,
                            fileSize: (await fs.stat(file.path)).size
                        };
                    }));
                }



            } else {
                console.log('No files received');
            }

            // Parse and merge additional form data
            if (req.body.data) {
                const payload = JSON.parse(req.body.data);
                Object.keys(payload).forEach((key) => {
                    body[key as keyof typeof body] = payload[key];
                });
            }

            const filesToDelete = files.map(file => {
                fs.unlink(file.path);
            })
            const processedFiles = await fs.readdir(processedDir);

            if (processedFiles.length > 0) {
                await Promise.all(processedFiles.map(file => {
                    fs.unlink(path.join(processedDir, file));
                }));
            }
            await Promise.all(filesToDelete);

            req.body = { ...body };
            next();
        } catch (error) {
            console.error('Error in uploadAttachmentToS3AndFormatBody:', error);
            res.status(500).json({
                error: 'An error occurred while processing the file upload',
                details: error
            });
        }
    };
};