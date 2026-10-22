import { logger } from "@utils/utils/logger";
import { AppError } from "@utils/errors/AppError";
import { 
    IAccessTokenPayload,
    ICreateRefreshToken,
    ITokenSchema,
    IUpdateRefreshToken,
    ITokenPayload } from "@modules/auth/auth.type";
import { pool } from "config/db/pg.db";


export class RefreshRepository {
    async createRefresh (data:ICreateRefreshToken):Promise<ITokenSchema>{
        try {
        const query = `
        INSERT INTO refresh_token (
        user_id,
        token_hash,
        token_expires,
        revoked,
        token_version,
        session_id,
        created_at,
        updated_at
        )
        VALUES (
        $1, $2 , $3 , $4 , $5 , $6,
        CURRENT_TIMESTAMP ,
        CURRENT_TIMESTAMP
        )
        RETURNING 
        id , 
        user_id ,
        token_hash ,
        token_expires ,
        revoked ,
        token_version ,
        session_id , 
        created_at ,
        updated_at
        `;

        const values = [
            data.user_id,
            data.refresh_token_hash,
            data.refresh_token_expiry,
            false,
            data.token_version|| 1,
            data.session_id
            
        ];

        const result = await pool.query(query,values);
        return result.rows[0]
        } catch (error) {
            logger.error('Failed to create refresh token')
            throw AppError.internal("Failed to create refresh token")
        }
    }
    async findByTokenHash (token_hash:string):Promise<ITokenSchema|null>{
        const query = `
        SELECT
         rt.id,
         rt.user_id,
         rt.token_hash,
         rt.token_expires,
         rt.revoked,
         rt.token_version,
         rt.session_id ,
         rt.created_at ,
         rt.updated_at ,
         u.username ,
         u.email ,
         u.role ,
         u.status
         FROM refresh_token rt
         JOIN auth u ON rt.user_id = u.id
         WHERE rt.token_hash = $1
        `;
        try {
            const result = await pool.query(query,[token_hash]);
            return result.rows[0]||null
        } catch (error:unknown) {
            logger.error("Failed to get refresh token info by token hash",error);
            throw AppError.internal('Failed to get refresh token info by token hash')
        }
    }
    async findTokenByUserId (user_id:string):Promise<ITokenSchema|null>{
        const query = `
        SELECT 
        id,
        user_id,
        token_hash,
        token_expires,
        revoked,
        token_version,
        session_id ,
        created_at 
        FROM refresh_token 
        WHERE user_id = $1
        AND revoked = FALSE 
        AND token_expires > CURRENT_TIMESTAMP
        ORDER BY created_at DESC
        LIMIT 1
        `;
        try {
          const result = await pool.query(query,[user_id]);
          return result.rows[0]||null
        } catch (error:unknown) {
            logger.error('Failed to get refresh token by user id',error);
            throw AppError.internal('Failed to get refresh token by user id')
        }
    }

    async findAllByUserId (user_id:string):Promise<ITokenSchema[]>{
       const query = `
       SELECT
       id,
       user_id,
       token_hash,
       token_expires,
       revoked,
       token_version,
       session_id,
       created_at
       FROM refresh_token 
       WHERE user_id = $1 
       AND revoked = FALSE 
       AND token_expires > CURRENT_TIMESTAMP
       ORDER BY created_at DESC
       `
        try {
        const result = await pool.query(query,[user_id]);
        return result.rows
       } catch (error:unknown) {
        logger.error('Failed to get all refresh tokens thats regards to the user id',error)
        throw AppError.internal('Failed to get all refresh tokens thats regards to the user id')   
    }
    }
    async updateRefreshToken (id:string , data:IUpdateRefreshToken):Promise<ITokenSchema|null>{
            const updates : string[] = [];
            const values:any[] =  [];
            let paramCounter = 1;
            if(data.revoked !== undefined){
                updates.push(` revoked = $${paramCounter} `);
                values.push(data.revoked);
                paramCounter ++;
            }
            if(data.refresh_token_hash !== undefined){
                updates.push(`token_hash = $${paramCounter}`);
                values.push(data.refresh_token_hash);
                paramCounter ++;
            }
            if(data.session_id !== undefined){
                updates.push(` session_id = $${paramCounter}`);
                values.push(data.session_id);
                paramCounter ++;
            }
            if(data.updated_at !== undefined){
                updates.push(` updated_at = $${paramCounter} `);
                values.push(data.updated_at);
                paramCounter ++;
            }
            
            if(updates.length === 0 ){
                throw AppError.badRequest('No fields are provided to updates')
            }
 
            updates.push(` updated_at = CURRENT_TIMESTAMP `);
             
             
            const query = `
            UPDATE refresh_token
            SET ${updates.join(',')}
            WHERE id = $${paramCounter}
            RETURNING 
            id,
            user_id,
            token_hash,
            token_expires,
            revoked,
            token_version,
            session_id ,
            created_at
            `;
            values.push(id);
        
        try{
            const result = await pool.query(query,values);
            return result.rows[0]||null
        } catch (error:unknown) {
            logger.error('Failed to update refresh token token :',error);
            throw AppError.internal('Failed to update refresh token ')
        }
    }
    async revoke ( id:string ):Promise<boolean>{
        
        const query = `
        UPDATE refresh_token 
        SET revoked = TRUE , updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
        `
        try {
         const result = await   pool.query(query,[id]);
         return result.rowCount ? result.rowCount > 0 : false
        } catch (error:unknown) {
            logger.error('Failed to revoke refresh token',error);
            throw AppError.internal('Failed to revoke refresh token')
        }
    }
    async revokeAllByUserId (user_id:string):Promise<number>{
        const query = `
        UPDATE refresh_token 
        SET revoked = TRUE , updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND revoked = FALSE
        RETURNING id 
        `
        try {
            const result = await pool.query(query,[user_id])
            return result.rowCount || 0
        } catch (error:unknown) {
            logger.error('Failed to revoke all refresh token that regarded to user id :',error);
            throw AppError.internal('Failed to revoke all refresh token that regarded to user id')
        }
    }

