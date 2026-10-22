export const create_session_q = `
INSERT INTO sessions (
user_id , 
device_id ,
session_id ,
refresh_token_hash ,
is_active ,
expires_at ,
last_activity ,
created_at ,
updated_at 
) VALUES (
$1 , $2 , $3 , $4 , $5 , $6 , CURRENT_TIMESTAMP ,
CURRENT_TIMESTAMP , CURRENT_TIMESTAMP
) RETURNING *
`;


export const find_by_session_id = `
SELECT * FROM sessions 
WHERE session_id = $1
`

export const find_session_with_device = `
SELECT
 s.*,
 d.device_name ,
 d.device_version ,
 d.device_model , 
 d.device_vendor ,
 d.os_name ,
 d.os_version , 
 d.browser_name , 
 d.browser_version , 
 d.ip_address ,
 d.user_agent , 
 d.finger_print 
 FROM sessions s 
 LEFT JOIN devices d ON s.device_id = d.id 
 WHERE s.session_id = $1
`;

export const update_activity = `
UPDATE sessions
SET last_activity = CURRENT_TIMESTAMP ,
updated_at = CURRENT_TIMESTAMP
WHERE session_id = $1
`;

export const revoke_by_session_id = `
UPDATE sessions 
SET is_active = FALSE ,
updated_at = CURRENT_TIMESTAMP
WHERE session_id = $1
RETURNING id
`;

export const revoke_all_user_sessions = `
UPDATE sessions 
SET is_active = FALSE ,
updated_at = CURRENT_TIMESTAMP 
WHERE user_id = $1 AND is_active = TRUE
RETURNING id
`

export const revoke_device_sessions = `
UPDATE sessions 
SET is_active = FALSE ,
updated_at = CURRENT_TIMESTAMP 
WHERE device_id = $1 AND is_active = TRUE
RETURNING id
`

export const GET_USER_ACTIVE_SESSIONS = `
SELECT 
s.*,
d.device_name ,
d.device_version , 
d.device_model , 
d.device_vendor
FROM sessions s 
LEFT JOIN devices d ON s.device_id = d.id 
WHERE s.user_id = $1 ,
s.is_active = TRUE ,
s.expires_at > CURRENT_TIMESTAMP 
ORDER BY s.last_activity DESC 
`;


export const delete_expired_session = `
DELETE FROM sessions 
WHERE expires_at < CURRENT_TIMESTAMP
OR (is_active = FALSE AND updated_at < CURRENT_TIMESTAMP - INTERVAL '30 days') 
RETURNING id
`

export const is_valid_session_id = `
    SELECT * FROM sessions 
    WHERE session_id = $1 
    AND is_active = TRUE 
    AND expires_at > CURRENT_TIMESTAMP 
    AND updated_at > CURRENT_TIMESTAMP - INTERVAL '30 days' 
`

export const update_refresh_token = `
   UPDATE sessions
   SET refresh_token_hash = $2 ,
   last_activity = CURRENT_TIMESTAMP ,
   updated_at = CURRENT_TIMESTAMP
   WHERE session_id = $1
   RETURNING id
`;