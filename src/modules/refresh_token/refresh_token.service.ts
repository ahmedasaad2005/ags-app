import { logger } from "@utils/utils/logger";
import { AppError } from "@utils/errors/AppError";
import dtv from 'dotenv';
import { RefreshRepository } from "./refresh_token.repository";
import { TokenMapper } from "./refresh_token_mapper";
import { ITokenSchema,ITokenPair,ITokenResponse,ICreateRefreshToken, ITokenPayload, IAccessTokenPayload, IRefreshTokenPayload, Token_Type, User_Role } from "@modules/auth/auth.type";
import cpo from 'crypto';
import jwt from 'jsonwebtoken'


dtv.config();

const { JWT_ACCESS_SECRET , JWT_REFRESH_SECRET , JWT_ACCESS_EXPIRES , JWT_REFRESH_EXPIRES } = process.env;


export class RefreshService {
    private mapper : TokenMapper;
    private repo : RefreshRepository;
    private readonly jwt_access_secret : string;
    private readonly jwt_refresh_secret : string;
    private readonly def_access_expiry : string;
    private readonly def_refresh_expiry : string;
    constructor (){
        this.mapper = new TokenMapper();
        this.repo = new RefreshRepository();
        this.jwt_access_secret = JWT_ACCESS_SECRET!;
        this.jwt_refresh_secret =JWT_REFRESH_SECRET!;
        this.def_access_expiry = '15m';
        this.def_refresh_expiry = JWT_REFRESH_EXPIRES as string ||'7d';
    }

    async generateAndStoreToken (token:ITokenPayload):Promise<ITokenPair & {token_data:ITokenSchema}>{
      try {
        
        const token_pair = this.generateTokenPair(token,1);
        
        
        const token_hash = this.hashToken(token_pair.refresh_token);

        const decode = jwt.decode(token_pair.refresh_token) as {exp?:number};
        const expiryToken = decode?.exp ?
        new Date(decode.exp * 1000) :
        new Date(Date.now() + 1000 * 60 * 60 *24 * 7);
 console.log(`TOKEN_GENERATED:`,{
          r_t:token_pair.refresh_token||'unknown',
          a_t:token_pair.access_token||'Unknown',
          r_e:token_pair.refresh_expiry||'Unknown',
          a_e:token_pair.access_expiry||'Unknown',
          t_t:token_pair.token_type||'Unknown',
          t_h:token_hash,
          e_t:expiryToken,
          // t_d:token_data.token_version
        })

        const prepareToCreate = TokenMapper.prepareToCreateDTO(token.id,token_hash,expiryToken,1,token.session_id)  ;
        const token_data = await this.repo.createRefresh(prepareToCreate);

         
        return {
          ...token_pair,
          token_data
        }
      } catch (error:unknown) {
        logger.error('Failed to generate refresh token',error);
        throw AppError.internal('Failed to generate refresh token')
      }
    }
    generateAccessToken (payload:IAccessTokenPayload):string{
        return jwt.sign({
          id:payload.id,
          email:payload.email,
          role:payload.role,
          permissions:payload.permissions,
          session_id:payload.session_id,
          type:'access'
        },JWT_ACCESS_SECRET!,{
            expiresIn:'15m'
        })
    };


    generateTokenPair (
      token_payload :ITokenPayload ,
       token_version:number = 1 
       ) : ITokenPair {
      try {
        if(!token_payload.session_id){
          throw AppError.badRequest('Session ID is required for refresh generation')
        }
        const access_payload  = {
             ...token_payload,
             type:Token_Type.ACCESS,
        }
        const access_token = jwt.sign(
          access_payload,
          JWT_ACCESS_SECRET!,
          {expiresIn:'15m'}
        )

        const refresh_payload = {
           ...token_payload,
           type:Token_Type.REFRESH,
           token_version:token_version,
        };

        const refresh_token = jwt.sign(
          refresh_payload,
          JWT_REFRESH_SECRET!,
          {expiresIn:'7d'});
          
          const access_expiry = this.getTokenExpiry(access_token);
          
          const refresh_expiry = this.getTokenExpiry(refresh_token);
          
          return {
            access_token,
            refresh_token,
            access_expiry,
            refresh_expiry,
            token_type:'Bearer'
          }

      } catch (error:unknown) {
        logger.error('Failed to generate token pair',error);
        throw AppError.internal('Failed to generate token pair')
      }
    }

  

