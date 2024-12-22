import express from 'express';
import { ExtendDeliveryMessageOption, approveExtensionRequest } from './ExtendDelivary.controller';

const router = express.Router();

// Route to request an extension
router.post('/order/extend-delivery', ExtendDeliveryMessageOption);

// Route to approve or reject an extension request
router.post('/order/approve-extension', approveExtensionRequest);

export default router;
