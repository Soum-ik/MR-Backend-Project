import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';

export const getAllSubFoldersController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // const { folderSlug } = req.params;

    // Fetch all upload designs
    const allDesigns = await prisma.uploadDesign.findMany();

    const allFolders = await prisma.featureAllFolder.findMany();

    const existingSubFolders = await prisma.allSubFolder.findMany();

    const allSubFoldersWithFolder = [...allFolders].map((folder) => {
      // const subFolders = allDesigns
      //   .filter((design) => design.folder === folder.folder)
      //   .map((design, index) => {
      //     const subFolder = design.subFolder;
      //     const slug = design.subFolder?.split(' ').join('-').toLowerCase();
      //     const order = index;
      //     return { subFolder, slug, order };
      //   });
      const subFolders = Array.from(
        new Map(
          allDesigns
            .filter((design) => design.folder === folder.folder)
            .map((design, index) => {
              const subFolder = design.subFolder;
              const slug = subFolder?.split(' ').join('-').toLowerCase();
              return [subFolder, { subFolder, slug, order: index }]; // Create a key-value pair
            }),
        ).values(), // Get unique values from the Map
      );
      const { order, id, ...rest } = folder;
      return { ...rest, subFolders };
    });

    // for(subFoldersData of allSubFoldersWithFolder) {
    //   await prisma.allSubFolder.create({
    //     data: subFoldersData,
    //   });
    // }

    // const createSubFolderPromises = allSubFoldersWithFolder.map(
    //   (subFolderData) =>
    //     prisma.allSubFolder.create({
    //       data: subFolderData,
    //     }),
    // );
    // const createdSubFolders = await Promise.all(createSubFolderPromises);

    let upsertResponses: any = []; // Array to hold responses

    // Loop through each folder data
    for (const folderData of allSubFoldersWithFolder) {
      // Loop through each subFolder
      const existingFolder = await prisma.allSubFolder.findUnique({
        where: { slug: folderData.slug },
      });

      if (existingFolder) {
        // Update the existing subFolder
        // const response = await prisma.allSubFolder.update({
        //   where: { slug: folderData.slug },
        //   data: {
        //     folder: folderData.folder,
        //     subFolders: {
        //       // This can replace or add new entries based on your requirements
        //       push: subFolder, // or use appropriate update logic
        //     },
        //   },
        // });
        // upsertResponses.push(response);
        const response = await prisma.allSubFolder.findMany();
        upsertResponses = response;
      } else {
        // Create a new subFolder
        const response = await prisma.allSubFolder.create({
          data: {
            slug: folderData.slug,
            folder: folderData.folder,
            subFolders: folderData.subFolders, // Assuming subFolders is an array
          },
        });
        upsertResponses.push(response);
      }
    }

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      data: allSubFoldersWithFolder, // Ensure the final output is sorted
      message: 'Sub Folders find successfully',
    });
  } catch (error) {
    console.error('Error:', error);
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      data: null,
      message: 'Sub Folders resolved failed',
    });
  }
};

export const updateSubFolderByOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // const { newOrder }: { newOrder: { id: string }[] } = req.body; // newOrder should be an array of items with their new positions
  // try {
  //   // Start a transaction to update multiple records
  //   await prisma.$transaction(
  //     newOrder.map((item, index) =>
  //       prisma.allSubFolder.update({
  //         where: { id: item.id },
  //         data: { order: index },
  //       }),
  //     ),
  //   );
  //   return sendResponse(res, {
  //     statusCode: httpStatus.OK,
  //     success: true,
  //     data: null,
  //     message: 'Order updated successfully',
  //   });
  // } catch (error) {
  //   console.error('Error updating order:', error);
  //   return sendResponse(res, {
  //     statusCode: httpStatus.INTERNAL_SERVER_ERROR,
  //     success: false,
  //     data: null,
  //     message: 'Error updating order',
  //   });
  // }
};
