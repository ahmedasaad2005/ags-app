export const SET_RESETS = (table_name:'code'|'token') => `

UPDATE password_reset_${table_name}
SET reset_${table_name}_hash = $1
AND reset_${table_name}_expires_at


`