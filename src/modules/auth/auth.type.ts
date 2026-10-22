







export enum User_Role  {
    USER = 'user' ,
    MODERATOR = 'moderator',
    ADMIN = 'admin'
}
export enum User_Status {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    BANNED = 'blocked'
}
export enum Token_Type {
    ACCESS = 'access' ,
    REFRESH = 'refresh',
    VERIFY = 'verify',
    RESET = 'reset'
}


export interface IUser {
    id:string 
    username:string 
    email:string 
    password_hash:string 
    role:User_Role 
    avatar_url?:string
    first_name?:string 
    last_name?:string 
    avatar_public_id?:string
    last_login:Date
    email_verified:boolean 
    status:User_Status 
    is_active:boolean 
    phone_number?:string
    balance:number
    reset_code_hash?:string 
    reset_code_expiry?:Date
    reset_token_hash?:string 
    reset_token_expires_at?:Date  
    created_at:Date 
    updated_at:Date
}





export interface IUserCreate {
    username:string 
    email:string 
    password_hash:string  
    first_name?:string 
    last_name?:string
    avatar_url?:string
    avatar_public_id?:string
    role?:User_Role
    phone_number?:string
}

export interface IUpdateUser  {
    username?:string
    email?:string
    first_name?:string 
    last_name?:string
    phone_number?:string 
    password_hash?:string 
    role?:User_Role
    is_active?:boolean
    status?:User_Status 
    last_login?:Date 
    email_verified?:boolean
    balance?:number
    avatar_url?:string 
    avatar_public_id?:string
    reset_code?:string |null
    reset_code_expiry?:Date|null
    reset_token_hash?:string
    reset_token_expires_at?:Date
} 





export interface ITokenPayload {
    id:string
    email:string 
    permissions:string[]
    role:User_Role
    session_id:string
}


export interface IAccessTokenPayload extends ITokenPayload {
    type:Token_Type.ACCESS
    exp?:number
}

export interface IRefreshTokenPayload extends ITokenPayload {
    type:'refresh'
    token_version?:number 
    exp?:number
}

export interface ITokenPair {
    access_token:string 
    refresh_token:string
    access_expiry:Date 
    refresh_expiry:Date
    token_type:string 
}

export interface ITokenSchema {
 id:string 
 user_id:string 
 token_version:number 
 revoked?:boolean 
 token_hash:string
 token_expires:Date
 session_id:string
 created_at:Date
}


export interface IRefreshToken {
    id:string 
    user_id:string 
    token_hash:string 
    token_expires:Date 
    revoked:boolean 
    token_version:number 
    session_id:string
    created_at:Date
    updated_at:Date
}

export interface ICreateRefreshTokenADV {
    user_id:string 
    token_hash:string
    token_expiry:Date 
    token_version?:number
    session_id:string
}
export interface IUpdateRefreshTokenAdv {
    revoked?:boolean 
    token_version?:number 
    token_hash?:string 
    token_expires?:Date
    session_id?:string
}
export interface IAuthResponse {
    user:{
      id:string 
      username:string 
      email:string
      first_name:string 
      last_name:string
      role:User_Role 
      avatar_url?:string 
      avatar_public_id?:string 
      status:User_Status
      is_active:boolean
      email_verified:boolean 
      balance:number
      created_at:Date
    },
    tokens:ITokenPair,
    session:{
        session_id:string,
        expires_at:Date
    }
}

export interface ICreateRefreshToken {
    user_id:string 
    refresh_token_hash:string
    refresh_token_expiry:Date
    token_version:number
    session_id:string
}

export interface IUpdateRefreshToken {
    revoked?:boolean
    refresh_token_hash?:string
    session_id?:string 
    updated_at?:Date
}



export interface ITokenResponse {
    access_token:string 
    refresh_token:string
    access_token_expires:Date
    refresh_token_expires:Date
    token_type:'Bearer'
}



export interface IUserLoginDTO {
    email:string 
    password_hash:string 
     
}


export interface IUserRegisterDTO {
    username:string 
    email:string
    first_name?:string 
    last_name?:string
    password_hash:string 
    role:User_Role 
    phone_number?:string
}

export interface IRefreshTokenDTO {
    refresh_token:string 
}

export interface IChangePasswordDTO { 
    current_password:string 
    new_password:string
    confirm_password:string 
}

export interface IResetPassword {
    token:string 
    new_password:string 
    confirm_password:string
}

export interface IUserSession {
    id:string 
    user_id:string 
    refresh_token_id:string 
    device_id:string 
    device_name:string 
    device_type:string 
    ip_address:string 
    user_agent:string
    is_active:boolean 
    last_activity:Date 
    created_at:Date 
    updated_at:Date
}

export interface IPermission {
    id:string 
    name:string 
    resource:string 
    action:string
    description?:string
}

export interface IRolePermission {
    role:User_Role
    permission:IPermission[]
}

export function isAccessTokenPayload (payload:any) : payload is IAccessTokenPayload  {
    return payload && payload.type === Token_Type.ACCESS
}

export function isRefreshTokenPayload (payload:any) :payload is IRefreshTokenPayload {
    return payload && payload.type === Token_Type.REFRESH
}

export function isValidUserRole (role:string):role is User_Role { 
     return Object.values(User_Role).includes(role as User_Role)
}



export interface IResetPasswordCodeRow {
    id:string 
    user_id:string 
    reset_code_hash:string 
    reset_code_expires_at:Date 
    ip_address?:string
    user_agent?:string 
    used_at:Date|null
    email:string 
    username:string 
    first_name:string
    password_hash:string
}

export interface IResetPasswordTokenRow {
    id:string 
    user_id:string 
    reset_token_hash:string 
    reset_token_expires_at:Date 
    ip_address?:string
    user_agent?:string 
    used_at:Date|null
    email:string 
    username:string 
    first_name:string
    password_hash:string
}