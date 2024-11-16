import { Router } from 'express';
import { orderMessageController } from './Order-message.controller';
const router = Router();

// Route to send a message
router.post('/send', orderMessageController.sendMessage);

// Route to reply to a message
router.post('/reply', orderMessageController.replyToMessage);

// Route to get messages between user and admin
router.get('/get', orderMessageController.getMessages);

// Route to update a project message
router.patch('/update', orderMessageController.updateProjectMessage);

router.delete('/:id', orderMessageController.deleteMessage)

export const handleOrderMessageRoute = router;
