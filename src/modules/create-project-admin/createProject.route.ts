import express from "express";
import { projects } from "./createProject.controller";

const router = express.Router();
router.post("/create", projects.createProject);
router.put("/update/:projectId", projects.updateProject);
router.delete("/delete/:id", projects.deleteProject);
router.get('/get-singel/:id', projects.getProjectById); // Get a project by ID
router.get('/get', projects.getAllProjects);     // Get all projects

export const createProjectRoute = router;
