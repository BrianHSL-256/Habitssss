import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as categoryService from '../services/categoryHabit.service';
import { AppError } from '../errors/AppError';

/** Corta la request si express-validator encontró errores */
const checkValidation = (req: AuthRequest): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
  }
};

export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryService.listCategories(req.userId!, {
      includeArchived: req.query.includeArchived === 'true',
      onlyArchived: req.query.onlyArchived === 'true',
    });

    return res.json({ categories });
  } catch (error) {
    return next(error);
  }
};

export const getOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    const category = await categoryService.getCategoryById(req.userId!, id);
    return res.json({ category });
  } catch (error) {
    return next(error);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    checkValidation(req);

    const category = await categoryService.createCategory(req.userId!, req.body);
    return res.status(201).json({ category });
  } catch (error) {
    return next(error);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    checkValidation(req);

    const { id } = req.params as { id: string };

    const category = await categoryService.updateCategory(req.userId!, id, req.body);
    return res.json({ category });
  } catch (error) {
    return next(error);
  }
};

export const archive = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    const { category, habitsAfectados } = await categoryService.archiveCategory(
      req.userId!,
      id,
      { moveHabitsTo: req.body?.moveHabitsTo },
    );

    return res.json({ category, habitsAfectados });
  } catch (error) {
    return next(error);
  }
};

export const restore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    const category = await categoryService.restoreCategory(req.userId!, id);
    return res.json({ category });
  } catch (error) {
    return next(error);
  }
};

export const destroy = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    await categoryService.deleteCategory(req.userId!, id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

export const reorder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    checkValidation(req);

    const categories = await categoryService.reorderCategories(req.userId!, req.body.orderedIds);
    return res.json({ categories });
  } catch (error) {
    return next(error);
  }
};