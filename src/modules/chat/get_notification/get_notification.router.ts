// routes.ts
import { Router } from 'express';
import { getNotifications } from './get_notification.controller';
import authenticateToken from '../../../middleware/auth';
import { USER_ROLE } from '../../user/user.constant';

const router = Router();

// Route to get notifications for the logged-in user
router.get('/get', authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.USER), getNotifications);

export const handleNotificationRoute = router;
