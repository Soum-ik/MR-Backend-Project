import { Router } from 'express';
import { messageControlller } from './user-admin.controller';

const router = Router();

// Route to send a message
router.post('/send', messageControlller.sendMessage);

// Route to reply to a message
router.post('/reply', messageControlller.replyToMessage);

// Route to get messages between user and admin
router.get('/', messageControlller.getMessages);

router.delete('/:id', messageControlller.deleteMessage)

export const handleMessageRoute = router;
