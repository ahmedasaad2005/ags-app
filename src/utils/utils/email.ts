import { AppError } from "@utils/errors/AppError";
import ndmr from 'nodemailer';
import dtv from  'dotenv';
import { logger } from "./logger";
import cpo from 'crypto'


dtv.config();

const {SMTP_USER,SMTP_PASS,SMTP_HOST,SMTP_PORT,SMTP_SECURE} = process.env;


export interface IEmailOptions {
    from?:string 
    to:string|string[]
    html:string 
    text?:string 
    subject?:string
}

export const createTransporter = () =>{
    return ndmr.createTransport({
       service:'gmail',
       secure:SMTP_SECURE! === 'true',
       auth:{
         user:SMTP_USER!,
         pass:SMTP_PASS!
       }
    })
} 

export const generateResetCode = (length:number = 6):number=>{
    const min = Math.pow(10,(length - 1));
    const max =Math.pow(10,(length)) - 1;
    return cpo.randomInt(min,max)
 }

export const sendEmail = async  (options:IEmailOptions) => {
    try {
        const transporter = createTransporter();
        await transporter.sendMail({
            to:Array.isArray(options.to)?options.to.join(', '):options.to,
            from:options.from||SMTP_USER!||'ahmedasaad1912@gmail.com',
            subject:options.subject,
            text:options.text?.replace(/<[^>]+>/g,''),
            html:options.html
        });
        logger.info(`The mail sent to :${options.to}📩`)
    } catch (error:unknown) {
        logger.warn('The mail failed to sent',error);
        throw AppError.internal(`The mail failed to sent ${error}`);
    }
}

export const sendResetCode = (first_name:string='Mr',last_name:string='visiter',email:string,reset_code:number|string)=>{
    return {
        to:email,
        subject:'reset password using code number',
        html:`<div style="min-width:100vw;min-height:100vh;display:flex;background:#ededed;align-items:center;flex-direction:column;justify-content:center;">
<div style="padding:12px;align-self:center;font-family:Arial,sans-serif;box-shadow: 5px 5px 10px 6px rgba(0, 0, 0, 0.3);font-weight:100;background:white;max-width:600px;min-height:100vh">
        <h3 style="opacity:.3;color:#3a005c;">Naqify business</h3>
        <h1 style="width:100%;display:flex;flex-direction:column;align-items:start; justify-content:center; background:#222222;color:#4a6fa5">Password reset code</h1>
        <h3>Hello ${first_name} ${last_name}, You requested recently to reset password using code</h3>
        <strong style="font-size:26px">The code will expire in 2 Minutes</strong>
        <article>
        <h3>The reset code :</h3>
        <div style="width:100%; display:flex; flex-direction:column; background:#4444; justify-content:center; align-items:center; text-align:center">
           <h1 style="color:black; background:#2222;padding:6px">${reset_code}</h1>
        </div>
           <h3>If you not requested to reset password ,please ignore this email for secuirty</h3>
        </article>
        <div style="width:100%; height:2px; background:#222222"></div>
        <p style="color:#5555">Notice do never share this email to anyone !⚠️</p>
        </div>
    </div>`
    }
}

