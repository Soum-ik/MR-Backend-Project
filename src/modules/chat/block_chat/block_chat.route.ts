import { Router } from "express";
import { blockChatController } from "./block_chat.controller";
import authenticateAdmin from "../../../middleware/Admins_auth";

const router = Router()

router.patch('/:user_id', authenticateAdmin, blockChatController.block_user)
router.get('/get-blocked-users', authenticateAdmin, blockChatController.get_blocked_users)

export const blockChatRouter = router