import { UUID } from "crypto";
import { UAParser } from "ua-parser-js";
import os from 'os';
import si from 'systeminformation';
import cpo from 'crypto';
import { logger } from "@utils/utils/logger";
import { Request } from "express";
import { IDeviceInfo, ISessionInformation } from "./device.type";
import { AppError } from "@utils/errors/AppError";



export class DeviceService {
 getDeviceInfoFromRequest (req:Request):IDeviceInfo{
        try {
        const user_agent = req.headers['user-agent']||'';
        const ip_address = this.getClientIp(req);
        const parser = new UAParser(user_agent);
        const result = parser.getResult()
        const finger_print = this.generateDeviceFingerPrint(req);
        const session_id = this.generateSessionId();
        const device_id = this.generateDeviceId(finger_print);
        const device_info : IDeviceInfo = {
            device_id,
            device_name:this.getDeviceName(user_agent,result.device),
            device_type:this.classifyDevice(user_agent,result.device),
            device_model:result.device?.model,
            device_vendor:result.device?.vendor,
            os_name:result.os?.name || 'Unknown operating system name',
            os_version:result.os?.version || 'Unknown',
            os_platform:process.platform,
            browser_name:result.browser?.name||'Unknown browser name',
            browser_version:result.browser?.version||'Unknown browser version',
            browser_engine:result.engine?.name||'Unknown browser engine',
            ip_address,
            finger_print,
            session_id,
            screen_info: this.getScreenInfo(req),
            user_agent,
            connection_info:this.getConnectionInfo(req)
        }
        logger.info('Device info extracted',{
            device_name:device_info.device_name,
            device_type:device_info.device_type,
            device_id:device_info.device_id,
            session_id:device_info.session_id,
            ip_address:device_info.ip_address
        })
        return device_info
        } catch (error:unknown) {
            logger.error("Failed to extract device info",error);
            throw AppError.internal('Failed to extract device info')
        }

    }
     private generateDeviceId (finger_print:string):string{
        return cpo.createHash('sha256').update(finger_print).digest('hex').substring(0,32)
    }

