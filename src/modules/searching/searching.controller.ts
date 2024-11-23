import { tags } from './../../../node_modules/.prisma/client/index.d';
import { Request, Response } from "express";
import sendResponse from "../../libs/sendResponse";
import httpStatus from "http-status";
import { prisma } from "../../libs/prismaHelper";
import AppError from "../../errors/AppError";


export const searchProjects = async (req: Request, res: Response) => {
    const { searchQuery } = req.query;

    const searchQueryString = searchQuery?.toString().toLowerCase();

    // Use fuzzy search with similarity threshold
    const projects = await prisma.uploadDesign.findMany({
        where: {
            OR: [
                {
                    title: {
                        contains: searchQueryString,
                        mode: 'insensitive'
                    }
                },
                {
                    title: {
                        startsWith: searchQueryString,
                        mode: 'insensitive'
                    }
                },
                {
                    tags: {
                        has: searchQueryString,
                    }
                },
            ]
        },
        orderBy: {
            title: 'asc'
        }
    });

    if (!projects) {
        throw new AppError(httpStatus.NOT_FOUND, "No projects found");
    }

    const projectIds = projects.map((project) => ({
        projectId: project.id,
        designId: project.designId,
        title: project.title
    }));

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Projects fetched successfully",
        data: projectIds
    })
}
