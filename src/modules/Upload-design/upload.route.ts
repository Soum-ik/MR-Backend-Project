import express from 'express';
import { uploaders } from './upload.controller';


const router = express.Router();
router.post('/create', uploaders.UploadDesign)


export const UploadRoute = router;