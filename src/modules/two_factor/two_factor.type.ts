export type TwoFactorPurpose = 'login'|
'enable_2fa' |
'disable_2fa' |
'verify_phone' ;

export interface ITwoFactorCode  {
    id:string 
    user_id:string 
    phone_number:string
    code_hash:string
    expires_at :Date
    used_at:Date|null
    purpose:TwoFactorPurpose  
    attemps:number 
    max_attemps:number
    ip_address?:string 
    user_agent?:string
    created_at :Date
}

export interface ITrustedDevice {
    id:string
    user_id:string 
    device_id:string 
    token_hash:string 
    expires_at:Date 
    device_name?:string
    user_agent?:string 
    ip_address?:string
    last_used_at:Date
    created_at:Date
}


export interface ITwoFactorChallenge {
    requires_2fa:true
    masked_phone:string
    method:'sms'
    challenge_token:string
    expires_at:number // milli seconds
}

