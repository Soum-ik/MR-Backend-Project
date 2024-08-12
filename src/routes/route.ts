import express from 'express'
import UserController from '../controller/UserController'

const router = express.Router()


// get users api route -done
router.post('/sign-up', UserController.SingUp);
router.post('/sign-in', UserController.SignIn);
router.get('/forgot-pass/:email', UserController.forgotPass);
router.get('/verify-otp/:email', UserController.verifyOtp);
router.post('/set-new-pass/', UserController.setNewPass);
router.get('/all-user/', UserController.getAllUser);



export default router