     verifyAccessToken (token:string):IAccessTokenPayload {
      try {
        const decoded = jwt.verify(token ,JWT_ACCESS_SECRET!) as IAccessTokenPayload ;
        if(decoded.type !== 'access'){
            throw AppError.badRequest('Invalid access token type')
        }
        return decoded
      } catch (error:unknown) {
        if(error instanceof jwt.TokenExpiredError){
          throw AppError.badRequest('Access token expired')
        }
        if(error instanceof jwt.JsonWebTokenError){
          throw AppError.badRequest("Invalid token type")
        }
        logger.error("Failed to verify access type",error);
        throw AppError.internal("Failed to verify access token")
      }
    }

   async verifyRefreshToken (token:string):Promise<IRefreshTokenPayload>{
    try {
      const decode = jwt.verify(token,this.jwt_refresh_secret) as IRefreshTokenPayload;
      if(decode.type !== 'refresh'){
        logger.error('Invalid refresh token type')
        throw AppError.badRequest('Invalid refresh token type');
      }
      const token_hash =  this.hashToken(token);

      const stored_token = await this.repo.findByTokenHash(token_hash);
      if(!stored_token){
        logger.error('Refresh hashed Token not found')
        throw AppError.notFound('Refresh hashed Token not found');
      }
      if(stored_token.revoked){
        logger.error('Refresh token has been revoked')
        throw AppError.badRequest('Refresh token has been revoked')
      }
      if(stored_token.session_id !== decode.session_id){
        logger.error('Token session not match')
      }
      if(new Date(stored_token.token_expires) < new Date()){
        logger.error('Refresh token has been expired');
        throw AppError.badRequest('Refresh token has been expired');
      }
      if(stored_token.token_version !== decode.token_version){
        logger.error('Token version mismatch')
        throw AppError.badRequest('Token version mismatch')
      }
      logger.info(`Refresh token verified for user ${decode.id}`);
      return decode
    } catch (error:unknown) {
      if(error instanceof jwt.TokenExpiredError){
        logger.error('Token has been expired',error)
        throw AppError.badRequest('Token has been expired',error);
      }
      if(error instanceof jwt.JsonWebTokenError){
        logger.error("Invalid refresh token",error);
        throw AppError.badRequest('Invalid refresh token');
      }
      if (error instanceof AppError) throw error;
      logger.error('Failed to verify refresh token', error);
      throw AppError.unauthorized('Invalid refresh token');
    }
   }

   async refreshTokenPair (refresh_token:string,session_id:string):Promise<ITokenPair>{
    try {
      const payload = await this.verifyRefreshToken(refresh_token);
      const token_hash = this.hashToken(refresh_token);
      const stored_token = await this.repo.findByTokenHash(token_hash);
      if(stored_token){
        await this.repo.revoke(stored_token.id);
        logger.warn('Old token has been revoked');
      }
      const token_payload : ITokenPayload = {
        id:payload.id,
        email:payload.email,
        role:payload.role,
        permissions:payload.permissions || [],
        session_id,        
      } 
      const new_token_version = (stored_token?.token_version || 0 ) + 1;
      const token_pair = this.generateTokenPair(token_payload,new_token_version);

      await this.generateAndStoreToken(token_payload)
      logger.info(`Tokens refreshed to the user ${payload.id}`)
      return token_pair 
    } catch (error:unknown) {
                  if (error instanceof AppError) throw error;
            logger.error('Failed to refresh token pair', error);
            throw AppError.unauthorized('Failed to refresh tokens');

    }
   }

