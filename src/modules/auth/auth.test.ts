import { UserRepo } from "./user.repository";
import cpo from 'crypto';


const userrepo = new UserRepo()
export const ResetTester = async () => {
    const data_body = {
        id:'3139d221-5a4b-4348-9df1-ad72313d6fdf',
        reset_code:cpo.randomInt(100000,999999).toString(),
        reset_code_expiry:new Date(Date.now() + 1000 * 60 * 2)
    }
    const reset_code_hash = cpo.createHash('sha256').update(data_body.reset_code).digest('hex')
    const result = await userrepo.updateResetCode(data_body.id,reset_code_hash,data_body.reset_code_expiry)
    console.log('RESULT_RESET_TESTER:',{
        result:result,
        id:data_body.id,
        reset_code:reset_code_hash,
        reset_code_expiry:data_body.reset_code_expiry
    })
}
ResetTester()