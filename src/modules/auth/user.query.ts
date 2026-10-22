export  const user_create = `
INSERT INTO auth (
id, 
username,
first_name,
last_name,
email,
password_hash,
role,
phone_number ,
avatar_url ,
avatar_public_id ,
is_active ,
status ,
email_verified , 
balance ,
created_at , 
updated_at 
) VALUES (
gen_random_uuid(),
$1 , $2 , $3 , $4 , $5 , $6 , $7 , $8 , $9 , $10 , $11 , $12 , $13 ,
 CURRENT_TIMESTAMP ,
 CURRENT_TIMESTAMP 
)
 RETURNING 
 id ,
 username ,
 email ,
 first_name ,
 last_name ,
 password_hash ,
 role ,
 phone_number ,
 is_active ,
 status ,
 email_verified ,
 avatar_url ,
 avatar_public_id ,
 balance ,
 last_login ,
 created_at , 
 updated_at  
`;


export const find_user_id = `
SELECT 
  id,
  username,
  email,
  first_name,
  last_name,
  password_hash,
  role,
  is_active ,
  status ,
  email_verified ,
  phone_number ,
  balance ,
  avatar_url ,
  avatar_public_id ,
  last_login ,
  created_at ,
  updated_at FROM auth 
  WHERE id = $1 
`;

export const find_user_email = `
SELECT
 id ,
 username ,
 email ,
 first_name ,
 last_name , 
 password_hash , 
 role , 
 is_active ,
 status ,
 email_verified ,
 phone_number ,
 balance ,
 avatar_url ,
 avatar_public_id ,
 last_login ,
 created_at ,
 updated_at 
 FROM auth
 WHERE email = $1
`;

export const find_user_username = `
SELECT 
id,
username,
email,
first_name,
last_name,
password_hash , 
role ,
phone_number,
balance , 
is_active ,
status ,
email_verified ,
avatar_url ,
avatar_public_id ,
last_login , 
created_at,
updated_at 
FROM auth 
WHERE username = $1  
`;
export const exist_user_username = `
SELECT * FROM auth WHERE username = $1;
`;




export const FIND_RESETS = (table_name:'code'|'token'):string=>{ 
  return `
SELECT 
  u.id AS user_id,
  u.email AS user_email,
  r.id AS ${table_name}_id,
  r.reset_${table_name}_hash ,  
  r.reset_${table_name}_expires_at ,
  r.used_at,
  r.created_at 
  FROM password_reset_${table_name} r
  INNER JOIN auth u ON r.user_id = u.id 
  WHERE r.user_id = $1 AND r.reset_${table_name}_hash = $2 
  AND r.reset_${table_name}_expires_at > CURRENT_TIMESTAMP
  AND r.used_at IS NULL 
`;}





export const FIND_VALID_RESETS = (table_name:'code'|'token') : string => {
return `
SELECT
 r.id AS reset_id ,
 r.user_id , 
 r.reset_${table_name}_hash  AS reset_hash,
 r.reset_${table_name}_expires_at ,
 r.ip_address , 
 r.user_agent ,
 r.used_at,
 r.created_at ,
 u.id AS user_id ,
 u.username ,
 u.email ,
 u.first_name 
 FROM password_reset_${table_name} r
 INNER JOIN auth u ON r.user_id = u.id
 WHERE u.email = $1 
 AND r.reset_${table_name}_hash = $2 
 AND r.reset_${table_name}_expires_at > CURRENT_TIMESTAMP
 AND r.used_at IS NULL
 AND u.is_active = TRUE
 LIMIT 1 
`
};

export const FIND_ONLY_VALID_BY_HASH = (table_name:'code'|'token'):string=>{
  return `
   SELECT 
   r.id AS reset_id ,
   r.user_id ,
   r.reset_${table_name}_hash AS reset_hash ,
   r.reset_${table_name}_expires_at ,
   r.used_at ,
   u.id AS user_id , 
   u.username ,
   u.email , 
   u.first_name 
   FROM password_reset_${table_name} r
   INNER JOIN auth u ON r.user_id = u.id 
   WHERE r.reset_${table_name}_hash = $1 
   AND r.reset_${table_name}_expires_at > CURRENT_TIMESTAMP 
   AND r.used_at IS NULL 
   AND u.is_active = TRUE
   LIMIT 1 
  `
}


export const FIND_ACTIVE_RESET_FOR_USER = (table_name:'code'|'token'):string => `
SELECT
 r.id AS reset_id ,
 r.user_id ,
 r.reset_${table_name}_hash , 
 r.reset_${table_name}_expires_at ,
 r.ip_address ,
 r.user_agent ,
 r.used_at ,
 r.created_at
 u.id ,
 u.email , 
 u.username , 
 u.first_name ,
FROM password_reset_${table_name} r
INNER JOIN auth u ON r.user_id = u.id 
WHERE r.user_id = $1 
AND r.reset_${table_name}_expires_at > CURRENT_TIMESTAMP 
AND r.used_at IS NULL
ORDER BY r.created_at DESC
`;

