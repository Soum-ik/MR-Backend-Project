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
      const subFolders = allDesigns
        .filter((design) => design.folder === folder.folder)
        .map((design, index) => {
          const subFolder = design.subFolder;
          const slug = design.subFolder?.split(' ').join('-').toLowerCase();
          const order = index;
          return { subFolder, slug, order };
        });
      const { order, id, ...rest } = folder;
      return { ...rest, subFolders };
    });

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
