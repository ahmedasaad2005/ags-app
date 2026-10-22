export interface IDeviceInfo {
    device_id:string
    device_name:string
    device_type:'mobile'|'tablet'|'desktop'|'tv'|'wearable'|'bot'|'unknown'
    user_agent:string 
    ip_address:string 
    device_model?:string 
    device_vendor?:string
    os_name:string 
    os_version:string
    os_platform:string
    browser_name:string 
    browser_version:string
    browser_engine:string
    finger_print:string
    session_id:string 
    screen_info?:{
        width:number 
        height:number
        color_depth:number
    }
    connection_info?:{
        type:string 
        effective_type:string
    }

}

export interface ISessionInformation {
    session_id:string
    device_id:string 
    created_at:Date
    last_activity:Date 
    is_active:boolean
    expires_at:Date 
    ip_address:string 
    user_agent:string
}
export interface IDevice {
    id:string
    user_id:string 
    device_id:string 
    device_name?:string 
    device_type?:string
    device_vendor?:string
    user_agent?:string 
    ip_address?:string 
    os_name?:string 
    os_version?:string
    browser_name?:string
    browser_version?:string
    is_trusted:boolean
    finger_print?:string
    is_active?:boolean
    last_used_at:Date
    created_at:Date
    updated_at:Date
}
export interface ISession {
    id:string 
    user_id:string 
    session_id:string 
    device_id:string
    refresh_token_hash?:string
    is_active:boolean 
    last_activity:Date 
    expires_at:Date
    created_at:Date
    updated_at:Date
}

export interface IDeviceCreate {
    user_id:string 
    device_id:string
    device_name?:string 
    device_type?:string
    device_vendor?:string
    device_model?:string
    os_name?:string
    os_version?:string 
    browser_name?:string 
    browser_version?:string
    ip_address?:string 
    user_agent?:string
    finger_print?:string
    last_activity?:Date
    last_used_at?:Date
    is_trusted?:boolean
}

export interface ISessionCreate {
    user_id:string 
    device_id:string 
    session_id:string
    refresh_token_hash?:string
    expires_at:Date
}