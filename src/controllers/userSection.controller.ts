import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as sectionService from '../services/userSection.service';
import { SECTION_SLUGS, type SectionSlug } from '../constants/sections';
import { AppError } from '../errors/AppError';

export const getAvailable = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return res.json({ sections: await sectionService.listAvailableSections() });
  } catch (error) {
    return next(error);
  }
};

export const getMine = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return res.json({ sections: await sectionService.listUserSections(req.userId!) });
  } catch (error) {
    return next(error);
  }
};

export const toggle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { isEnabled } = req.body;

    if (!SECTION_SLUGS.includes(slug as SectionSlug)) {
      throw new AppError('Invalid section', 400, 'INVALID_SECTION');
    }

    const updated = await sectionService.setUserSection(
      req.userId!,
      slug as SectionSlug,
      Boolean(isEnabled),
    );

    return res.json({ section: updated });
  } catch (error) {
    return next(error);
  }
};