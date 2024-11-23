import express from "express";
import { ddController } from "./DD.controller";


const router = express.Router();
router.get("/get/:folderSlug", ddController.getAllSubFolderByFolder);
router.post('/update', ddController.updateAllSubFolderByFolder)

export const DDroute = router;
