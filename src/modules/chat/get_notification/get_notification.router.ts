// routes.ts
import { Router } from 'express';
import { getNotifications } from './get_notification.controller';
import authenticateToken from '../../../middleware/auth';

const router = Router();

// Route to get notifications for the logged-in user
router.get('/get', authenticateToken, getNotifications);

export const handleNotificationRoute = router;
