import { Router } from 'express';
import { messageControlller } from './user-admin.controller';
import { unreadMessageRoutes } from '../unread/unread-message.route';
const router = Router();

// Route to send a message
router.post('/send', messageControlller.sendMessage);

// Route to reply to a message
router.post('/reply', messageControlller.replyToMessage);

// Route to get messages between user and admin
router.get('/get', messageControlller.getMessages);

router.delete('/:id', messageControlller.deleteMessage)

router.delete('/delete-conversation/:userId', messageControlller.deleteConversation)

router.use('/unread', unreadMessageRoutes)  

export const handleMessageRoute = router;
