import express from 'express';
import authenticateToken from '../../../middleware/auth';
import { USER_ROLE } from '../../user/user.constant';
import {
  ExtendDeliveryMessageOption,
  approveExtensionRequest,
} from './ExtendDelivary.controller';

const router = express.Router();

// Route to request an extension
router.post('/delivery', ExtendDeliveryMessageOption);

// Route to approve or reject an extension request
router.post(
  '/approve',
  authenticateToken(
    USER_ROLE.ADMIN,
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.SUB_ADMIN,
    USER_ROLE.USER,
  ),
  approveExtensionRequest,
);

export const ExtendDeliveryRouter = router;
