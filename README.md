//to hash passwords use bcrypt.hash(password,salt);
//to generate reset code crypto.randomInt(min,max);
//to generate random reset token crypto.randomBytes(64).toString('hex);
//to hash reset code crypto.createHash('sha256').update(this.code).digest('hex');
//to generate refresh token by a specific we use jwt.sign({payload},process.env.JWT_REFRESH_SECRER,{exp:'7days'}); 
//to generate access token by a specific we use jwt.sign({payload},process.env.JWT_ACCESS_SECRET,{exp:'7days'}); 
//to extract token from cookies we use req.cookies.refresh_token or req.headers['authorization'];
//verify the token not fake or match with signature we use jwt.verify(refresh_token,JWT_REFRESH_SECRET);
//to decode the token and extract expiration time jwt.decode(token) AS {exp?:number};
//about email to create transporter we need to property ndmr.createTransport{service:'gmail',secure:auth:{user:process.env.SMTP_USER,pass:SMTP_PASS}}
//
