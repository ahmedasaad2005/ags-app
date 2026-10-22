import bt from 'bcrypt';
import cpo from 'crypto';


export const hashPassword = async (password_to_hash:string):Promise<string>=>{
    const salt = await bt.genSalt(12);
    return await bt.hash(password_to_hash,salt)
}

export const comparePassword = async (plain_password:string,hashed_password:string):Promise<boolean>=>{
    return bt.compare(plain_password,hashed_password)
}

export const generateRandomCode = (length:number=6):number=>{
    const min = Math.pow(10,(length - 1))
    const max = Math.pow(10,length) - 1
    return cpo.randomInt(min,max)
}

export const generateRandomToken = (bytes:number=32) :string=> {
    return cpo.randomBytes(bytes).toString('hex')
}

export const generateRandomUuid = () :string => {
    return cpo.randomUUID()
}

export const hashToken = (token_to_hash:string) :string => {
    return cpo.createHash('sha256').update(token_to_hash).digest('hex')
}