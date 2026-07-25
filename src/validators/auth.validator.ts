import {body} from 'express-validator'; 

export const registerValidator = [

    body('email').optional().isEmail().withMessage('Invalid Email Address'),
    body('password').isLength({min: 8}).withMessage('Password must be at least 8 characters long'),
   


];


export const loginValidator = [
    
    body('password')
        .notEmpty(),

    body('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email'),


];
