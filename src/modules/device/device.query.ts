export const create_device = `
INSERT INTO devices (
device_id ,
user_id ,
device_name ,
device_type , 
device_model , 
device_vendor , 
os_name ,
os_version ,
browser_name ,
browser_version , 
ip_address , 
user_agent , 
finger_print ,
is_trusted ,
created_at,
updated_at ,  
last_used_at 
)
VALUES (
$1 , $2, $3 , $4 , $5 , $6 , $7 , $8 , $9 , $10 , $11 , $12 , $13 , $14 ,
 CURRENT_TIMESTAMP  ,
 CURRENT_TIMESTAMP ,
 CURRENT_TIMESTAMP
)
 RETURNING *
`;


export const find_by_device_id = `
SELECT * FROM devices WHERE device_id = $1
`;

export const find_by_finger_print = `
SELECT * FROM devices WHERE finger_print = $1
`;

export const update_last_used = `
UPDATE devices
SET last_used_at =  CURRENT_TIMESTAMP 
, updated_at = CURRENT_TIMESTAMP 
WHERE id = $1
`;
export const update_device_info  = `
UPDATE devices
SET user_agent = $1 ,
ip_address = $2 ,
last_used_at = CURRENT_TIMESTAMP ,
updated_at = CURRENT_TIMESTAMP
WHERE id = $3

`

export const get_user_devices = `
SELECT * FROM devices 
WHERE user_id = $1
ORDER BY last_used_at DESC
`

export const delete_device = `
DELETE FROM devices 
WHERE id = $1
RETURNING id 
`;

