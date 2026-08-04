import { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as registerService from '../services/habitRegister.service';
import { AppError } from '../errors/AppError';

const checkValidation = (req: AuthRequest): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
  }
};

/** POST /registers — crea o actualiza el registro del día (idempotente) */
export const upsert = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    checkValidation(req);

    const log = await registerService.upsertLog(req.userId!, req.body);
    
    return res.status(201).json({ register: log });
  } catch (error) {
    return next(error);
  }
};

/** GET /registers?from=YYYY-MM-DD&to=YYYY-MM-DD&habitId= */
export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to, habitId } = req.query as { from?: string; to?: string; habitId?: string };

    if (!from || !to) {
      throw new AppError('from y to son obligatorios (YYYY-MM-DD)', 400, 'MISSING_RANGE');
    }

    const registers = await registerService.listLogsByRange(req.userId!, { from, to, habitId });
    return res.json({ registers });
  } catch (error) {
    return next(error);
  }
};

export const getOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    const register = await registerService.getLogById(req.userId!, id);
    return res.json({ register });
  } catch (error) {
    return next(error);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    checkValidation(req);

    const { id } = req.params as { id: string };

    const register = await registerService.updateLog(req.userId!, id, req.body);
    return res.json({ register });
  } catch (error) {
    return next(error);
  }
};

export const destroy = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };

    await registerService.deleteLog(req.userId!, id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};