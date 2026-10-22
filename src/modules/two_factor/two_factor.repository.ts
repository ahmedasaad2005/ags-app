import { pool } from "config/db/pg.db";
import { 
    INSERT_2FA_CODE,
    CLEAN_UP_SMS,
    COUNT_RESENT_SMS,
    DELETE_ALL_EXPIRED_CODES,
    DELETE_EXPIRED_TRUSTED_DEVICE,
    DELETE_TRUSTED_DEVICE,
    DISABLE_2FA,
    ENABLE_2FA,
    FIND_ACTIVE_CODE,
    FIND_TRUSTED_DEVICE,
    GET_2FA_STATUS,
    INCREMENT_2FA_ATTEMPS,
    INSERT_SMS_LOG,
    INSERT_TRUSTED_DEVICE,
    INVALIDATE_2FA_OLD_CODES,
    MARK_2FA_USED,
    TOUCH_TRUSTED_DEVICE
 } from "./two_factor.query";
 import { 
    TwoFactorPurpose,
    ITrustedDevice,
    ITwoFactorChallenge,
    ITwoFactorCode
 } from "./two_factor.type";
import { logger } from "@utils/utils/logger";
import { AppError } from "@utils/errors/AppError";
import { REFUSED } from "dns";


 export class TwoFactorRepo { 
    async createCode (
        user_id:string ,
        purpose:string , 
        code_hash:string,
        phone_number:string ,
        expires_at:Date ,
        max_attemps:number = 5,
        ip_address?:string,
        user_agent?:string,
    ):Promise<boolean>{
        const client = await pool.connect()
        try {
            await client.query('BEGIN ');
            const values = [
                user_id,
                purpose,
                code_hash,
                expires_at,
                ip_address??null,
                user_agent??null, 
                phone_number,
                max_attemps 
            ]
            const result  = await client.query(INSERT_2FA_CODE,values);
            await client.query(' COMMIT')
            return result.rowCount! > 0 
        } catch (error:unknown) {
            logger.error('Failed to create or store 2fa code into db',error);
            throw AppError.internal('Failed to store 2fa code into db');
        }finally{
            client.release();
        }
    }

    async findValidCode (user_id:string,purpose:ITwoFactorChallenge):Promise<ITwoFactorCode|null>{
        try {
            const result = await pool.query(FIND_ACTIVE_CODE,[user_id,purpose]);
            return result.rows[0] ?? null;
        } catch (error:unknown) {
            logger.error('Failed to retreive valid or active',error);
            throw AppError.internal('Failed to retreive valid or active');
        }
    }
    async incrementAttemps (code_id:string):Promise<{attemps:number,max_attemps:number}>{
        try {
            const result = await pool.query(INCREMENT_2FA_ATTEMPS,[code_id]);
            return {
                attemps:result.rows[0].attemps ,
                max_attemps:result.rows[0].max_attemps
            }
        } catch (error:unknown) {
            logger.error('Failed to increment code attemps',error);
            return {attemps:0,max_attemps:5}
        }
    }
    async markUsed (code_id:string):Promise<boolean>{
        try {
            const result = await pool.query(MARK_2FA_USED,[code_id]);
            return result.rowCount ?result.rowCount > 0  : false 
        } catch (error:unknown) {
            logger.error('Failed to mark code as used',error);
            throw AppError.internal('Failed to mark code as used');
        }
    }
    async invalidateOld2FACode (
        user_id:string,
        purpose:string
    ):Promise<number>{
        try {
            const result = await pool.query(INVALIDATE_2FA_OLD_CODES,[user_id,purpose]);
            return result.rowCount ?? 0 
        } catch (error:unknown) {
            logger.error('Failed to invalidate or revoke 2FA code',error);
            throw AppError.internal('Failed to invalidate or revoke 2FA code');
        }
    }
    
    async deleteExpired ():Promise<number>{
        try {
            const result = await pool.query(DELETE_ALL_EXPIRED_CODES);
            return result.rowCount ?? 0 
        } catch (error:unknown) {
            logger.error('Failed to delete expired 2FA code',error);
            throw AppError.internal('Failed to delete expired 2FA code')
        }
    }

    async trustedDevice (
        user_id:string,
        device_id:string,
        token_hash:string,
        expires_at:string,
        device_name?:string,
        ip_address?:string,
        user_agent?:string,
    ):Promise<boolean>{
        try {
            const result = await pool.query(INSERT_TRUSTED_DEVICE,[
                user_id,
                device_id,
                device_name,
                token_hash,
                expires_at,
                ip_address,
                user_agent
            ]);
            return result.rowCount ? result.rowCount > 0 : false; 

        } catch (error:unknown) {
         logger.error('Failed to create a new trusted device',error);
         throw AppError.internal('Failed to create a new trusted device');
        }
    }
    async findTrustedDevice (token_hash:string):Promise<ITrustedDevice|null>{
        try {
            const result = await pool.query(FIND_TRUSTED_DEVICE,[token_hash]);
            return result.rows[0] || null
        } catch (error:unknown) {
            logger.error('Failed to retreive trusted device',error);
            throw AppError.internal('Failed to retreive trusted device')
        }
    }
    async touchTrustedDevice (token_hash:string):Promise<boolean>{
        try {
            const result = await pool.query(TOUCH_TRUSTED_DEVICE,[token_hash]);
            return result.rowCount ? result.rowCount > 0 : false;
        } catch (error:unknown) {
            logger.error('Failed to touch or update trusted device',error);
            throw AppError.internal('Failed to touch or update trusted device');
        }
    }
    async deleteExpiredDevice (user_id:string,device_id:string):Promise<boolean>{
        try {
            const result = await pool.query(DELETE_TRUSTED_DEVICE,[user_id,device_id]);
            return result.rowCount ? result.rowCount > 0 : false
        } catch (error:unknown) {
            logger.error('Failed to delete expired trusted device',error);
            throw AppError.internal('Failed to delete expired trusted device')
        }
    }

    async deleteAllExpiredDevice ():Promise<number>{
        try {
            const result = await pool.query(DELETE_EXPIRED_TRUSTED_DEVICE);
            return result.rowCount ?? 0
        } catch (error:unknown) {
            logger.error('Failed to cleanup trusted devices', error);
            return 0;
        }
    }

    async get2FAStatus (user_id:string):Promise<{
        id:string ,
        enabled:boolean , 
        methods:string ,
        phone_number:string
    }|null>{
        try {
            const result = await pool.query(GET_2FA_STATUS,[user_id]);
            return {
                id:result.rows[0].id,
                enabled:result.rows[0].two_factor_enabled,
                methods:result.rows[0].two_factor_methods,
                phone_number:result.rows[0].two_factor_phone
            }
        } catch (error:unknown) {
            logger.error('Failed to get 2FA code status from user');
            throw AppError.internal('Failed to get 2FA code status from user');
        }
    }

    async enable2FACode (
        user_id:string ,
        methods:string ,
        phone_number:string , 
    ):Promise<{
        id:string 
        two_factor_enabled:boolean,
        two_factor_methods:string , 
        two_factor_phone:string
    }>{
        try {
            const result = await pool.query(ENABLE_2FA,[user_id,methods,phone_number]);
            return {
                id:result.rows[0].id,
                two_factor_enabled:result.rows[0].two_factor_enabled,
                two_factor_methods:result.rows[0].two_factor_methods,
                two_factor_phone:result.rows[0].two_factor_phone,
            }
        } catch (error:unknown) {
            logger.error("Failed to enable 2FA code",error);
            throw AppError.internal('Failed to enable 2FA code');
        }
    }
    async disable2FACode (user_id:string):Promise<boolean>{
        try {
            const result = await pool.query(DISABLE_2FA,[user_id]);
            return result.rowCount ? result.rowCount>0: false;
        } catch (error:unknown) {
            logger.error('Failed to disable 2FA code from user',error);
            throw AppError.internal('Failed to disable 2FA code from user')
        }
    }
    async logSmsSent (user_id:string,phone_number:string):Promise<void>{
        try {
             await pool.query(INSERT_SMS_LOG,[phone_number,user_id ?? null]);
        } catch (error:unknown) {
            logger.error("Failed to log sms for phone number",error);
            throw AppError.internal('Failed to log sms for phone number')
        }
    }

    async countRecentSms(phone: string): Promise<number> {
        try {
            const result = await pool.query(COUNT_RESENT_SMS, [phone]);
            return result.rows[0]?.count ?? 0;
        } catch (error: unknown) {
            logger.error('Failed to count recent SMS', error);
            return 0;
        }
    }


 };
