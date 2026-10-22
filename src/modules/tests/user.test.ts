// import { pool } from "config/db/pg.db";
// import { logger } from "@utils/utils/logger";
// import { UserService } from "@modules/auth/user.service";
// import { AppError} from "@utils/errors/AppError";
// import cpo from 'crypto'
// import { User_Role } from "@modules/auth/auth.type";


// const userserv = new UserService();

// export async function testtUserRegisteration  (){
// console.log(`=============customize Function to test user=================`);
// try {
    
//  const user_data = {
//     username:'kamudsjoddfffe3',
//     email:'ahmedasasad191dd2340@gmail.com',
//     role:User_Role.USER,
//     first_name:'Tests',
//     password_hash:'Ah12834899!@',
//     last_name:'Users',
//     phone_number:('+20'+cpo.randomInt(10).toString())
// }

// console.log('User registration',user_data.username);
// const result  =  await userserv.register(user_data);
// console.log('Registeration Successfully!');
// console.log("Result registeration info",{
//     id:result.user.id,
//     email:result.user.email,
//     username:result.user.username,
//     role:result.user.role,
// })
// console.log("Token registeration info",{
//     access_token:result.tokens.access_token.substring(0,50)+'...',
//     refresh_token:result.tokens.refresh_token.substring(0,50)+'...',
//     access_expiry:result.tokens.access_expiry,
//     refresh_expiry:result.tokens.refresh_expiry,
// });
// return result
// } catch (error:unknown) {
//     console.error('❌ Registration failed:', error);
//     throw error;
    
// }
// }

// testtUserRegisteration().then(()=>{
//     console.log('Test completed successfully');
//     process.exit(0)
// }).catch((error)=>{
//     console.error('Test failed ',error);
// });
