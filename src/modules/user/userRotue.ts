import express from "express";
import { User } from "./userController";
import authenticateToken from "../../middleware/auth";

const router = express.Router();

// get users api route -done
router.post("/sign-up", User.SignUp);
router.post("/sign-in", User.SignIn);
router.get("/forgot-pass/:email", User.forgotPass);
router.get("/verify-otp/:email", User.verifyOtp);
router.put("/set-new-pass/", authenticateToken, User.setNewPass);
router.get("/all-user/", User.getAllUser);
router.post("/update-user/", User.updateUser);

export const UserRoute = router;
