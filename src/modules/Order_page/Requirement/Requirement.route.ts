import { Router } from 'express'
import { requirementAnswer } from './Requirement.controller'
import authenticateAdmin from '../../../middleware/Admins_auth';
import paymentAuth from './Requirement.middleware'
import authenticateToken from '../../../middleware/auth';
import { USER_ROLE } from '../../user/user.constant';
const router = Router()

router.post('/send', authenticateToken(
    USER_ROLE.ADMIN,
    USER_ROLE.SUB_ADMIN,
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.USER,
), requirementAnswer.answerRequirements);
// router.get('/get/:orderId', authenticateAdmin, requirementAnswer.getRequirementsAnswers);

export const RequirementSubmitRoute = router;