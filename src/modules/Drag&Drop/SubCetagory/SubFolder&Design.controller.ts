import { Request, Response } from 'express';
import httpStatus from 'http-status';
import AppError from '../../../errors/AppError';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import catchAsync from '../../../libs/utlitys/catchSynch';

export const getAlldesignsSub_Folders = catchAsync(
  async (req: Request, res: Response) => {
    const { folderName, subFolderName } = req.query as {
      folderName?: string;
      subFolderName?: string;
    };

    console.log('design id');

    if (!folderName || !subFolderName) {
      throw new AppError(httpStatus.NOT_FOUND, 'Folders missing');
    }

    const findDesign = await prisma.uploadDesign.findMany({
      where: {
        folder: folderName,
        subFolder: subFolderName,
      },
      select: {
        designId: true,
      },
    });

    const list = findDesign.map((i) => i.designId);

    const existingdesign = await prisma.allDesignsByFolderSubFolder.findMany({
      where: {
        designId: {
          in: [...list],
        },
      },
    });

    // Extract just the designIds from existing designs for comparison
    const existingDesignIds = existingdesign.map((design) => design.designId);

    const designsToCreate = findDesign.filter(
      (design) => !existingDesignIds.includes(design.designId),
    );

    if (designsToCreate.length === 0) {
      const findQuery = await prisma.allDesignsByFolderSubFolder.findMany({
        where: {
          folderName: folderName,
          subFolderName: subFolderName,
        },
      });

      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: findQuery,
      });
    }
    const createdDesigns = await Promise.all(
      designsToCreate.map(async (design) => {
        try {
          const newDesign = await prisma.allDesignsByFolderSubFolder.create({
            data: {
              subFolderName: subFolderName,
              order: await prisma.allDesignsByFolderSubFolder.count(),
              folderName: folderName,
              designId: design.designId,
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

    const getDesigns = await prisma.allDesignsByFolderSubFolder.findMany({
      where: {
        folderName: folderName,
        subFolderName: subFolderName,
      },
    });

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      data: getDesigns,
    });
  },
);

export const updateAlldesignsSub_Folders = catchAsync(
  async (req: Request, res: Response) => {
    const { newOrder } = req.body;
    await prisma.$transaction(
      newOrder.map((item: any, index: number) =>
        prisma.allDesignsByFolderSubFolder.update({
          where: { id: item.id },
          data: { order: index },
        }),
      ),
    );
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      data: null,
      message: 'Order Updated Successfully.',
      success: true,
    });
  },
);
