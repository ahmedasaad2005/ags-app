import z from "zod";
import { User_Role } from "./auth.type";


// Password validation helper  

const password_validation = z
.string({message:'Password must be string'})
.min(8,'Password must contains at least 8 characters length')
.max(1000,'Password must be less than 1000 characters')
.regex(/[A-Z]/,'Password must contain at least one upper case letter')
.regex(/[a-z]/,'Password must contain at least one lower case letter')
.regex(/[0-9]/,'Password must contain at least one number')
.regex(/[@#$%^&*]/,'Password must contain at least one special characters')



export const authValidation = {
    register:z.object({
        username:z
        .string()
        .min(1,'User name is required')
        .max(100,'User name cannot exceed 100 characters letter')
        .regex(/^[a-zA-Z0-9_]+$/,'User name can only involve letters , numbers , special characters'),
        email:z
        .email({message:"Email must be correct format"})
        .min(0,"Email must be required")
        .max(255,'Email is too long length')
        .trim()
        .transform(val=>val.toLowerCase()),
        password_hash:password_validation,
        first_name:z
        .string()
        .max(50,'First name cannot exceed 50 letters')
        .optional(),
        last_name:z
        .string()
        .max(50,'Last name cannot exceed 50 letters')
        .optional(),
        avatar:z
        .any()
        .optional(),
        phone_number:z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/,'Invalid phone number format')
        .optional(),
        role:z
        .nativeEnum(User_Role)
        .default(User_Role.USER)
        

    }),
    login:z.object({
        email:z
        .email({message:"Email must be correct format"})
        .min(0,'Email must be required')
        .max(255,'Email is too much long')
        .trim(),
        password_hash:password_validation,
    }),
    logout:z.object({
        refresh_token:z
        .string()
        .min(1,'refresh token is required')
    }),
    user_id:z.object({
    id:z.uuid({message:'Invalid user id format'}).min(1,'User id is required')
  }),
  token_id:z.object({
     id:z.uuid({message:'Invalid token id format'}).min(1,'Token id is required')
  }),
  reset_password:z.object({
    email:z.email({message:"Invalid email format"})
    .min(0,'Id user is required'),
    new_password:password_validation,
    confirm_password:z
    .string({message:"Confirm Password must be string"})
    .min(0,'Confirm password is required')
    .max(200,'Confirm password is too much')
  }).refine(val=>val.new_password === val.confirm_password,{
    message:'New password must match with confirm password',
    path:['confirm_password']
  }),
    refresh:z.object({
        refresh_token:z
        .string()
        .min(1,'refresh token is required')
    }),
    change_password:z.object({
        current_password:z.string()
        .min(1,'Current password is required'),
        new_password:password_validation,
        confirm_password:z
        .string()
        .min(1,'Confirm password is required ')
    }).refine(val=> val.current_password !== val.new_password,{
        message:'Current password should not match with new password',
        path:['new_password']
    }).refine((val)=>{
        return val.confirm_password === val.new_password
    },{
        message:'Confirm password should match with new password',
        path:['confirm_password']
    }),
    forget_password:z.object({
        email:z
        .email('Email must be correct format')
        .min(0,'Email must be required')
    }),
    verify_code:z.object({
        email:z
        .email({message:"Invalid email format"})
        .min(0,"Email field is required"),
        reset_code:z.number({
            message:'Reset code must be a number'
        }).min(100000,'Reset code must be at least 6 nemuric length')
        .max(999999,'Reset code must be at maximal 6 nemuric')
        .transform(val=>val.toString())
    }),
    reset_password_token:z.object({
        token:z
        .string()
        .min(1,'Token must be required'),
        new_password:password_validation,
        confirm_password:z
        .string()
        .min(1,'Confirm password field is required')
    }).refine((val)=>{
        return val.new_password === val.confirm_password
    },{
        message:'Confirm password supposedily match with new password',
        path:['confirm_password']
    })

}

export type ZRegister = z.infer<typeof authValidation.register>;
export type ZLogin = z.infer<typeof authValidation.login>;
export type ZLogout = z.infer<typeof authValidation.logout>;
export type ZChangePassword = z.infer<typeof authValidation.change_password>;
export type ZVerifyResetCode = z.infer<typeof authValidation.verify_code>;
export type ZResetPasswordByToken = z.infer<typeof authValidation.reset_password_token>;
export type ZResetPasswordByCode = z.infer<typeof authValidation.reset_password>
export type ZRefresh = z.infer<typeof authValidation.refresh>
export type ZForgetPassword = z.infer<typeof authValidation.forget_password>
export type ZUserId = z.infer<typeof authValidation.user_id>;
export type ZTokenId = z.infer<typeof authValidation.token_id>;
