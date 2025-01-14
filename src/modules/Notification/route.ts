import express from 'express';
import { InboxNotification } from './InboxNotification';

import authenticateToken from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';

const router = express.Router();

router.get(
  '/inbox',
  authenticateToken(
    USER_ROLE.ADMIN,
    USER_ROLE.SUB_ADMIN,
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.USER,
  ),
  InboxNotification.getMessages,
);

router.get(
  '/get',
  authenticateToken(
    USER_ROLE.ADMIN,
    USER_ROLE.SUB_ADMIN,
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.USER,
  ),
  InboxNotification.getNotifications,
);

router.get(
  '/count',
  authenticateToken(
    USER_ROLE.ADMIN,
    USER_ROLE.SUB_ADMIN,
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.USER,
  ),
  InboxNotification.notficationCount,
);

router.put(
  '/update/:notificationId',
  authenticateToken(
    USER_ROLE.ADMIN,
    USER_ROLE.SUB_ADMIN,
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.USER,
  ),
  InboxNotification.getUnseenMessageController,
);

export const NotificationInbox = router;
