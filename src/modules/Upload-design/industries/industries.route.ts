import express from 'express';
import { Industrys } from './industries.controller';


const router = express.Router();

router.get('/filter/get', Industrys.getByname)
router.get('/get', Industrys.getAll)


export const IndustrysRoute = router;