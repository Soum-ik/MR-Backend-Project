import express from "express";
import archiveUser from "./archive.controller";

const router = express.Router();

router.get("/archive-user-list", archiveUser.archiveUserList);
router.post("/archive-user/:userId", archiveUser.archiverUser);

export const archiveRoute = router;