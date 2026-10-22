import { Response,Request } from "express";
import { AppError } from "@utils/errors/AppError";
import dtv from 'dotenv';


dtv.config();



export const successToResponse = (res:Response,message:string,statusCode:number,data?:any):Response => {
  return res.status(statusCode).json({
    success:true,
    message:process.env.NODE_ENV! === 'development' ? message  : 'Operation success!' ,
    timestamps:new Date().toISOString()
  })
}

export const failedToResponse = (res:Response,error:any):Response=>{
  if(error instanceof AppError){
    return res.status(error.statusCode).json({
        success:false,
        message:error.message,
        errors:error.errors,
        timestamps:new Date().toISOString()
    })
  }
  if(error instanceof Error){
    return res.status(500).json({
        success:false,
        message:error.message||'Internal server error',
        timeStamps:new Date().toISOString()
    })
  }
  return res.status(500).json({
        success:false,
        message:'Internal server error',
        timeStamps:new Date().toISOString()
    })
}


export const validationErrorToResponse = (res:Response,errors:Record<string,string>):Response => {
    return res.status(400).json({
        success:false,
        message:"Validation failed",
        errors:errors,
        timeStamps:new Date().toISOString()
    })
}