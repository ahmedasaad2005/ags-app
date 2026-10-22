import multer,{FileFilterCallback} from "multer";
import path from "path";
import { AppError } from "@utils/errors/AppError";
import dtv from 'dotenv'
import { Request } from "express";


dtv.config();


const ALLOWED_IMAGE_TYPE = ['image/jpg','image/jpeg','image/png','image/webp','image/gif'];
const ALLOWED_DOCUMENT_TYPE = ['application/pdf','application/msword']; 


export const ALLOWED_MIME_TYPE = [
    ...ALLOWED_IMAGE_TYPE,
    ...ALLOWED_DOCUMENT_TYPE
];

export const getFileType = (mimeType:string):'image'|'document' => {
    if(mimeType.startsWith('image/')) return 'image'
    return 'document'
}

export const getMaxFileSize = (mimeType:string):number=> {
    if(mimeType.startsWith('image/')) return 1024 * 1024 * 5;
    return 1024 * 1024 * 40
}

export const createFileFilter = (allowed_mime_type: string[] = ALLOWED_MIME_TYPE) => {
    return (req:Request,file:Express.Multer.File,cb:FileFilterCallback)=>{
        if(!file||!file.originalname){
            throw AppError.badRequest('Invalid file object')
        }
        const correctExtention =  ['.png' , '.jpg' , '.jpeg','.webp','.gif','.pdf','.msword']
        const fileExtention = path.extname(file.originalname).toLowerCase();
        const isValidType = allowed_mime_type.includes(file.mimetype);
        const isValidExtention =  correctExtention.includes(fileExtention);
        if(isValidExtention||isValidType){
          cb(null,true)
        }else{
          cb(AppError.badRequest(`File type not allowed , Got ${file.mimetype}`))
        }
    }
}

export const uploadSingle = (field_name:string) => {
    const storage = multer.memoryStorage();
    const fileFilter = createFileFilter();
    return multer({
        fileFilter,
        storage,
        limits:{
            fileSize:1024* 1024* 40
        }
    })
}

export const uploadMany = (field_name:string,maxCount:number)=>{
    const fileFilter = createFileFilter();
    const storage = multer.memoryStorage();
    return multer({
        fileFilter,
        storage,
        limits:{
            fileSize:1024*1024*20,
            files:maxCount||10
        }
    })
}