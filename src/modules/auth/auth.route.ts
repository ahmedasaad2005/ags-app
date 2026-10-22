import { UserCont } from "./user.controller";
import { protect , restrictTo , authorizePermission  } from "@utils/middleware/protect";
import { Router } from "express";
import { uploadSingle } from "config/db/cld";

export const userrouter = Router();
const controller = new UserCont()



userrouter.post('/register',uploadSingle.single('avatar'),controller.register);
userrouter.post('/login',controller.login);
userrouter.post('/refresh',controller.refreshTokens);
// userrouter.post('/forget-password',controller.forgetPassword);
// userrouter.post('/verify-code',controller.verifyResetCode);
// userrouter.post('/reset-password',controller.resetPassword);

//  ======================================================
//             PROTECTED ROUTES (Authentication required)
//  =======================================================

userrouter.use(protect);
userrouter.post('/logout',controller.logout);
userrouter.post('/logout-all/:id',controller.logoutAll);
userrouter.get('/me/:id',controller.getMe);
// userrouter.post('/forget-password',controller.forgetPassword);
userrouter.post('/change-password',controller.changePassword);