export const sendResetUrl = (first_name:string="Mr",last_name:string="visiter",email:string,reset_url:string)=>{
    return {
        to:email,
        text:'Reset password by url',
        html:`<html>
    <head>
        <script src="https://kit.fontawesome.com/3062010fd5.js" crossorigin="anonymous"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">

        <style>
            button.btn:hover{
                opacity:.7;
            } 
        </style>
    </head>
<body>
    <div style="min-width:100vw;min-height:100vh;display:flex;background:#ededed;align-items:center;flex-direction:column;justify-content:center;">
<div style="padding:12px;align-self:center;font-family:Open Sans,sans-serif;box-shadow: 5px 5px 10px 6px rgba(0, 0, 0, 0.3);font-weight:100;background:#fff2ff;max-width:600px;min-height:100vh">
    <div style="display:flex;align-items:center; column-gap:24px;">
        <img src="https://res.cloudinary.com/dpyggloqj/image/upload/v1789812912/WhatsApp_Image_2026-09-19_at_13.06.38.jpg" style="width:6rem;border-radius:1rem;box-shadow:0px 0px 8px 8px rgba(0,0,0,0.1)" />
        <h3 style="opacity:.3;color:#3a005c;">Naqify business</h3>
    </div>
    <div style="width:100%;margin-top:2rem;height:.5px;opacity:.5;background:#000;" >
        
    </div>
        <h1 style="width:100%;display:flex;flex-direction:column;align-items:center; justify-content:center; background:#222222;color:#9f14e0">Password reset URL</h1>
        <h3>Hello ${first_name} ${last_name}, You requested recently to reset password using URL link</h3>
        <strong style="font-size:26px">The URL will expire in 15 Minutes</strong>
        <article>
        <h3>Your reset url :</h3>
            <button type="submit" class="btn" style="width:100%; display:flex;cursor:pointer; flex-direction:column;outline:none;border:none; border-radius:1rem; background:#ffbff5;border:2px solid #cc0eae; justify-content:center; align-items:center; text-align:center">
           <a href=${reset_url}  style="text-decoration:none;width:100%;height:5rem;display:flex;flex-direction:column;justify-content:center;align-items:center;color:#fff;padding:6px;font-size:1.6rem;"><span>Reset Password <i class="fa-solid fa-arrow-up-right-from-square"></i></span></a>
        </button>
           <h3>If you not requested to reset password using URL link,please ignore this email for secuirty</h3>
        </article>
        <p style="color:#5555">Notice do never share this email to anyone !⚠️</p>
        <div style="font-weight:600">
        <p>Thanks,</p>
        <p style="width:100%;display:flex;align-items:center;justify-content:space-between;text-align:center;">Naqify business secuirty<img src="https://res.cloudinary.com/dpyggloqj/image/upload/v1789929635/20260920_213548.png" style="width:3rem;"/></p>
         <div style="width:100%; height:.5px;opacity:.5; background:#222222">
         </div>
         
        </div>
        <p>Done send this message into <a href='https://accounts.google.com/signin/v2/usernamerecovery?flowName=GlifWebSignIn&flowEntry=ServiceLogin'>${email}</a> successfully!</p>
        <p>For more help try to not replay this message for secure     <a href="/" style="color:#cc0eae;">See more help.</a></p>
    
        </div>
    </div>
</body>
</html>`
    }

}


