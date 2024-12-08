import { NextFunction, Request, Response } from 'express';
import fs from 'fs/promises';
import httpStatus from 'http-status';
import path from 'path';
import sharp from 'sharp';
import AppError from '../errors/AppError';
import catchAsync from '../libs/utlitys/catchSynch';
import { uploadFileToS3, uploadMultipleFilesToS3 } from '../utils/sendFiletoS3';

interface FileData {
  url: string;
  optimizedUrl: string;
  originalName: string;
  fileType: string;
  fileSize: number;
}

export const uploadAttachmentToS3AndFormatBodyOptimized = () => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const body: { file?: FileData; files?: FileData[] } = {};
    const files = req.files as Express.Multer.File[];
    const bucketNameWatermark = 'mr-backend-watermark-resized';

    // Updated watermark path to use current directory
    const watermarkPath = path.join(__dirname, 'watermark.png');

    // Ensure processed directory exists
    const processedDir = path.join(process.cwd(), 'processed');
    await fs.mkdir(processedDir, { recursive: true });

    const processImageWithWatermark = async (file: Express.Multer.File) => {
      const inputPath = file.path;
      const outputPath = path.join(
        processedDir,
        `${bucketNameWatermark}-${file.filename}`,
      );
      const fileName = `${bucketNameWatermark}-${file.filename}`;
 

      try {
        // Read dimensions of the main image with type safety
        const mainImage = sharp(inputPath).jpeg({ quality: 75 });
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
          .composite([
            {
              input: watermark,
              blend: 'over',
            },
          ])
          .toFile(outputPath);

        // Close the sharp instance after processing
        mainImage.destroy();

        // Clean up the original uploaded file

        return {
          watermarkPath: outputPath,
          watermarkfileName: fileName,
        };
      } catch (error) {
        throw new Error(
          `Failed to process image ${file.originalname}: ${error}`,
        );
      }
    };

    // Process a single image with watermark using Sharp
    const processImageWithOptimized = async (file: Express.Multer.File) => {
      const inputPath = file.path;
      const outputPath = path.join(
        processedDir,
        `${bucketNameWatermark}-${file.filename}`,
      );
      const fileName = `${bucketNameWatermark}-resized-${file.filename}`;
 

      try {
        // Process and compress the image
        await sharp(inputPath)
          .resize(400, 225, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 75 })
          .toFile(outputPath);

        return {
          optimizedPath: outputPath,
          optimizedfileName: fileName,
        };
      } catch (error) {
        throw new Error(
          `Failed to process image ${file.originalname}: ${error}`,
        );
      }
    };

    if (files && files.length === 0) {
      throw new AppError(httpStatus.NOT_FOUND, 'No files recived');
    }

    if (files && files.length === 1) {
      const file = files[0];

      if (file.mimetype.includes('image')) {
        const { optimizedPath, optimizedfileName } =
          await processImageWithOptimized(file);
        await uploadFileToS3(
          bucketNameWatermark,
          optimizedPath,
          optimizedfileName,
          'public-read',
        );

        const { watermarkPath, watermarkfileName } =
          await processImageWithWatermark(file);
        await uploadFileToS3(
          bucketNameWatermark,
          watermarkPath,
          watermarkfileName,
          'public-read',
        );
        body.file = {
          url: `https://${bucketNameWatermark}.s3.amazonaws.com/${watermarkfileName}`,
          optimizedUrl: `https://${bucketNameWatermark}.s3.amazonaws.com/${optimizedfileName}`,
          originalName: file.originalname,
          fileType: file.mimetype,
          fileSize: (await fs.stat(optimizedPath)).size,
        };
      } else {
        throw new AppError(httpStatus.BAD_REQUEST, 'File is not an image');
      }
    } else if (files && files.length > 1) {
      if (files.every((file) => file.mimetype.includes('image'))) {
        const processedFiles = await Promise.all(
          files.map(processImageWithWatermark),
        );
        await uploadMultipleFilesToS3(
          bucketNameWatermark,
          processedFiles.map(({ watermarkPath, watermarkfileName }) => ({
            filePath: watermarkPath,
            fileName: watermarkfileName,
          })),
          'public-read',
        );

        const processedFilesOptimized = await Promise.all(
          files.map(processImageWithOptimized),
        );
        await uploadMultipleFilesToS3(
          bucketNameWatermark,
          processedFilesOptimized.map(
            ({ optimizedPath, optimizedfileName }) => ({
              filePath: optimizedPath,
              fileName: optimizedfileName,
            }),
          ),
          'public-read',
        );

        body.files = await Promise.all(
          files.map(async (file, index) => {
            return {
              url: `https://${bucketNameWatermark}.s3.amazonaws.com/${processedFiles[index].watermarkfileName}`,
              optimizedUrl: `https://${bucketNameWatermark}.s3.amazonaws.com/${processedFilesOptimized[index].optimizedfileName}`,
              originalName: file.originalname,
              fileType: file.mimetype,
              fileSize: (
                await fs.stat(processedFilesOptimized[index].optimizedPath)
              ).size,
            };
          }),
        );
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

    // Handle file cleanup with error handling and retries
    const deleteFile = async (filePath: string, retries = 3, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          await fs.unlink(filePath);
          return;
        } catch (error) {
          if (i === retries - 1) throw error;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    };

    const uploads = path.join(process.cwd(), 'uploads');
    const uploadsFiles = await fs.readdir(uploads);
    console.log(uploadsFiles, 'uploadsfiles');

    const processedFiles = await fs.readdir(processedDir);

    // Clean up files with retry mechanism
    const cleanupPromises = [];

    if (uploadsFiles.length > 0) {
      cleanupPromises.push(
        ...uploadsFiles.map(async (file) => {
          const filePath = path.join(uploads, file);
          try {
            await fs.stat(filePath);
            console.log(file, 'file exists and attempting to remove');
            await deleteFile(filePath);
          } catch (error) {
            console.log(file, 'file does not exist or cannot be accessed');
          }
        }),
      );
    }

    if (processedFiles.length > 0) {
      cleanupPromises.push(
        ...processedFiles.map((file) =>
          deleteFile(path.join(processedDir, file)),
        ),
      );
    }

    cleanupPromises.push(...files.map((file) => deleteFile(file.path)));

    try {
      await Promise.all(cleanupPromises);
    } catch (error) {
      console.error('Error during file cleanup:', error);
      // Continue execution even if cleanup fails
    }

    req.body = { ...body };
    next();
  });
};
