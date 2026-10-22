import { pool } from "config/db/pg.db";
import { logger } from "@utils/utils/logger";
import { AppError } from "@utils/errors/AppError";
import { create_session_q,
    GET_USER_ACTIVE_SESSIONS,
    delete_expired_session,
    find_by_session_id,
    find_session_with_device,
    is_valid_session_id,
    revoke_all_user_sessions,
    revoke_by_session_id,
    revoke_device_sessions,
    update_activity, 
    update_refresh_token
} from "./session.query";
import { ISession, ISessionCreate } from "@modules/device/device.type";





export class SessionRepo {
    async create(data:ISessionCreate):Promise<ISession>{
        const values = [
            data.user_id,
            data.device_id,
            data.session_id,
            data.refresh_token_hash,
            true,
            data.expires_at
        ];
        try {
          const result = await pool.query(create_session_q,values);
          return result.rows[0]  
        } catch (error) {
            logger.error('Failed to create a session',error);
            throw AppError.internal('Failed to create a session')
        }
    }
    async findSessionBySessionId (session_id:string):Promise<ISession|null>{
        try {
            const result = await pool.query(find_by_session_id,[session_id]);
            return result.rows[0]||null
        } catch (error:unknown) {
            logger.error('Failed to get session by ID',error);
            throw AppError.internal('Failed to get session by ID');      
        }
    } 
    async findSessionByDevice (session_id:string):Promise<any|null>{
        try {
            const result = await pool.query(find_session_with_device,[session_id])
            return result.rows[0] ||null
        } catch (error:unknown) {
            logger.error('Failed to retreive session with device by session ID',error);
            throw AppError.internal('Failed to retreive session with device by session ID')
        }
    }

    async updateSessionActivity (session_id:string):Promise<void>{
        try {
            await pool.query(update_activity,[session_id]) 
        } catch (error:unknown) {
            logger.error('Failed to update session activity',error);
            throw AppError.internal('Failed to update session activity')
        }
    }
    async revoke (session_id:string):Promise<boolean>{
        try {
            const result = await pool.query(revoke_by_session_id,[session_id]);
            return result.rowCount ? result.rowCount > 0 : false;
        } catch (error:unknown) {
            logger.error("Failed to revoke session by session ID");
            throw AppError.internal('Failed to revoke session by session ID')
        }
    }
    async revokeAllSessionsByUserId (user_id:string):Promise<number>{
        try {
            const result  = await pool.query(revoke_all_user_sessions,[user_id]);
            return result.rowCount || 0
        } catch (error:unknown) {
            logger.error('Failed to revoke all sessions by user ID',error);
            throw AppError.internal('Failed to revoke all sessions by user ID')
        }
    }
    async revokeAllSessionsDevice (device_id:string):Promise<number>{
        try {
            const result = await pool.query(revoke_device_sessions,[device_id]);
            return result.rowCount || 0 
        } catch (error:unknown) {
            logger.error('Failed to revoke all device sessions',error);
            throw AppError.internal('Failed to revoke all device sessions')
        }
    }
    async getUserActiveSessions (user_id:string):Promise<ISession[]>{
        try {
            const result = await pool.query(GET_USER_ACTIVE_SESSIONS,[user_id]);
            return result.rows 
        } catch (error:unknown) {
            logger.error('Failed to get active sessions by id');
            throw AppError.internal('Failed to get active sessions by id')
        }
    }

    async updateRefreshToken (session_id:string,token_hash:string):Promise<boolean>{
        const values = [
            session_id,
            token_hash
        ]
        try {
            const result = await pool.query(update_refresh_token,values);
            return result.rowCount ? result.rowCount > 0: false
        } catch (error:unknown) {
            logger.error('Failed to update refresh token by session ID',error);
            throw AppError.internal('Failed to update refresh token by session ID')
        }
    }
    async deleteExpireSessions ():Promise<number>{
        try {
            const result = await pool.query(delete_expired_session);
            return result.rowCount || 0 
        } catch (error:unknown) {
            logger.error('Failed to delete expired sessions',error);
            throw AppError.internal('Failed to delete expired sessions');
        }
    }
    async isValid (session_id:string):Promise<boolean>{
        try {
            const result = await pool.query(is_valid_session_id,[session_id]);
            return result.rowCount? result.rowCount > 0 : false;
        } catch (error:unknown) {
            logger.error('Failed to check session validity',error);
            throw AppError.internal("Failed to check session validity")
        }
    }
}