export const welcomeMessage = (username:string,email:string)=>{
    return {
        to:email,
        subject:'Nice to meet you',
        html:`
         <html>
     <head>
        <script src="https://kit.fontawesome.com/YOUR_KIT_CODE.js" crossorigin="anonymous"></script>

      <style>
         .btn:hover{
             background:#0056b3;
         }
        </style>



     </head>
    
     <body>
         <div style="min-width:100vw;min-height:100vh;display:flex;background:#6800c9; align-items:start;justify-content:center;">
<div style="padding:12px;font-family:Arial,sans-serif;font-weight:100;background:white;max-width:600px;min-height:100vh">
        <h3 style="opacity:.3;color:#3a005c;">Naqify business</h3>
        <div style="display:flex;align-items:center;min-width:100%;justify-content:center">
            <h1 style="color:red;font-size:2.5rem">Thanks for joining us!💌</h1>
        </div>
        <div style="display:flex; align-items:center;">
              <h1 style="width:100%;display:flex;flex-direction:column;align-items:start; justify-content:center; color:#6500b8">You just started a new buisness.</h1>
        <svg width="64px" height="64px" viewBox="0 0 1024 1024" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="4.096"></g><g id="SVGRepo_iconCarrier"><path d="M948.7 703c-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17s-20.7-9.8-25.7-17c-5.1-7.3-7.7-10.2-12.7-10.2-5 0-7.5 3-12.7 10.2-5.1 7.2-12 17-25.7 17-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2-4.4 0-8-3.6-8-8s3.6-8 8-8c13.8 0 20.7 9.8 25.7 17 5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17 13.8 0 20.7 9.8 25.7 17 5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 4.4 0 8 3.6 8 8s-3.6 8-8 8zM948.7 653c-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2s-7.5 3-12.7 10.2c-5.1 7.2-12 17-25.7 17s-20.7-9.8-25.7-17c-5.1-7.3-7.7-10.2-12.7-10.2-5 0-7.5 3-12.7 10.2-5.1 7.2-12 17-25.7 17-13.8 0-20.7-9.8-25.7-17-5.1-7.3-7.7-10.2-12.7-10.2-4.4 0-8-3.6-8-8s3.6-8 8-8c13.8 0 20.7 9.8 25.7 17 5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17 13.8 0 20.7 9.8 25.7 17 5.1 7.3 7.7 10.2 12.7 10.2 5 0 7.5-3 12.7-10.2 5.1-7.2 12-17 25.7-17s20.7 9.8 25.7 17c5.1 7.3 7.7 10.2 12.7 10.2 4.4 0 8 3.6 8 8s-3.6 8-8 8z" fill="#9A2D2F"></path><path d="M349.7 103.3m-32 0a32 32 0 1 0 64 0 32 32 0 1 0-64 0Z" fill="#FFEB4D"></path><path d="M349.7 143.3c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40z m0-64c-13.2 0-24 10.8-24 24s10.8 24 24 24 24-10.8 24-24-10.7-24-24-24z" fill="#9A2D2F"></path><path d="M342.2 394.8L94.7 351.5l429-215.7 397 177.3-194 81.7z" fill="#FFACC2"></path><path d="M239.7 324.6c55-1.9 96.1-18.5 133.1-68.5 48.5-65.5 150.7-111.6 150.7-111.6l-404 203.1 66.1 11.6c11-14.1 25.8-33.6 54.1-34.6z" fill="#FFFFFF"></path><path d="M341.7 394.8l181.2-259 202.8 259z" fill="#FFEB4D"></path><path d="M523.7 135.8l396.9 177.3-194 81.7z" fill="#C0FCD0"></path><path d="M653.7 949.3c-51.3-56.5-125.2-92-207.5-92s-156.2 35.5-207.5 92h415z" fill="#FFFFFF"></path><path d="M845.7 950.3s-85.9-104-167.7-129c-82.8-25.3-154.7 23.1-227.8-0.8-101.4-33.3-194.9-186.1-194.9-186.1h-52.6s102.9 178.8 208.2 215.4c66.5 23.1 167.7-13.6 236.7 0.4 57.6 11.8 132.8 100.1 132.8 100.1h65.3z" fill="#DAE5FF"></path><path d="M69.7 203.6c5 0 7.5 3 12.7 10.2 5.1 7.2 12 17 25.7 17s20.7-9.8 25.7-17c5.1-7.3 7.7-10.2 12.7-10.2s7.5 3 12.7 10.2c5.1 7.2 12 17 25.7 17 13.8 0 20.7-9.8 25.7-17 5.1-7.3 7.7-10.2 12.7-10.2 5 0 7.5 3 12.7 10.2 5.1 7.2 12 17 25.7 17 4.4 0 8-3.6 8-8s-3.6-8-8-8c-5 0-7.5-3-12.7-10.2-5.1-7.2-12-17-25.7-17s-20.7 9.8-25.7 17c-5.1 7.3-7.7 10.2-12.7 10.2-5 0-7.5-3-12.7-10.2-5.1-7.2-12-17-25.7-17s-20.7 9.8-25.7 17c-5.1 7.3-7.7 10.2-12.7 10.2s-7.5-3-12.7-10.2c-5.1-7.2-12-17-25.7-17-4.4 0-8 3.6-8 8s3.5 8 8 8z" fill="#9A2D2F"></path><path d="M923.7 941.3h-75.1c-16.8-19.6-93.2-104.7-168.2-127.7-44-13.5-84.3-7-123.3-0.8-8.5 1.4-17 2.7-25.3 3.8V402.8h195.8c0.1 0 0.2 0 0.4-0.1 0.1 0 0.3 0 0.4-0.1 0.5-0.1 1-0.3 1.5-0.5l194-81.7c2.9-1.2 4.9-4.1 4.9-7.3s-1.8-6.1-4.7-7.4l-397-177.3s-0.1 0-0.1-0.1c-0.2-0.1-0.4-0.2-0.6-0.2-0.1 0-0.2-0.1-0.3-0.1-0.2-0.1-0.3-0.1-0.5-0.1-0.1 0-0.2 0-0.3-0.1-0.2 0-0.5-0.1-0.7-0.1H522.9c-2 0.1-3.8 0.8-5.2 2.1L245.1 267c-1.4-1.3-3.3-2-5.3-2-3.7 0-5.9-3-10.2-9.9-4.6-7.3-10.9-17.4-23.8-17.4s-19.2 10.1-23.8 17.4c-4.3 6.9-6.5 9.9-10.2 9.9-3.7 0-5.9-3-10.2-9.9-4.6-7.3-10.9-17.4-23.8-17.4s-19.2 10.1-23.8 17.4c-4.3 6.9-6.5 9.9-10.2 9.9s-5.9-3-10.2-9.9c-4.6-7.3-10.9-17.4-23.8-17.4-4.4 0-8 3.6-8 8s3.6 8 8 8c3.7 0 5.9 3 10.2 9.9 4.6 7.3 10.9 17.4 23.8 17.4s19.2-10.1 23.8-17.4c4.3-6.9 6.5-9.9 10.2-9.9s5.9 3 10.2 9.9c4.6 7.3 10.9 17.4 23.8 17.4s19.2-10.1 23.8-17.4c4.3-6.9 6.5-9.9 10.2-9.9s5.9 3 10.2 9.9c2.6 4.2 5.8 9.3 10.4 12.9l-135.3 68c-3.1 1.5-4.8 4.9-4.3 8.3 0.5 3.4 3.1 6.1 6.5 6.7l245.9 43c0.8 0.2 1.6 0.4 2.4 0.4h174v413.6c0 0.7 0.1 1.3 0.3 1.9-21.4 1.9-42.4 1.3-63.2-5.5-40-13.1-85.5-48.7-131.7-102.9-35.3-41.4-58.6-79.4-58.9-79.7-1.5-2.4-4-3.8-6.8-3.8h-52.6c-2.9 0-5.5 1.5-6.9 4-1.4 2.5-1.4 5.5 0 8 0.3 0.5 26.5 45.8 65.2 94.9 25.3 32.1 49.9 58.4 73.7 78.8l-50.6 87.1c-17.7 12.1-34.1 26.2-48.9 42.1H99.7c-4.4 0-8 3.6-8 8s3.6 8 8 8h676.8c1.2 0.6 2.5 1 3.9 1h65.4c1.4 0 2.7-0.4 3.8-1h74.2c4.4 0 8-3.6 8-8s-3.7-8.1-8.1-8.1z m-23.2-628.4l-171.4 72.2-179.2-228.8 350.6 156.6zM338.1 386l-218.2-38.2 377.9-190L338.1 386z m18.9 0.8l166.3-237.6 185.9 237.6H357z m-9.8 435.6c4.6 3.6 9.2 7 13.8 10.2l-21.4 37.1c-4.1 1.6-8.2 3.3-12.2 5.2-5.1 2.3-10.1 4.8-15 7.3l34.8-59.8z m-89.6 118.9c22.4-21.6 48.1-39 76.5-51.9 35.3-16 73-24.1 112.1-24.1s76.8 8.1 112.1 24.1c28.5 12.9 54.1 30.3 76.5 51.9H257.6z m105.2-79.7l11.7-20.3c8 4.8 15.8 8.8 23.5 12.1-11.9 1.9-23.6 4.7-35.2 8.2z m294.3 79.7c-26.2-28.2-57.3-50.6-92.3-66.5-11.8-5.3-23.8-9.8-36-13.5l11.1-1.2c38.9-4.3 75.7-8.3 106-2.1 40.6 8.3 91.9 58.3 115.4 83.3H657.1z m126 0c-15.5-17.5-80.6-88.1-133.9-99-32.8-6.7-72.5-2.3-111 1.9-44.4 4.9-90.3 9.9-124.7-2-85.7-29.8-171.6-159.5-196.6-199.9h34c6.9 10.8 27.9 42.6 57.8 77.8 48.8 57.4 95.6 93.7 139.1 107.9 37.6 12.4 75.3 6.4 111.8 0.6 37.2-5.9 75.7-12 116.1 0.3 60.7 18.6 125 83.5 151.4 112.4h-44z" fill="#9A2D2F"></path></g></svg>
        </div>
        <h3>Welcome ${username} to naqify buisness ,Your free trial started today.</h3>
        <h3 >Just try our service consistes pationate , building , imapct , start successful buisness and antifrustration.</h3>
               <h3></h3> 
 
           <h3>We present you best opportunites for you to get more power job </h3>
           <h3>We guide you to listen to courses and get accredited cerification for example google accredited certificate technology .
           </h3>
           <button class="btn" style="padding:12px;border:none;background:#ab6bff;transition:background .3s ease; cursor:pointer;color:white;border-radius:4px;">Got it</button>
           <h2>Our contacts:-</h2>
            <ul>
                <li style="color:#000">
                    <a href="https://wa.me:+2001028856441">
                        +2001028856441 📞
                    </a>
                </li>
                <li>
                    <a href="https://wa.me:+201207794229">
                        +201207794229 📞
                    </a>
                </li>
            </ul>           
        
        <div style="width:100%; height:2px; background:#2222"></div>
        <p style="color:#5555">&#169; 2026 - 2027 Naqify business & Welcome message</p>
        </div>
    </div>
     </body>
 </html>
        `
    }
}