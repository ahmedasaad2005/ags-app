import { cloudinary } from "config/db/cld";
import { ICloudinaryUploadResult , ICloudinaryDeleteReset , ICloudinaryUploadOptions } from "./cloudinary.types";
import { logger } from "@utils/utils/logger";
import { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import streamifier from 'streamifier';
import { AppError } from "@utils/errors/AppError";


export class CloudinaryService {
    private defaultTransfromation = {
       width:600 ,
       height:600 ,
       crop:'limit',
       quality:'auto'
    }
     async UploadImageByBuffer (
        buffer:Buffer,
        options:ICloudinaryUploadOptions = {}
    ):Promise<ICloudinaryUploadResult>{
            return await new Promise((resolve,reject)=>{
                const UploadOptions = {
                  public_id:options.public_id,
                  folder:options.folder||'uploads',
                  tags:options.tags,
                  transformations:options.transformations||this.defaultTransfromation,
                  eager:options.eager,
                  eager_async:options.eager_async,
                  resource_type:'auto' as const,
                  invalidate:options.invalidate!==undefined,
                  over_write:options.over_write!== undefined
                } as ICloudinaryUploadOptions;
              const upload =  cloudinary.uploader.upload_stream(UploadOptions,(
                    error:UploadApiErrorResponse|undefined,result:UploadApiResponse|undefined
                )=>{
                    if(error){
                        AppError.internal("Failed to upload file using cloudinary buffer");
                        logger.warn(`Failed to upload file using cloudinary buffer ${buffer}`)
                    }if(!result){
                        AppError.internal('File uploaded successfully but cannot get result')
                        logger.warn(`File uploaded successfully but cannot get result`)
                    }else {
                         resolve({
                            public_id:result.public_id,
                            secure_url:result.secure_url,
                            width:result.width,
                            height:result.height,
                            bytes:result.bytes,
                            format:result.format,
                            resource_type:result.resource_type ,
                            created_at:new Date(result.created_at)
                         })
                    }
                })
                streamifier.createReadStream(buffer).pipe(upload)
    })
    }
    async UploadImageByPath (
        path:string,
        uploadOptions:ICloudinaryUploadOptions = {}
    ):Promise<ICloudinaryUploadResult>{
    try {
            const options = {
          public_id:uploadOptions.public_id,
          transformations:uploadOptions.transformations||this.defaultTransfromation,
          folder:uploadOptions.folder,
          eager:uploadOptions.eager,
          eager_async:uploadOptions.eager_async,
          tags:uploadOptions.tags,
          invalidate:uploadOptions.invalidate !== undefined,
          over_write:uploadOptions.over_write !== undefined
        } as ICloudinaryUploadOptions;

        const result = await cloudinary.uploader.upload(path,options);
        return {
            public_id:result.public_id,
            secure_url:result.secure_url,
            width:result.width,
            height:result.height,
            bytes:result.bytes,
            format:result.format,
            resource_type:result.resource_type||'auto' as const,
            created_at:new Date(result.created_at),
            

        }
    } catch (error:unknown) {
        logger.warn(`Failed to upload file using path : ${path}`)
        throw AppError.internal(`Failed to upload file using path : ${path}`)
    }
    }
    async uploadMultiple (
        files:Express.Multer.File[],
        uploadOptions:ICloudinaryUploadOptions = {}
    ):Promise<ICloudinaryUploadResult[]> {
      const promiseAll  = files.map((file)=>(
        this.UploadImageByBuffer(file.buffer,{...uploadOptions,public_id:uploadOptions.public_id?`${uploadOptions.public_id}-${new Date()}`:undefined})
      ))
      return await Promise.all(promiseAll)
    }
    async deleteSingle (
        public_id:string
    ):Promise<ICloudinaryDeleteReset>{
        try {
            const result = await cloudinary.uploader.destroy(public_id,{
            invalidate:true,
            resource_type:'image'
        });
        return {
         public_id:result.public_id,
         success:result.success === 'ok'  ,
         result:result.result 
        };
        } catch (error:unknown) {
          logger.warn(`Failed to delete image from cloudinary using public id`);
          throw AppError.internal('Failed to delete image from cloudinary using public id')
        }
    }
    async deleteMultiple (
        publicIds:string[]
    ):Promise<ICloudinaryDeleteReset[]>{
       const promisesAll =  publicIds.map(publicId=>(
             this.deleteSingle(publicId)
        ))
        return await Promise.all(promisesAll)
    }
}

export const cldserv = new CloudinaryService();