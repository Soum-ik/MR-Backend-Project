import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../libs/prismaHelper';
import sendResponse from '../../libs/sendResponse';
import { z } from 'zod';
import { createProjectSchema, updateProjectSchema, designs } from './createProject.validation';
import { Prisma } from '@prisma/client';


const createProjectSchemaWithDesigns = updateProjectSchema.extend({
    CreateProjectDesigns: z.array(designs)
});


const createProject = async (req: Request, res: Response) => {
    try {
        // Validate the request body using Zod
        const validatedBody = createProjectSchema.parse(req.body);

        // Extract CreateProjectDesign from the validatedBody
        const { CreateProjectDesigns, ...projectData } = validatedBody;

        // Create the project in the database using Prisma
        const newProject = await prisma.createProject.create({
            data: {
                ...projectData, // Spread the projectData to include all project fields
                CreateProjectDesigns: {
                    create: CreateProjectDesigns ?? [], // Handle creation of related designs if provided
                },
            },
            include: {
                CreateProjectDesigns: true, // Include related designs in the response
            },
        });

        // Respond with the created project data
        return sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            data: newProject,
            message: `Project created successfully.`,
        });
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: 'Validation failed',
                data: error.errors,
            });
        }

        // Handle other errors
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Internal server error',
        });
    }
};



const deleteProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if the project exists
        const existingProject = await prisma.createProject.findUnique({
            where: { id },
            include: {
                CreateProjectDesigns: true, // Include related designs
            },
        });

        if (!existingProject) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: `Project with ID ${id} not found.`,
            });
        }

        // Delete related designs first
        await prisma.createProjectDesigns.deleteMany({
            where: { createProjectId: id },
        });

        // Delete the project
        await prisma.createProject.delete({
            where: { id },
        });

        // Respond with a success message
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: `Project with ID ${id} and its related designs deleted successfully.`,
        });
    } catch (error) {
        console.error("Error in deleteProject:", error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Internal server error',
        });
    }
};



const getProjectById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Fetch the project by ID
        const project = await prisma.createProject.findUnique({
            where: { id },
            include: {
                CreateProjectDesigns: true, // Include related designs if any
            },
        });

        if (!project) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: `Project with ID ${id} not found.`,
            });
        }

        // Respond with the project data
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: project,
            message: 'Project fetched successfully.',
        });
    } catch (error) {
        console.error("Error in getProjectById:", error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Internal server error',
        });
    }
};



const getAllProjects = async (req: Request, res: Response) => {
    try {
        // Fetch all projects
        const projects = await prisma.createProject.findMany({
            include: {
                CreateProjectDesigns: true, // Include related designs if any
            },
            orderBy: {
                id: 'desc'
            }
        });

        // Respond with the list of projects
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: projects,
            message: 'Projects fetched successfully.',
        });
    } catch (error) {
        console.error("Error in getAllProjects:", error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Internal server error',
        });
    }
};


const updateProject = async (req: Request, res: Response) => {
    try {
        // Validate the request body using Zod
        const validatedBody = createProjectSchemaWithDesigns.parse(req.body);

        // Extract project ID from request parameters
        const projectId = req.params.projectId;
        if (!projectId) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: 'Project ID is required.',
            });
        }

        // Fetch the existing project to ensure it exists
        const existingProject = await prisma.createProject.findUnique({
            where: { id: projectId },
            include: { CreateProjectDesigns: true },
        });

        if (!existingProject) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: 'Project not found',
            });
        }

        // Prepare operations for CreateProjectDesigns
        const createProjectDesignsOperations = validatedBody.CreateProjectDesigns?.map(sub => {
            if (sub.id) {
                // Update existing design
                return prisma.createProjectDesigns.update({
                    where: { id: sub.id },
                    data: {
                        designName: sub.designName,
                        designTypogrphys: sub.designTypogrphys,
                        createProjectId: projectId, // Assign the parent project ID
                    },
                });
            } else {
                // Create new design
                return prisma.createProjectDesigns.create({
                    data: {
                        designName: sub.designName,
                        designTypogrphys: sub.designTypogrphys,
                        createProjectId: projectId, // Assign the parent project ID
                    },
                });
            }
        }) || []; // Fallback to empty array if CreateProjectDesigns is undefined

        // Execute design operations
        const updatedCreateProjectDesigns = await Promise.all(createProjectDesignsOperations);

        // Update the main project
        const updatedProject = await prisma.createProject.update({
            where: { id: projectId },
            data: {
                bullPoints: validatedBody.bullPoints,
                delivery: validatedBody.delivery,
                extraFastDelivery: validatedBody.extraFastDelivery,
                requirements: validatedBody.requirements,
                offerAmount: validatedBody.offerAmount,
                projectImage: validatedBody.projectImage,
                extraFastDeliveryAmount: validatedBody.extraFastDeliveryAmount,
                originalAmount: validatedBody.originalAmount,
                freeDesignName: validatedBody.freeDesignName,
                freeDesignTypographys: validatedBody.freeDesignTypographys,
            },
        });

        // Respond with the updated project data
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: {
                ...updatedProject,
                CreateProjectDesigns: updatedCreateProjectDesigns,
            },
            message: 'Project updated successfully.',
        });
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: 'Validation failed',
                data: error.errors,
            });
        }

        // Handle Prisma-related errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return sendResponse(res, {
                statusCode: httpStatus.INTERNAL_SERVER_ERROR,
                success: false,
                message: `Prisma error: ${error.message}`,
            });
        }

        // Handle other errors
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Internal server error',
        });
    }
};



export const projects = {
    createProject, deleteProject, getAllProjects, getProjectById, updateProject
};
