import { Request, Response } from "express";
import httpStatus from "http-status";
import { prisma } from "../../../libs/prismaHelper";
import sendResponse from "../../../libs/sendResponse";

export const getAllDesignsController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { folderName, subFolderName } = req.body;

        // Fetch all upload designs
        const filteredDesigns = await prisma.uploadDesign.findMany({
            where: {
                folder: folderName,
                subFolder: subFolderName,
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
        const uniqueDesigns = new Map<string, string>();

        for (const design of filteredDesigns) {
            // Ensure design.folder is not null or undefined
            if (design.designId) {
                const slug = design.designId;
                if (!uniqueDesigns.has(slug)) {
                    uniqueDesigns.set(slug, design.designId);
                }
            }
        }

        // Fetch all existing folders and sort by order
        const existingDesigns = await prisma.allDesigns.findMany({
            orderBy: {
                order: "asc",
            },
        });

        // Determine folders to delete
        const designsToDelete = existingDesigns.filter(
            (d) => !uniqueDesigns.has(d.slug)
        );

        const deletePromises = designsToDelete.map((design) =>
            prisma.allDesigns.delete({
                where: { id: design.id },
            })
        );

        // Process subfolder creation/updating
        const designsPromises = Array.from(uniqueDesigns.keys()).map(
            async (slug) => {
                let design = await prisma.allDesigns.findUnique({
                    where: { slug },
                });

                if (!design) {
                    design = await prisma.allDesigns.create({
                        data: {
                            slug,
                            order: await prisma.allDesigns.count(),
                        },
                    });
                }

                return design;
            }
        );

        // Execute delete and create/update operations
        await Promise.all(deletePromises);
        const allDesigns = await Promise.all(designsPromises);

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: allDesigns.sort((a, b) => a.order - b.order),
            message: "All Design find successfully",
        });
    } catch (error) {
        console.error("Error:", error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: null,
            message: "All Design resolved failed",
        });
    }
};

export const updateAllDesignByOrder = async (
    req: Request,
    res: Response
): Promise<void> => {
    const { newOrder }: { newOrder: { id: string }[] } = req.body; // newOrder should be an array of items with their new positions
    try {
        // Start a transaction to update multiple records
        await prisma.$transaction(
            newOrder.map((item, index) =>
                prisma.allDesigns.update({
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
