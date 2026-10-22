import { IResetPasswordCodeRow,IResetPasswordTokenRow } from "@modules/auth/auth.type";
import { pool } from "config/db/pg.db";
import { 
    SET_RESETS_FOR_PASSWORD,
    COUNT_RESET_ACTIVE_FOR_USER,
    DELETE_ALL_EXPIRED,
    FIND_BY_EMAIL_AND_RESETS,
    FIND_RESETS,
    FIND_RESET_ACTIVE_FOR_USER,
    INVALIDATE_ALL_RESETS,
    INVALIDATE_RESETS,
    UPDATING_INTO_NEW_PASSWORD
} from "@modules/auth/user.query";
import { logger } from "@utils/utils/logger";
import { AppError } from "@utils/errors/AppError";


export class ResetPasswordRepo {
  
  
  async create (
    table_name:'code'|'token' ,
    user_id:string ,
    to_hash:string ,
    expires_at:Date ,
    ip_address?:string ,
    user_agent?:string ,
    revoke_old=true 
  ):Promise<boolean>{
    
    const client = await pool.connect()
    try {
        await client.query('BEGIN');
        if(revoke_old){
            await client.query(INVALIDATE_ALL_RESETS(table_name),[user_id]);
        }
        const set_query = SET_RESETS_FOR_PASSWORD(table_name);
        const result = await client.query(set_query,[
            user_id,
            to_hash,
            expires_at,
            ip_address??null,
            user_agent??null
        ]);
        await client.query(' COMMIT ')
        return result.rowCount!  > 0 
    
        } catch (error:unknown) {
        await client.query(' ROLLBACK ')
        logger.error(`Failed to generate reset ${table_name} for password`,error);
        throw AppError.internal(`Failed to generate reset ${table_name} for user`);
        }finally{
        client.release()
    }
  }


  async findValidToken (user_id:string,token_hash:string) : Promise<IResetPasswordTokenRow|null>{
    try {
        const result = await pool.query<IResetPasswordTokenRow>(FIND_RESETS('token'),[user_id,token_hash]);
        return result.rows[0] ?? null 
    } catch (error:unknown) {
        logger.error('Failed to find reset token',error);
        return null
    }
  }
  
  async findValidCode (user_id:string,code_hash:string) :Promise<IResetPasswordCodeRow|null>{
    try {
      const result = await pool.query<IResetPasswordCodeRow>(FIND_BY_EMAIL_AND_RESETS('code'),[user_id,code_hash]);
      return result.rows[0] || null
    } catch (error:unknown) {
      logger.error('Invalid reset code password',error);
      return null;
    }
  }
  async invalidateResetCode (user_id:string,code_id:string):Promise<boolean>{
    try {
      const result = await pool.query(INVALIDATE_RESETS('code'),[user_id,code_id]);
      return result.rowCount ? result.rowCount > 0 : false
    } catch (error:unknown) {
      logger.error('Failed to revoke all reset code invalid',error);
      throw AppError.internal('Failed to revoke all reset code invalid');
    };
  } 
  async invalidateResetToken (user_id:string,token_id:string):Promise<boolean>{
    try {
      const result = await pool.query(INVALIDATE_RESETS('token'),[user_id,token_id]);
      return result.rowCount ? result.rowCount > 0 : false
    } catch (error:unknown) {
      logger.error('Invalid reset token verification',error);
      throw AppError.internal('Invalid reset token verification');
    }
  }
  async invalidateAllResetToken (user_id:string):Promise<number>{
    try {
      const result = await pool.query(INVALIDATE_ALL_RESETS('token'),[user_id]);
      return result.rowCount ? result.rowCount : 0  
    } catch (error:unknown) {
      logger.error('Failed to invalidate all reset tokens',error);
      throw AppError.internal("Failed to invalidate all reset tokens");
    }
  }
  async countResetToken (user_id:string):Promise<number>{
    try {
      const result = await pool.query(COUNT_RESET_ACTIVE_FOR_USER('token'),[user_id]);
      return result.rows[0].total_active || 0
    } catch (error:unknown) {
      logger.error('Failed count all active token',error);
      throw AppError.internal('Failed count all active token');
    }
  }
  async countResetCode (user_id:string):Promise<number>{
    try {
      const result = await pool.query(COUNT_RESET_ACTIVE_FOR_USER('code'),[user_id]);
      return result.rows? result.rows[0].total_active : 0
    } catch (error:unknown) {
      logger.error('Failed count all active code',error);
      throw AppError.internal('Failed count all active code');
    }
  }

  async deleteAllExpiredCode ():Promise<number>{
    try {
      const result =await pool.query(DELETE_ALL_EXPIRED('code'));
      return result.rowCount ? result.rowCount : 0 
    } catch (error:unknown) {
      logger.error('Failed to delete all expired code',error);
      throw AppError.internal('Failed to delete all expired code')
    }
  }
}


