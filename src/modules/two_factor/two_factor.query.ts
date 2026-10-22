export const INSERT_2FA_CODE = `
INSERT INTO two_factor_codes (
user_id,
purpose , 
code_hash ,
expires_at ,
ip_address ,
user_agent ,
phone_number ,
max_attemps ,
created_at 
)
AND VALUES (
 $1, $2, $3 ,$4 ,$5, $6, $7 ,$8, CURRENT_TIMESTAMP
)
RETURNING id, user_id , phone_number , expires_at , purpose , created_at
`;

export const FIND_ACTIVE_CODE = `
SELECT 
id , 
user_id, 
code_hash , 
expires_at ,
purpose , 
used_at ,
phone_number , 
attemps ,
max_attemps ,
created_at 
FROM two_factor_codes 
WHERE user_id = $1 
AND purpose = $2 
AND expires_at > CURRENT_TIMESTAMP 
AND used_at IS NULL 
ORDER BY created_at DESC
LIMIT 1
`;


export const INCREMENT_2FA_ATTEMPS = `
UPDATE two_factor_codes 
SET attemps = attemps + 1 
WHERE id = $1 
RETURNING attemps , max_attemps
`;


export const MARK_2FA_USED = `
UPDATE two_factor_codes
SET used_at = CURRENT_TIMESTAMP 
WHERE id = $1 
RETURNING id
`;

export const INVALIDATE_2FA_OLD_CODES = `
UPDATE two_factor_codes 
SET used_at = CURRENT_TIMESTAMP 
WHERE user_id = $1 
AND purpose = $2
AND used_at IS NULL
RETURNING id
`;

export const DELETE_ALL_EXPIRED_CODES = `
DELETE FROM two_factor_codes 
WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
OR used_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
RETURNING id
`;

export const INSERT_TRUSTED_DEVICE = `
INSERT INTO trusted_device (
user_id ,
device_id , 
device_name ,
token_hash , 
expires_at , 
ip_address , 
user_agent ,
last_used_at ,  
created_at  
) VALUES (
  $1 , $2 , $3  , $4 , $5 , $6 , $7 , CURRENT_TIMESTAMP , CURRENT_TIMESTAMP
)
ON CONFLICT (user_id , device_id) 
DO UPDATE SET
token_hash = EXCLUDED.token_hash , 
expires_at = EXCLUDED.expires_at , 
last_used_at = CURRENT_TIMESTAMP , 
user_agent = EXCLUDED.user_agent ,
ip_address = EXCLUDED.ip_address 
RETURNING id , user_id , device_id ,expires_at 
`;

export const FIND_TRUSTED_DEVICE = `
SELECT 
id , 
user_id , 
device_id , 
token_hash , 
expires_at ,
last_expires_at 
FROM trusted_device 
WHERE token_hash = $1 
AND expires_at > CURRENT_TIMESTAMP 

`;

export const TOUCH_TRUSTED_DEVICE = `
UPDATE trusted_device 
SET last_used_at = CURRENT_TIMESTAMP 
WHERE token_hash = $1
AND expires_at > CURRENT_TIMESTAMP 
RETURNING id
`;

export const DELETE_TRUSTED_DEVICE = `
DELETE FROM trusted_device 
WHERE user_id = $1 AND device_id = $2 
RETURNING id 
` ;


export const DELETE_EXPIRED_TRUSTED_DEVICE = `
DELETE FROM trusted_device 
WHERE
 expires_at < CURRENT_TIMESTAMP  
`;


export const ENABLE_2FA = `
UPDATE auth
SET two_factor_enabled = TRUE 
AND two_factor_phone = $2
AND two_factor_methods = $3
AND updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING id , two_factor_enabled , two_factor_methods , two_factor_phone
`;

export const DISABLE_2FA = `
UPDATE auth
SET two_factor_enabled = FALSE 
AND updated_at = CURRENT_TIMESTAMP 
WHERE id = $1
RETURNING id , two_factor_enabled
`;

export const GET_2FA_STATUS = `
SELECT 
id , 
two_factor_enabled ,
two_factor_methods , 
two_factor_phone FROM auth
WHERE id = $1 
`;


export const INSERT_SMS_LOG =    `
INSERT INTO sms_rate_limits (phone_number,user_id)
VALUES ($1,$2)
`;

export const COUNT_RESENT_SMS = `
COUNT (*)::INT AS count 
FROM sms_rate_limits
WHERE phone_number = $1 
AND sent_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
`;

export const CLEAN_UP_SMS = `
DELETE FROM sms_rate_limits
WHERE sent_at < CURRENT_TIMESTAMP - INTERVAL '24 hour'
RETURNING id
`;



