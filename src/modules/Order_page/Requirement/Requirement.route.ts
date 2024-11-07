import { Router } from 'express'
import { requirementAnswer } from './Requirement.controller'
import authenticateAdmin from '../../../middleware/Admins_auth';
import paymentAuth from './Requirement.middleware'
const router = Router()

router.post('/send', requirementAnswer.answerRequirements);
// router.get('/get/:orderId', authenticateAdmin, requirementAnswer.getRequirementsAnswers);

export const RequirementSubmitRoute = router;