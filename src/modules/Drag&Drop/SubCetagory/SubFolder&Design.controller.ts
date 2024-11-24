
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../../libs/prismaHelper';
import catchAsync from '../../../libs/utlitys/catchSynch';
import sendResponse from '../../../libs/sendResponse';
import AppError from '../../../errors/AppError';



export const getAlldesignsSub_Folders = catchAsync(
    async (req: Request, res: Response) => {
        const { folderName, subFolderName } = req.query as {
            folderName?: string;
            subFolderName?: string;
        };


        console.log('design id');


        if (!folderName || !subFolderName) {
            throw new AppError(httpStatus.NOT_FOUND, 'Folders missing')
        }



        const findDesign = await prisma.uploadDesign.findMany({
            where: {
                folder: folderName,
                subFolder: subFolderName
            },
            select: {
                designId: true
            }
        })

        const list = findDesign.map(i => i.designId)

        const existingdesign = await prisma.allDesignsByFolderSubFolder.findMany({
            where: {
                designId: {
                    in: [...list]
                }
            }
        })

        // Extract just the designIds from existing designs for comparison
        const existingDesignIds = existingdesign.map(design => design.designId);

        const designsToCreate = findDesign.filter(design => !existingDesignIds.includes(design.designId));

        if (designsToCreate.length === 0) {

            const findQuery = await prisma.allDesignsByFolderSubFolder.findMany({
                where: {
                    folderName: folderName,
                    subFolderName: subFolderName
                },
            })

            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                data: findQuery
            })
        }
        const createdDesigns = await Promise.all(
            designsToCreate.map(async (design) => {
                try {
                    const newDesign = await prisma.allDesignsByFolderSubFolder.create({
                        data: {
                            subFolderName: subFolderName,
                            order: await prisma.allDesignsByFolderSubFolder.count(),
                            folderName: folderName,
                            designId: design.designId

                        },
                    });
                    console.log(`Created new folder: ${folderName}`);
                    return newDesign;
                } catch (error) {
                    console.error(`Error creating subfolder ${folderName}:`, error);
                    throw error;
                }
            }),
        );

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: createdDesigns
        })

    })


//   // Filter out designs that need to be created
//   const designsToCreate = findDesign.filter(design => !existingDesignIds.has(design.designId));

//   if (designsToCreate.length === 0) {
//       console.log('All designs already exist');
//       return existingDesigns;
//   }

//   // Create new designs
//   const newDesigns = await prisma.allDesignsByFolderSubFolder.createMany({
//       data: designsToCreate.map(design => ({
//           designId: design.designId,
//           // Add other required fields here
//       })),
//       skipDuplicates: true // Extra safety measure
//   });

//   // Return combined results
//   const updatedDesigns = await prisma.allDesignsByFolderSubFolder.findMany({
//       where: {
//           designId: {
//               in: designIds
//           }
//       }
//   });

//   return updatedDesigns;