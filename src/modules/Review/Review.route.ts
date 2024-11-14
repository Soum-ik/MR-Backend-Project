import { Router } from "express";
import { ReviewController } from "./Review.controller";
import authenticateToken from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";

const router = Router();

router.post("/create", authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.USER, USER_ROLE.SUPER_ADMIN), ReviewController.createReview);
router.get("/:orderId", authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.USER, USER_ROLE.SUPER_ADMIN), ReviewController.getReviewsByOrderId);
router.get("/owner", authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.SUPER_ADMIN), ReviewController.getAllOwnerReviews);
export default router;
