import { Router } from 'express';
import { 
    list, 
    getOne, 
    create, 
    update, 
    archive, 
    restore, 
    destroy, 
    reorder 
} from '../controllers/habit.controller';
import { roleAuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/habits
 * @desc    Lista los hábitos del usuario
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.get(
    '/', 
    roleAuthMiddleware(['customer', 'admin']), 
    list
);

/**
 * @route   GET /api/habits/:id
 * @desc    Obtiene un hábito por su ID
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.get(
    '/:id', 
    roleAuthMiddleware(['customer', 'admin']), 
    getOne
);

/**
 * @route   POST /api/habits
 * @desc    Crea un nuevo hábito
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.post(
    '/', 
    roleAuthMiddleware(['customer', 'admin']), 
    create
);

/**
 * @route   PUT /api/habits/:id
 * @desc    Actualiza un hábito existente
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.put(
    '/:id', 
    roleAuthMiddleware(['customer', 'admin']), 
    update
);

/**
 * @route   PATCH /api/habits/:id/archive
 * @desc    Archiva un hábito
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.patch(
    '/:id/archive', 
    roleAuthMiddleware(['customer', 'admin']), 
    archive
);

/**
 * @route   PATCH /api/habits/:id/restore
 * @desc    Restaura un hábito archivado
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.patch(
    '/:id/restore', 
    roleAuthMiddleware(['customer', 'admin']), 
    restore
);

/**
 * @route   DELETE /api/habits/:id
 * @desc    Elimina permanentemente un hábito
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.delete(
    '/:id', 
    roleAuthMiddleware(['customer', 'admin']), 
    destroy
);

/**
 * @route   PATCH /api/habits/reorder
 * @desc    Reordena los hábitos del usuario
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.patch(
    '/reorder', 
    roleAuthMiddleware(['customer', 'admin']), 
    reorder
);

export default router;