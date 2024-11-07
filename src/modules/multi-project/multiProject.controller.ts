import { Request, Response } from "express";
import sendResponse from "../../libs/sendResponse";
import httpStatus from "http-status";
import { prisma } from "../../libs/prismaHelper";



const upsertMultiProject = async (req: Request, res: Response) => {
  const { id, projectTitle, projectImage, requirements } = req.body;

  try {
    // Check if the project already exists
    const existingProjects = await prisma.multiProject.findMany();
    console.log("exist", existingProjects);

    if (existingProjects.length > 0 && id) {
      // Update the existing project
      const updatedProject = await prisma.multiProject.update({
        where: { id },
        data: { projectTitle, projectImage, requirements },
      });
      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: updatedProject,
        message: "Project updated successfully",
      });
    } else {
      // Create a new project
      const newProject = await prisma.multiProject.create({
        data: { projectTitle, projectImage, requirements },
      });
      return sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        data: newProject,
        message: "Project created successfully",
      });
    }
  } catch (error) {
    console.error(error);
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      data: null,
      message: "An error occurred while saving the project.",
    });
  }
};

const getMultiProject = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.multiProject.findMany();
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      data: projects,
      message: "Projects retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      data: null,
      message: "An error occurred while retrieving projects.",
    });
  }
};

export const multiProjectController = {
  upsertMultiProject,
  getMultiProject,
};

