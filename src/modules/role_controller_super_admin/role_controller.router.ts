import { Router } from 'express';
import { controle_role_controller } from './role_controller.controller';

const router = Router();

// Route to send a message
router.post('/controle_role', controle_role_controller.controle_role);

export const handleRoleRoute = router;