export const COUNT_ACTIVE_RESETS = (table_name:'code'|'token')=> `
SELECT COUNT(*) AS total_actives 
FROM password_reset_${table_name} 
WHERE user_id = $1
AND reset_${table_name}_expires_at > CURRENT_TIMESTAMP
AND used IS NULL 

`;

export const INVALIDATE_ONE_RESET = (table_name:'code'|'token') => `
UPDATE password_reset_${table_name}
SET used_at = CURRENT_TIMESTAMP
WHERE user_id = $1
AND reset_${table_name}_hash = $2 
AND used_at IS NULL 
RETURNING id
`;

export const INVALIDATE_ALL_RESETS = (table_name:'code'|'token') => `
UPDATE password_reset_${table_name}
SET used_at = CURRENT_TIMESTAMP
WHERE user_id = $1
AND reset_${table_name}_expires_at > CURRENT_TIMESTAMP
AND used_at IS NULL
RETURNING id
`



// DELETE STALE TOKEN 

export const DELETE_STALE_RESET = (table_name:'code'|'token'):string => `
DELETE FROM password_reset_${table_name} 
WHERE used_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
AND reset_${table_name}_expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days'
RETURN id
`;














export const SET_RESETS_FOR_PASSWORD = (table_name:'code'|'token'):string=>{
return `
INSERT INTO password_reset_${table_name} (
user_id , 
reset_${table_name}_hash ,
reset_${table_name}_expires_at ,
ip_address ,
user_agent ,
created_at
)
VALUES (
 $1 , $2 , $3 , $4 , $5 ,CURRENT_TIMESTAMP
)
RETURNING *
` 
};

export const exist_user_email = `
  SELECT * FROM auth WHERE email = $1 
`
export const FIND_BY_EMAIL_AND_RESETS =(table_name:string):string=> {
  return`
  SELECT 
  r.id  AS ${table_name}_id ,
  r.reset_${table_name}_hash ,
  r.reset_${table_name}_expires_at ,
  r.used_at ,
  u.id AS user_id ,
  u.email ,
  u.username 
  FROM password_reset_${table_name} r 
  INNER JOIN auth u ON r.user_id = u.id 
  WHERE r.user_id = $1 
  AND reset_${table_name}_hash = $2 AND
  reset_code_expires_at  > NOW() AND 
  used_at IS NULL
`;}

export const INVALIDATE_RESETS =(table_name:string):string=>{ 
  return `
     UPDATE password_reset_${table_name} 
     SET used_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND reset_${table_name}_hash = $2
     RETURNING id
   `};



export const DELETE_ALL_EXPIRED = (table_name:string):string=>{ 
  return `
     DELETE FROM password_reset_${table_name} 
     WHERE reset_${table_name}_expires_at < CURRENT_TIMESTAMP + INTERVAL '7 days' OR 
     used_at < CURRENT_TIMESTAMP + INTERVAL '7 days'
     RETURNING id 
`;}
export const FIND_RESET_ACTIVE_FOR_USER = (table_name:string):string =>{ 
  return `
    SELECT
    u.email ,
    u.username,
    r.reset_${table_name}_hash,
    r.reset_${table_name}_expires_at ,
    r.user_agent , 
    r.ip_address ,
    r.created_at
    FROM password_reset_${table_name} r
    INNER JOIN auth u ON r.user_id = u.id
    WHERE r.user_id = $1 AND  
    r.reset_${table_name}_expires_at > CURRENT_TIMESTAMP AND
    r.used_at IS NULL 
    ORDER BY r.created_at DESC
`;}

export const COUNT_RESET_ACTIVE_FOR_USER = (table_name:string):string =>{ 
return `
SELECT COUNT(*)::INT AS total_active
FROM password_reset_${table_name}
WHERE user_id = $1
used_at IS NULL AND
reset_code_expires_at > CURRENT_TIMESTAMP 
`}



export const UPDATING_INTO_NEW_PASSWORD = `
UPDATE auth 
SET password_hash = $2 ,
updated_at = CURRENT_TIMESTAMP 
WHERE email = $1 
RETURNING * 
`





export function update_user (updates:string[],param_counter:number):string{
  return `
  UPDATE auth 
  SET ${updates.join(' , ')}
  WHERE id = $${param_counter}
  RETURNING
  id ,
  username ,
  email , 
  password_hash ,
  first_name , 
  last_name ,
  role ,
  phone_number ,
  balance ,
  avatar_url ,
  avatar_public_id ,
  is_active ,
  status ,
  email_verified ,
  last_login ,
  created_at , 
  updated_at
  `
}

export const update_last_login = `
   UPDATE auth
   SET last_login = CURRENT_TIMESTAMP ,
   updated_at = CURRENT_TIMESTAMP
   WHERE id = $1 
`;










export const delete_user = `
  UPDATE auth 
  SET is_active = FALSE 
  AND updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING id
`;

export const hard_delete = `
DELETE FROM auth 
WHERE id = $1
RETURNING id 
`;

