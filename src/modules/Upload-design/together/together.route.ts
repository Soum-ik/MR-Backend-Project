import express from 'express';
import { getTogetherController } from './together.controller';


const router = express.Router();

router.get('/get', getTogetherController.getTogether)



export const getTogetherRoute = router;