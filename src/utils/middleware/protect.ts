import { Request , Response , NextFunction } from "express";
import dtv from 'dotenv';
import { AppError } from "@utils/errors/AppError";
import { verifyAccessToken, verifyRefreshToken } from "@utils/utils/token";
import { UserRepo } from "@modules/auth/user.repository";
import { logger } from "@utils/utils/logger";


dtv.config();

const userrepo = new UserRepo()

export const protect = async (req:Request,res:Response,next:NextFunction) => {
try {
   let token : string | undefined ;

   if( !token && req.cookies?.access_token){
    token =  req.cookies.access_token;
   }
   console.log('REFRESH_TOKEN',{
    c_r_t:req.cookies?.refresh_token
   })
   if (!token) {
     throw AppError.unauthorized('No access token provided');
   }

   const payload = verifyAccessToken(token);
   const user = await userrepo.findUserById(payload.id)
   if(!user){
    throw AppError.unauthorized("User not found")
   }
   if(!user.is_active||user.status === 'inactive'){
    throw AppError.unauthorized('User status is inactive');
   }

   req.user = {
    id:user.id,
    email:user.email,
    role:user.role,
    permissions:payload.permissions||[],
    session_id:payload.session_id
}
   next()
} catch (error:unknown) {
   if(error instanceof AppError){
    next(error)
   }
   else if(error instanceof Error && error.message === 'Access token expired'){
    next(AppError.unauthorized('Access token expired'))
   }else{
    next(AppError.unauthorized('Invalid access token'))
   }

}

}



export const restrictTo = (...roles:string[])=>{
    return (req:Request,res:Response,next:NextFunction)=>{
        if(!req.user?.role){
            throw AppError.unauthorized('Unauthorized access')
        }
        if(!roles.includes(req.user?.role)){
            throw AppError.forbidden('You no have permission to perform this action ')
        }
        next()
    }
    
}
export const authorizePermission = (...permissions:string[]) =>{
    return (req:Request,res:Response,next:NextFunction)=>{
        try {
            
            if(!req.user){
                throw AppError.unauthorized("User not authenticated");
            }
            
            const user_permissions  = req.user.permissions || [];
            
            const has_permissions = permissions.some(p=>user_permissions.includes(p))
            
            if(!has_permissions){
                throw AppError.forbidden('Insufficient permissions');
            }

            next()

        } catch (error:unknown) {
                            if (error instanceof AppError) {
                    next(error);
                } else {
                    logger.error('Permission authorization error:', error);
                    next(AppError.forbidden('Authorization failed'));
                }

        }
    }
}

