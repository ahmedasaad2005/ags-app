import { 
    IAccessTokenPayload,
    ICreateRefreshToken,
    IRefreshTokenPayload,
    ITokenPair,
    ITokenPayload,
    ITokenResponse,
    ITokenSchema,
    IUpdateRefreshToken,
    Token_Type,
    User_Role
 } from "@modules/auth/auth.type";
import { logger } from "./logger";
import jwt from 'jsonwebtoken';
import dtv from 'dotenv';
import { AppError } from "@utils/errors/AppError";
import { generateRandomToken } from "./encryption";

dtv.config();

const {JWT_ACCESS_SECRET , JWT_REFRESH_SECRET} = process.env;

export const generateAccessToken = (payload:ITokenPayload) :string=>{
    
    const user :IAccessTokenPayload= {
        id:payload.id,
        email:payload.email,
        role:payload.role,
        permissions:payload.permissions,
        session_id:payload.session_id,
        type:Token_Type.ACCESS
    }
    return jwt.sign(
       { ...payload}
    ,process.env.JWT_ACCESS_SECRET!,{
        expiresIn:'15m'
    })
}
export const generateRefreshToken = (payload:ITokenPayload,token_version?:number):string=>{
    const user :IRefreshTokenPayload = {
        id:payload.id,
        email:payload.email,
        role:payload.role,
        permissions:payload.permissions,
        session_id:payload.session_id,
        token_version:token_version,
        type:'refresh'
    }
    
    return jwt.sign(
        {
            ...user,
            jti:generateRandomToken(16)
        },
        process.env.JWT_REFRESH_SECRET!,
        {expiresIn:'7d'}
    )
}




export const generateTokenPair = (payload:ITokenPayload):ITokenPair=>{
    return {
        access_token:generateAccessToken(payload),
        refresh_token:generateRefreshToken(payload),
        access_expiry:generateAccessTokenExpiry(),
        refresh_expiry:generateRefreshTokenExpiry(),
        token_type:'Bearer'
    }
}

export const generateRefreshTokenExpiry = () :Date=>{
    return new Date(Date.now() + (1000 * 60 * 60 * 24 * 7))
} 
export const generateAccessTokenExpiry = ():Date =>{
    return new Date(Date.now() + (1000 * 60 * 15))
}

export const verifyAccessToken = (access_token:string):ITokenPayload => {
    try {
        const decoded = jwt.verify(access_token,JWT_ACCESS_SECRET!) as IAccessTokenPayload & {type:string};
        
        if(decoded.type !== 'access'){
            throw AppError.badRequest('Invalid access token type!')
        }

        return {
            id:decoded.id,
            email:decoded.email,
            role:decoded.role,
            permissions:decoded.permissions,
            session_id:decoded.session_id

        }
    } catch (error:unknown) {
        if(error instanceof jwt.TokenExpiredError){
            throw AppError.badRequest('Access token expired')
        }
        throw AppError.badRequest('Invalid access token')
        
    }
}

export const verifyRefreshToken = (refresh_token:string):ITokenPayload=>{
    try {
        const decoded = jwt.verify(refresh_token,JWT_REFRESH_SECRET!) as IRefreshTokenPayload & {type:string,jti:string}
        if(decoded.type !== 'refresh'){
            throw AppError.badRequest('Invalid refresh token type')
        }
        return {
            id:decoded.id,
            email:decoded.email,
            permissions:decoded.permissions,
            role:decoded.role,
            session_id:decoded.session_id
        }
    } catch (error:unknown) {
        if(error instanceof jwt.TokenExpiredError){
            throw AppError.badRequest('Expired refresh token')
        }
        throw AppError.badRequest("Invalid refresh token")
    }
} 
