import { NextFunction, Request, Response } from 'express';
import { uploadFileToS3, uploadMultipleFilesToS3 } from '../utils/sendFiletoS3';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import AppError from '../errors/AppError';
import httpStatus from 'http-status';
import catchAsync from '../libs/utlitys/catchSynch';

interface FileData {
    url: string;
    originalName: string;
    fileType: string;
    fileSize: number;
}

export const uploadAttachmentToS3AndFormatBody = () => {
    return catchAsync(
        async (req: Request, res: Response, next: NextFunction) => {
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

            if (files && files.length === 0) {
                throw new AppError(httpStatus.NOT_FOUND, 'No files recived');
            }

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

                await uploadMultipleFilesToS3(
                    bucketName,
                    files.map((file) => ({
                        filePath: file.path,
                        fileName: `${bucketName}-${file.filename}`
                    })),
                    'public-read'
                );

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
            }

            // Parse and merge additional form data
            if (req.body.data) {
                const payload = JSON.parse(req.body.data);
                Object.keys(payload).forEach((key) => {
                    body[key as keyof typeof body] = payload[key];
                });
            }

            // Handle file cleanup with error handling and retries
            const deleteFile = async (filePath: string, retries = 3, delay = 1000) => {
                for (let i = 0; i < retries; i++) {
                    try {
                        await fs.unlink(filePath);
                        return;
                    } catch (error) {
                        if (i === retries - 1) {
                            console.error(`Failed to delete file ${filePath} after ${retries} attempts:`, error);
                        } else {
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    }
                }
            };

            const uploads = path.join(process.cwd(), 'uploads');
            await fs.mkdir(uploads, { recursive: true });
            
            const uploadsFiles = await fs.readdir(uploads);
            console.log(uploadsFiles, 'uploadsfiles');

            const processedFiles = await fs.readdir(processedDir);

            // Clean up files with retry mechanism
            const cleanupPromises = [];

            if (uploadsFiles.length > 0) {
                cleanupPromises.push(...uploadsFiles.map(async file => {
                    const filePath = path.join(uploads, file);
                    try {
                        await fs.stat(filePath);
                        console.log(file, 'file exists and attempting to remove');
                        await deleteFile(filePath);
                    } catch (error) {
                        console.log(file, 'file does not exist or cannot be accessed');
                    }
                }));
            }

            if (processedFiles.length > 0) {
                cleanupPromises.push(...processedFiles.map(file => 
                    deleteFile(path.join(processedDir, file))
                ));
            }

            cleanupPromises.push(...files.map(file => 
                deleteFile(file.path)
            ));

            try {
                await Promise.all(cleanupPromises);
            } catch (error) {
                console.error('Error during file cleanup:', error);
                // Continue execution even if cleanup fails
            }

            req.body = { ...body };
            next();
        }
    );
};