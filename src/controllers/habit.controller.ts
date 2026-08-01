import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as habitService from '../services/habit.service';
import { AppError } from '../errors/AppError';

// Guárdalo en: src/controllers/habit.controller.ts

/** Corta la request si express-validator encontró errores */
const checkValidation = (req: AuthRequest): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Si más adelante amplías AppError para recibir detalles, puedes pasarle
    // errors.array() como 4º argumento y el front sabrá qué campo falló.
    throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
  }
};

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const habits = await habitService.listHabits(req.userId!, {
      categoryId: req.query.categoryId as string | undefined,
      includeArchived: req.query.includeArchived === 'true',
      onlyArchived: req.query.onlyArchived === 'true',
    });

    return res.json({ habits });
  } catch (error) {
    return next(error);
  }
};

export const getOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    const habit = await habitService.getHabitById(req.userId!, id);
    return res.json({ habit });
  } catch (error) {
    return next(error);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    checkValidation(req);

    const habit = await habitService.createHabit(req.userId!, req.body);

    return res.status(201).json({ habit });
  } catch (error) {
    return next(error);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    checkValidation(req);

    const { id } = req.params as { id: string };

    const habit = await habitService.updateHabit(req.userId!, id, req.body);

    return res.json({ habit });
  } catch (error) {
    return next(error);
  }
};

export const archive = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    const habit = await habitService.archiveHabit(req.userId!, id);
    return res.json({ habit });
  } catch (error) {
    return next(error);
  }
};

export const restore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    const habit = await habitService.restoreHabit(req.userId!, id);
    return res.json({ habit });
  } catch (error) {
    return next(error);
  }
};

export const destroy = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    await habitService.deleteHabit(req.userId!, id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const reorder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    checkValidation(req);

    const habits = await habitService.reorderHabits(req.userId!, req.body.orderedIds);
    return res.json({ habits });
  } catch (error) {
    return next(error);
  }
};