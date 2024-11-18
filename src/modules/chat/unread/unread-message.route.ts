import { Router } from "express";
import { unreadMessageController } from "./unread-message.controller";
import authenticateToken from "../../Analytics/visitors/visitors.middleware";
import { USER_ROLE } from "../../user/user.constant";

const router = Router();

router.get("/total/:commonkey", authenticateToken(USER_ROLE.USER, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN), unreadMessageController.getUnseenMessageController);
router.patch("/update/:commonkey", authenticateToken(USER_ROLE.USER, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN), unreadMessageController.updateUnseenMessageController);

export const unseenMessageRoutes = router;