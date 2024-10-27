import { Request, Response } from "express";
import httpStatus from "http-status";
import { prisma } from "../../../libs/prismaHelper";
import sendResponse from "../../../libs/sendResponse";

export const getAllSubFoldersController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { folderName } = req.body;

        // Fetch all upload designs
        const filteredDesigns = await prisma.uploadDesign.findMany({
            where: {
                folder: folderName,
            },
        });

        if (!Array.isArray(filteredDesigns) || filteredDesigns.length === 0) {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                data: null,
                message: "No designs found in this folder",
            });
        }

        // Create a unique slug to folder map
        const uniqueSubFolders = new Map<string, string>();

        for (const design of filteredDesigns) {
            // Ensure design.folder is not null or undefined
            if (design.subFolder) {
                const slug = design.subFolder
                    .split(" ")
                    .join("-")
                    .toLowerCase();
                if (!uniqueSubFolders.has(slug)) {
                    uniqueSubFolders.set(slug, design.subFolder);
                }
            }
        }

        // Fetch all existing folders and sort by order
        const existingSubFolders = await prisma.allSubFolder.findMany({
            orderBy: {
                order: "asc",
            },
        });

        // Determine folders to delete
        const subFoldersToDelete = existingSubFolders.filter(
            (subfolder) => !uniqueSubFolders.has(subfolder.slug)
        );
        const deletePromises = subFoldersToDelete.map((subFolder) =>
            prisma.allSubFolder.delete({
                where: { id: subFolder.id },
            })
        );

        // Process subfolder creation/updating
        const subFolderPromises = Array.from(uniqueSubFolders.keys()).map(
            async (slug) => {
                const subFolderName = uniqueSubFolders.get(slug);
                if (!subFolderName) {
                    throw new Error(
                        `Sub Folder name not found for slug: ${slug}`
                    );
                }
                let subFolder = await prisma.allSubFolder.findUnique({
                    where: { slug },
                });

                if (!subFolder) {
                    subFolder = await prisma.allSubFolder.create({
                        data: {
                            slug,
                            subFolder: subFolderName,
                            order: await prisma.allSubFolder.count(),
                        },
                    });
                }

                return subFolder;
            }
        );

        // Execute delete and create/update operations
        await Promise.all(deletePromises);
        const subFolders = await Promise.all(subFolderPromises);

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: subFolders.sort((a, b) => a.order - b.order), // Ensure the final output is sorted
            message: "Sub Folders find successfully",
        });
    } catch (error) {
        console.error("Error:", error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: null,
            message: "Sub Folders resolved failed",
        });
    }
};

export const updateSubFolderByOrder = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { newOrder }: { newOrder: { id: string }[] } = req.body; // newOrder should be an array of items with their new positions
    try {
        // Start a transaction to update multiple records
        await prisma.$transaction(
            newOrder.map((item, index) =>
                prisma.allSubFolder.update({
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
