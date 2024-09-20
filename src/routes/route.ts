import express from "express";
import UserController from "../controller/UserController";
import SocialMediaLinkController from "../controller/socialMediaLinkController";
import { upload } from "../libs/utlitys/multer";
import authenticateToken from "../middleware/auth";
import { CategoryRoute } from "../modules/ProjectCategory/CategoryRoute";
import { DesignsRoute } from "../modules/Upload-design/designs/designs.route";
import { FolderRouter } from "../modules/Upload-design/folders/folders.route";
import { IndustrysRoute } from "../modules/Upload-design/industries/industries.route";
import { SubFolderRouter } from "../modules/Upload-design/subFolders/subfolders.route";
import { getTogetherRoute } from "../modules/Upload-design/together/together.route";
import { UploadRoute } from "../modules/Upload-design/upload.route";
import { createProjectRoute } from "../modules/create-project-admin/createProject.route";
import uploadImage from "../modules/uploadImage/uploadController";
import { startContact } from '../modules/contact/contact.controller'
import { chating } from "../modules/chat/chat.controller";


const router = express.Router();

// get users api route -done
router.post("/sign-up", UserController.SignUp);
router.post("/sign-in", UserController.SignIn);
router.get("/forgot-pass/:email", UserController.forgotPass);
router.get("/verify-otp/:email", UserController.verifyOtp);
router.put("/set-new-pass/", authenticateToken, UserController.setNewPass);
router.get("/all-user/", UserController.getAllUser);
router.post("/update-user/", UserController.updateUser);

router.get(
  "/social-media-link/",
  authenticateToken,
  SocialMediaLinkController.getSocialMediaLinks
);
// middleware applyed

router.get('/get-singel-user/', authenticateToken, UserController.getSingelUser);

router.use('/category', CategoryRoute)
router.use('/upload', UploadRoute)
router.use('/folder', FolderRouter)
router.use('/subFolderRouter', SubFolderRouter)
router.use('/industrys', IndustrysRoute)
router.use('/designs', DesignsRoute)
router.use('/create-offer-project', createProjectRoute)
router.use('/getTogether', getTogetherRoute)


router.post('/upload-iamge', upload.any(), uploadImage)
router.post('/contactForChat', authenticateToken, startContact)

router.get('/avaiableforchat', chating.AvaiableForChat)


export default router;
