import { NextFunction, Request, Response } from 'express';
import { uploadFileToS3, uploadMultipleFilesToS3 } from '../utils/sendFiletoS3';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import AppError from '../errors/AppError';
import httpStatus from 'http-status';

interface FileData {
    url: string;
    originalName: string;
    fileType: string;
    optimizedUrl: string;
    fileSize: number;
}

export const uploadAttachmentToS3AndFormatBodyOptimized = () => {
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
                        optimizedPath: outputPath,
                        optimizedfileName: fileName
                    };
                } catch (error) {
                    throw new Error(`Failed to process image ${file.originalname}: ${error}`);
                }
            };



            // Process a single image with watermark using Sharp
            const processImageWithWatermarkOptimized = async (file: Express.Multer.File) => {
                const inputPath = file.path;
                const outputPath = path.join(processedDir, `${bucketNameWatermark}-${file.filename}`);
                const fileName = `${bucketNameWatermark}-resized-${file.filename}`;
                console.log('fileName checking 1', fileName);

                try {
                    // Process and compress the image
                    await sharp(inputPath)
                        .resize(1000, 741, {
                            fit: 'inside',
                            withoutEnlargement: true
                        })
                        .jpeg({ quality: 80 })
                        .toFile(outputPath);

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

                if (file.mimetype.includes('image')) {
                    const { outputPath, fileName } = await processImageWithWatermarkOptimized(file);
                    const { optimizedPath, optimizedfileName } = await processImageWithWatermark(file);
                    await uploadFileToS3(bucketNameWatermark, outputPath, fileName, 'public-read');
                    await uploadFileToS3(bucketNameWatermark, optimizedPath, optimizedfileName, 'public-read');
                    body.file = {
                        url: `https://${bucketNameWatermark}.s3.amazonaws.com/${fileName}`,
                        optimizedUrl: `https://${bucketNameWatermark}.s3.amazonaws.com/${optimizedfileName}`,
                        originalName: file.originalname,
                        fileType: file.mimetype,
                        fileSize: (await fs.stat(outputPath)).size
                    };
                } else {
                    throw new AppError(httpStatus.BAD_REQUEST, 'File is not an image');
                }

            } else if (files && files.length > 1) {


                if (files.every(file => file.mimetype.includes('image'))) {
                    const processedFiles = await Promise.all(files.map(processImageWithWatermark));
                    const processedFilesOptimized = await Promise.all(files.map(processImageWithWatermarkOptimized));
                    
                    // Upload original files
                    await uploadMultipleFilesToS3(bucketNameWatermark,
                        processedFiles.map(({ optimizedPath, optimizedfileName }) => ({
                            filePath: optimizedPath,
                            fileName: optimizedfileName
                        })),
                        'public-read'
                    );

                    // Upload optimized files
                    await uploadMultipleFilesToS3(bucketNameWatermark,
                        processedFilesOptimized.map(({ outputPath, fileName }) => ({
                            filePath: outputPath,
                            fileName: fileName
                        })),
                        'public-read'
                    );

                    body.files = await Promise.all(files.map(async (file, index) => {
                        return {
                            url: `https://${bucketNameWatermark}.s3.amazonaws.com/${processedFiles[index].optimizedfileName}`,
                            optimizedUrl: `https://${bucketNameWatermark}.s3.amazonaws.com/${processedFilesOptimized[index].fileName}`,
                            originalName: file.originalname,
                            fileType: file.mimetype,
                            fileSize: (await fs.stat(processedFilesOptimized[index].outputPath)).size
                        };
                    }));
                } else {
                    throw new AppError(httpStatus.BAD_REQUEST, 'File is not an image');
                }
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

            const uploads = path.join(process.cwd(), 'uploads');
            const uploadsFiles = await fs.readdir(uploads);
            console.log(uploadsFiles, 'uploadsfiles');

            const processedFiles = await fs.readdir(processedDir);


            if (uploadsFiles.length > 0) {
                await Promise.all(uploadsFiles.map(async file => {
                    const filePath = path.join(uploads, file);
                    try {
                        if (await fs.stat(filePath).then(() => true).catch(() => false)) {
                            console.log(file, 'file exists and is being removed');
                            await fs.unlink(filePath);
                        } else {
                            console.log(file, 'file does not exist');
                        }
                    } catch (error) {
                        console.log(`Error checking or deleting file ${file}:`, error);
                        // Do not throw an error to avoid sending it in the response
                    }
                }));
            }

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