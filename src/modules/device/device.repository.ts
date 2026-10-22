import { IDevice, IDeviceCreate, IDeviceInfo } from "./device.type";
import { create_device, find_by_device_id,find_by_finger_print,update_last_used,update_device_info,delete_device,get_user_devices } from "./device.query";
import { logger } from "@utils/utils/logger";
import { AppError } from "@utils/errors/AppError";
import { pool } from "config/db/pg.db";

export class DeviceRepo {
    async create (data:IDeviceCreate):Promise<IDevice>{
    const values  = [
       data.device_id,
       data.user_id,
       data.device_name||null,
       data.device_type||null,
       data.device_model||null,
       data.device_vendor||null,
       data.os_name||null,
       data.os_version||null,
       data.browser_name||null,
       data.browser_version||null,
       data.ip_address||null,
       data.user_agent||null,
       data.finger_print||null,
       data.is_trusted||false
    ] 
        try {
            const result = await pool.query(create_device,values);
            return result.rows[0]
        } catch (error:unknown) {
            logger.error('Failed to create device info',error);
            throw AppError.internal('Failed to create device info')
        }
    }
    async findByDeviceId (device_id:string):Promise<IDevice|null>{
        try {
            const result = await pool.query(find_by_device_id,[device_id]);
            return result.rows[0] 
        } catch (error:unknown) {
            logger.error('Failed to find device by ID',error);
            throw AppError.internal('Failed to find device by ID');
        }
    }
    async findByFingerPrint (finger_print:string):Promise<IDevice|null>{
        try {
            const result = await pool.query(find_by_finger_print,[finger_print]);
            return result.rows[0]
        } catch (error:unknown) {
            logger.error('Failed to retreive device info by fingerprint',error);
            throw AppError.internal('Failed to retreive device info by fingerprint');
        }
    }
    async findOrCreateDeviceInfo (
        user_id:string ,
        device_info:IDeviceInfo
    ):Promise<IDevice>{
        try {
            let device = await this.findByFingerPrint(device_info.finger_print);
            if(device){
                await this.updateLastUsed(device_info.device_id)
                return device
            } 
            device = await this.findByDeviceId(device_info.device_id);
            if(device){
                await this.updateLastUsed(device_info.device_id);
                return device
            }
            const create_device : IDeviceCreate = {
                user_id,
                device_id:device_info.device_id,
                device_name:device_info.device_name,
                device_vendor:device_info.device_vendor,
                device_model:device_info.device_model,
                device_type:device_info.device_type,
                os_name:device_info.os_name,
                os_version:device_info.os_version,
                browser_name:device_info.browser_name,
                browser_version:device_info.browser_version,
                ip_address:device_info.ip_address,
                user_agent:device_info.user_agent,
                finger_print:device_info.finger_print,
                is_trusted:false
            } 
            return await this.create(create_device);
        } catch (error:unknown) {
            logger.error('Failed to find or create device informations',error);
            throw AppError.internal('Failed to find or create device informations');
        }
    }

    async updateLastUsed (device_id:string):Promise<boolean>{
        try {
            const result = await pool.query(update_last_used,[device_id]);
            return result.rowCount ? result.rowCount > 0 : false 
        } catch (error) {
            logger.error('Failed to update last used for device',error);
            throw AppError.internal('Failed to update last used for device');
        }
    }
    
    async updateDeviceInfo (
        device_id:string,
        ip_address:string ,
        user_agent:string
    ):Promise<void>{
        const values = [
            user_agent,
            ip_address,
            device_id
        ]
        try {
             await pool.query(update_device_info,values)
        } catch (error:unknown) {
            logger.error('Failed to update device info',error);
        }
    }
    async getUserDevices (
        user_id:string
    ):Promise<IDevice[]>{
        try {
           const result = await pool.query(get_user_devices,[user_id]) ;
           return result.rows[0]
        } catch (error:unknown) {
            logger.error('Failed to retreive all user devices',error);
            throw AppError.internal('Failed to retreive all user devices');
        }
    }
    async deleteDevice (
        device_id:string
    ):Promise<boolean>{
        try {
            const result = await pool.query(delete_device,[device_id]);
            return result.rowCount ? result.rowCount > 0 :  false
        } catch (error:unknown) {
            logger.error('Failed to delete device',error);
            throw AppError.internal('Failed to delete device')
        }
    }
}
