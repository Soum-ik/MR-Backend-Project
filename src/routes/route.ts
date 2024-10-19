import express from "express";
import UserController from "../controller/UserController";
import SocialMediaLinkController from "../controller/socialMediaLinkController";

import authenticateToken from "../middleware/auth";
import { CategoryRoute } from "../modules/ProjectCategory/CategoryRoute";
import { DesignsRoute } from "../modules/Upload-design/designs/designs.route";
import { FolderRouter } from "../modules/Upload-design/folders/folders.route";
import { IndustrysRoute } from "../modules/Upload-design/industries/industries.route";
import { SubFolderRouter } from "../modules/Upload-design/subFolders/subfolders.route";
import { getTogetherRoute } from "../modules/Upload-design/together/together.route";
import { UploadRoute } from "../modules/Upload-design/upload.route";
import { chating } from "../modules/chat/chat.controller";
import { startContact } from "../modules/contact/contact.controller";
import { createProjectRoute } from "../modules/create-project-admin/createProject.route";
import { multiProjectRoute } from "../modules/multi-project/multiProject.route";
import uploadImage from "../modules/uploadImage/uploadController";
import { quickResponseRouter } from "../modules/QuickResponses/quickResponses.router";
import { handleMessageRoute } from '../modules/chat/user-admin-converstion/user-admin.router'
import { bookMarkRoute } from '../modules/book_mark/book_mark.router'
import { handleRoleRoute } from "../modules/role_controller_super_admin/role_controller.router";
import authenticateSuperAdmin from "../middleware/super_admin_auth";
import { UserRoute } from "../modules/user/userRotue";
import { payment } from "../modules/payment/payment.controller";
import { handleNotificationRoute } from "../modules/chat/get_notification/get_notification.router";
import { blockChatRouter } from "../modules/chat/block_chat/block_chat.route";
import { uploadAttachmentToS3AndFormatBody } from "../middleware/uploadAttachmentToS3AndFormatBody";
import { uploadFile } from "../middleware/uploadFileWihtMulter";
const router = express.Router();


router.get(
  "/social-media-link/",
  authenticateToken,
  SocialMediaLinkController.getSocialMediaLinks
);
router.post(
  "/social-media-link/",
  authenticateToken,
  SocialMediaLinkController.upsertSocialMediaLink
);
// middleware applyed

router.post("/upload-attachment", uploadFile.any(), uploadAttachmentToS3AndFormatBody(), (req, res) => {
  // Log the request body to check the structure and data
  console.log(req.body, "Received request body");

  // Respond with the request body to confirm what was received
  res.status(200).send({
    message: "Attachment uploaded and processed successfully",
    data: req.body
  });
})

router.get(
  "/get-singel-user/",
  authenticateToken,
  UserController.getSingelUser
);

router.use("/", UserRoute);
router.use("/category", CategoryRoute);
router.use("/upload", UploadRoute);
router.use("/folder", FolderRouter);
router.use("/subFolderRouter", SubFolderRouter);
router.use("/industrys", IndustrysRoute);
router.use("/designs", DesignsRoute);
router.use("/create-offer-project", createProjectRoute);
router.use("/getTogether", getTogetherRoute);
router.use("/quickResponse", authenticateToken, quickResponseRouter);
router.use('/message', authenticateToken, handleMessageRoute)
router.use('/bookMark', bookMarkRoute)
router.use('/role', authenticateSuperAdmin, handleRoleRoute)
router.use('/notification', handleNotificationRoute)

router.post("/upload-image", uploadFile.any(), uploadImage);
router.post("/contactForChat", authenticateToken, startContact);

router.get("/avaiableforchat", chating.AvaiableForChat);

router.use('/block-chat', blockChatRouter)


//Multi-Project Route
router.use("/multi-project", multiProjectRoute);

//payment route
router.post('/api/checkout-session', payment.stripePayment)

export default router;
