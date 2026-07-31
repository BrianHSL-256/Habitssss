import { Types } from 'mongoose';
import { Section } from '../models/Section.model';
import { UserSection } from '../models/UserSection.model';
import { AppError } from '../errors/AppError';
import type { SectionSlug } from '../constants/sections';

export const listAvailableSections = () =>
  Section.find({ isAvailable: true }).sort({ name: 1 }).lean();

export const listUserSections = (userId: Types.ObjectId | string) =>
  UserSection.find({ userId })
    .populate('sectionId', 'slug name isAvailable')
    .sort({ position: 1 })
    .lean();

export const setUserSection = async (
  userId: Types.ObjectId | string,
  slug: SectionSlug,
  isEnabled: boolean,
) => {
  const section = await Section.findOne({ slug, isAvailable: true }).select('_id');

  // Si no existe o está apagada, es error del cliente. NO la creamos.
  if (!section) {
    throw new AppError('Section not available', 404, 'SECTION_NOT_AVAILABLE');
  }

  return UserSection.findOneAndUpdate(
    { userId, sectionId: section._id },
    { $set: { isAvalable: isEnabled }, $setOnInsert: { userId, sectionId: section._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
};