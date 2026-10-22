import { ResetCont } from "./reset_password.controller";
import { Router } from "express";


const resetcont = new ResetCont() 
export const resetrouter = Router();



resetrouter.post('/check-email-code',resetcont.verifyEmailAndGenerateCode);
resetrouter.post('/check-email-token',resetcont.verifyEmailAndGenerateToken);
resetrouter.post('/verify-code',resetcont.verifyResetCode);
resetrouter.post('/verify-token',resetcont.verifyTokenForReset);
resetrouter.post('/reset-password-code',resetcont.resetPassword);
resetrouter.post('/reset-password-token',resetcont.resetPasswordUsingToken);