import { body } from 'express-validator';
import { HEX_COLOR_RE } from '../models/CategoryHabit.model';

export const createCategoryRules = [
  body('name')
    .isString().withMessage('name debe ser texto')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 80 }).withMessage('Máximo 80 caracteres'),
  body('color').optional().matches(HEX_COLOR_RE).withMessage('Color hex inválido (#CCFF00)'),
  body('icon').optional().isString().trim().isLength({ max: 50 }),
  body('position').optional().isInt({ min: 0 }).toInt(),
  body('userSectionId').optional({ values: 'null' }).isMongoId(),
];

export const updateCategoryRules = [
  body('name').optional().isString().trim().notEmpty().isLength({ max: 80 }),
  body('color').optional().matches(HEX_COLOR_RE).withMessage('Color hex inválido (#CCFF00)'),
  body('icon').optional().isString().trim().isLength({ max: 50 }),
  body('position').optional().isInt({ min: 0 }).toInt(),
  body('userSectionId').optional({ values: 'null' }).isMongoId(),
];

export const reorderRules = [
  body('orderedIds').isArray({ min: 1 }).withMessage('orderedIds debe ser un arreglo'),
  body('orderedIds.*').isMongoId().withMessage('id inválido en orderedIds'),
];