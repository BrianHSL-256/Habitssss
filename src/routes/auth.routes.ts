import { Router } from 'express';
import { 
    register, 
    login, 
    refreshToken, 
    logout 
} from '../controllers/auth.controller';
import { body } from 'express-validator';

const router = Router();

// Ruta de Registro con validaciones básicas
router.post('/register', register);

// Ruta de Inicio de Sesión
router.post('/login',login);

// Ruta para Refrescar el Access Token
router.post('/refresh-token', refreshToken);

// Ruta de Cierre de Sesión (Logout)
router.post(
    '/logout',
    [
        body('refreshToken').notEmpty().withMessage('Refresh token is required')
    ],
    logout
);

export default router;