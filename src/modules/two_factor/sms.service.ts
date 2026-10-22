import axios from 'axios';
import { logger } from '@utils/utils/logger';
import { AppError } from '@utils/errors/AppError';
import dtv from 'dotenv';


dtv.config();



export interface IAkedlyApiResponse {
    status:'success'|'error'|'skipped'
    data?:{
        transaction_id:string 
        provider:'cequens'|'own-waba'
        billed:boolean
    }
    message?:string 
    code?:string
}

export class SmsService {
    private readonly api_key  : string 
    private readonly pipeline_id :string;
    private readonly base_url : string
    
    constructor(){
       this.api_key = process.env.AKEDLY_API_SECRET_KEY!;
       this.pipeline_id = process.env.AKEDLY_PIPELINE_ID!;
       this.base_url = 'https://app.akedly.io'; 
       if(!this.api_key||!this.pipeline_id){
        logger.warn('Api key or pipeline ware missing in environment file, please check.');
       }

    }

    async send2FACode (phone:string,code:string):Promise<boolean>{
     try {
        const idempotency_key  = `2fa-${phone}-${Date.now()}`;
        const response = await axios.post<IAkedlyApiResponse>('https://app.akedly.io/utilities/send',{
            api_key:this.api_key,
            pipeline_id:this.pipeline_id,
            phone_number:phone,
            variables:{
                code:code
            }
        },{
            headers:{
                'Content-Type':'application/json',
                'Idempotency-key':idempotency_key
            }
        })
        if(response.data.status === 'success'){
            logger.info(`Akedly SMS send code to ${phone}`);
            return true
        }
        if(response.data.status === 'skipped'){
            logger.warn(`Akedly not send the code to recipient suppressed`);
            return false;
        }
        if(response.data.status === 'error'){
            logger.warn(`Failed to send the code to the recipient`);
            return false
        }  
                    // status === 'error'
            logger.error(`Akedly SMS error for ${phone}`, response.data);
            throw AppError.internal(`SMS provider error: ${response.data.message || 'Unknown'}`);

     } catch (error:unknown) {
            logger.error('Failed to send SMS via Akedly', error);
            throw AppError.internal('Failed to send SMS');
        
     }
        
    }


}


