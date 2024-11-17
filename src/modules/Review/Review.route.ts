import { Router } from "express";
import { ReviewController } from "./Review.controller";
import authenticateToken from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";

const reviewRouter = Router();


reviewRouter.get("/get-all-owner-reviews", authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.SUPER_ADMIN), ReviewController.getAllOwnerReviews);

reviewRouter.post("/create", authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.USER, USER_ROLE.SUPER_ADMIN), ReviewController.createReview);
reviewRouter.get("/:orderId", authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUB_ADMIN, USER_ROLE.USER, USER_ROLE.SUPER_ADMIN), ReviewController.getReviewsByOrderId);


export default reviewRouter;
