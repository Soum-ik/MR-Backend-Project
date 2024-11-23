import { AllDesigns } from './../../../node_modules/.prisma/client/index.d';
import { Request, Response } from "express";
import sendResponse from "../../libs/sendResponse";
import httpStatus from "http-status";
import { prisma } from "../../libs/prismaHelper";
import catchAsync from "../../libs/utlitys/catchSynch";

const getAllSubFolderByFolder = catchAsync(async (req: Request, res: Response) => {
    const { folderSlug } = req.params

    const getFolderName = await prisma.featureAllFolder.findUnique({
        where: {
            slug: folderSlug
        },
        select: {
            folder: true
        }
    })

    const AllDesigns = await prisma.uploadDesign.findMany({
        where: {
            folder: getFolderName?.folder
        }, select: {
            subFolder: true
        }
    })

    const allSubFoldersNames = AllDesigns.map((value) => value.subFolder)

    const uniqueSubFolders = [...new Set(allSubFoldersNames)].filter((name): name is string =>
        name !== null && name !== undefined && name !== ''
    );
    const existingFolders = await prisma.allSubFolder.findMany({
        where: {
            subFolder: {
                in: uniqueSubFolders
            }
        },
        select: {
            subFolder: true
        }
    });

    // Get array of existing folder names and ensure non-null values
    const existingFolderNames = existingFolders
        .map(folder => folder.subFolder)
        .filter((name): name is string => name !== null);

    // Filter out folders that already exist
    const foldersToCreate = uniqueSubFolders.filter(
        folderName => !existingFolderNames.includes(folderName)
    );

    if (foldersToCreate.length === 0) {
        console.log('All folders already exist');
        const data = await prisma.allSubFolder.findMany({
            where: { folderName: getFolderName?.folder }
        })
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: { folderName: getFolderName?.folder, folderSlug: folderSlug, subFoldersData: data }
        })
    }

    // Create only non-existing folders
    const createdFolders = await Promise.all(
        foldersToCreate.map(async (folderName) => {
            try {
                const newFolder = await prisma.allSubFolder.create({
                    data: {
                        subFolder: folderName,
                        slug: folderName.toLowerCase().trim().split(' ').join('-'),
                        order: await prisma.allSubFolder.count(),
                        folderName: getFolderName?.folder || ''
                    }
                });
                console.log(`Created new folder: ${folderName}`);
                return newFolder;
            } catch (error) {
                console.error(`Error creating subfolder ${folderName}:`, error);
                throw error;
            }
        })
    );
    const data = await prisma.allSubFolder.findMany({
        where: { folderName: getFolderName?.folder }
    })
    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: { folderName: getFolderName?.folder, folderSlug: folderSlug, subFoldersData: data }
    })
})

const updateAllSubFolderByFolder = catchAsync(async (req: Request, res: Response) => {
    const { newOrder } = req.body
    await prisma.$transaction(
        newOrder.map((item: any, index: number) =>
            prisma.allSubFolder.update({
                where: { id: item.id },
                data: { order: index },
            })
        )
    );
    return sendResponse(res, {
        statusCode: httpStatus.OK,
        data: null,
        success: true
    })

})
export const ddController = {
    getAllSubFolderByFolder,
    updateAllSubFolderByFolder
}