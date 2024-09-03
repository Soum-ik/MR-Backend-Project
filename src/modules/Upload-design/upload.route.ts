import express from 'express';
import { uploaders } from './upload.controller';


const router = express.Router();
router.post('/create', uploaders.UploadDesign)
router.get('/get', uploaders.getAllUploadDesign)
router.delete('/delete/:id', uploaders.deleteDesign)
router.put('/update/:designId', uploaders.UpdateDesign)
router.get('/get-single/:designId', uploaders.getSingelUploadDesign)

export const UploadRoute = router;