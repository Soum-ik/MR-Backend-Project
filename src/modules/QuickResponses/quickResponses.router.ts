import express from "express";
import { quickResponse } from './quickResponses.controller'


const router = express.Router();



// Define the routes
router.post('/quickres', quickResponse.createQuickResquickResponse);
router.put('/quickres/:id', quickResponse.updateQuickResquickResponse);
router.delete('/quickres/:id', quickResponse.deleteQuickResquickResponse);
router.get('/quickres', quickResponse.getUserQuickResquickResponse);


export const quickResponseRouter = router;
