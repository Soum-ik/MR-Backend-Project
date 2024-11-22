import { Router } from 'express';
import { CancelProject } from './Cancel-project/cancel-project.controller';
import { CompletedProject } from './Completed/Completed.controller';

const router = Router();

router.post('/Cancel-project', CancelProject)
router.post('/Completed-project', CompletedProject)


export const handleOrderRoute = router;
