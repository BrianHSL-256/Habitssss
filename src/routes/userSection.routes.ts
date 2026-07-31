import { Router } from 'express';
import { 
    getAvailable, 
    getMine, 
    toggle 
} from '../controllers/userSection.controller';  // Ajusta la ruta si es necesario
import { roleAuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/sections/available
 * @desc    Obtiene las secciones disponibles
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */

router.get(
    '/available', 
    roleAuthMiddleware(['customer', 'admin']), 
    getAvailable
);

/**
 * @route   GET /api/sections/mine
 * @desc    Obtiene las secciones del usuario autenticado
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.get(
    '/mine', 
    roleAuthMiddleware(['customer', 'admin']), 
    getMine
);

/**
 * @route   PATCH /api/sections/toggle/:slug
 * @desc    Habilita o deshabilita una sección para el usuario
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.patch(
    '/toggle/:slug', 
    roleAuthMiddleware(['customer', 'admin']), 
    toggle
);

export default router;