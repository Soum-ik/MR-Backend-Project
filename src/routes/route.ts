import express from 'express';
import UserController from '../controller/UserController';
import SocialMediaLinkController from '../controller/socialMediaLinkController';

import httpStatus from 'http-status';
import { AWS_SES } from '../helper/smtp/AWS_SES';
import sendResponse from '../libs/sendResponse';
import catchAsync from '../libs/utlitys/catchSynch';
import authenticateToken from '../middleware/auth';
import authenticateSuperAdmin from '../middleware/super_admin_auth';
import { uploadAttachmentToS3AndFormatBody } from '../middleware/uploadAttachmentToS3AndFormatBody';
import { uploadAttachmentToS3AndFormatBodyOptimized } from '../middleware/uploadAttachmentToS3AndFormatBodyOptimized';
import { uploadFile } from '../middleware/uploadFileWihtMulter';
import OrderNoteRouter from '../modules/Order_page/Note/OrderNote.rotue';
import { handleOrderMessageRoute } from '../modules/Order_page/Order-message/Order-message.route';
import getOrderStatusRoute from '../modules/Order_page/Order-status/order-status.route';
import findOrderRouter from '../modules/Order_page/Order_page.Route';
import { RequirementSubmitRoute } from '../modules/Order_page/Requirement/Requirement.route';
import { Start_Project_Controller } from '../modules/Order_page/Start_project/Start_project.route';
import { CategoryRoute } from '../modules/ProjectCategory/CategoryRoute';
import { quickResponseRouter } from '../modules/QuickResponses/quickResponses.router';
import { DesignsRoute } from '../modules/Upload-design/designs/designs.route';
import { FolderRouter } from '../modules/Upload-design/folders/folders.route';
import { IndustrysRoute } from '../modules/Upload-design/industries/industries.route';
import { SubFolderRouter } from '../modules/Upload-design/subFolders/subfolders.route';
import { getTogetherRoute } from '../modules/Upload-design/together/together.route';
import { UploadRoute } from '../modules/Upload-design/upload.route';
import { bookMarkRoute } from '../modules/book_mark/book_mark.router';
import { archiveRoute } from '../modules/chat/archive/archive.route';
import { blockChatRouter } from '../modules/chat/block_chat/block_chat.route';
import { chating } from '../modules/chat/chat.controller';
import { handleNotificationRoute } from '../modules/chat/get_notification/get_notification.router';
import { handleMessageRoute } from '../modules/chat/user-admin-converstion/user-admin.router';
import { startContact } from '../modules/contact/contact.controller';
import { createProjectRoute } from '../modules/create-project-admin/createProject.route';
import { multiProjectRoute } from '../modules/multi-project/multiProject.route';
import { payment } from '../modules/payment/payment.controller';
import { handleRoleRoute } from '../modules/role_controller_super_admin/role_controller.router';
import { sendMessageForChat } from '../modules/send_message_from_admin/sendMessage.controller';
import uploadImage from '../modules/uploadImage/uploadController';
import { USER_ROLE } from '../modules/user/user.constant';
import { UserRoute } from '../modules/user/userRotue';

const router = express.Router();
router.get(
  '/social-media-link/',
  authenticateToken(
    USER_ROLE.ADMIN,
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.SUB_ADMIN,
    USER_ROLE.USER,
  ),
  SocialMediaLinkController.getSocialMediaLinks,
);
router.post(
  '/social-media-link/',
  authenticateToken(
    USER_ROLE.ADMIN,
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.SUB_ADMIN,
    USER_ROLE.USER,
  ),
  SocialMediaLinkController.upsertSocialMediaLink,
);
// middleware applyed

router.post(
  '/upload-attachment',
  uploadFile.array('files'),
  uploadAttachmentToS3AndFormatBody(),
  catchAsync((req, res) => {
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Attachment uploaded and processed successfully',
      data: req.body,
    });
  }),
);

router.post(
  '/upload-attachment-optimized',
  uploadFile.array('files'),
  uploadAttachmentToS3AndFormatBodyOptimized(),
  catchAsync((req, res) => {
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Attachment uploaded and processed successfully',
      data: req.body,
    });
  }),
);

router.get(
  '/get-singel-user/',
  authenticateToken(
    USER_ROLE.ADMIN,
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.SUB_ADMIN,
    USER_ROLE.USER,
  ),
  UserController.getSingelUser,
);

router.use('/', UserRoute);
router.use('/category', CategoryRoute);
router.use('/upload', UploadRoute);
router.use('/folder', FolderRouter);
router.use('/subFolderRouter', SubFolderRouter);
router.use('/industrys', IndustrysRoute);
router.use('/designs', DesignsRoute);
router.use('/create-offer-project', createProjectRoute);
router.use('/getTogether', getTogetherRoute);
router.use(
  '/quickResponse',
  authenticateToken(
    USER_ROLE.ADMIN,
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.SUB_ADMIN,
    USER_ROLE.USER,
  ),
  quickResponseRouter,
);
router.use(
  '/message',
  authenticateToken(
    USER_ROLE.ADMIN,
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.SUB_ADMIN,
    USER_ROLE.USER,
  ),
  handleMessageRoute,
);
router.use('/bookMark', bookMarkRoute);
router.use('/archive', archiveRoute);
router.use('/role', authenticateSuperAdmin, handleRoleRoute);
router.use('/notification', handleNotificationRoute);
router.use('/order-message', handleOrderMessageRoute);
router.post('/upload-image', uploadFile.any(), uploadImage);
router.post('/contactForChat', authenticateToken(USER_ROLE.USER), startContact);

router.use('/order-status', getOrderStatusRoute);
router.use('/order', OrderNoteRouter);

router.use('/find-order', findOrderRouter);

router.use('/requirement', RequirementSubmitRoute);

router.post(
  '/sendMessageForChat/:user_id',
  authenticateToken(
    USER_ROLE.ADMIN,
    USER_ROLE.SUB_ADMIN,
    USER_ROLE.SUPER_ADMIN,
  ),
  sendMessageForChat,
);

router.use('/inbox', Start_Project_Controller);
router.get('/avaiableforchat', chating.AvaiableForChat);

router.use('/block-chat', blockChatRouter);

//Multi-Project Route
router.use('/multi-project', multiProjectRoute);

//payment route
router.post('/api/checkout-session', payment.stripePayment);
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  payment.stripePayment,
);

router.post('/verify-email', async (req, res) => {
  try {
    const response = await AWS_SES.verifyEmailIdentity(req.body.email);
    res.status(200).json({ message: 'Email verification initiated', response });
  } catch (error) {
    console.error('Error in /verify-email:', error);
    res.status(500).json({
      message: 'Failed to verify email',
      error: error || 'Unknown error',
      details: error,
    });
  }
});

router.post('/send-email', async (req, res) => {
  const { email, subject, body } = req.body;

  try {
    // Attempt email verification (it won't throw an error if email is already verified)
    await AWS_SES.verifyEmailIdentity(email);

    // Send the email
    const response = await AWS_SES.sendEmail(email, subject, body);
    console.log(response, 'response');
    res.status(200).json({ message: 'Email sent successfully', response });
  } catch (error) {
    console.error('Error in /send-email:', error);
    res.status(500).json({
      message: 'Failed to send email',
      error: error || 'Unknown error',
      details: error,
    });
  }
});
export default router;