   async revokeToken (token:string):Promise<boolean>{
    try {
      const token_hash = this.hashToken(token);
      const stored_token = await this.repo.findByTokenHash(token_hash);
      if(!stored_token){
        logger.error('Stored token not found');
        throw AppError.badRequest('Stored token not found');
      }
      const result = await this.repo.revoke(stored_token.id);
      logger.info('Refresh token revoked');
      return result;
    } catch (error:unknown) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to revoke refresh token', error);
      throw AppError.internal('Failed to revoke refresh token');
    }
   }


   async revokeAllTokensForUser (user_id:string):Promise<number>{
    try {
      const count = await this.repo.revokeAllByUserId(user_id);
      logger.info('All refresh token revoked successfully');
      return count;
    } catch (error:unknown) {
      if(error instanceof AppError) throw AppError.internal('Failed to revoke all tokens by id');
      logger.error('Failed to revoke all user tokens', error);
      throw AppError.internal('Failed to revoke all tokens');
    }
   }

   private getTokenExpiry (token:string):Date{
      try {
        const decode = jwt.decode(token) as {exp?:number};

        if(!decode.exp){
          return new Date(Date.now()+ 1000 * 60 * 15);
        }
        return new Date(decode.exp * 1000)
      } catch (error:unknown) {
        return new Date(Date.now() + 1000 * 60 * 15);
      }
    }
   

   decodeToken (token:string):ITokenPayload | null {
      try {
        return jwt.decode(token) as ITokenPayload;
      } catch (error:unknown) {
        logger.error('Failed to decode token',error);
        return null
      }
    }
   isTokenExpireSoon (token:string,thres_hold_minutes:number = 5):boolean{
    try {
      const decode = jwt.decode(token) as {exp?:number};
      if(!decode?.exp) return false;
      const token_expiry  = decode.exp  * 1000;; 
      const current_time = Date.now();
      const thres_hold_ms = thres_hold_minutes * 1000 * 60;
      return (token_expiry - current_time) < thres_hold_ms;
    } catch (error:unknown) {
      return false
    }
   }
   getTokenRemainingTime (token:string):number{
   try {
    const decoded = jwt.decode(token) as {exp?:number};
    if(!decoded?.exp){
       return 0;
    }
    const expiry_time = decoded.exp * 1000;
    const current_time = Date.now();
    return Math.max(0,Math.floor((expiry_time - current_time) / 1000));
   } catch (error:unknown) {
    return 0
   }

   }
    generateRandomNumericCode (length:number=6):string{
      const min = Math.pow(10, ( length - 1 ))
      const max =  Math.pow(10,(length)) - 1;
      return String(cpo.randomInt(min,max))
    }
    generateDeviceId():string{
      return cpo.randomBytes(16).toString('hex');
    }
    generateSessionId():string{
      return cpo.randomBytes(32).toString('hex');
    }
    generateFingerPrint(user_agent:string,ip_address:string,accept_language:string){
      const data = `${user_agent}|${ip_address}|${accept_language}`;
      return cpo.createHash('sha256').update(data).digest('hex')
    }
    generateRandomResetToken (length:number =64):string{
      return cpo.randomBytes(length).toString('hex')
    }

    hashToken (refresh_token:string):string{
      return cpo.createHash('sha256').update(refresh_token).digest('hex');
    }
    getTokenPermissions (user_role:User_Role):string[]{
      const permissions : Record<User_Role,string[]> = {
        [User_Role.USER]:[
          'read:profile',
          'update:profile',
          'create:payment',
          'read:orders',
          'create:orders',
          'update:orders'
        ],
        [User_Role.MODERATOR]:[
          'read:profile',
          'update:profile',
          'create:orders',
          'update:orders',
          'read:orders',
          'create:payment',
          'read:users',
          'update:users',
          'moderate:content'
        ],
        [User_Role.ADMIN]:[
          'read:profile',
          'create:profile',
          'create:order',
          'read:order',
          'update:order',
          'create:payment',
          'read:users',
          'update:users',
          'moderate:content',
          'manage:system',
          'delete:users',
          'manage:roles',
          'view:analytics',
        ]
      }
      return permissions[user_role] || []
    }
}
