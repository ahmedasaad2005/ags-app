import rateLimit from "express-rate-limit";
import { Request , Response ,NextFunction  } from "express";
import { AppError } from "@utils/errors/AppError";


export const rateLimitConfig = rateLimit({
    legacyHeaders:false,
    standardHeaders:true,
    handler:(req:Request,res:Response,next:NextFunction,options?:any)=>{
        next(AppError.tooManyRequests('Too many attemps please try again later'))
    }
})



export const forgetAttemps = rateLimit({
    max:4,
    windowMs:1000 * 60 * 1,
    message:'Too many email verifications attemps please try again afte minutes',
    ...rateLimitConfig
}) 

export const resetCodeAttemps = rateLimit({
    max:3,
    windowMs:1000*60*2,
    message:'Too many reset code attemps ,please try again later',
    ...rateLimitConfig
})


