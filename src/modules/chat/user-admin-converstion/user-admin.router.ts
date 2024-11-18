import { Router } from 'express';
import { messageControlller } from './user-admin.controller';
 
import { unreadMessageController } from '../unread/unread-message.controller';
 
const router = Router();

// Route to send a message
router.post('/send', messageControlller.sendMessage);

// Route to reply to a message
router.post('/reply', messageControlller.replyToMessage);

// Route to update a message
router.patch('/update/:messageId', messageControlller.updateMessage);

// Route to get messages between user and admin
router.get('/get', messageControlller.getMessages);

router.delete('/:messageId', messageControlller.deleteMessage)

router.delete('/delete-conversation/:userId', messageControlller.deleteConversation)

router.use('/unread', unreadMessageController.getUnseenMessageController)

export const handleMessageRoute = router;
