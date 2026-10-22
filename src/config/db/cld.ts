import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '@utils/errors/AppError';
import { Logger } from 'winston';
import path from 'path';
import dtv from 'dotenv';
import multer, { FileFilterCallback } from 'multer';
import { Request,Response } from 'express';
import { logger } from '@utils/utils/logger';


dtv.config();

const {CLOUDINARY_NAME,CLOUDINARY_KEY,CLOUDINARY_SECRET} = process.env;


cloudinary.config({
cloud_name:CLOUDINARY_NAME!,
api_key:CLOUDINARY_KEY!,
api_secret:CLOUDINARY_SECRET!
})

export const fileFilter = (req:Request,file:Express.Multer.File,cb:FileFilterCallback) => {
  const allowedExtention = ['.png','.webp','.jpg','.jpeg','.gif'];
  const allowedMimetype = ['image/png','image/jpg','image/jpeg','image/webp','image/gif'];
  const fileExtend = path.extname(file.originalname).toLowerCase();
  const valideFileMimeType = allowedMimetype.includes(file.mimetype);
  const validFileExtention = allowedExtention.includes(fileExtend)
  if(valideFileMimeType && validFileExtention){
    cb(null,true)
  }else{
    cb(AppError.badRequest('Validation failed for recognizing extend or mime type file'))
    logger.warn(`Validation failed for recognize file type ,Got extend:${fileExtend}`)
  }
}

const storage = multer.memoryStorage();

export const uploadSingle = multer({
    fileFilter,
    storage,
    limits:{
        fileSize:1024 * 1024 * 10,
        files:1
    }
})

export const uploadMultiple = multer({
    fileFilter,
    storage,
    limits:{
        fileSize:1024*1024*5,
        files:5
    }
})
export { cloudinary }