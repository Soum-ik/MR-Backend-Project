import express from 'express';
import { Subfolder } from './subfolders.controller';


const router = express.Router();

router.get('/filter/get', Subfolder.getByname)
router.get('/get', Subfolder.getAll)


export const SubFolderRouter = router;