import { Router } from "express";
import { searchProjects } from "./searching.controller";

const router = Router();

router.get("/", searchProjects);

export const searchProjectsRouter = router;