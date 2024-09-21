import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const upsertMultiProject = async (req, res) => {
  const { id, projectTitle, projectImage, requirements } = req.body;

  try {
    // Check if the project already exists
    const existingProject = await prisma.multiProject.findMany();
    console.log("exist", existingProject);

    if (existingProject.length > 0) {
      // Update the existing project
      const updatedProject = await prisma.multiProject.update({
        where: { id },
        data: { projectTitle, projectImage, requirements },
      });
      return res.status(200).json(updatedProject);
    } else {
      // Create a new project
      const newProject = await prisma.multiProject.create({
        data: { projectTitle, projectImage, requirements },
      });
      return res.status(201).json(newProject);
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while saving the project." });
  }
};

export const getMultiProject = async (req, res) => {
  try {
    const projects = await prisma.multiProject.findMany();
    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving projects." });
  }
};
