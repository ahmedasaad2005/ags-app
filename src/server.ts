import cors from 'cors';
import express, { Application } from 'express';
import dtv from 'dotenv';
import cpn from 'compression' 
import helmet from 'helmet'
import cp from 'cookie-parser'
import os from 'os'
import { pool } from 'config/db/pg.db';
import {UAParser} from 'ua-parser-js'
import { logger } from '@utils/utils/logger';
import si from 'systeminformation'; // npm install systeminformation
import { userrouter } from '@modules/auth/auth.route';
// import { testtUserRegisteration } from '@modules/tests/user.test';
import cpo from 'crypto';
import jwt from 'jsonwebtoken';
import { resetrouter } from '@modules/reset_password/reset_password.route';
import { twofactorrouter } from '@modules/two_factor/two_factor.route';







dtv.config();

const { FIRST_PORT , SECOND_PORT , THIRD_PORT , SERVER_PORT} = process.env;


export class DeviceDetector {
    static async getDeviceInfo (user_agent:string,ip_address?:string):Promise<any>{
        try {
            const parser = new UAParser(user_agent);
            const result = parser.getResult();
            const uaResult = {
                device:result.device,
                browser:result.browser,
                os:result.os,
                engine:result.engine,
                cpu:result.cpu
            }
        const deviceInfo = {
            ...uaResult ,
            osDetails:{
                name:uaResult.os.name || 'Unknown os',
                version:uaResult.os.version|| 'Unknown version',
                platform:process.platform,
                arch:process.arch,
            },
            device_type:await this.classifyDevice(user_agent,result.device),
            device_name:await this.getDeviceName(user_agent,result.device),
            server_info:{
              hostname:os.hostname(),
              platform:os.platform(),
              release:os.release()
            },
            ip_address:ip_address,
            timeStamp:new Date().toISOString()
        }
        return deviceInfo
        } catch (error:unknown) {
            logger.error('Device detection error:', error);
            return  {
                error: 'Failed to detect device',
                userAgent: user_agent,
                fallback: {
                    deviceName: 'Unknown Device',
                    deviceType: 'Unknown',
                    os: 'Unknown'
                }
            };


        }

    }
    private static async getDeviceName (user_agent:string,device:any):Promise<string>{
        if(device?.model){
            return device.vendor ? `${device.vendor} ${device.model}` : device.model
        }

        const ua = user_agent.toLowerCase();

        //detect apple devices
        if(ua.includes('iphone')) return 'iphone';
        
        if(ua.includes('ipad')) return 'ipad';
        
        if(ua.includes('ipod')) return 'ipod';
        
        if(ua.includes('macintosh')||ua.includes('mac os')) {
            if(ua.includes('arm64')) return 'APPLE Mac M1/M2'
            return 'Mac'
        }

        if(ua.includes('android')){
            if(ua.includes('samsung')){
                const match = ua.match(/samsung\s?([^\s;]+)/);
                return match ? `Samsung galaxy ${match[1]}` : 'Samsung device'
            }
            if(ua.includes('infinix')){
                const match = ua.match(/infinix\s?([^\s;]+)/)
                return match ? `Infinix ${match[1]}` : 'Infinix device'
            }
            if(ua.includes('oppo')){
                const match = ua.match(/oppo\s?([^\s;]+)/);
                return match ? `Oppo ${match[1]}` : 'Oppo device';
            }
            if(ua.includes('xiaomi')){
                const match = ua.match(/xiaomi\s?([^\s;]+)/);
                return match ? `Xiaomi redmi ${match[1]}` : 'Xiaomi device'
            }
            if(ua.includes('realme')){
                const match = ua.match(/realme\s?([^\s;]+)/);
                return match ? `Realme ${match[1]}` : 'Realme device'
            }
            if(ua.includes('pixel')){
                const match = ua.match(/realme\s?([^\s;]+)/);
                return match ? `Google pixel ${match[1]}` : 'Google pixel device'
            }
            return 'Android device'
        }
        
        if(ua.includes('windows')){
            if(ua.includes('arm')) return 'Windows arm device';
            return 'Windows PC device'
        }

        // Detect Linux
        if (ua.includes('linux')) {
            if (ua.includes('ubuntu')) return 'Ubuntu Linux';
            if (ua.includes('debian')) return 'Debian Linux';
            if (ua.includes('fedora')) return 'Fedora Linux';
            return 'Linux PC';
        }

         if(ua.includes('bot')|| ua.includes('crawler')||ua.includes('spider')){
            return 'bot & crawler'
         }
 
         return 'Unknown device';


    }
    private static async classifyDevice (user_agent:string,device:any):Promise<string>{
        const ua = user_agent.toLowerCase();
        if(ua.includes('bot')||ua.includes('crawler')||ua.includes('spider')){
            return 'bot'
        }
        if(device?.type === 'mobile'
            ||ua.includes('mobile')
            ||ua.includes('android')&&!ua.includes('tablet')
            ||ua.includes('ios')
            ||ua.includes('ipod')){
                return 'mobile'
        }
        if(device?.type === 'tablet'
           || ua.includes('tablet')
           || ua.includes('ipad')
        ){
            return 'tablet'
        }
        if(ua.includes('windows')
          ||ua.includes('mac os')
          ||ua.includes('linux') && !ua.includes('android')
        ){
            return 'desktop'
        }
        if(ua.includes('tv')
           ||ua.includes('apple tv')
           ||ua.includes('android tv')){
            return 'tv'
        }

        if(ua.includes('watch')
        ||ua.includes('wear')
        ||ua.includes('glass')){
            return 'wearable'
        }
        return device?.type || 'unknown'
    }

