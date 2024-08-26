import express from 'express';
import { uploaders } from './upload.controller';


const router = express.Router();
router.post('/create', uploaders.UploadDesign)
router.get('/get', uploaders.getAllUploadDesign)
router.delete('/delete/:id', uploaders.deleteDesign)


export const UploadRoute = router;