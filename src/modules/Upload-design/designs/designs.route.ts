import express from 'express';
import { Designs } from './designs.controller';


const router = express.Router();

router.get('/filter/get', Designs.getByname)
router.get('/get', Designs.getAll)


export const DesignsRoute = router;