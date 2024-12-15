import { Router } from "express";
import { AffiliateController } from "./affiliate.controller";
import authenticateToken from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constant";

const affiliateRouter = Router();

affiliateRouter.get('/auto',
    authenticateToken(USER_ROLE.USER, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN),
    AffiliateController.autoGenerate);

affiliateRouter.post('/create',
    authenticateToken(USER_ROLE.USER, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN),
    AffiliateController.createAffiliate);

affiliateRouter.delete('/delete',
    authenticateToken(USER_ROLE.USER, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN),
    AffiliateController.deleteAffiliate);

affiliateRouter.get('/all',
    authenticateToken(USER_ROLE.USER, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN),
    AffiliateController.getAllAffiliates);

affiliateRouter.put('/update',
    AffiliateController.updateAffiliateClicks);

affiliateRouter.get('/find-affiliate',
    authenticateToken(USER_ROLE.USER, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN),
    AffiliateController.usersAffiliate);

affiliateRouter.get('/withdrawRequests',
    authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN),
    AffiliateController.requestPaymentList
)


affiliateRouter.put('/update-withdrawRequest',
    authenticateToken(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN),
    AffiliateController.withDrawRequestUpdateAction
)

affiliateRouter.post('/paymentMethod-setUp',
    authenticateToken(USER_ROLE.USER),
    AffiliateController.paymentMethod
)

affiliateRouter.get('/paymentMethod-profile',
    authenticateToken(USER_ROLE.USER),
    AffiliateController.affiliateProfile,
)

affiliateRouter.post('/withdrawRequest',
    authenticateToken(USER_ROLE.USER),
    AffiliateController.withDrawRequest
)

export default affiliateRouter;