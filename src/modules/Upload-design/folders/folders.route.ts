import express from 'express';
import { folder } from './folders.controller';


const router = express.Router();

router.get('/filter/get', folder.getByname)
router.get('/get', folder.getAll)


export const FolderRouter = router;