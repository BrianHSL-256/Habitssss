import { Types, isValidObjectId } from 'mongoose';
import { CategoryHabit, ICategoryHabit } from '../models/CategoryHabit.model';
import { Habit } from '../models/Habit.model';
import { AppError } from '../errors/AppError';

/* ============================================================
   TIPOS DE ENTRADA
   ============================================================ */

export interface CreateCategoryInput {
  name: string;
  color?: string;
  icon?: string;
  position?: number;
  userSectionId?: string | null;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export interface ListOptions {
  includeArchived?: boolean;
  onlyArchived?: boolean;
}

type OwnerId = Types.ObjectId | string;

/* ============================================================
   HELPERS
   ============================================================ */

const assertObjectId = (id: string, campo = 'id'): void => {
  if (!isValidObjectId(id)) {
    throw new AppError(`Invalid ${campo}`, 400, 'INVALID_ID');
  }
};

/** Traduce el índice unique parcial (userId + name donde archivedAt = null) a un 409 legible */
const asDuplicateError = (err: any): never => {
  if (err?.code === 11000) {
    throw new AppError('Ya tienes una categoría con ese nombre', 409, 'CATEGORY_NAME_TAKEN');
  }
  throw err;
};

/** Whitelist: nunca dejes que el body escriba userId ni archivedAt */
const pickWritableFields = (input: UpdateCategoryInput) => {
  const data: Partial<ICategoryHabit> = {};

  if (input.name !== undefined) data.name = input.name.trim();
  if (input.color !== undefined) data.color = input.color;
  if (input.icon !== undefined) data.icon = input.icon;
  if (input.position !== undefined) data.position = input.position;
  if (input.userSectionId !== undefined) {
    if (input.userSectionId === null) {
      data.userSectionId = undefined;
    } else {
      assertObjectId(input.userSectionId, 'userSectionId');
      data.userSectionId = new Types.ObjectId(input.userSectionId);
    }
  }

  return data;
};

/* ============================================================
   LECTURA
   ============================================================ */

export const listCategories = (userId: OwnerId, opts: ListOptions = {}) => {
  const filter: Record<string, unknown> = { userId };

  if (opts.onlyArchived) filter.archivedAt = { $ne: null };
  else if (!opts.includeArchived) filter.archivedAt = null;

  return CategoryHabit.find(filter).sort({ position: 1, createdAt: 1 }).lean();
};

export const getCategoryById = async (userId: OwnerId, id: string) => {
  assertObjectId(id);

  // el userId SIEMPRE va en el filtro: sin esto cualquiera lee categorías ajenas
  const category = await CategoryHabit.findOne({ _id: id, userId }).lean();

  if (!category) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  return category;
};

/* ============================================================
   ESCRITURA
   ============================================================ */

export const createCategory = async (userId: OwnerId, input: CreateCategoryInput) => {
  const data = pickWritableFields(input);

  if (!data.name) {
    throw new AppError('El nombre es obligatorio', 400, 'NAME_REQUIRED');
  }

  // si no mandan posición, va al final de las vivas
  if (data.position === undefined) {
    data.position = await CategoryHabit.countDocuments({ userId, archivedAt: null });
  }

  try {
    const category = await CategoryHabit.create({ ...data, userId });
    return category.toObject();
  } catch (err) {
    return asDuplicateError(err);
  }
};

export const updateCategory = async (
  userId: OwnerId,
  id: string,
  input: UpdateCategoryInput,
) => {
  assertObjectId(id);

  const data = pickWritableFields(input);

  if (Object.keys(data).length === 0) {
    throw new AppError('Nada que actualizar', 400, 'EMPTY_UPDATE');
  }

  try {
    const category = await CategoryHabit.findOneAndUpdate(
      { _id: id, userId, archivedAt: null },
      { $set: data },
      { new: true, runValidators: true },
    ).lean();

    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    return category;
  } catch (err) {
    if (err instanceof AppError) throw err;
    return asDuplicateError(err);
  }
};

/* ============================================================
   SOFT DELETE
   ============================================================ */

export interface ArchiveOptions {
  /** Mueve los hábitos de esta categoría a otra antes de archivar */
  moveHabitsTo?: string | null;
}

export const archiveCategory = async (
  userId: OwnerId,
  id: string,
  opts: ArchiveOptions = {},
) => {
  assertObjectId(id);

  const category = await CategoryHabit.findOne({ _id: id, userId, archivedAt: null });

  if (!category) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  if (opts.moveHabitsTo !== undefined) {
    let destino: Types.ObjectId | null = null;

    if (opts.moveHabitsTo !== null) {
      assertObjectId(opts.moveHabitsTo, 'moveHabitsTo');

      const existe = await CategoryHabit.exists({
        _id: opts.moveHabitsTo,
        userId,
        archivedAt: null,
      });

      if (!existe) {
        throw new AppError('Categoría destino no válida', 400, 'INVALID_TARGET_CATEGORY');
      }

      destino = new Types.ObjectId(opts.moveHabitsTo);
    }

    await Habit.updateMany({ userId, categoryId: category._id }, { $set: { categoryId: destino } });
  }

  category.archivedAt = new Date();
  await category.save();

  const habitsAfectados = await Habit.countDocuments({
    userId,
    categoryId: category._id,
    archivedAt: null,
  });

  return { category: category.toObject(), habitsAfectados };
};

export const restoreCategory = async (userId: OwnerId, id: string) => {
  assertObjectId(id);

  const category = await CategoryHabit.findOne({ _id: id, userId, archivedAt: { $ne: null } });

  if (!category) {
    throw new AppError('Archived category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  // mientras estuvo archivada pudo crearse otra con el mismo nombre
  const choca = await CategoryHabit.exists({
    userId,
    name: category.name,
    archivedAt: null,
  });

  if (choca) {
    throw new AppError(
      'Ya tienes una categoría activa con ese nombre. Renómbrala antes de restaurar',
      409,
      'CATEGORY_NAME_TAKEN',
    );
  }

  category.archivedAt = null;
  await category.save();

  return category.toObject();
};

/** Borrado real. Solo si ya no queda nada colgando. */
export const deleteCategory = async (userId: OwnerId, id: string) => {
  assertObjectId(id);

  const habitsVinculados = await Habit.countDocuments({ userId, categoryId: id });

  if (habitsVinculados > 0) {
    throw new AppError(
      `No se puede borrar: ${habitsVinculados} hábito(s) siguen en esta categoría`,
      409,
      'CATEGORY_HAS_HABITS',
    );
  }

  const deleted = await CategoryHabit.findOneAndDelete({ _id: id, userId }).lean();

  if (!deleted) {
    throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
  }

  return deleted;
};

/* ============================================================
   ORDEN (drag & drop)
   ============================================================ */

export const reorderCategories = async (userId: OwnerId, orderedIds: string[]) => {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new AppError('Manda el arreglo de ids', 400, 'EMPTY_ORDER');
  }

  orderedIds.forEach((id) => assertObjectId(id));

  const vivas = await CategoryHabit.countDocuments({
    _id: { $in: orderedIds },
    userId,
    archivedAt: null,
  });

  // si no coinciden, alguien mandó ids ajenos o archivados
  if (vivas !== orderedIds.length) {
    throw new AppError('Alguna categoría no existe o no es tuya', 400, 'INVALID_ORDER');
  }

  await CategoryHabit.bulkWrite(
    orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id), userId },
        update: { $set: { position: index } },
      },
    })),
  );

  return listCategories(userId);
};