import { ISession } from "@modules/device/device.type";
import { ITokenSchema,IAuthResponse,IUserCreate,IUpdateUser, IUser, ITokenPair, User_Role, ICreateRefreshToken, ITokenResponse, IRefreshToken } from "./auth.type";
import { hashPassword } from "@utils/utils/encryption";

export class UserMapper {
    toUserResponse (data:IUser):IAuthResponse['user']{
    return {
        id:data.id,
        username:data.username,
        email:data.email,
        first_name:data.first_name||'Unknown name',
        last_name:data.last_name||'Unknown last name',
        role:data.role,
        avatar_url:data.avatar_url,    
        avatar_public_id:data.avatar_public_id,
        is_active:data.is_active,
        status:data.status,
        email_verified:data.email_verified,
        balance:data.balance,
        created_at:data.created_at    
    }
   }

    toAuthResponse (data:IUser,tokens:ITokenPair,session:Pick<ISession,'session_id'|'expires_at'>):IAuthResponse{
    return {
        user:this.toUserResponse(data),
        tokens,
        session:{
            session_id:session.session_id,
            expires_at:session.expires_at
        }
    }
   }

    async prepareToCreate (
    data:{
    username:string,
    email:string,
    password_hash:string,
    role?:User_Role,
    avatar_url?:string,
    avatar_public_id?:string
    first_name?:string,
    last_name?:string,
    phone_number?:string
    }
   ):Promise<IUserCreate>{
    return {
        username:data.username,
        email:data.email,
        password_hash:await hashPassword(data.password_hash),
        avatar_url:data.avatar_url,
        avatar_public_id:data.avatar_public_id,
        first_name:data.first_name||'Unknown',
        last_name:data.last_name||'Unknown',
        role:data.role,
        phone_number:data.phone_number
    }
   }

    toRefreshTokenCreate (
    user_id:string ,
    token_hash:string ,
    token_expires:Date ,
    token_version: number ,
    session_id:string
   ):ICreateRefreshToken{
     return {
        user_id,
        refresh_token_hash:token_hash,
        refresh_token_expiry:token_expires,
        token_version:token_version,
        session_id
     }
   }

    toRefreshTokenResponse (
    token:IRefreshToken
   ):{
    id:string,
    user_id:string,
    expires_at:Date,
    revoked:boolean,
    token_version:number,
    session_id:string,
    created_at:Date
}{
return {
    id:token.id,
    user_id:token.id,
    expires_at:token.token_expires,
    token_version:token.token_version,
    revoked:token.revoked,
    session_id:token.session_id,
    created_at:token.created_at
}
}
 toRefreshTokenListResponse (tokens:IRefreshToken[]):any[]{
     return tokens.map(token=> this.toRefreshTokenResponse(token))
}
 sanitizeUser (user:IUser):Omit<IUser,'password_hash'|'reset_code'|'reset_code_expiry'|'reset_token_hash'|'reset_token_expires_at'>{
    const {
        password_hash, 
        reset_code_hash,
        reset_code_expiry,
        reset_token_hash,
        reset_token_expires_at,
        ...sanitize_user 
    } = user
    return sanitize_user
}



  

  async toUpdateData (data:Partial<IUser>):Promise<IUpdateUser>{
    const updateData : IUpdateUser = {};
    if(data.username !== undefined) updateData.username = data.username;
    if(data.email !== undefined) updateData.email = data.email;
    if(data.password_hash !== undefined){
         updateData.password_hash = await hashPassword(data.password_hash);
    }

    if(data.first_name !== undefined) updateData.first_name = data.first_name;
    if(data.last_name !== undefined) updateData.last_name = data.last_name;
    if(data.role !== undefined) updateData.role = data.role;
    if(data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
    if(data.avatar_public_id !== undefined) updateData.avatar_public_id = data.avatar_public_id;
    if(data.is_active !== undefined) updateData.is_active = data.is_active;
    if(data.status !== undefined) updateData.status = data.status;
    if(data.email_verified !== undefined) updateData.email_verified = data.email_verified;
    if(data.phone_number !== undefined) updateData.phone_number = data.phone_number;
    if(data.balance !== undefined) updateData.balance = data.balance;
return updateData;
}

 hasRole (user:IUser,roles:string[]):boolean{
  return roles.includes(user.role)
}

 isActive (user:IUser):boolean{
    return user.is_active && user.status === 'active'
}

}
