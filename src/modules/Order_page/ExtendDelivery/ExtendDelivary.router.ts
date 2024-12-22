import express from 'express';
import { ExtendDeliveryMessageOption, approveExtensionRequest } from './ExtendDelivary.controller';

const router = express.Router();

// Route to request an extension
router.post('/delivery', ExtendDeliveryMessageOption);

// Route to approve or reject an extension request
router.post('/approve', approveExtensionRequest);

export const ExtendDeliveryRouter = router;
