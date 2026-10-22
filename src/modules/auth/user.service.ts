import { AppError } from "@utils/errors/AppError";
import { logger } from "@utils/utils/logger";
import { UserRepo } from "./user.repository";
import { UserMapper } from "./user.mapper";
import { TokenMapper } from "@modules/refresh_token/refresh_token_mapper";
import { RefreshService } from "@modules/refresh_token/refresh_token.service";
import { IAuthResponse, ITokenPair, ITokenPayload, IUser, IUserCreate, IUserLoginDTO, User_Role, User_Status } from "./auth.type";
import bt from 'bcrypt';
import { comparePassword, generateRandomCode, hashPassword, hashToken } from "@utils/utils/encryption";
import cpo from 'crypto';
import { RefreshRepository } from "@modules/refresh_token/refresh_token.repository";
import { generateResetCode, sendEmail, sendResetCode, sendResetUrl } from "@utils/utils/email";
import { SessionRepo } from "@modules/session/session.repository";
import { DeviceRepo } from "@modules/device/device.repository";
import { DeviceService } from "@modules/device/device.service";
import { Request } from "express";
import { IDeviceInfo, ISession } from "@modules/device/device.type";
import { cldserv } from "@modules/cloudinary/cloudinary.service";
import { ResetTester } from "./auth.test";


export class UserService {
    private usermapper : UserMapper;
    private userrepo : UserRepo;
    private tokenmapper : TokenMapper;
    private tokenservice :RefreshService;
    private tokenrepo : RefreshRepository; 
    private sessionrepo : SessionRepo;
    private devicerepo : DeviceRepo;
    private deviceserv : DeviceService;
    constructor (){
        this.usermapper = new UserMapper();
        this.userrepo = new UserRepo();
        this.tokenmapper = new TokenMapper();
        this.tokenservice = new RefreshService();
        this.tokenrepo = new RefreshRepository();
        this.sessionrepo = new SessionRepo();
        this.devicerepo = new DeviceRepo();
        this.deviceserv = new DeviceService();
    }


