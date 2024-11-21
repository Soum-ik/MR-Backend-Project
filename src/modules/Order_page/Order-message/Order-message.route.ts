import { Router } from 'express';
import { orderMessageController } from './Order-message.controller';
import authenticateToken from '../../../middleware/auth';
import { USER_ROLE } from '../../user/user.constant';
const router = Router();

// Route to send a message
router.post('/send', authenticateToken(
    USER_ROLE.ADMIN,
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.SUB_ADMIN,
    USER_ROLE.USER,
), orderMessageController.sendMessage);

// Route to reply to a message
router.post('/reply', orderMessageController.replyToMessage);

// Route to get messages between user and admin
router.get('/get',  authenticateToken(
    USER_ROLE.ADMIN,
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.SUB_ADMIN,
    USER_ROLE.USER,
  ), orderMessageController.getMessages);

// Route to update a project message
router.patch('/update', orderMessageController.updateProjectMessage);

router.delete('/:commonkey/:projectNumber', orderMessageController.deleteMessage)

export const handleOrderMessageRoute = router;
