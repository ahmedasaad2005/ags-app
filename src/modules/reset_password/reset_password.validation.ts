import { currentLoad } from 'systeminformation';
import z from 'zod';


const validate_pass = z
.string()
.min(8,"Password must contain at least 8 characters letters")
.max(1000,"password is too much")
.regex(/[A-Z]/,'Password must includes at least one uppper case')
.regex(/[a-z]/,'Password must includes at least one lower case')
.regex(/[0-9]/,'Password must includes at least one number')
.regex(/[!^&*%$#@]/,'Password must includes at least one special characters')

export const ResetValidation = {
    user_id:z.object({
       user_id:z.uuid({message:'Invalid id UUID format'}).min(0,'ID field is required')
    }),
    check_email:z.object({
        email:z.email({message:'Invalid email format'})
        .min(1,'Email field is required')
        .max(500,'Email is too much')
    }),
    check_reset_code:z.object({
        email:z.email({message:'Invalid email format'})
        .min(1,'Email field is required')
        .max(500,'Email is too much'),
        reset_code:z
        .number({message:'Reset code must be number'})
        .min(100000,'Reset code must starts from 100000 or 6 digits')
        .max(999999,'Reset code cannot exceed 999999 or 6 digits')
        .transform(val=>val.toString())
    }),
    check_reset_token:z.object({
        email:z.email({message:'Invalid email format'})
        .min(1,'Email field is required')
        .max(500,'Email is too much'),
       
        token:z.string()
        .min(1,'Token is required')
    }),
    token:z.object({
        token:z.string()
        .min(1,'Token is required')
    }),
    reset_costume_password:z.object({
        email:z.email({message:'Invalid email format'})
        .min(1,'Email field is required')
        .max(500,'Email is too much'),
        new_password:validate_pass,
        
        confirm_password:z
        .string()
        .min(1,"Confirm password is required")
    }).refine(val=> {
        return val.new_password === val.confirm_password
    } ,{
        message:'Confirm password must match with new password',
        path:['confirm_password']
    }),
    reset_password_code:z.object({
        email:z.email({message:'Invalid email format'})
        .min(1,'Email field is required')
        .max(500,'Email is too much'),
        reset_code:z
        .number({message:'Reset code must be number'})
        .min(100000,'Reset code must starts from 100000 or 6 digits')
        .max(999999,'Reset code cannot exceed 999999 or 6 digits')
        .transform(val=>val.toString()),
        new_password:validate_pass,
        confirm_password:z
        .string()
        .min(1,"Confirm password is required")
    }).refine(val=> {
        return val.new_password === val.confirm_password
    } ,{
        message:'Confirm password must match with new password',
        path:['confirm_password']
    }),
}


export type ZVerifyEmail = z.infer<typeof ResetValidation.check_email>;
export type ZVerifyResetCode = z.infer<typeof ResetValidation.check_reset_code>;
export type ZVerifyResetToken = z.infer<typeof ResetValidation.check_reset_token>;
export type ZResetPassword = z.infer<typeof ResetValidation.reset_password_code>;
export type ZResetCostumePassword = z.infer<typeof ResetValidation.reset_costume_password>;