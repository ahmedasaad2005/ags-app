import z from 'zod'
import { AppError } from '@utils/errors/AppError'




export const validateOrThrow = <T> (schema:z.ZodSchema<T>,data?:unknown):T=>{
    try {
        return schema.parse(data)
    } catch (error:unknown) {
        if(error instanceof z.ZodError){
            const errors = error.issues.reduce((acc,err)=>{
                const path = err.path.join(',');
                acc[path] = err.message
                return acc
            },{} as Record<string,string>
        );
        throw AppError.badRequest(`Validation failed ${error.message} ${JSON.stringify(errors)} ${errors}`)
        }
        throw error
    }

}

export const validateUuid = z.object({
    id:z.uuid({message:'Id must be correct format uuid'}).min(0,'Id is required')
})

export const pagination = z.object({
    page:z.string({message:'Page must be string'}).min(0,'Page query is required').optional().default('1').transform(Number),
    limit:z.string({message:'Limit must be string'}).min(0,'Limit query is required').optional().default('10').transform(Number)
});

export const regexPassword = z.string({message:"Password must be string type"})
.min(8,'Password must contain at least 8 characters includes special symbols , number , uppercase and one lowercase')
.regex(/[A-Z]/,'Password must contain at least one uppercase')
.regex(/[a-z]/,'Password must contain at least one lowercase')
.regex(/[0-9]/,'Password must contain at least one number')
.regex(/[@$!%*?&]/,'Password must contain at least one special characters')
.max(1000,'Password is too much');

