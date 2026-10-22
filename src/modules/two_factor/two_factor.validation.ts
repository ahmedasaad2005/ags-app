import z from 'zod';



export const TwoFactorValidation = {
    user_id:z.object({
        user_id:z
        .uuid({message:'Invalid user id format for uuid'})
        .min(1,'User id is required')
    }),
    phone:z.object({
        phone_number:z
        .string({message:'Phone number must be string type'})
        .regex(/^\+?[1-9]\d{9,14}$/,'Invalid phone number format (E.164)')
        .min(1,'Phone number is required')
    }),
    code:z.object({
        code:z
        .string({message:'2FA Code must be string'})
        .min(1,'2FA code is required')
        .length(6,'Code must be 6 digits')
        .regex(/^\d+$/)
    })
}