    async register (data:IUserCreate,req:Request,file?:Express.Multer.File):Promise<IAuthResponse>{
       try {
        const device_info  =  this.deviceserv.getDeviceInfoFromRequest(req);
      
        const [ exist_username , exist_email ] = await Promise.all([
             this.userrepo.existUserByUsername(data.username),
             this.userrepo.existsUserByEmail(data.email)
        ])
        if(exist_username){
            throw AppError.conflict('Username is already exist')
        }
        if(exist_email){
            throw AppError.conflict('Email is already exist')
        }
        
        let fileData = null

        if(file){
            const result = await cldserv.UploadImageByBuffer(file.buffer,{
                transformations:{
                    width:200,
                    height:200,
                    crop:'limit',
                    quality:'auto'
                }
            });
             fileData = {
                avatar_url:result.secure_url,
                avatar_public_id:result.public_id
            }
           
        }
          
            
        //GETTING avatar urls successfully
        const prepareData =await this.usermapper.prepareToCreate({
            username:data.username,
            email:data.email,
            password_hash:data.password_hash,
            phone_number:data.phone_number,
            role:data.role ? data.role : User_Role.USER,
            avatar_url:fileData? fileData.avatar_url : 'unknown',
            avatar_public_id:fileData? fileData.avatar_public_id : 'unknown',
            first_name:data.first_name,
            last_name:data.last_name 
        })
        const user = await this.userrepo.create(prepareData);
        console.log('USER DATA INFO 📩!:',{
            user_id:user.id,
            username:user.username,
            email:user.email,
            role:user.role,
            avatar_url:user.avatar_url,
            avatar_public_id:user.avatar_public_id,
        })
        const prepareForCreateDevice  = {
            user_id:user.id,
            ...device_info
        };
        const device  = await this.devicerepo.create(prepareForCreateDevice)
        const payload : ITokenPayload  = {
          id:user.id,
          email:user.email,
          role:user.role,
          permissions:this.tokenservice.getTokenPermissions(user.role),
          session_id:device_info.session_id
        };
        
        const expires_at = new Date();
        expires_at.setDate(expires_at.getDate()+7);
        const prepareForCreateSession = {
            user_id:user.id,
            device_id:device.id,
            session_id:device_info.session_id,
            expires_at
        }
        

        const session = await this.sessionrepo.create(prepareForCreateSession);

        const stored_token = await this.tokenservice.generateAndStoreToken(payload)

        const token_hash =  hashToken(stored_token.refresh_token);


        await this.sessionrepo.updateRefreshToken(device_info.session_id,token_hash)
        
        
        await this.userrepo.updateLastLogin(user.id);

        logger.info('User registered successfully',{
            session_id:device_info.session_id,
            device_id:device_info.device_id
        })
        return this.usermapper.toAuthResponse(user,stored_token,session);
    } catch (error:unknown) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error('Failed to register user:', error);
            throw AppError.internal('Failed to register user');    
   }
    }

    async login (data:IUserLoginDTO,req:Request):Promise<IAuthResponse>{
        try {
            
            const device_info = this.deviceserv.getDeviceInfoFromRequest(req);
            const user = await this.userrepo.findByEmail(data.email);
            if(!user){
                throw AppError.notFound('User not found');
            } 
            if(data.email !== user.email){
                throw AppError.unauthorized('User has been inactive');
            }
            
            if(!user.is_active||user.status === User_Status.INACTIVE){
                throw AppError.unauthorized('User has been inactive');
            }
            if(user.status === User_Status.SUSPENDED){
                throw AppError.unauthorized('User has been suspended');
            }
            if(user.status === User_Status.BANNED){
                throw AppError.unauthorized('User has been banned')
            }
            console.log('REAL_USER_ID_FORMAT_SHOULD BE',{
                id:user.id
            })
            
            const compare_password = await comparePassword(data.password_hash,user.password_hash);
            if(!compare_password){
                throw AppError.badRequest('Invalid password credential')
            }
            const prepareToCreateDevice = {
              user_id:user.id,
              ...device_info
            }

            const device = await this.devicerepo.create(prepareToCreateDevice);
            const session_id = this.tokenservice.generateSessionId()
            const expires_at = new Date()
            expires_at.setDate(expires_at.getDate() + 7)
            const prepareForCreateSession = {
                user_id:user.id,
                device_id:device.id,
                session_id:session_id,
                expires_at
            }
            const session = await this.sessionrepo.create(prepareForCreateSession);
            const payload : ITokenPayload = {
                id:user.id,
                email:user.email,
                role:user.role,
                permissions:this.tokenservice.getTokenPermissions(user.role),
                session_id:device_info.session_id,
                
            }
            
            const token_pair = await this.tokenservice.generateAndStoreToken(payload);
            
            const hash_token =this.tokenservice.hashToken(token_pair.refresh_token)

            await this.userrepo.updateLastLogin(user.id);

            await this.sessionrepo.updateRefreshToken(session_id,hash_token);
            logger.info('User logged in',{
                id:device_info.session_id,
                device_id:device.device_id,

            })

            return this.usermapper.toAuthResponse(user,token_pair,session);

        } catch (error:unknown) {
            logger.error('Login failed for user ',error);
            throw AppError.internal('Login failed for user');
        }
    }
   
    
    async resendCodeVerification (user_id:string):Promise<void>{
        try {
            const user = await this.userrepo.findUserById(user_id);
            
            if(!user){
                logger.error('User not found');
                throw AppError.notFound('User not found');
            }
            
            const reset_code = generateRandomCode(6).toString();
            
            const getExpiry = new Date();

            getExpiry.setDate(getExpiry.getDate() + 1000 * 60 * 15);

            const result = await this.userrepo.update(user_id,{reset_code,reset_code_expiry:getExpiry})

             sendResetCode(user.first_name,user.last_name,user.email,reset_code);

            logger.info(`Reset code resend to the user : ${user.id} `)
            
        } catch (error:unknown) {
            logger.error("Failed to send code to the user",error)
        }
    }
    async logoutSession (session_id:string):Promise<void>{
       try {
         await this.sessionrepo.revoke(session_id); 
         logger.info('User logout by session_id',session_id);
       } catch (error:unknown) {
        logger.error("Failed to revoke session_id",error);
        throw AppError.internal('Failed to revoke session_id')
       }
    }
    async logoutAllSessions (user_id:string):Promise<number>{
      try {
        const result = await this.sessionrepo.revokeAllSessionsByUserId(user_id);
        logger.info('All devices logout successfully',result);
        return result
      } catch (error:unknown) {
        logger.error("Failed to logout all devices by session ID",error);
        throw AppError.internal('Failed to logout all devices by session ID');
      }
    }
    async getActiveUserSessions (user_id:string):Promise<ISession[]>{
        try {
            const result = await this.sessionrepo.getUserActiveSessions(user_id);
            logger.error('All active sesstion retreived successfully',result)
            return result ;
        } catch (error:unknown) {
            logger.error('Failed to retreive all active sessions for a user',error);
            throw AppError.internal('Failed to retreive all active sessions for a user')
        }
    }
    async revokeSession (session_id:string,user_id:string):Promise<void>{
        try {
            const session = await this.sessionrepo.findSessionBySessionId(session_id);
            if(!session || session.user_id !== user_id){
                logger.error('Session not found');
                throw AppError.notFound('Session not found');
            } 
             await this.sessionrepo.revoke(session_id) ;
        } catch (error:unknown) {
           if (error instanceof AppError) throw error;
            logger.error('Failed to revoke token',error);
            throw AppError.internal('Failed to revoke token');
        }
    }
    async refreshTokens (refresh_token:string):Promise<ITokenPair>{
        try {
            const payload = await this.tokenservice.verifyRefreshToken(refresh_token);
            const hash_token =  cpo.createHash('sha256').update(refresh_token).digest('hex');
            const stored_token = await this.tokenrepo.findByTokenHash(hash_token);
            if(!stored_token){
                throw AppError.unauthorized("Token not Found")
            }
            if(stored_token.revoked){
                throw AppError.unauthorized("Refresh token has been revoked");
            }
            if(new Date(stored_token.token_expires) < new Date()){
                throw AppError.unauthorized("Refresh token has expired")
            }
            const user = await this.userrepo.findUserById(payload.id);
            if(!user){
                throw AppError.notFound('User not found')
            }
            await this.tokenrepo.revoke(stored_token.id);
            const session_id = this.tokenservice.generateSessionId()
            const new_token_payload : ITokenPayload = {
                id:user?.id,
                email:user.email,
                role:user.role,
                permissions:this.tokenservice.getTokenPermissions(user.role),
                session_id
            } 
            return await this.createTokens(user.id,new_token_payload);

        } catch (error:unknown) {
            logger.error('Token refresh failed',error);
            throw AppError.internal('Token refresh failed')
        }
    }
    async logout (refresh_token:string):Promise<void>{
        try {
            const hash_token = cpo.createHash('sha256').update(refresh_token).digest('hex');
            const stored_token = await this.tokenrepo.findByTokenHash(hash_token);
            
            
            if(stored_token && !stored_token.revoked){
                await this.tokenrepo.revoke(stored_token.id);
                logger.info(`User logged out : ${stored_token.user_id}`);
            }
        } catch (error:unknown) {
            logger.error("Failed to logout",error);
            throw AppError.internal('Failed to logout');
        }
    }
    async logoutAll (user_id:string):Promise<number>{
        try {
            const count = await this.tokenrepo.revokeAllByUserId(user_id);
            logger.info(`Logout all devices successfully (${count}) for user id : ${user_id}`)
            return count
        } catch (error:unknown) {
            logger.error('Failed to logout all user id', error);
            throw AppError.internal('Failed to logout all by user id')
        }
    }
