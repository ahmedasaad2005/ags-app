import dtv from 'dotenv';


export class AppError extends Error {
    public readonly statusCode : number
    public readonly status ? : string 
    public readonly isOperational ? : boolean
    public readonly code ? :string
    public readonly errors ? : Record<string,any>
    constructor(message:string,statusCode:number,isOperational:boolean = true,code?:string,errors?:Record<string,any>){
       super(message)
       Object.setPrototypeOf(this,AppError.prototype)
       this.statusCode = statusCode
       this.status = this.status?.startsWith('4') ? 'failed' : 'error'
       this.isOperational = true
       this.errors = errors
       Error.captureStackTrace(this,this.constructor)
    }
    static badRequest (message:string,errors?:Record<string,any>):AppError{
        return new AppError(message,400,true,'BAD_REQUEST',errors)
    }
    static unauthorized (message:string):AppError{
        return new AppError(message||'Unauthorized access',401,true,'UNAUTHORIZED')
    }
    static forbidden(message:string):AppError{
        return new AppError(message||'Forbidden access',403,true,'FORBIDDEN')
    }
    static notFound(message:string = 'resource'):AppError{
        return new AppError(`${message} not found!`,404,true,'NOT_FOUND')
    }
    static conflict(message:string,errors?:Record<string,any>):AppError{
        return new AppError(message,409,true,'CONFLICT',errors)
    }
    static unprocessAbleUntity(message:string,errors:Record<string,any>):AppError{
        return new AppError(message,422,true,'UNPROCESS_ABLE_UNTITY',errors)
    }
    static tooManyRequests(message:string):AppError{
        return new AppError(message||'Too many request , please try again later',429,true,'TOO_MANY_REQUESTS')
    }
    static internal(message:string = 'Internal server error'):AppError{
        return new AppError(message,500,false,'INTERNAL_ERROR')
    }
    static serviceUnavailable (message:string = 'Service temporarily unavailable'):AppError{
        return new AppError(message,503,true,'SERVICE_UNAVAILABLE');
    }
    static validationError (message:string,errors?:Record<string,any>):AppError{
        return new AppError(message,422,true,'VALIDATION_ERROR',errors)
    }
    
    toJSON(){
        return {
            success:false,
            status:this.status,
            statusCode:this.statusCode,
            code:this.code,
            message:this.message,
            ...(this.errors,{errors:this.errors}),
            ...(process.env.NODE_ENV === 'production',{stack:this.stack})
        }
    }
}


export const isAppError = (error:unknown):error is AppError => {
    return error instanceof AppError
}