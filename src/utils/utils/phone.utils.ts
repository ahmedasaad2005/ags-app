import {isValidPhoneNumber,parsePhoneNumberFromString} from 'libphonenumber-js';
// import {parsePhoneNumberFromString} from 'libphonenumber-js/max'

export interface validationNumberResult {
    is_valid:boolean 
    formatted:string|null
    error?:string
}



export function validateAndFormatNumber (
    raw_phone:string,
    default_country:'EG'|'US'|'GB'='EG'
):validationNumberResult{
    if(!raw_phone||raw_phone.trim() === ''){
        return {is_valid:false,formatted:null,error:'Phone number is required'}
    }
    try {
        const phone_number = parsePhoneNumberFromString(raw_phone,default_country as any);
        if(!phone_number){
            return {is_valid:false,formatted:null,error:'Could you not parse the phone number'}
        }
        if(!phone_number.isValid()){
            return {is_valid:false,formatted:null,error:'Invalid phone number format'};
        }
        return {
            is_valid:true,
            formatted:phone_number.format('E.164')
        }

    } catch (error:any) {
        if(error instanceof Error){
            return {is_valid:false,formatted:null,error:error.message}
        }
        return {is_valid:false,formatted:null,error:error.message}
    }
}