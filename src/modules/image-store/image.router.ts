import { Router } from "express";
import { ImageStoreController } from "./image";

const router = Router();

router.post('/create', ImageStoreController.imageController)
router.get('/get', ImageStoreController.getImage)
export default router;  