async getUserById(id:string):Promise<IAuthResponse['user']>{
    try {
        const user = await this.userrepo.findUserById(id)
        if(!user){
            throw AppError.notFound('User not found');
        }
        return this.usermapper.toUserResponse(user)
    } catch (error:unknown) {
        logger.error('Failed to get user by id',error);
        throw AppError.internal("Failed to get user by id");
    }
}

async changePassword (
    user_id:string,
    current_password:string,
    new_password:string,
):Promise<void>{
    try {
        const user = await this.userrepo.findUserById(user_id);
        if(!user){
            throw AppError.notFound('User not found');
        }
        const verify_password = await comparePassword(current_password,user.password_hash);
        if(!verify_password){
            throw AppError.badRequest('The entered password is incorrect');
        }
        const hash_password = await bt.hash(new_password,10);
        await this.userrepo.update(user_id,{password_hash:hash_password}) ;
        await this.tokenrepo.revokeAllByUserId(user_id);
        logger.info(`The password changed successfully for the user :${user_id}`)

    } catch (error:unknown) {
        if (error instanceof AppError) throw error
        logger.error('Failed to change the password',error);
        throw AppError.internal('Failed to change the password');
    }
}
    private async createTokens (user_id:string,payload:ITokenPayload):Promise<ITokenPair>{
        const existing_token = await this.tokenrepo.findTokenByUserId(user_id);
        const token_version =  existing_token?.token_version || 0
        
        const tokens =  this.tokenservice.generateTokenPair(payload,token_version + 1);
        
        const token_hash = cpo.createHash('sha256').update(tokens.refresh_token).digest('hex');
        const session_id = this.tokenservice.generateSessionId() 
        const refresh_token_data = this.usermapper.toRefreshTokenCreate(
        user_id,
        token_hash,
        tokens.refresh_expiry,
         token_version + 1,
         session_id
        );
          await this.tokenrepo.createRefresh(refresh_token_data)
       return {
        refresh_token:tokens.refresh_token,
        access_token:tokens.access_token,
        refresh_expiry:tokens.refresh_expiry,
        access_expiry:tokens.access_expiry,
        token_type:'Bearer'
       };
    }
}