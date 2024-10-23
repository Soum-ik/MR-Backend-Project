import { NextFunction, Request, Response } from 'express';
import { uploadFileToS3, uploadMultipleFilesToS3 } from '../utils/sendFiletoS3';
import sharp from 'sharp';
import fs from 'fs/promises'; // Use promises for file system
import path from 'path';
import jimp from 'jimp';

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
            const bucketName = process.env.BUCKET_NAME || 'mr-backend'; // Use env variable
            const watermarkPath = path.resolve(__dirname, './watermark.png'); // Path to watermark image

            // Process a single image with watermark
            const processImageWithWatermark = async (file: Express.Multer.File) => {
                const filePath = path.resolve(__dirname, `./uploads/${file.filename}`);
                const outputPath = path.resolve(__dirname, `./processed/${file.filename}`);

                // Read image using Jimp
                const image = await jimp.read(file.buffer); // Read image from buffer (Multer)
                const watermark = await jimp.read(watermarkPath); // Read the watermark image

                // Resize watermark based on image size (optional)
                watermark.resize(image.bitmap.width / 5, jimp.AUTO);

                // Composite watermark on the bottom-right corner
                image.composite(watermark, image.bitmap.width - watermark.bitmap.width - 10, image.bitmap.height - watermark.bitmap.height - 10, {
                    mode: jimp.BLEND_SOURCE_OVER,
                    opacitySource: 0.5
                });

                // Save watermarked image to a buffer
                const watermarkedImageBuffer = await image.getBufferAsync(jimp.MIME_PNG);

                // Write processed image to file system (optional, depends on your flow)
                await fs.writeFile(outputPath, watermarkedImageBuffer);

                return { outputPath, fileName: file.filename };
            };

            if (files && files.length === 1) {
                const file = files[0];
                const { outputPath, fileName } = await processImageWithWatermark(file);

                // Upload the processed image to S3
                await uploadFileToS3(bucketName, outputPath, fileName, 'public-read');
                body.file = {
                    url: `https://${bucketName}.s3.amazonaws.com/${fileName}`,
                    originalName: file.originalname,
                    fileType: file.mimetype,
                    fileSize: (await fs.stat(outputPath)).size // Use async stat
                };

                // Clean up the local processed file
                const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
                if (fileExists) {
                    await fs.unlink(outputPath);
                } else {
                    console.error(`File not found for unlinking: ${outputPath}`);
                }
            } else if (files && files.length > 1) {
                const processedFiles = await Promise.all(files.map(processImageWithWatermark));

                const uploadedFiles = await uploadMultipleFilesToS3(
                    bucketName,
                    processedFiles.map(({ outputPath, fileName }) => ({
                        filePath: outputPath,
                        fileName: fileName
                    })),
                    'public-read'
                );

                body.files = await Promise.all(uploadedFiles.map(async (fileName, index) => {
                    const file = files[index];
                    return {
                        url: `https://${bucketName}.s3.amazonaws.com/${fileName}`,
                        originalName: file.originalname,
                        fileType: file.mimetype,
                        fileSize: (await fs.stat(processedFiles[index].outputPath)).size // Use async stat
                    };
                }));

                // Clean up the local processed files
                await Promise.all(processedFiles.map(async ({ outputPath }) => {
                    const fileExists = await fs.access(outputPath).then(() => true).catch(() => false);
                    if (fileExists) {
                        await fs.unlink(outputPath);
                    } else {
                        console.error(`File not found for unlinking: ${outputPath}`);
                    }
                }));
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

            req.body = { ...body }; // Overwrite request body with updated data
            next(); // Continue to next middleware
        } catch (error) {
            console.error('Error in uploadAttachmentToS3AndFormatBody:', error);
            res.status(500).json({ error: 'An error occurred while processing the file upload' });
        }
    };
};
