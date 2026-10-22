import { 
    ITokenSchema,
    ICreateRefreshToken,
    ITokenResponse,
    IUpdateRefreshToken,
    ITokenPair,
    User_Role,
    ITokenPayload,
    IRefreshTokenPayload,
    IAuthResponse
 } from "@modules/auth/auth.type";
 


 export class TokenMapper {
    static prepareToCreateDTO (
        user_id:string ,
        token_hash:string,
        token_expires:Date,
        token_version:number = 1 ,
        session_id:string
     ):ICreateRefreshToken{
        return {
            user_id,
            refresh_token_hash:token_hash,
            refresh_token_expiry:token_expires,
            token_version,
            session_id
        }
     }
     
     static toTokenPair (
        access_token:string ,
        refresh_token:string ,
        access_token_expires:Date,
        refresh_token_expires:Date
     ):ITokenResponse{
        return {
            access_token,
            refresh_token,
            access_token_expires,
            refresh_token_expires,
            token_type:'Bearer'
        }
     }
     static toTokenPairResponse (
      token_pair:ITokenPair,
      token_data:Pick<ITokenSchema,'id'|'token_version'>
     ):any{
      return {
         refresh_token:token_pair.refresh_token,
         access_token:token_pair.access_token,
         refresh_token_expiry:token_pair.refresh_expiry,
         access_token_expiry:token_pair.access_expiry,
         token_type:token_pair.token_type||'Bearer',
         token_id:token_data.id,
         token_version:token_data.token_version
      }
     }
     
     static toRefreshPayload (
        id:string ,
        email:string ,
        role:User_Role,
        session_id:string,
        permissions:string[],
        token_version:number=1
     ):IRefreshTokenPayload{
        return {
            id,
            email,
            role:role as User_Role,
            permissions,
            type:'refresh',
            session_id,
            token_version
        }
     }

     static toSanitizedToken (token:ITokenSchema):any{
       const {token_hash,...sanitized}= token;
       return {
        ...sanitized,
        token_hash:'***'
       }
     }
     static isValidTokenVersion (
       current_version:number ,
       expected_version:number
     ):{is_valid:boolean,message?:string}{
         if(current_version !== expected_version){
            return {
                is_valid:false,
                message:`Invalid refresh token version , Expected ${expected_version} v,But got ${current_version} v`
            }
         }
         return {
            is_valid:true
         }
     }
     static toTokenStatus(token:ITokenSchema|null):{
        exists:boolean,
        is_valid:boolean,
        is_revoked:boolean,
        is_expired:boolean
     }{
        if(!token){
            return {
                exists:false,
                is_valid:false,
                is_revoked:false,
                is_expired:false
            }
        }
        const now = new Date();
        const expired = new Date(token.token_expires) < now;
        return {
            exists:true,
            is_valid:!token.revoked&&!expired,
            is_revoked:token.revoked || false,
            is_expired:expired

        }
     }
     static toResponse (token:ITokenSchema):any{
      return {
        id:token.id,
        refresh_token_hash:token.token_hash,
        refresh_token_expiry:token.token_expires,
        revoked:token.revoked,
        token_version:token.token_version,
        created_at:token.created_at
      }
     }
 }