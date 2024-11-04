import express from 'express';
import { extendDelivery, approveExtensionRequest } from './ExtendDelivary.controller';

const router = express.Router();

// Route to request an extension
router.post('/order/extend-delivery', extendDelivery);

// Route to approve or reject an extension request
router.post('/order/approve-extension', approveExtensionRequest);

export default router;