    static async getServerInfo ():Promise<any>{
    try {
        const cpuInfo = await si.cpu();
        
        const memInfo =await si.mem();
        
        const osInfo = await si.osInfo() 
        
        return {
            hostname:os.hostname(),
            arch:process.arch,
            platform:process.platform,
            nodeVersion:process.version,
            uptime:process.uptime(),
            cpu:{
                cores:cpuInfo.cores,
                manufactorur:cpuInfo.manufacturer,
                brand:cpuInfo.brand,
                speed:cpuInfo.speed,
            },
            memory:{
                total:memInfo.total,
                free:memInfo.free,
                used:memInfo.used
            },
            os:{
                name:osInfo.distro,
                version:osInfo.release,
                kernel:osInfo.kernel
            }
        }
    } catch (error:unknown) {
        logger.info('Failed to get server info',error)
        return null;
    }       
    }
}


const app : Application = express();
// app.use(testtUserRegisteration)
app.use(express.json({limit:'10mb'}));
app.use(express.urlencoded({extended:true,limit:'10mb'}))
app.use(cpn());
app.use(cp()); // Stands for cookie parser 
app.use(cors({
    origin:[`http://localhost:${FIRST_PORT!}`,`http://localhost:${SECOND_PORT!}`,`http://localhost${THIRD_PORT!}`],
    credentials:true, // Very important for reading cookie parser 
    methods:['POST','GET','PUT','PATCH','DELETE'],
    allowedHeaders:['Content-Type','Authorization','X-Requested-With']
}));
app.use(helmet());

app.use('/api/user',userrouter)
app.use('/api/resets',resetrouter)
app.use('/api/2fa',twofactorrouter)
app.get('/api',(req,res)=>{
    res.status(200).json({
        success:true,
        message:'The server is running ..🚀',
        timeStamps:new Date().toISOString()
    })
})

app.get('/db_check',async (req,res)=>{
    let client = null
    try {
     client = await pool.connect();
    const user_agent  = req.headers['user-agent'] || '';
    const ip_address = req.ip || req.connection.remoteAddress || req.socket.remoteAddress
    const device_info = await DeviceDetector.getDeviceInfo(user_agent,ip_address?.toString()) 
    const server_info = await DeviceDetector.getServerInfo()
    logger.info(`Device info:`,{
        device_name:device_info.device_name ,
        device_type:device_info.device_type,
        os:device_info.osDetails.name,
        browser:device_info.browser.name,
        ip:device_info.ip,
        server_info:server_info
    });
    
        await client.query('SELECT * FROM auth');
        await client.query('SELECT 1')
        console.log('Connected to postgre database successfully🐘🌵')
        console.log('Request of body',req.body);
        const result = await pool.query('SELECT current_database() as db_name')
        const dbname = await result.rows[0]?.db_name || 'Unknown database'
        logger.info(`DATABASE NAME ===== ${dbname}`)
        const resultVersion = await pool.query('SELECT version() as db_version');
        const db_version = await resultVersion.rows[0]?.db_version || 'Unknown the version of db';
        const resultLetancy = await pool.query('SELECT CURRENT_TIMESTAMP AS now');
        const db_letancy = await resultLetancy.rows[0].now || new Date()
        logger.info(`Database timestamp === ${db_letancy}`);
        logger.info(`Database version === ${db_version}`);
        
        console.log(``)
        res.status(200).json({
            success:true,
            message:'Connected to postgre database successfully🐘🌵',
            device: {
                name: device_info.device_name,
                type: device_info.device_type,
                os: device_info.osDetails,
                browser: device_info.browser,
                engine: device_info.engine,
                cpu: device_info.cpu
            },
           
            database:{
              name:dbname,
              version:db_version,
              date:db_letancy
            },
            timeStamps:new Date(),
        })
    } catch (error:unknown) {
        console.error('Failed to connect with database')
    } finally {
        if(client){
           client.release()
        }
    }
    res.status(200).json({
        success:true,
        message:"The server is running🌵🐘",
        environment:process.env.NODE_ENV!,
        timeStamps:new Date().toISOString()
    })
})


