import { Request } from "express";
import { logger } from "@utils/utils/logger";
import { AppError } from "@utils/errors/AppError";
import cpo from 'crypto';
import { DeviceService } from "@modules/device/device.service";
import { UserService } from "@modules/auth/user.service";
import { ResetPasswordRepo } from "./reset_password.repository";
import { UserRepo } from "@modules/auth/user.repository";
import { IUser } from "@modules/auth/auth.type";
import { generateRandomCode } from "@utils/utils/encryption";
import bt from 'bcrypt'
import { RefreshRepository } from "@modules/refresh_token/refresh_token.repository";
import { sendEmail, sendResetCode, sendResetUrl } from "@utils/utils/email";
import dtv from 'dotenv';


dtv.config();



export class ResetPasswordServ {
    private readonly deviceserv : DeviceService;
    private readonly userserv : UserService;
    private readonly resetrepo : ResetPasswordRepo;
    private readonly userrepo : UserRepo;
    private readonly refreshrepo : RefreshRepository;
    constructor(){
        this.deviceserv =new DeviceService();
        this.userserv =new UserService();
        this.resetrepo =new ResetPasswordRepo();
        this.userrepo =new UserRepo();
        this.refreshrepo = new RefreshRepository;
    }
    async findByEmail (email:string):Promise<IUser|null>{
        try {
            const user = await this.userrepo.findByEmail(email);
            if(!user){
                logger.error('Email is not registered');
                throw AppError.notFound('Email is not registered')
            }
            logger.info(`User ${user.email} found`) 
            return user
        } catch (error:unknown) {
            logger.error('User not found by email',error);
            throw AppError.internal('User not found by email');
        }
    }
    async generateResetCode (email:string,req:Request):Promise<boolean>{
        try {
            const user = await this.findByEmail(email);
            if(!user){
                logger.error('User not found');
                throw AppError.notFound('User not found')
            }
             await this.resetrepo.deleteAllExpiredCode();
            const reset_code = generateRandomCode(6).toString();
            console.log('RESET_CODE',{
                reset_code:reset_code
            })
            const mailOptions =  sendResetCode(user.first_name,user.last_name,user.email,reset_code)
            await sendEmail(mailOptions);
            const hash_code = cpo.createHash('sha256').update(reset_code).digest('hex');
            const device_info =  this.deviceserv.getDeviceInfoFromRequest(req)
            const expiry_time = new Date(Date.now() + 1000 * 60 * 2);
            const store_code = await this.resetrepo.create(`code`,user.id,hash_code,expiry_time,device_info.ip_address,device_info.user_agent,true);
            if(!store_code){
                logger.error('Failed to store code into database');
                throw AppError.badRequest('Failed to store code into database')
            }
            logger.info('The code stored hash into database and the result:',store_code);
            return true
        } catch (error:unknown) {
            logger.error("Failed to generate reset code",error);
            throw AppError.internal('Failed to generate reset code');
        }
    }
    async verifyResetCode (email:string,reset_code:string):Promise<boolean>{
        try {
            const user = await this.findByEmail(email);
            if(!user){
                logger.error('User not found by entered email')
                throw AppError.notFound("User not found by entered email")
            }
            const hash_code = cpo.createHash('sha256').update(reset_code).digest('hex');
            
            const result = await this.resetrepo.findValidCode(user.id,hash_code);
            
            if(!result){
                logger.error('Invalid reset code')
                throw AppError.badRequest('Invalid reset code')
            }
            if(result && result.reset_code_expires_at && result.reset_code_expires_at < new Date()){
                logger.error('Reset code has been expired');
                throw AppError.badRequest('Reset code has been expired')
            }
            logger.info('Reset code verified successfully')
            return true;
        } catch (error:unknown) {
                logger.error('Failed to verify reset code');
                throw AppError.badRequest('Failed to verify reset code');
        }
    }
    async resetPasswordUsingCode (email:string,reset_code:string,new_password:string):Promise<boolean>{
        try {
            const user = await this.findByEmail(email);
            if(!user){
                logger.error('User not found by email');
                throw AppError.notFound('User not found by email');
            }
            const validate_pass = await bt.compare(new_password,user.password_hash);
            if(validate_pass){
                logger.error("New password must not match with stored password");
                throw AppError.conflict('New password must not match with stored password')
            }
            const hash_code = cpo.createHash('sha256').update(reset_code).digest('hex');
            
            const revoke_code = await this.resetrepo.invalidateResetCode(user.id,hash_code);
            if(!revoke_code){
                logger.error('Failed to revoke code ')
            }
            const hash_password = await bt.hash(new_password,10);

            const result = await this.userrepo.updateUserPasswordByEmail(email,hash_password)

            if(!result){
                logger.error('Failed to reset new password');
                throw AppError.badRequest('Failed to reset new password');
            }

            logger.info(`Password changed for user ${user.username} successfully`)
            return true
        } catch (error:unknown) {
            logger.error('Failed to reset a new password',error);
            throw AppError.internal('Failed to reset a new password')
        }
    }
        async generateResetToken (email:string,req:Request):Promise<boolean>{
        try {
            const user = await this.findByEmail(email);
            if(!user){
                logger.error('User not found');
                throw AppError.notFound('User not found')
            }
            await this.resetrepo.deleteAllExpiredCode();
            const reset_token = cpo.randomBytes(32).toString('base64url');
            console.log('RESET-TOKEN-WILL-BE',{reset_token:reset_token})
            const hash_token = cpo.createHash('sha256').update(reset_token).digest('hex');
            const device_info =  this.deviceserv.getDeviceInfoFromRequest(req)
            const expiry_time = new Date(Date.now() + 1000 * 60 * 2);
            const server_url = process.env.SERVER_URL! as string
            const options =  sendResetUrl(user.first_name,user.last_name,email,`${server_url}resets/reset-password-token?token=${reset_token}`);
            await sendEmail(options)
            const store_token = await this.resetrepo.create(`token`,user.id,hash_token,expiry_time,device_info.ip_address,device_info.user_agent,true);
            if(!store_token){
                logger.error('Failed to store token into database');
                throw AppError.badRequest('Failed to store token into database')
            }
            logger.info('The token stored hash into database and the result:',store_token);
            return true
        } catch (error:unknown) {
            logger.error("Failed to generate reset token",error);
            throw AppError.internal('Failed to generate reset token');
        }
    }
    async verifyResetToken (email:string,reset_token:string):Promise<boolean>{
        try {
            const user = await this.findByEmail(email);
            if(!user){
                logger.error('User not found by entered email')
                throw AppError.notFound("User not found by entered email")
            }
            console.log('RESET_TOKEN_FROM_CONTROLLER_INTO_SERVICE:',reset_token)
            const hash_token = cpo.createHash('sha256').update(reset_token).digest('hex');
            
            console.log('RESET_HASH_TOKEN_TO_REPO',{hash_token:hash_token,
                user_id:user.id
            })
            const result = await this.resetrepo.findValidToken(user.id,hash_token);
            
            if (!result) {
            logger.error('Invalid or expired reset token');
            throw AppError.badRequest('Invalid or expired reset token');
        
        }
         
            logger.info(`Reset token verified successfully for user ${user.email}`)
            return true;
        } catch (error:unknown) {
            logger.error('Failed to verify reset token');
            throw AppError.badRequest('Failed to verify reset token');
        }
    }
    async resetPasswordUsingToken (email:string,reset_token:string,new_password:string):Promise<boolean>{
        try {
            const user = await this.findByEmail(email);
            if(!user){
                logger.error('User not found by email');
                throw AppError.notFound('User not found by email');
            }
            const validate_pass = await bt.compare(new_password,user.password_hash);
            if(validate_pass){
                logger.error("New password must not match with stored password");
                throw AppError.conflict('New password must not match with stored password')
            }
            const hash_token = cpo.createHash('sha256').update(reset_token).digest('hex');
        
             await this.resetrepo.invalidateResetToken(user.id,hash_token);
             await this.resetrepo.invalidateAllResetToken(user.id);

             await this.refreshrepo.revokeAllByUserId(user.id);
            const hash_password = await bt.hash(new_password,10);

            const result = await this.userrepo.updateUserPasswordByEmail(email,hash_password)

            if(!result){
                logger.error('Failed to reset new password');
                throw AppError.badRequest('Failed to reset new password');
            }

            logger.info(`Password changed for user ${user.username} successfully`)
            return true
        } catch (error:unknown) {
            logger.error('Failed to reset a new password',error);
            throw AppError.internal('Failed to reset a new password')
        }
    }
}