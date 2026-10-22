import { User_Role } from "@modules/auth/auth.type"

declare global {
    namespace Express {
        interface Request {
            user?:{
                id:string 
                email:string  
                role:User_Role
                permissions:string[]
                session_id:string
                file?:Multer.File
                files?:Multer.File[]
            }
            
        }
    }
}