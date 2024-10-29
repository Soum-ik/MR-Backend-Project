import express from 'express';
import {
  getAllFoldersController,
  updateFolderByOrder,
} from './feature/foldersControllers';
import {
  getAllDesignsController,
  updateAllDesignByOrder,
} from './feature/orderDesignsController';
import {
  getAllSubFoldersController,
  updateSubFolderByOrder,
} from './feature/subFoldersController';
import { uploaders } from './upload.controller';

const router = express.Router();
router.post('/create', uploaders.UploadDesign);
router.get('/get', uploaders.getAllUploadDesign);
router.delete('/delete/:id', uploaders.deleteDesign);
router.put('/update/:designId', uploaders.UpdateDesign);
router.get('/get-single/:designId', uploaders.getSingelUploadDesign);

// Feature Folder Api
router.get('/feature-folder', getAllFoldersController);
router.post('/feature-folder', updateFolderByOrder);

// sub folders routes for ordering
router.get('/sub-folder', getAllSubFoldersController);
router.post('/sub-folder', updateSubFolderByOrder);

// sub folders routes for ordering
router.get('/all-design', getAllDesignsController);
router.post('/all-design', updateAllDesignByOrder);

export const UploadRoute = router;
