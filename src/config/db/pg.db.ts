import pg,{Pool} from 'pg';
import dtv from 'dotenv';

dtv.config()

const {POSTGRE_URL} = process.env;

export const pool = new Pool({
    connectionString:POSTGRE_URL!,
    ssl:{
        rejectUnauthorized:false
    }
})