     private generateDeviceFingerPrint (req:Request):string{
        const components = [
            req.headers['user-agent']||'',
            req.headers['accept-language']||'',
            req.headers['accept-encoding']||'',
            req.headers['accept']||'',
            this.getClientIp(req),
            req.headers['x-forwarded-for'] || '',
            req.headers['sec-ch-ua'] || '', // Client Hints
            req.headers['sec-ch-ua-platform'] || '',
            req.headers['sec-ch-ua-mobile'] || ''
        ];
        const finger_print_tostring = components.join('|');
        return  cpo
        .createHash('sha256')
        .update(finger_print_tostring)
        .digest('hex')

    }
     private generateSessionId ():string{
        return cpo.randomUUID();
    }
    private getDeviceName (user_agent:string,device:any){
        if(device?.model){
          return device?.vendor ? `${device.vendor} ${device.model}` : device.model;
        }
        const ua = user_agent.toLowerCase();
        if(ua.includes('iphone')) return 'iphone';
        if(ua.includes('ipad')) return 'ipad'
        if(ua.includes('ipod')) return 'ipod';
        if(ua.includes('macintosh')||ua.includes('mac os')) {
            if(ua.includes('arm64')) return 'Apple Mac M1/M2';
            return 'Old Mac'
        }
        if(ua.includes('android')){
            const brands = [
                {name:'samsung',display:'Samsung'},
                {name:'oppo',display:'Oppo'},
                {name:'xiaomi',display:'Xiaomi'},
                {name:'realme',display:'Realme'},
                {name:'infinix',display:'Infinix'},
                {name:'huawei',display:'Huawei'},
                {name:'tecno',display:'Tecno'},
                {name:'motorila',display:'Motorila'},
                {name:'vivo',display:'Vivo'},
                {name:'pixel',display:'Pixel'},
                {name:'oneplus',display:'OnePlus'},
            ]
            for(const brand of brands){
                if(ua.includes(brand.name)){
                    const match = ua.match(new RegExp(`${device.name}\\s?([^\\s;]+)`))
                    return match ? `${brand.display} ${match[1]}` : `${brand.display}`
                }
            }
            return `Android device`
        }
    
        if(ua.includes('windows')){
            if (ua.includes('arm')) return 'Windows ARM Device';
            if (ua.includes('phone')) return 'Windows Phone';
            return 'Windows PC';
        }
        if (ua.includes('linux')) {
            if (ua.includes('ubuntu')) return 'Ubuntu Linux';
            if (ua.includes('debian')) return 'Debian Linux';
            if (ua.includes('fedora')) return 'Fedora Linux';
            if (ua.includes('arch')) return 'Arch Linux';
            return 'Linux PC';
        }
         if(ua.includes('bot')||ua.includes('crawler')||ua.includes('spider')){
            return 'Bot/Crawler'
         }
         return 'Unknown device'
    }
    private classifyDevice (user_agent:string,device:any):'mobile'|'tablet'|'desktop'|'tv'|'wearable'|'bot'|'unknown'{
        const ua = user_agent.toLowerCase()
        if (device?.type === 'mobile' ||
            ua.includes('mobile') ||
            (ua.includes('android') && !ua.includes('tablet')) ||
            ua.includes('iphone') ||
            ua.includes('ipod')) {
            return 'mobile';
        }

        if (device?.type === 'tablet' ||
            ua.includes('tablet') ||
            ua.includes('ipad')) {
            return 'tablet';
        }

        if(ua.includes('windows')||ua.includes('mac os')||( ua.includes('linux') && !ua.includes('android'))){
            return 'desktop'
        }
        if(ua.includes('bot')||ua.includes('crawler')||ua.includes('spider')){
            return 'bot'
        }
        if(ua.includes('tv')||ua.includes('android tv')||ua.includes('apple tv')){
            return 'tv'
        }
        if(ua.includes('watch')||ua.includes('wear')||ua.includes('glass')){
            return 'wearable';
        }
        return 'unknown'
    }
    private getScreenInfo(req: Request): any {
        try {
            const viewport = req.headers['sec-ch-viewport'] || req.headers['viewport'];
            if (viewport) {
                const [width, height] = (viewport as string).split('x').map(Number);
                return { width, height, colorDepth: 24 };
            }
            return undefined;
        } catch (error) {
            return undefined;
        }
    }
    private getConnectionInfo(req: Request): any {
        try {
            const connection = (req as any).connection;
            if (connection) {
                return {
                    type: connection.type,
                    effectiveType: connection.effectiveType
                };
            }
            return undefined;
        } catch (error) {
            return undefined;
        }
    }

    private createDeviceInfo (device:IDeviceInfo):ISessionInformation{
        const now = new Date();
        const expires_at = new Date(now)
        expires_at.setDate(expires_at.getDate() + 30);
        return {
            is_active:true,
            user_agent:device.user_agent,
            device_id:device.device_id,
            ip_address:device.ip_address,
            session_id:device.session_id,
            created_at:now,
            last_activity:now,
            expires_at:expires_at,
        }
    }
        async getServerInfo(): Promise<any> {
        try {
            const cpuInfo = await si.cpu();
            const memInfo = await si.mem();
            const osInfo = await si.osInfo();

            return {
                hostname: os.hostname(),
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version,
                uptime: process.uptime(),
                cpu: {
                    manufacturer: cpuInfo.manufacturer,
                    brand: cpuInfo.brand,
                    cores: cpuInfo.cores,
                    speed: cpuInfo.speed
                },
                memory: {
                    total: memInfo.total,
                    free: memInfo.free,
                    used: memInfo.used
                },
                os: {
                    name: osInfo.distro,
                    version: osInfo.release,
                    kernel: osInfo.kernel
                }
            };
        } catch (error) {
            logger.error('Failed to get server info:', error);
            return null;
        }
    }

    private getClientIp (req:Request):string{
        return (
            (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
            req.socket?.remoteAddress ||
            req.connection?.remoteAddress||
            req.ip ||'unknown_client_ip'
        )
    }
}