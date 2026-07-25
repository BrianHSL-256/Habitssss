import jwt from 'jsonwebtoken';



const parseExpires = (value: string, fallbackSeconds: number): number => {
    


    const map: Record<string, number> = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400,
        y: 31536000
    }

     const match = value.match(/^(\d+)([smhdy])$/);

     if(!match){
        return fallbackSeconds
     }


     return parseInt(match[1], 10) * map[match[2]];

}




export const generateToken = (userId: string, role: string): string => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET as string,
    {
      expiresIn: parseExpires(
        process.env.JWT_EXPIRES || '15m',
        900
      )
    }
  );
};



export const generateRefreshToken = (userId: string, role: string): string => {

    return jwt.sign(
        {userId, role}, 
        process.env.REFRESH_TOKEN_SECRET as string,
        {
            expiresIn: parseExpires(
                process.env.REFRESH_TOKEN_EXPIRES || '7d',
                604800
            )
        }
    )


}