    async deleteRevokedOrExpiryToken():Promise<number>{
        const query = `
        DELETE 
        FROM refresh_token
        WHERE token_expire < CURRENT_TIMESTAMP
        OR revoked = TRUE
        `;
        try {
            const result = await pool.query(query);
            return result.rowCount || 0
        } catch (error:unknown) {
            logger.error('Failed to revoke all expired or revoked refresh token',error);
            throw AppError.internal('Failed to revoke all expired or revoked refresh token')
        }

    }

    async deleteTokensByUserId (user_id:string):Promise<number>{
        const query = `
        DELETE FROM refresh_token 
        WHERE user_id = $1
        `
        try {
            const result = await pool.query(query,[user_id]);
            return result.rowCount ? result.rowCount : 0
        } catch (error:unknown) {
            logger.error('Failed to delete all tokens from user',error);
            throw AppError.internal('Failed to delete all tokens from user');
        }
    }
    async delete (token_id:string):Promise<boolean>{
        const query = `
        DELETE FROM refresh_token 
        WHERE id = $1
        `;
        try {
            const result = await pool.query(query,[token_id]);
            return result.rowCount ? result.rowCount > 0 : false;
        } catch (error:unknown) {
            logger.error('Failed to delete a specific token',error);
            return false
        }
    }
    async isValidToken (token_hash:string):Promise<boolean>{
        const query = `
        SELECT id 
        FROM refresh_token 
        WHERE token_hash = $1
        AND revoked = FALSE
        AND token_expires > CURRENT_TIMESTAMP
        `
        try {
            const result = await pool.query(query,[token_hash]);
            return result.rowCount ? result.rowCount > 0 : false  
        } catch (error:unknown) {
            logger.error('Invalid or expired refresh token',error);
            return false
        }
    }

    async incrementTokenVersion (id:string):Promise<number>{
        const query = `
        UPDATE FROM refresh_token 
        SET token_versio = token_version + 1
        WHERE id = $1
        RETURNING token_version 
        `;
        try {
            const result = await pool.query(query,[id]);
            return result.rows[0]?.token_version || 0 
        } catch (error:unknown) {
            logger.error('Failed to increment token version',error);
            throw AppError.internal('Failed to update token version');
        }
    }

    async getTokenExpiryUsingTokenHash (token_hash:string):Promise<Date|null>{
        const query = `
        SELECT token_expires 
        FROM refresh_token 
        WHERE token_hash = $1
        `;
        try {
            const result = await pool.query(query,[token_hash]);
            return result.rows[0]?.token_expires || null 
        } catch (error:unknown) {
            logger.error('Failed to retreive token expiry time using token hash',error)
            return null
        }
    }
    async getTokenExpiryById (id:string):Promise<Date|null>{
        const query = `
        SELECT token_expires
        FROM refresh_token 
        WHERE id = $1
        `
        try {
            const result = await pool.query(query,[id]);
            return result.rows[0]?.token_expires || null
        } catch (error:unknown) {
            logger.error('Failed to retreive token expiry time using token id');
            return null
        }
    }
}

