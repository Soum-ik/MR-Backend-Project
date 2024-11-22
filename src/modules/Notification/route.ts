import { InboxNotification } from './InboxNotification'
import express from "express";

import authenticateToken from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";

const router = express.Router();

router.get('/inbox', authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.SUPER_ADMIN),
    InboxNotification.getMessages
)

export const NotificationInbox = router 