import express from "express";
import { multiProjectController } from "./multiProject.controller";

const router = express.Router();
router.post("/create", multiProjectController.upsertMultiProject);
router.get("/get", multiProjectController.getMultiProject);

export const multiProjectRoute = router;
