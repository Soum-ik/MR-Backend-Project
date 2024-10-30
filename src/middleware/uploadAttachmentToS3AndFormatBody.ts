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


                const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

                const safeUnlink = async (filePath: string) => {
                    try {
                        await delay(300);  // Adjust delay as needed (e.g., 100ms)
                        await fs.unlink(filePath);
                    } catch (error) {
                        console.error('Error during unlink:', error);
                    }
                };


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
                    await safeUnlink(inputPath);

                    console.log(outputPath, path.basename(outputPath));
                    return {
                        outputPath,
                        fileName: path.basename(outputPath)

                    };
                } catch (error) {
                    console.error('Detailed error processing image:', error);

                    // Clean up with safe unlink
                    await safeUnlink(inputPath);
                    await safeUnlink(outputPath);

                    throw new Error(`Failed to process image ${file.originalname}: ${error}`);
                }
            };

            if (files && files.length === 1) {
                const file = files[0];
                console.log('Processing single file:', file.originalname);

                await uploadFileToS3(bucketName, file.path, file.originalname, 'public-read');
                let outputPath, fileName;


                // Check if the file type is png, jpg, or jpeg to decide on watermarking
                if (['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype)) {
                    ({ outputPath, fileName } = await processImageWithWatermark(file));
                } else {
                    // Directly move the file without watermarking
                    outputPath = file.path;
                    fileName = file.originalname;
                }

                // Upload to S3
                await uploadFileToS3(bucketNameWatermark, outputPath, fileName, 'public-read');
                body.file = {
                    url: `https://${bucketNameWatermark}.s3.amazonaws.com/${fileName}`,
                    originalName: file.originalname,
                    fileType: file.mimetype,
                    fileSize: (await fs.stat(outputPath)).size
                };

                // Cleanup processed file
                // await fs.unlink(outputPath).catch(err =>
                //     console.error(`Error deleting file ${outputPath}:`, err)
                // );

            } else if (files && files.length > 1) {
                console.log('Processing multiple files:', files.length);
                const processedFiles = await Promise.all(files.map(processImageWithWatermark));

                const uploadedFiles = await uploadMultipleFilesToS3(
                    bucketNameWatermark,
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

                // Cleanup processed files
                await Promise.all(processedFiles.map(({ outputPath }) =>
                    fs.unlink(outputPath).catch(err =>
                        console.error(`Error deleting file ${outputPath}:`, err)
                    )
                ));
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