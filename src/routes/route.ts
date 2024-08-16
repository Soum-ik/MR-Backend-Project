import express from 'express'
import UserController from '../controller/UserController'
import SocialMediaLinkController from '../controller/socialMediaLinkController';
import authenticateToken from '../middleware/auth';
const router = express.Router()


// get users api route -done
router.post('/sign-up', UserController.SignUp);
router.post('/sign-in', UserController.SignIn);
router.get('/forgot-pass/:email', UserController.forgotPass);
router.get('/verify-otp/:email', UserController.verifyOtp);
router.post('/set-new-pass/', UserController.setNewPass);
router.get('/all-user/', UserController.getAllUser);
router.post('/update-user/', UserController.updateUser);
router.post('/social-media-link/', SocialMediaLinkController.upsertSocialMediaLink);
router.get('/social-media-link/:email', SocialMediaLinkController.getSocialMediaLinks);
// middleware applyed
router.get('/get-singel-user/', authenticateToken, UserController.getSingelUser);

export default router

