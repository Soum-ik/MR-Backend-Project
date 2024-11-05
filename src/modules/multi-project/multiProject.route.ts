import express from "express";
import { multiProjectController } from "./multiProject.controller";
import authenticateToken from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";

const router = express.Router();
router.post("/create", authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN), multiProjectController.upsertMultiProject);
router.get("/get", multiProjectController.getMultiProject);

export const multiProjectRoute = router;
