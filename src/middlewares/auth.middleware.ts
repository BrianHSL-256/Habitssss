
import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';


export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
}

export const roleAuthMiddleware = (allowedRoles: string[]) => {
    return (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ): Response | void => {



        const authHeader = req.headers.authorization;


        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({message: "No token provided"});
        }       

        const token = authHeader.split(' ')[1];

        try{
            const payload = jwt.verify(
                    token,
                    process.env.JWT_SECRET as string
                ) as { userId: string, role: string };

                req.userId = payload.userId;

                console.log(req.userId);
                   req.role = payload.role;

                console.log(req.role);
                

                if(!allowedRoles.includes(payload.role)){
                    return res.status(403).json({message: "You don't have enough permissions"});
                }

             
                next();



        }catch(error){  
            
            return res.status(401).json({message: "Invalid token"});
        }       


    }

}


