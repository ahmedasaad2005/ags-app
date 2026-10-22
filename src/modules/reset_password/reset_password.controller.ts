import { Response , Request } from "express";
import { successToResponse,failedToResponse } from "@utils/utils/responseCase";
import { validateOrThrow } from "@utils/utils/validation";
import { ResetPasswordServ } from "./reset_password.service";
import { UserService } from "@modules/auth/user.service";
import { ResetValidation,ZResetCostumePassword,ZResetPassword,ZVerifyEmail,ZVerifyResetToken,ZVerifyResetCode } from "./reset_password.validation";
import { logger } from "@utils/utils/logger";
import { AppError } from "@utils/errors/AppError";

export class ResetCont {
    private readonly userserv : UserService;
    private readonly resetserv:ResetPasswordServ;

    constructor(){
         this.userserv = new UserService();
         this.resetserv = new ResetPasswordServ();
    }

    verifyEmailAndGenerateCode  = async (req:Request<{},{},ZVerifyEmail>,res:Response):Promise<Response>=>{
        try {
            const {email} = req.body;
            const validated_email = validateOrThrow(ResetValidation.check_email,{email});
            const result = await this.resetserv.generateResetCode(validated_email.email,req);
            if(!result){
                throw AppError.notFound('The reset code sent successfully to the user email')
            }
            logger.info('Checking for email',{result:result});
            return successToResponse(res,'Email checked successfully',200,result)
        } catch (error:unknown) {
            return failedToResponse(res,error)
        }
    }
    verifyResetCode = async (req:Request<{},{},ZVerifyResetCode>,res:Response):Promise<Response>=>{
        try {
            const validated_data = validateOrThrow(ResetValidation.check_reset_code,req.body);
            const result = await this.resetserv.verifyResetCode(validated_data.email,validated_data.reset_code);
            logger.info('Reset code verified successfully');
            return successToResponse(res,'Reset code verified successfully',200,{result:result})
        } catch (error:unknown) {
            return failedToResponse(res,error)
        }
    }
    resetPassword = async (req:Request<{},{},ZResetPassword>,res:Response):Promise<Response>=>{
      try {
        const validated_data = validateOrThrow(ResetValidation.reset_password_code,req.body);
        const result = await this.resetserv.resetPasswordUsingCode(validated_data.email,validated_data.reset_code,validated_data.new_password);
        if(!result){
            logger.error('Failed to reset password',{result:result});
            throw AppError.badRequest('Failed to reset password');
        }
        logger.info('Password changed successfully for user',result);
        return successToResponse(res,'Password changed successfully for user',200,result)
      } catch (error:unknown) {
        return failedToResponse(res,error);
      }
    }
    verifyEmailAndGenerateToken = async (req:Request<{},{},ZVerifyEmail>,res:Response):Promise<Response>=>{
        try {
            const { email } = req.body;
            const validated_email = validateOrThrow(ResetValidation.check_email,{email});
            const result = await this.resetserv.generateResetToken(validated_email.email,req);
            logger.info('Email checked successfully')
            return successToResponse(res,'Email checked successfully',200,{result:result})
        } catch (error:unknown) {
            return failedToResponse(res,error)
        }
    }
    verifyTokenForReset =async (req:Request<{},{},ZVerifyResetToken>,res:Response):Promise<Response>=>{
        try {
            const { email } = req.body;
            const { token } = req.query;
            console.log('LETS_SEE_QUERY',{
                token:req.query
            })
            console.log('TOKEN_VALUE',{
                token:req.query.token
            })
            const validated_data = validateOrThrow(ResetValidation.check_reset_token,{email,token:req.query.token});
            const result = await this.resetserv.verifyResetToken(validated_data.email,validated_data.token);
            if(!result){
                logger.error('Invalid reset token credential');
                throw AppError.badRequest('Invalid reset token credential');
            }
            logger.info('Reset token verified successfully ',{result:result});
            return successToResponse(res,'Reset token verified successfully',200,{result:result})
        } catch (error:unknown) {
            return failedToResponse(res,error)
        }
    }
    resetPasswordUsingToken = async (req:Request<{},{},ZResetCostumePassword>,res:Response):Promise<Response>=>{
        try {
            const { email , new_password,confirm_password } = req.body;
            const { token } = req.query;
            const validated_data = validateOrThrow(ResetValidation.reset_costume_password,{email,new_password,confirm_password});
            const validated_token = validateOrThrow(ResetValidation.token,{token:req.query.token});
            const result = await this.resetserv.resetPasswordUsingToken(validated_data.email,validated_token.token,validated_data.new_password)
            logger.info('Password reseted by token',{result:result});
            return successToResponse(res,'Password reseted by token',200,{result:result})
        } catch (error:unknown) {
            return failedToResponse(res,error)
        }
    }
    

}