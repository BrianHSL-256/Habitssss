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
} from '../controllers/categoryHabit.controller';
import { roleAuthMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/categories
 * @desc    Lista las categorías del usuario
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.get(
    '/', 
    roleAuthMiddleware(['customer', 'admin']), 
    list
);

/**
 * @route   GET /api/categories/:id
 * @desc    Obtiene una categoría por su ID
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.get(
    '/:id', 
    roleAuthMiddleware(['customer', 'admin']), 
    getOne
);

/**
 * @route   POST /api/categories
 * @desc    Crea una nueva categoría
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.post(
    '/', 
    roleAuthMiddleware(['customer', 'admin']), 
    create
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Actualiza una categoría existente
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.put(
    '/:id', 
    roleAuthMiddleware(['customer', 'admin']), 
    update
);

/**
 * @route   PATCH /api/categories/:id/archive
 * @desc    Archiva una categoría
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.patch(
    '/:id/archive', 
    roleAuthMiddleware(['customer', 'admin']), 
    archive
);

/**
 * @route   PATCH /api/categories/:id/restore
 * @desc    Restaura una categoría archivada
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.patch(
    '/:id/restore', 
    roleAuthMiddleware(['customer', 'admin']), 
    restore
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Elimina permanentemente una categoría
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.delete(
    '/:id', 
    roleAuthMiddleware(['customer', 'admin']), 
    destroy
);

/**
 * @route   PATCH /api/categories/reorder
 * @desc    Reordena las categorías del usuario
 * @access  Privado (Requiere estar autenticado, rol 'customer' o 'admin')
 */
router.patch(
    '/reorder', 
    roleAuthMiddleware(['customer', 'admin']), 
    reorder
);

export default router;