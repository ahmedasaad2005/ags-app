import wn from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import dtv from 'dotenv'


dtv.config();
const logDir = 'logs';

/**
 * @borrow the format
 */

const wnFormat = wn.format.combine(
    wn.format.timestamp({format:'YYYY-MM-DD HH:mm:ss:ms'}),
    wn.format.colorize({all:true}),
    wn.format.printf((info)=>`${info.timestamp} ${info.level}:${info.message}`)
)


const fileRotateTransport = new DailyRotateFile({
    filename:path.join(logDir,'%DATE%.log'),
    maxFiles:'30d',
    maxSize:'20m',
    datePattern:'YYYY-MM-DD',
    format:wn.format.combine(
        wn.format.json(),
        wn.format.timestamp()
    )
})


const consoleTransport  = new wn.transports.Console({
    format:wnFormat
})


export const logger = wn.createLogger({
    level:process.env.NODE_ENV! === 'development' ? 'debug' : 'info',
    transports:[
        consoleTransport,
        fileRotateTransport
    ],
    exceptionHandlers:[
      new wn.transports.File({
        filename:path.join(logDir,'exception.log')
      })  
    ],
    rejectionHandlers:[
        new wn.transports.File({
            filename:path.join(logDir,'rejections.log')
        })
    ]
})


export const logInfo = (message:string,meta?:any)=>{
    return logger.info(message,meta)
} 

export const logWarn = (message:string,meta?:any)=>{
 return logger.warn(message,meta)
}

export const logError = (message:string,meta?:any)=>{
 return logger.error(message,meta)
}
export const logDebug = (message:string,meta?:any)=>{
 return logger.debug(message,meta)
}