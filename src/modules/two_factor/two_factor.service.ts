import { logger } from "@utils/utils/logger";
import { AppError } from "@utils/errors/AppError";
import cpo from 'crypto';
import { ITwoFactorCode,TwoFactorPurpose } from "./two_factor.type";
import { SmsService } from "./sms.service";
import { TwoFactorRepo } from "./two_factor.repository";
import { UserRepo } from "@modules/auth/user.repository";
import dtv from 'dotenv';
import { ITokenPayload } from "@modules/auth/auth.type";
import { UserService } from "@modules/auth/user.service";
import { RefreshService } from "@modules/refresh_token/refresh_token.service";
import { DeviceService } from "@modules/device/device.service";
import { Request } from "express-serve-static-core";
import { validateAndFormatNumber } from "@utils/utils/phone.utils";


dtv.config();



const MAX_CODE_ATTEMPS_PER_HOUR = 5
const CODE_TTL_MMS = 1000 * 60 * 60 
export class TwoFactorService {
    private readonly smsserv : SmsService;
    private readonly twofactorrepo : TwoFactorRepo;
    private readonly userrepo : UserRepo;
    private readonly tokenserv : RefreshService; 
    private readonly deviceserv : DeviceService; 
    constructor(){
        this.smsserv = new SmsService();
        this.twofactorrepo = new TwoFactorRepo();
        this.userrepo = new UserRepo();
        this.tokenserv = new RefreshService();
        this.deviceserv = new DeviceService();
    }
    async enableTwoFactorIntoAccount(user_id:string,methods:string='sms',phone:string):Promise<boolean>{
        try {
            const user = await this.userrepo.findUserById(user_id);
            if(!user){
                logger.error('User not authenticated');
                throw AppError.unauthorized('User not authenticated')
            }
            const valid_phone = validateAndFormatNumber(phone,'EG');
            if(!valid_phone.is_valid || valid_phone.formatted === null){
                logger.error(`Invalid format number provided phone :${phone}`)
                throw AppError.badRequest(`Invalid format number provided phone :${phone}`)
            }
            const normalized_phone = valid_phone.formatted;
            const result = await this.twofactorrepo.enable2FACode(user_id,methods,normalized_phone)
            return result.id ? true : false
        } catch (error:unknown) {
            logger.error('Invalid phone number format')
            throw AppError.internal('')
        }
    }
    async createChallenge (
        user_id:string,
        phone:string, 
        purpose:TwoFactorPurpose = 'login'
    ):Promise<boolean>{
             const user = await this.userrepo.findUserById(user_id);
             if(!user){
                 logger.error('User not found');
                 throw AppError.notFound('User not found')
             }
             const validate_phone = validateAndFormatNumber(phone,'EG')
             if(!validate_phone.is_valid || validate_phone.formatted === null){
                logger.error(`Invalid phone number provided phone:${phone}`,{error:validate_phone.error});
                throw AppError.badRequest(`Invalid phone number provided phone:${phone}`)
             }
             const recent = await this.twofactorrepo.countRecentSms(phone);
             if (recent > MAX_CODE_ATTEMPS_PER_HOUR){
                 logger.error('Too many request , please try again later after 1 hour');
                 throw AppError.tooManyRequests('Too many request , please try again later after 1 hour')
             } 
            const normalized_phone = validate_phone.formatted 
            const code = this.generateNemuricCode();
            const code_hash = this.hash(code);
            const expires_at = new Date(Date.now() + CODE_TTL_MMS);
            const stored = await this.twofactorrepo.createCode(
            user_id,
            purpose,
            code_hash,
            normalized_phone,
            expires_at,
            MAX_CODE_ATTEMPS_PER_HOUR,
        )
        
        if(!stored){
            logger.error('Failed to store 2FA code into db');
            throw AppError.badRequest('Failed to store 2FA code into db')
        }
        try {
         await this.smsserv.send2FACode(phone,code);
         await this.twofactorrepo.logSmsSent(user_id,phone);
        } catch (error:unknown) {
            logger.error('Code was stored ,But sms not sent',error);
            if(process.env.NODE_ENV! !== 'production'){
                logger.warn(`[Dev]:2FA Code sent to phone:${phone} Code:[${code}]`)
            }
            throw AppError.serviceUnavailable('Failed to send SMS code');
        }
        return true
    }

    async verifyCode (user_id:string,purpose:TwoFactorPurpose,code:string,req:Request):Promise<ITokenPayload>{
            const stored = await this.twofactorrepo.findValidCode(user_id,{purpose} as any)
            if(!stored){
                throw AppError.badRequest('No active 2FA code, Please request a new 2FA code')
            }
            if(stored.attemps > MAX_CODE_ATTEMPS_PER_HOUR){
                throw AppError.tooManyRequests('Too many request ,Please try again later')
            }
            const user =await this.userrepo.findUserById(user_id);
            if(!user){
                logger.error('User not authenticated')
                throw AppError.unauthorized('User not authenticated')
            }
            
            const incoming_hash  = this.hash(code);
            const match = cpo.timingSafeEqual(
                Buffer.from(stored.code_hash,'hex'),
                Buffer.from(incoming_hash,'hex')
            )
            if(!match){
                const {attemps,max_attemps}= await this.twofactorrepo.incrementAttemps(stored.id);
                const left = Math.max(0,max_attemps - attemps);
                throw AppError.badRequest(`Invalid code , You have only ${left} remain attemps`)
            }
            await this.twofactorrepo.markUsed(stored.id)
            return {
                id:user.id,
                email:user.email,
                permissions:this.tokenserv.getTokenPermissions(user.role),
                role:user.role,
                session_id:this.deviceserv.getDeviceInfoFromRequest(req).session_id
            }
        
    }

    private generateNemuricCode (length:number=6):string{
        const min = Math.pow(10,(length-1))
        const max = Math.pow(10,(length))-1
        return cpo.randomInt(min,max).toString();
    }
    private hash (code:string):string{
        return cpo.createHash('sha256').update(code).digest('hex');
    }
}