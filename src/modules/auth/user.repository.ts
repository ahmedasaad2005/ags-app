import { 
    IUser,
    IUserCreate,
    IUpdateUser,
    User_Status,
    User_Role,
 } from "./auth.type";
 import { logger } from "@utils/utils/logger";
 import { AppError } from "@utils/errors/AppError";
 import { user_create,update_user,find_user_id,exist_user_email ,FIND_RESETS ,exist_user_username,find_user_email,find_user_username, update_last_login, delete_user, hard_delete, FIND_BY_EMAIL_AND_RESETS, INVALIDATE_RESETS, UPDATING_INTO_NEW_PASSWORD, SET_RESETS_FOR_PASSWORD} from "./user.query";
import { pool } from "config/db/pg.db";



 export class UserRepo {
    async create (data:IUserCreate):Promise<IUser>{
       
        const values = [
            data.username,
            data.first_name,
            data.last_name,
            data.email,
            data.password_hash,
            data.role,
            data.phone_number,
            data.avatar_url||'unknown',
            data.avatar_public_id||'unknown',
            true,
            User_Status.ACTIVE,
            false,
            0,
        ];
        try {
            const result = await pool.query(user_create,values);
            return result.rows[0];
        } catch (error:unknown) {
            logger.error('Failed to create a new user',error);
            throw AppError.internal('Failed to create a new user');
        }
    }

    async  findUserById (id:string):Promise<IUser|null>{
        try {
        const result = await pool.query(find_user_id,[id]);
        return result.rows[0] || null;
        } catch (error) {
            logger.error(`Failed to retreive user by id:${id} INVALID ID`,error);
            throw AppError.internal('Invalid user id');
        }
    }
    
    async findByEmail (email:string):Promise<IUser|null>{
        try {
           const result = await pool.query(find_user_email,[email]);
           return result.rows[0]||null          
        } catch (error:unknown) {
            logger.warn('Failed to retreive user by email',error);
            throw AppError.internal('Failed to retreive user by email');
        }
    }
    
    async findByUsername (username:string):Promise<IUser|null>{
        try {
            const result = await pool.query(find_user_username,[username]);
            return result.rows[0];
        } catch (error:unknown) {
            logger.error('Failed to find user by user name',error);
            throw AppError.internal('Failed to find user by user name');
        }
    }
    async updateUserPasswordByEmail (email:string,password_hash:string):Promise<IUser|null>{
        try {
            const result = await pool.query(UPDATING_INTO_NEW_PASSWORD,[email,password_hash]);
            return result.rows[0]||null
        } catch (error:unknown) {
            logger.error('Failed to reset new password',error);
            throw AppError.internal('Failed to reset new password');
        }
    }
    

    // async updateResetToken (email:string,token_hash:string,reset_Token_expires_at:Date):Promise<boolean>{
    //     try {
    //         const result = await pool.query(SET_RESET_TOKEN,[email,token_hash,reset_Token_expires_at]);
    //         return result.rowCount ? result.rowCount > 0 : false 
    //     } catch (error:unknown) {
    //         logger.error('Failed to update reset token into db',error);
    //         throw AppError.internal('Failed to update reset token into db');
    //     }
    // }

    // async findByResetToken (email:string,token_hash:string):Promise<IUser|null>{
    //    try {
    //     const result = await pool.query(FIND_RESET_TOKEN,[email,token_hash]);
    //     return result.rows[0]||null; 
    //    } catch (error:unknown) {
    //     logger.error('Failed to find user by reset token as hash',error);
    //     throw AppError.internal('Failed to find user by reset token as hash');
    //    }
    // }

    // async invalidateResetToken (email:string):Promise<boolean>{
    //     try {
    //         const result = await pool.query(INVALIDATE_RESET_TOKEN,[email]);
    //         return result.rowCount ? result.rowCount > 0 : false 
    //     } catch (error:unknown) {
    //         logger.error('Failed to revoke reset token into db',error);
    //         throw AppError.internal('Failed to revoke reset token into db');
    //     }
    // }
    // async invalidateResetCode (email:string):Promise<boolean>{
    //     try {
    //         const result = await pool.query(INVALIDATE_RESET_CODE,[email]);
    //         return result.rowCount ? result.rowCount > 0 : false 
    //     } catch (error:unknown) {
    //         logger.error('Failed to invalidate reset code',error);
    //         throw AppError.internal('Failed to invalidate reset code');
    //     }
    // }
    // async findByResetCode(email:string,reset_code_hash:string):Promise<boolean> {
    //     try {
    //         const result = await pool.query(FIND_BY_EMAIL_AND_RESET_CODE,[email,reset_code_hash]);
    //         return result.rowCount ? result.rowCount > 0 : false
    //     } catch (error:unknown) {
    //         logger.error('User not found')
    //         return false
    //     }
    // }
    async existUserByUsername (username:string):Promise<boolean>{
        try {
            const result = await pool.query(exist_user_username,[username]);
            return result?.rowCount ?result.rowCount > 0 : false
        } catch (error) {
            logger.error(`Failed to check user name : ${username}`,error);
            throw AppError.internal('User not found by user name');
        }
    }
    async existsUserByEmail (email:string):Promise<boolean>{
      try {
        const result = await pool.query(exist_user_email,[email]);
            return result?.rowCount ?result.rowCount > 0 : false
      } catch (error:unknown) {
        logger.error('Failed to check user by email',error);
        throw AppError.internal('Failed to check user by email');
      }
    }

    async update (id:string , data:IUpdateUser) :Promise<IUser|null>{
         const updates : string[] = [];
            const values : any[] = []
            let paramCounter = 1
            if(data.username !== undefined){
                updates.push(` username = $${paramCounter} `);
                values.push(data.username);
                paramCounter ++;
            } 
            if(data.email !== undefined){
                updates.push(` email = $${paramCounter} `);
                values.push(data.email);
                paramCounter ++ ;
            }
             if(data.password_hash !== undefined){
                updates.push(`password_hash = $${paramCounter} `);
                values.push(data.password_hash);
                paramCounter ++;
            }
            if(data.first_name !== undefined){
                updates.push(`first_name = $${paramCounter} `)
                values.push(data.first_name);
                paramCounter ++;
            }
            if(data.last_name){
                updates.push(`last_name = $${paramCounter} `)
                values.push(data.last_name);
                paramCounter ++;
            }
           
            if(data.role){
                updates.push(`role = $${paramCounter} `)
                values.push(data.role);
                paramCounter ++
            }
            if(data.is_active !== undefined){
                updates.push(`is_active = $${paramCounter} `);
                values.push(data.is_active);
                paramCounter ++;
            }
            if(data.email_verified !== undefined){
                updates.push(`email_verified = $${paramCounter} `);
                values.push(data.email_verified);
                paramCounter ++;
            }
            if(data.status !== undefined ){
                updates.push(`status = $${paramCounter} `);
                values.push(data.status)
                paramCounter ++;
            }
            if(data.phone_number !== undefined){
                updates.push(`phone_number = $${paramCounter} `);
                values.push(data.phone_number);
                paramCounter ++
            }
            if(data.balance !== undefined){
                updates.push(`balance = $${paramCounter} `);
                values.push(data.balance);
                paramCounter ++;
            }
            if(data.avatar_url !== undefined){
                updates.push(`avatar_url = $${paramCounter} `);
                values.push(data.avatar_url);
                paramCounter ++; 
            }
            if(data.avatar_public_id !== undefined){
                updates.push(`avatar_public_id = $${paramCounter} `);
                values.push(data.avatar_public_id);
                paramCounter ++;
            }
            
            if(data.reset_code !== undefined){
                updates.push(`reset_code = $${paramCounter} `);
                values.push(data.reset_code);
                paramCounter ++;
            }
            
            if(data.reset_code_expiry !== undefined){
                updates.push(`reset_code_expiry = $${paramCounter} `);
                values.push(data.reset_code);
                paramCounter ++;
            }

            if(data.reset_token_hash !== undefined){
                updates.push(`reset_token_hash = $${paramCounter} `);
                values.push(data.reset_token_hash);
                paramCounter ++;
            }
            if(data.reset_token_expires_at !== undefined){
                updates.push(`reset_token_expires_at = $${paramCounter} `);
                values.push(data.reset_token_expires_at);
                paramCounter ++;
            }
            if(data.last_login !== undefined){
                updates.push(`last_login = $${paramCounter} `);
                values.push(data.last_login);
                paramCounter ++;
            }
            updates.push(' updated_at = CURRENT_TIMESTAMP')
            if(Object.keys(data).length = 0){
                logger.error('No field was provided for update');
                throw AppError.badRequest('No field was provided for update')
            }
            values.push(id)
            let query = update_user(updates,paramCounter);
            
        try {
          
              const result = await pool.query(query,values);
              return result.rows[0]||null

        } catch (error:unknown) {
            logger.error('Failed to update user',error);
            throw AppError.internal('Failed to update user')
        }
    }
    async updateLastLogin (id:string ):Promise<void>{
        const query = update_last_login;
        try {
            await pool.query(query,[id])
        } catch (error:unknown) {
            logger.error('Failed to update last login for user');
            throw AppError.internal('Failed to update last login for user');
        }
    }
    async delete (id:string):Promise<boolean>{
        
        const query = delete_user;
        try {
            const result = await pool.query(query,[id]);
            return result.rowCount ? result.rowCount > 0 :  false
        } catch (error:unknown) {
            logger.error("Failed to soft delete user");
            throw AppError.internal('Failed to soft delete user');
        }
    }  

    async hardDelete (id:string):Promise<boolean>{
        const query = hard_delete;
        
        try {
            const result = await pool.query(hard_delete,[id])
            return result.rowCount ? result.rowCount > 0 : false 
        } catch (error:unknown) {
            logger.error(`Failed to hard delete for user :${id}`,error);
            throw AppError.internal(`Failed to hard delete for user :${id}`);
        }
    }
    async findAll (
        limit:number = 50 ,
        offset:number = 0 ,
          filters:{role?:User_Role,status?:User_Status}
    ):Promise<{
        users:IUser[],
        total:number 
    }>{


        let query = `
        SELECT 
        id,
        username ,
        email ,
        first_name ,
        last_name ,
        role , 
        status ,
        is_active ,
        email_verified ,
        phone_number ,
        balance ,
        avatar_url , 
        avatar_public_id ,
        last_login ,
        created_at ,
        updated_at 
        FROM auth 
        WHERE 1 = 1
        `;
        const conditions :string [] = [];
        const values : any [] = [];
        var paramCounter = 1 ;

        if(filters?.status){
            conditions.push(` status = $${paramCounter} `)
            values.push(filters.status);
            paramCounter ++
        }
        if(filters?.role){
             conditions.push(` role = $${paramCounter} `)
             values.push(filters.role);
             paramCounter ++;
        }
        if(conditions.length > 0 ){
            query += ` AND ` + conditions.join(' AND ')
        }

        query += `ORDER BY created_at DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`
        values.push(limit,offset)
        try {
            const result = await pool.query(query,[values]);
            const countQuery = `
            SELECT COUNT(*) AS total
            FROM auth
            WHERE 1 = 1 ${conditions.length ? 'AND' + conditions.join(' AND ')  : '' }
            `;
            const countResult = await pool.query(countQuery,values.slice(0,-2))

            return {
                users:result.rows ,
                total:parseInt(countResult.rows[0]?.total)
            }
        } catch (error:unknown) {
            logger.error('Failed to get all users and the count of users',error);
            throw AppError.internal('Failed to get all users and the count of users')
        }
    }

 } 