app.get('/',async (req,res)=>{

  
    console.log(`
          ╔════════════════════════════════════════════════════════════════════════════════════════════════════════╗
          ║              🚀 APP SERVER TESTER                                                                      ║
          ╠═════════════════════════════════════════════════════════════════════════════════════════════════════════╣
          ║                                                                                                        ║
          ║                                                                                                        ║
          ║                                                                                                         ║
          ║                                                                                                         ║
          ║                                                                                                          ║
          ║                                                                                                          ║
          ║                                                                                                           ║
          ║                                                                                                         ║
          ║                                                                                                         ║
          ║                                                                                                         ║
          ║                                                                                                         ║
          ║                                                                                                         ║
          ╚═════════════════════════════════════════════════════════════════════════════════════════════════════════╝
        
        
        `)
})


const server_port = Number(SERVER_PORT);
if(!server_port){
    throw new Error('Server port is defined in environment file')
}

app.listen(Number(SERVER_PORT),async ()=>{
    const server_info = await DeviceDetector.getServerInfo();
    const randomId = (cpo.randomUUID()).toString();
    const randomEmail = (cpo.randomBytes(16).toString().toLowerCase() + '@gmail.com');
    const role = 'user'
    const token = jwt.sign({
        id:randomId,
        email:randomEmail,
        role
    },process.env.JWT_ACCESS_SECRET!,{
        expiresIn:'15m'
    })
    const exp = new Date(Date.now()+ 1000 * 60 * 15)
    const new_date  = new Date() ;
    const date_now = Date.now(); 
    const new_date_date_now = new Date(Date.now())
    const decode = jwt.decode(token,) as {exp?:number}
  console.log(`
          ╔════════════════════════════════════════════════════════════════════════════════════════════════════════╗
          ║              🚀 AUTH SERVER STARTED                                                                    ║
          ╠═════════════════════════════════════════════════════════════════════════════════════════════════════════╣
          ║  📡 Port: ${SERVER_PORT}                                                                                ║
          ║  📁 API: http://localhost:${SERVER_PORT}/api                                                           ║
          ║  📝 Register: POST /api/auth/register                                                                   
          ║      token :${token} 
          ║      exp  :${exp}    
          ║      decode:${decode}  
          ║      datenow:${date_now}   
          ║      newdate:${new_date}
                newnow:${new_date_date_now}
          ║     real_expire:${decode.exp && new Date()}
          ║  🔑 Login:    POST /api/auth/login                                                                     ║
          ║  💻 Server:   ${server_info?.hostname || 'unknown'}  (${server_info?.platform ||'unknown platform'})   ║
          ║  👨🏼‍💻 CPU: ${server_info?.cpu?.brand || 'unknown'} (${server_info?.cpu?.cores || 'unknown'})             ║
          ║  🌐 Environment: ${process.env.NODE_ENV || 'development'}                                              ║
          ╚═════════════════════════════════════════════════════════════════════════════════════════════════════════╝
    `)
})



app.get('/api/device-info',async (req,res)=>{
    const user_agent = req.headers['user-agent'] || 'Unknown user agent'
    const ip_address =req.ip || req.connection.remoteAddress || req.socket.remoteAddress
    const device_info  =await DeviceDetector.getDeviceInfo(user_agent,ip_address);
    return res.status(200).json({
        success:true,
        user_agent:user_agent,
        ip_address:ip_address,
        device_info:device_info
    })
})