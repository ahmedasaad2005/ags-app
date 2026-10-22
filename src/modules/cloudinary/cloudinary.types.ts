


export interface ICloudinaryUploadOptions {
    public_id?:string
    folder?:string 
    transformations?:{
        width?:number //
        height?:number //
        quality?:string|'auto' 
        format?:'.jpg'|'.png'|'.jpeg'|'.webp'|'.gif'
        crop?:'limit'|'fill'|'thumb'|'scale'
    }
    eager?:any[]
    eager_async?:boolean
    over_write?:boolean
    invalidate?:boolean 
    tags?:string[]
}

export interface ICloudinaryUploadResult {
    public_id:string 
    secure_url:string
    height?:number 
    width?:number 
    format?:string
    bytes?:number 
    resource_type?:string
    created_at?:Date 
}

export interface ICloudinaryDeleteReset {
    result?:any
    success:boolean
    public_id:string 
}

