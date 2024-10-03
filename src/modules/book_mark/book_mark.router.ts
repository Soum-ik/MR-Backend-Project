import express from "express";
import {  getBookmarkStatus, toggleBookmarkStatus} from "../book_mark/book_mark.controller";

const router = express.Router();
router.post("/update/:userId", toggleBookmarkStatus);
router.get("/get", getBookmarkStatus);

export const multiProjectRoute = router;
