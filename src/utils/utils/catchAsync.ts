import { Request , Response , NextFunction } from "express";
import { AppError } from "@utils/errors/AppError";
import { logger } from "./logger";
import z from "zod";
import jwt from 'jsonwebtoken'
import dtv from 'dotenv'

dtv.config();


export const catchAsync = (fn:(req:Request,res:Response,next:NextFunction)=>Promise<Response>)=>{
    return (req:Request,res:Response,next:NextFunction)=> {
        Promise.resolve(fn(req,res,next)).catch(error=>{
            logger.error('Error caucht by catch async',{
                message:error.message,
                stack:error.stack,
                path:req.path,
                method:req.method,
                ip:req.ip,
                params:req.params,
                body:req.body,
                query:req.query
            })
            if(error instanceof AppError){
                return next(error)
            }
            if(error instanceof z.ZodError && error.name === 'ValidationError' || error.name==='ZodError'){
                const validationMessage = AppError.badRequest(error.message||'Validation Failed')
                return next(validationMessage);
            }
            if( error.code){
                if(error.code === '23505'){
                    const conflictError = AppError.conflict('Duplicate entry found');
                    return next(conflictError);
                }
                if(error.code === '23503'){
                    const badValidationError = AppError.badRequest('Invalid reference');
                    return next(badValidationError);
                }
            }
            if(error instanceof jwt.JsonWebTokenError && error.name === 'JsonWebTokenError'){
                const unauthorizedError = AppError.unauthorized(error.message||'Invalid token')
                return next(unauthorizedError);
            }
            if(error instanceof jwt.TokenExpiredError && error.name === 'TokenExpiredError'){
                const unauthorizedError = AppError.unauthorized(error.message||'Expired has been token')
                return next(unauthorizedError);
            }
            if(error.code === 'ECONNREFUSED' ||error.code === 'ETIMEDOUT'){
                const serviceError = AppError.serviceUnavailable('Server temporarily unavailable')
                return next(serviceError);
            }
            if(error.code === 'RATE_LIMIT'){
                const too_many_request_error = AppError.tooManyRequests('Too many request please try again later')
                return next(too_many_request_error)
            }
            
            const internalServer = process.env.NODE_ENV === 'production' ? AppError.internal('Something went wrong') : error instanceof AppError ? AppError.internal(error.message) : AppError.internal('Internal server error')

            
            return next(internalServer)


        })
    }
}
export const catchAsyncWithHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
    errorHandler?: (error: any, req: Request, res: Response, next: NextFunction) => void
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next))
            .catch((error) => {
                if (errorHandler) {
                    errorHandler(error, req, res, next);
                } else {
                    // Default error handling
                    logger.error('Unhandled error:', {
                        error: error.message,
                        stack: error.stack,
                        path: req.path,
                        method: req.method
                    });
                    next(error);
                }
            });
    };
};
