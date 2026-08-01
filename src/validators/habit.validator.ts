import { body } from 'express-validator';
import {
  HABIT_TRACKING_TYPES,
  HABIT_FREQUENCIES,
} from '../models/Habit.model';

// Guárdalo en: src/validators/habit.validator.ts

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const needsValue = (trackingType?: string) =>
  trackingType === 'quantity' || trackingType === 'duration';

export const createHabitValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ max: 120 })
    .withMessage('El nombre no puede pasar de 120 caracteres'),

  body('categoryId')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('categoryId inválido'),

  body('trackingType')
    .isIn(HABIT_TRACKING_TYPES)
    .withMessage('trackingType inválido'),

  /* ---------- Meta numérica (quantity | duration) ---------- */
  body('targetValue')
    .if((_v, { req }) => needsValue(req.body.trackingType))
    .notEmpty()
    .withMessage('targetValue es obligatorio para cantidad o duración')
    .bail()
    .isFloat({ min: 0, max: 99_999_999.99 })
    .withMessage('targetValue debe ser un número positivo'),

  body('targetValueMax')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 99_999_999.99 })
    .withMessage('targetValueMax debe ser un número positivo')
    .bail()
    .custom((value, { req }) => {
      if (value == null) return true;
      if (Number(value) <= Number(req.body.targetValue)) {
        throw new Error('targetValueMax debe ser mayor que targetValue');
      }
      return true;
    }),

  body('unit')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 20 })
    .withMessage('La unidad no puede pasar de 20 caracteres'),

  /* ---------- Meta de hora (time) ---------- */
  body('targetTime')
    .if((_v, { req }) => req.body.trackingType === 'time')
    .notEmpty()
    .withMessage('targetTime es obligatorio para hábitos de tipo hora')
    .bail()
    .matches(TIME_RE)
    .withMessage('targetTime debe ir en formato HH:mm (24h)'),

  body('targetTimeMax')
    .optional({ nullable: true })
    .matches(TIME_RE)
    .withMessage('targetTimeMax debe ir en formato HH:mm (24h)')
    .bail()
    .custom((value, { req }) => {
      if (!value) return true;
      if (value <= req.body.targetTime) {
        throw new Error('targetTimeMax debe ser posterior a targetTime');
      }
      return true;
    }),

  /* ---------- Frecuencia ---------- */
  body('frequency')
    .isIn(HABIT_FREQUENCIES)
    .withMessage('frequency inválida'),

  body('daysOfWeek')
    .optional()
    .isArray()
    .withMessage('daysOfWeek debe ser un arreglo')
    .bail()
    .custom((days: unknown[], { req }) => {
      const valid = days.every(
        (d) => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6,
      );
      if (!valid) throw new Error('daysOfWeek debe traer enteros entre 0 (dom) y 6 (sáb)');
      if (new Set(days).size !== days.length) {
        throw new Error('daysOfWeek no admite días repetidos');
      }
      if (req.body.frequency === 'weekly_days' && days.length === 0) {
        throw new Error('Selecciona al menos un día de la semana');
      }
      return true;
    }),

  body('targetPerWeek')
    .if((_v, { req }) => req.body.frequency === 'times_per_week')
    .notEmpty()
    .withMessage('targetPerWeek es obligatorio cuando frequency = times_per_week')
    .bail()
    .isInt({ min: 1, max: 7 })
    .withMessage('targetPerWeek debe ser un entero entre 1 y 7'),

  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('position debe ser un entero positivo'),
];

/** En update todo es opcional, pero se valida lo que llegue */
export const updateHabitValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede quedar vacío')
    .isLength({ max: 120 }),

  body('categoryId').optional({ nullable: true }).isMongoId(),
  body('trackingType').optional().isIn(HABIT_TRACKING_TYPES),
  body('targetValue').optional({ nullable: true }).isFloat({ min: 0 }),
  body('targetValueMax').optional({ nullable: true }).isFloat({ min: 0 }),
  body('unit').optional({ nullable: true }).trim().isLength({ max: 20 }),
  body('targetTime').optional({ nullable: true }).matches(TIME_RE),
  body('targetTimeMax').optional({ nullable: true }).matches(TIME_RE),
  body('frequency').optional().isIn(HABIT_FREQUENCIES),
  body('daysOfWeek').optional().isArray(),
  body('targetPerWeek').optional({ nullable: true }).isInt({ min: 1, max: 7 }),
  body('position').optional().isInt({ min: 0 }),
];

export const reorderHabitsValidator = [
  body('orderedIds')
    .isArray({ min: 1 })
    .withMessage('orderedIds debe ser un arreglo con al menos un id')
    .bail()
    .custom((ids: string[]) => {
      if (new Set(ids).size !== ids.length) {
        throw new Error('orderedIds no admite ids repetidos');
      }
      return true;
    }),
  body('orderedIds.*').isMongoId().withMessage('Algún id no es un ObjectId válido'),
];