
import { Request, Response } from "express";
import { prisma } from "../../../libs/prismaHelper";
import sendResponse from "../../../libs/sendResponse";
import httpStatus from "http-status";


export const getAllFoldersController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch all upload designs
    const uploadDesigns = await prisma.uploadDesign.findMany();

    if (!Array.isArray(uploadDesigns)) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        data: null,
        message: "Invalid data format",
      });
    }

    // Create a unique slug to folder map
    const uniqueFolders = new Map<string, string>();

    for (const design of uploadDesigns) {
      // Ensure design.folder is not null or undefined
      if (design.folder) {
        const slug = design.folder.split(" ").join("-").toLowerCase();
        if (!uniqueFolders.has(slug)) {
          uniqueFolders.set(slug, design.folder);
        }
      }
    }

    // Fetch all existing folders and sort by order
    const existingFolders = await prisma.featureAllFolder.findMany({
      orderBy: {
        order: "asc", // Ensure folders are sorted by 'order' field in ascending order
      },
    });

    const existingFolderSlugs = new Set(existingFolders.map((folder) => folder.slug));

    // Determine folders to delete
    const foldersToDelete = existingFolders.filter(
      (folder) => !uniqueFolders.has(folder.slug)
    );
    const deletePromises = foldersToDelete.map((folder) =>
      prisma.featureAllFolder.delete({
        where: { id: folder.id },
      })
    );

    // Process folder creation/updating
    const folderPromises = Array.from(uniqueFolders.keys()).map(
      async (slug) => {

        const folderName = uniqueFolders.get(slug);
        if (!folderName) {
          throw new Error(`Folder name not found for slug: ${slug}`);
        }
        let folder = await prisma.featureAllFolder.findUnique({
          where: { slug },
        });

        if (!folder) {
          folder = await prisma.featureAllFolder.create({
            data: {
              slug,
              folder: folderName,
              order: await prisma.featureAllFolder.count(), // You might want to use a more reliable order strategy
            },
          });
        }

        return folder;
      }
    );

    // Execute delete and create/update operations
    await Promise.all(deletePromises);
    const folders = await Promise.all(folderPromises);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      data: folders.sort((a, b) => a.order - b.order), // Ensure the final output is sorted
      message: "Folders resolved successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      data: null,
      message: "Folders resolved failed",
    });
  }
};

export const updateFolderByOrder = async (req: Request, res: Response): Promise<void> => {
  const { newOrder }: { newOrder: { id: string }[] } = req.body; // newOrder should be an array of items with their new positions
  try {
    // Start a transaction to update multiple records
    await prisma.$transaction(
      newOrder.map((item, index) =>
        prisma.featureAllFolder.update({
          where: { id: item.id },
          data: { order: index },
        })
      )
    );
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      data: null,
      message: "Order updated successfully",
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      data: null,
      message: "Error updating order",
    });
  }
};