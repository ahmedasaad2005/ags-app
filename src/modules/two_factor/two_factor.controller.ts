import { TwoFactorService } from "./two_factor.service";
import { Request , Response } from "express";
import { successToResponse,failedToResponse } from "@utils/utils/responseCase";
import { AppError } from "@utils/errors/AppError";
import { TwoFactorValidation } from "./two_factor.validation";
import { validateOrThrow } from "@utils/utils/validation";
import { generateTokenPair } from "@utils/utils/token";
import dtv from 'dotenv'


dtv.config();


export class TwoFactorCont {
   private readonly twofactorserv : TwoFactorService;
   constructor(){
       this.twofactorserv = new TwoFactorService();
   }

   initiate = async (req:Request,res:Response) :Promise<Response>=>{
    try {
        
        const user_id = req.user?.id;
        
        if(!user_id){
            throw AppError.unauthorized('Unauthorized access')
        }
        
        const { phone }  = req.body;
        
        const validate_id = validateOrThrow(TwoFactorValidation.user_id,{user_id});
        
        const validate_phone = validateOrThrow(TwoFactorValidation.phone,{phone})

        const result = await this.twofactorserv.createChallenge(validate_id.user_id,validate_phone.phone_number);

        return successToResponse(res,`The code sent to the user and the result :${result}`,200,{result:result});

    } catch (error:unknown) {
        return failedToResponse(res,'Failed sending 2FA code to the user')
    }
   }
   verify = async (req:Request,res:Response):Promise<Response>=>{
    try {
        const user_id = req.user?.id;
        if(!user_id){
            throw AppError.unauthorized('User not authenticated')
        }
        const { code } = req.body;
        const validate_id = validateOrThrow(TwoFactorValidation.user_id,{user_id});
        const validate_code = validateOrThrow(TwoFactorValidation.code,{code});
        const result = await this.twofactorserv.verifyCode(validate_id.user_id,'login',validate_code.code,req);
        const token_pair = generateTokenPair(result)
        return successToResponse(res,'2FA code verified successfully',200)
    } catch (error:unknown) {
        return failedToResponse(res,error)
    }
   }

   private setCookies (res:Response,access_token:string,refresh_token:string){
    const is_production = process.env.NODE_ENV! === 'production';
    const domain = process.env.DOMAIN! || 'localhost';
    res.cookie('access_token',access_token,{
        httpOnly:true,
        secure:is_production ? true :false,
        path:'/',
        sameSite:'lax',
        maxAge:1000 * 60 * 15
    })
    res.cookie('refresh_token',refresh_token,{
        httpOnly:true,
        secure:is_production? true : false ,
        path:'/',
        sameSite:'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7
    })
   }
   private clearCookies (res:Response){
    res.clearCookie('access_token',{
        path:'/'
    })
    res.clearCookie('refresh_token',{
        path:'/'
    })
   }

   
}