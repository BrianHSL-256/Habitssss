import { Router } from 'express';
import { 
    upsert, 
    list, 
    getOne, 
    update, 
    destroy 
} from '../controllers/habitRegister.controller';
import { roleAuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/registers
 * @desc    Crea o actualiza el registro del día (idempotente)
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.post(
    '/', 
    roleAuthMiddleware(['customer', 'admin']), 
    upsert
);

/**
 * @route   GET /api/registers
 * @desc    Lista los registros de hábitos por rango de fechas (from, to, habitId)
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.get(
    '/', 
    roleAuthMiddleware(['customer', 'admin']), 
    list
);

/**
 * @route   GET /api/registers/:id
 * @desc    Obtiene un registro por su ID
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.get(
    '/:id', 
    roleAuthMiddleware(['customer', 'admin']), 
    getOne
);

/**
 * @route   PUT /api/registers/:id
 * @desc    Actualiza un registro existente por su ID
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.put(
    '/:id', 
    roleAuthMiddleware(['customer', 'admin']), 
    update
);

/**
 * @route   DELETE /api/registers/:id
 * @desc    Elimina permanentemente un registro por su ID
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.delete(
    '/:id', 
    roleAuthMiddleware(['customer', 'admin']), 
    destroy
);

export default router;