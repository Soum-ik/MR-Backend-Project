import express from 'express';
import authenticateToken from '../../middleware/auth';
import { USER_ROLE } from './user.constant';
import { User } from './userController';

const router = express.Router();

// get users api route -done
router.post('/sign-up', User.SignUp);
router.post('/sign-in', User.SignIn);
router.get('/forgot-pass/:email', User.forgotPass);
router.get('/verify-otp/:email', User.verifyOtp);
router.put('/set-forget-pass/:forgetPasswordToken', User.setForgetNewPass);
router.put(
  '/set-new-pass/',
  authenticateToken(
    USER_ROLE.ADMIN,
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.SUB_ADMIN,
    USER_ROLE.USER,
  ),
  User.setNewPass,
);
router.get('/all-user/', User.getAllUser);
router.post('/update-user/', User.updateUser);
router.get('/getUserById/:id', User.getUserById);

export const UserRoute = router;
