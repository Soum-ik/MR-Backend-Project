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
            const bucketName = 'mr-backend-watermark-resized';

            // Updated watermark path to use current directory
            const watermarkPath = path.join(__dirname, 'a.jpg');

            // Ensure processed directory exists
            const processedDir = path.join(process.cwd(), 'processed');
            await fs.mkdir(processedDir, { recursive: true });

            // Process a single image with watermark using Sharp
            const processImageWithWatermark = async (file: Express.Multer.File) => {

                const inputPath = file.path;
                const outputPath = path.join(processedDir, `${bucketName}processed-${file.filename}`);

                try {
                    
                    // Process the main image with watermark
                    await sharp(inputPath)
                        .composite([{
                            input: watermarkPath,
                            blend: 'over',
                            gravity: 'southeast',
                            tile: false
                        }])
                        .toFile(outputPath);


                    // Clean up the original uploaded file
                    await fs.unlink(inputPath);

                    return {
                        outputPath,
                        fileName: path.basename(outputPath)
                    };
                } catch (error) {
                    console.error('Detailed error processing image:', error);
                    // Clean up files in case of error
                    await fs.unlink(inputPath).catch(() => { });
                    await fs.unlink(outputPath).catch(() => { });
                    throw new Error(`Failed to process image ${file.originalname}: ${error}`);
                }
            };

            if (files && files.length === 1) {
                const file = files[0];
                console.log('Processing single file:', file.originalname);

                const { outputPath, fileName } = await processImageWithWatermark(file);

                // Upload to S3
                await uploadFileToS3(bucketName, outputPath, fileName, 'public-read');
                body.file = {
                    url: `https://${bucketName}.s3.amazonaws.com/${fileName}`,
                    originalName: file.originalname,
                    fileType: file.mimetype,
                    fileSize: (await fs.stat(outputPath)).size
                };

                // Cleanup processed file
                await fs.unlink(outputPath).catch(err =>
                    console.error(`Error deleting file ${outputPath}:`, err)
                );

            } else if (files && files.length > 1) {
                console.log('Processing multiple files:', files.length);
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