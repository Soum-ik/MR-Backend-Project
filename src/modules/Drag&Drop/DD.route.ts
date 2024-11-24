import express from "express";
import { ddController } from "./DD.controller";
import { getAlldesignsSub_Folders } from './SubCetagory/SubFolder&Design.controller'

const router = express.Router();
router.get("/get/:folderSlug", ddController.getAllSubFolderByFolder);
router.post('/update', ddController.updateAllSubFolderByFolder)


router.get('/allDesginByFolderSubFolder', getAlldesignsSub_Folders)
export const DDroute = router;
