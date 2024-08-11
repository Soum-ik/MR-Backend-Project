import express from 'express'
import UserController from '../controller/UserController'


const router = express.Router()

// get users api route -done
router.post('/sign-up', UserController.SingUp);
router.post('/sign-in', UserController.SignIn);
// router.get('/user/:id', UserController.getUsers);
 

export default router