import { UserService } from "./user.service";
import { RefreshService } from "@modules/refresh_token/refresh_token.service";
import { AppError } from "@utils/errors/AppError";
import { logger } from "@utils/utils/logger";
import { catchAsync } from "@utils/utils/catchAsync";
import cookieParser from "cookie-parser";
import dtv from 'dotenv';
import { Response,Request } from "express";
import { validateOrThrow } from "@utils/utils/validation";
import {
    authValidation,
    ZChangePassword,
    ZForgetPassword,
    ZLogin,
    ZLogout,
    ZRefresh,
    ZRegister,
    ZResetPasswordByCode,
    ZResetPasswordByToken,
    ZTokenId,
    ZUserId,
    ZVerifyResetCode
 } from "./auth.validation";
import { successToResponse,failedToResponse } from "@utils/utils/responseCase";
import { success } from "zod";



dtv.config();


export class UserCont {
    private  userserv : UserService;
    constructor(){
     this.userserv = new UserService();
    }

    register = async (req:Request<{},{},ZRegister>,res:Response)=>{
        try {
        const file = req.file
        const validatedData = validateOrThrow(authValidation.register,{
            ...req.body,
            avatar:file
        });
            console.log('AVATAR FILE DES',{
               fieldname:file?.fieldname,
               fileoriginal:file?.originalname,
               filesize:file?.size,
               filepath:file?.path,
               filemime:file?.mimetype
            });
        const result = await this.userserv.register({
            ...validatedData,
            role:validatedData.role
        },req,validatedData.avatar);
        console.log('VALIDATED_AVATAR',{
            avatar:validatedData.avatar
        })
        this.setAuthCookies(res,result.tokens.access_token,result.tokens.refresh_token);
         console.log('REFRESH_TOKEN_FROM_LOGOUT_USER_SERVICE',{
                refreshToken:req.cookies?.refresh_token||req.headers.authorization?.substring(7)||"Cannot read refresh token from cookies",
        })
         logger.info('User registered successfully');
        return successToResponse(res,'User regitstered successfully',201,{
            user:result.user,
            tokens:{
                access_expires:result.tokens.access_expiry,
                refresh_expires:result.tokens.refresh_expiry,
            },session_id:result.session.session_id
        });
        } catch (error:unknown) {
            return failedToResponse(res,error)
        }
    };

    login = async (req:Request<{},{},ZLogin>,res:Response)=>{
try {
            const { email , password_hash } = req.body;
           
        if(!email){
            logger.error('Email field is required');
            throw AppError.badRequest('Email field is required');
        }
        if(!password_hash){
            logger.error('Password field is required')
            throw AppError.badRequest('Password field is required')
        }
        
        const validatedData = validateOrThrow(authValidation.login,req.body);
        const result = await this.userserv.login(validatedData,req);
        this.setAuthCookies(res,result.tokens.access_token,result.tokens.refresh_token);
       console.log('REFRESH_TOKEN_FROM_LOGOUT_USER_SERVICE',{
                refreshToken:req.cookies?.refresh_token||req.headers.authorization?.substring(7)||"Cannot read refresh token from cookies",
        })
        logger.info(`User logged in successfully ${result.user.email}`)
         
        return successToResponse(res,'User logged in successfully',200,result.user)
} catch (error:unknown) {
        return failedToResponse(res,error)
}
    };

    refreshTokens = async (req:Request<{},{},ZRefresh>,res:Response)=>{
    try {
        const { refresh_token } = req.body;
        if(!refresh_token){
            logger.error('refresh token is required');
            throw AppError.badRequest('Refresh token is required')
        }
        const tokens = await this.userserv.refreshTokens(refresh_token)
        return successToResponse(res,'Tokens refreshed successfully',200,tokens) 
    
    } catch (error:unknown) {
        return failedToResponse(res,error)
    }    
    };

    logout = catchAsync(async (req:Request<{},{},ZLogout>,res:Response)=>{
        const refresh_token  =
        req.cookies?.refresh_token||
        req.body?.refresh_token  ||
         req.headers.authorization?.substring(7);
         
        console.log('READING REFRESH TOKEN - LOGOUT',{
            cookies:req.cookies?.refresh_token,
            body:req.body?.refresh_token,
            headers:!!req.headers.authorization?.substring(7)
        })
        if(!refresh_token){
            logger.error('Refresh token is required to logout');
            throw AppError.badRequest('Refresh token is required');
        }
        
        await this.userserv.logout(refresh_token);
        this.clearCookie(res);
        return successToResponse(res,'User logout successfully',200)
    });
    logoutAll = async (req:Request<{},{},ZUserId>,res:Response)=>{
     try {
           const id  = req.user?.id;
           console.log('USER ID TO LOGOUT ALL USER',{
            id
           })
        if(!id){
            logger.error("User id is required");
            throw AppError.badRequest('User id is required');
        }
        const validatedId = validateOrThrow(authValidation.user_id,{id});
        const result = await this.userserv.logoutAll(validatedId.id);
        this.clearCookie(res);
        return successToResponse(res,`User logout all devices : ${result}`,200)
     } catch (error:unknown) {
        return failedToResponse(res,error);
     }
    };
    getMe = async (req:Request<{},{},ZUserId>,res:Response)=>{
     try {
        const id = req.user?.id;
        if(!id){
            logger.error('User id is required');
            throw AppError.badRequest("User id is required")
        }
        const validatedData = validateOrThrow(authValidation.user_id,{id});
        const result = await this.userserv.getUserById(validatedData.id);
        return successToResponse(res,"User retreived successfully by id",200,result)
     } catch (error:unknown) {
        return failedToResponse(res,error)
     }
    };
    

    changePassword = catchAsync(async (req:Request<{},{},ZChangePassword>,res:Response)=>{
        const user_id =  req.user?.id;
        if(!user_id){
            logger.error('User id is required')
            throw AppError.badRequest("User id is required")
        }
        const  validatedId  = validateOrThrow(authValidation.user_id,user_id);
        const { current_password,new_password,confirm_password} = req.body;
        const validatedData = validateOrThrow(authValidation.change_password,req.body)
         await this.userserv.changePassword(user_id,validatedData.current_password,new_password);
        return successToResponse(res,`Changed the password successfully for the user : ${user_id}`,200);
    });

    


    private setAuthCookies (res:Response,access_token:string,refresh_token:string) {
        
        const isProduction = process.env.NODE_ENV === 'production';
        
        const domain = process.env.DOMAIN_COOKIE! || 'localhost'
        
        res.cookie('refresh_token', refresh_token , {
            httpOnly:true,
            secure:isProduction,
            maxAge:1000 * 60 * 60 * 24 * 7,
            sameSite:'lax',
            path:'/',
            domain:isProduction ? domain : undefined 
        })
        
        res.cookie('access_token',access_token,{
            httpOnly:true,
            secure:isProduction,
            path:'/',
            sameSite:process.env.NODE_ENV! === 'production' ? 'strict' : 'lax',
            maxAge:1000*60*15,
            domain:isProduction ? domain : undefined
        
        })
    }
    private clearCookie (res:Response){
        res.clearCookie('refresh_token',{
            path:'/'
        })
        res.clearCookie('access_token',{
            path:'/'
        })
    }
}