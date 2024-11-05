import express from "express";
import { projects } from "./createProject.controller";
import { USER_ROLE } from "../user/user.constant";
import authenticateToken from "../../middleware/auth";

const router = express.Router();
router.post("/create", authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN), projects.createProject);
// router.put("/update/:projectId", projects.updateProject);
router.delete("/delete/:id", authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN), projects.deleteProject);
// router.get('/get-singel/:id', projects.getProjectById); // Get a project by ID
router.get('/get', projects.getAllProjects);     // Get all projects

export const createProjectRoute = router;
