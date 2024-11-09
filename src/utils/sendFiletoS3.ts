import {
    ObjectCannedACL,
    PutObjectCommand,
    PutObjectCommandInput,
    S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '../config/config';

// Initialize S3 client
const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID as string,
        secretAccessKey: AWS_SECRET_ACCESS_KEY as string,
    },
});

export const uploadFileToS3 = (
    bucketName: string,
    filePath: string,
    fileName: string,
    acl: ObjectCannedACL = 'private',
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const fileContent = fs.readFileSync(filePath);
        const contentType = getContentType(fileName);

        const params: PutObjectCommandInput = {
            Bucket: bucketName,
            Key: fileName,
            Body: fileContent,
            ContentType: contentType,
            // ACL: acl,
        };

        const command = new PutObjectCommand(params);

        s3Client
            .send(command)
            .then(() => {
                console.log(
                    `File uploaded successfully to ${bucketName}/${fileName}`,
                );
                // Delete the file asynchronously
                
                resolve(`${bucketName}/${fileName}`);
            })
            .catch((error: any) => {
                console.error('Error uploading file:', error);
                reject(error);
            });
    });
};

export const uploadMultipleFilesToS3 = (
    bucketName: string,
    files: { filePath: string; fileName: string }[],
    acl: ObjectCannedACL = 'private',
): Promise<string[]> => {
    return Promise.all(
        files.map(({ filePath, fileName }) => {
            return new Promise<string>((resolve, reject) => {
                const fileContent = fs.readFileSync(filePath);
                const contentType = getContentType(fileName);

                const params: PutObjectCommandInput = {
                    Bucket: bucketName,
                    Key: fileName,
                    Body: fileContent,
                    ContentType: contentType,
                    // ACL: acl,
                };

                const command = new PutObjectCommand(params);

                s3Client
                    .send(command)
                    .then(() => {
                        console.log(
                            `File uploaded successfully to ${bucketName}/${fileName}`,
                        );

                        // Delete the file asynchronously
                        // fs.unlink(filePath, (err) => {
                        //     if (err) {
                        //         console.error('Error deleting file:', err);
                        //     } else {
                        //         console.log('File is deleted.');
                        //     }
                        // });

                        resolve(`${bucketName}/${fileName}`);
                    })
                    .catch((error: any) => {
                        console.error('Error uploading file:', error);
                        reject(error);
                    });
            });
        }),
    );
};

export const getContentType = (fileName: string): string => {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
        case '.jpeg':
        case '.jpg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.pdf':
            return 'application/pdf';
        case '.doc':
        case '.docx':
            return 'application/msword';
        case '.txt':
            return 'text/plain';
        case '.zip':
            return 'application/zip';
        case '.mp3':
            return 'audio/mpeg';
        case '.mp4':
            return 'video/mp4';
        case '.mkv':
        case '.avi':
            return 'video/x-msvideo';
        case '.gif':
            return 'image/gif';
        case '.svg':
            return 'image/svg+xml';
        default:
            return 'application/octet-stream';
    }
};
