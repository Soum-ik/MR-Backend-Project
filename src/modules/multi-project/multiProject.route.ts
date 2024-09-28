import express from "express";
import { getMultiProject, upsertMultiProject } from "./multiProject.controller";

const router = express.Router();
router.post("/create", upsertMultiProject);
router.get("/get", getMultiProject);

export const multiProjectRoute = router;
