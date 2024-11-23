import express from 'express';
import {
  getAllFoldersController,
  updateFolderByOrder,
} from './feature/foldersControllers';

import { uploaders } from './upload.controller';
import authenticateToken from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';

const router = express.Router();
router.post('/create', authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN), uploaders.UploadDesign);
router.get('/get', uploaders.getAllUploadDesign);
router.delete('/delete/:id', authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN), uploaders.deleteDesign);
router.put('/update/:designId', authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN), uploaders.UpdateDesign);
router.get('/get-single/:designId', uploaders.getSingelUploadDesign);

// Feature Folder Api
router.get('/feature-folder', getAllFoldersController);
router.post('/feature-folder', updateFolderByOrder);

 

export const UploadRoute = router;
