

import {Request, Response} from 'express'; 
import bcrypt from 'bcrypt'; 
import { validationResult } from 'express-validator';
import {User} from '../models/User.model';
import { RefreshToken } from '../models/RefreshToken.model';
import {generateToken, generateRefreshToken} from '../utils/jwt';
import jwt from 'jsonwebtoken';


export const register = async (req: Request, res: Response)  =>{

    const errors = validationResult(req)
    
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {name, email, password} =  req.body;

    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail) {
        return res.status(400).json({ message: "Email  is required" });
    }

    const query: any[] = [];

    if (normalizedEmail) query.push({ email: normalizedEmail });
   
    const existingUser = await User.findOne({ $or: query });
   
    if(existingUser){
        return res.status(400).json({message: "User already exists"}); 
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'customer'
    })

    const accessToken = generateToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString(), user.role);


    await RefreshToken.create({
        user: user._id, 
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7*24*60*60*1000) // 7 days
    })


    //Send access token on header

    res.setHeader("x-access-token", accessToken); 
    res.setHeader("x-refresh-token", refreshToken)

    
    return res.status(201).json({
        user: {
            userName: user.name, 
            email: user.email, 
            role: user.role
        }    
    });



}


export const login = async (req: Request, res: Response) =>{

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }


    const {email, password} = req.body; 

    const normalizedEmail = email?.toLowerCase().trim();


     if (!normalizedEmail) {
        return res.status(400).json({ message: "Email or phone is required" });
    }

    const query: any[] = [];

    if (normalizedEmail) query.push({ email: normalizedEmail });

    const user = await User.findOne({ $or: query });

    if(!user){
        return res.status(400).json({message: "Invalid credentials"});

    }


    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        return res.status(401).json({message: "Invalid credentials"});
    }


    const accessToken = generateToken(user._id.toString(), user.role);

    const refreshToken = generateRefreshToken(user._id.toString(), user.role); 


    await RefreshToken.create({
        user: user._id, 
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7*24*60*60*1000) // 7 days
    })


    //Send access token on header

    res.setHeader("x-access-token", accessToken); 
    res.setHeader("x-refresh-token", refreshToken)


    return res.status(200).json({
        user: {
            userName: user.name, 
            email: user.email, 
            role: user.role
        }    
    });



}; 


export const refreshToken = async (req: Request, res: Response) => {


    
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(400).json({ message: "Refresh token is required" });
    }

    const refreshToken = authHeader.split(" ")[1];




    const storedToken = await RefreshToken.findOne({token: refreshToken});

    if(!storedToken){
        return res.status(401).json({message: "Invalid refresh token"});
    }

    try{
        const payload = jwt.verify(
            refreshToken, 
            process.env.REFRESH_TOKEN_SECRET as string
        ) as {userId: string, role: string};

        const newAccessToken = generateToken(payload.userId, payload.role );


         res.setHeader("x-access-token",newAccessToken); 

        return res.status(200)
        .json({
            message: "New access token generated"
        }); 




    }catch(error){
        return res.status(401).json({message: "Invalid refresh token"});
    }


}


export const logout = async (req: Request, res: Response) => {
    
    const {refreshToken} = req.body;

    if(!refreshToken){
        return res.status(401).json({message: "Refresh token is required"});
    }

    const deleted = await RefreshToken.deleteOne({token: refreshToken});


    return res.status(204).json({message: "Logged out successfully"});

}






