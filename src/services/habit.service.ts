import { Types } from 'mongoose';
import Habit from '../models/Habit.model';
import type { HabitTrackingType, HabitFrequency } from '../models/Habit.model';
import CategoryHabit from '../models/CategoryHabit.model';
import { AppError } from '../errors/AppError';

// Guárdalo en: src/services/habit.service.ts

/* ============================================================
   TIPOS DEL PAYLOAD
   ============================================================ */

export interface CreateHabitInput {
  categoryId?: string | null;
  name: string;
  trackingType: HabitTrackingType;
  targetValue?: number | null;
  targetValueMax?: number | null;
  unit?: string | null;
  targetTime?: string | null;
  targetTimeMax?: string | null;
  frequency: HabitFrequency;
  daysOfWeek?: number[];
  targetPerWeek?: number | null;
  position?: number;
}

export type UpdateHabitInput = Partial<CreateHabitInput>;

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/* ============================================================
   HELPERS
   ============================================================ */

const toObjectId = (id: string, field = 'id'): Types.ObjectId => {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(`${field} inválido`, 400, 'INVALID_ID');
  }
  return new Types.ObjectId(id);
};

/** La categoría debe existir, ser del usuario y no estar archivada */
const assertCategoryOwnership = async (
  userId: string,
  categoryId?: string | null,
): Promise<Types.ObjectId | null> => {
  if (!categoryId) return null;

  const _id = toObjectId(categoryId, 'categoryId');
  const category = await CategoryHabit.findOne({
    _id,
    userId: toObjectId(userId, 'userId'),
    archivedAt: null,
  }).lean();

  if (!category) {
    throw new AppError('La categoría no existe o no te pertenece', 404, 'CATEGORY_NOT_FOUND');
  }
  return _id;
};

/**
 * Normaliza el payload según trackingType y frequency:
 * limpia los campos que no aplican para que no queden datos huérfanos en Mongo.
 */
const normalizeHabitPayload = (input: CreateHabitInput | UpdateHabitInput) => {
  const data: Record<string, unknown> = { ...input };
  const { trackingType, frequency } = input;

  /* ---------- Según cómo se mide ---------- */
  if (trackingType) {
    const needsValue = trackingType === 'quantity' || trackingType === 'duration';
    const needsTime = trackingType === 'time';

    if (!needsValue) {
      data.targetValue = null;
      data.targetValueMax = null;
      data.unit = null;
    }
    if (!needsTime) {
      data.targetTime = null;
      data.targetTimeMax = null;
    }
    // La unidad solo tiene sentido en cantidad
    if (trackingType !== 'quantity') data.unit = null;
  }

  /* ---------- Según cada cuándo ---------- */
  if (frequency) {
    if (frequency === 'daily') {
      data.daysOfWeek = ALL_DAYS;
      data.targetPerWeek = null;
    }
    if (frequency === 'weekly_days') {
      data.daysOfWeek = [...new Set(input.daysOfWeek ?? [])].sort();
      data.targetPerWeek = null;
    }
    if (frequency === 'times_per_week') {
      data.daysOfWeek = [];
    }
  }

  return data;
};

/** Valida reglas que el schema por sí solo no cubre */
const validateBusinessRules = (input: CreateHabitInput | UpdateHabitInput) => {
  const { trackingType, frequency } = input;

  // Rango: el máximo debe ser mayor que el mínimo
  if (input.targetValueMax != null && input.targetValue != null) {
    if (Number(input.targetValueMax) <= Number(input.targetValue)) {
      throw new AppError(
        'targetValueMax debe ser mayor que targetValue',
        400,
        'INVALID_RANGE',
      );
    }
  }
  if (input.targetTimeMax && input.targetTime) {
    if (input.targetTimeMax <= input.targetTime) {
      throw new AppError(
        'targetTimeMax debe ser posterior a targetTime',
        400,
        'INVALID_RANGE',
      );
    }
  }

  // weekly_days necesita al menos un día
  if (frequency === 'weekly_days' && !(input.daysOfWeek ?? []).length) {
    throw new AppError(
      'Selecciona al menos un día de la semana',
      400,
      'DAYS_REQUIRED',
    );
  }

  // El rango solo aplica a metas numéricas o de hora
  if (trackingType === 'check' && (input.targetValueMax != null || input.targetTimeMax)) {
    throw new AppError(
      'Los hábitos de tipo check no admiten meta ni rango',
      400,
      'INVALID_TRACKING_CONFIG',
    );
  }
};

/** Siguiente posición libre dentro de la categoría (o del usuario si no tiene) */
const getNextPosition = async (
  userId: Types.ObjectId,
  categoryId: Types.ObjectId | null,
): Promise<number> => {
  const last = await Habit.findOne({ userId, categoryId, archivedAt: null })
    .sort({ position: -1 })
    .select('position')
    .lean();

  return last ? (last.position ?? 0) + 1 : 0;
};

/* ============================================================
   CREATE
   ============================================================ */

export const createHabit = async (userId: string, input: CreateHabitInput) => {
  const _userId = toObjectId(userId, 'userId');

  validateBusinessRules(input);

  const categoryId = await assertCategoryOwnership(userId, input.categoryId);

  // Evita duplicados vivos con el mismo nombre en la misma categoría
  const duplicate = await Habit.findOne({
    userId: _userId,
    categoryId,
    name: input.name.trim(),
    archivedAt: null,
  }).lean();

  if (duplicate) {
    throw new AppError('Ya tienes un hábito con ese nombre', 409, 'HABIT_DUPLICATE');
  }

  const payload = normalizeHabitPayload(input);

  const habit = await Habit.create({
    ...payload,
    userId: _userId,
    categoryId,
    name: input.name.trim(),
    position: input.position ?? (await getNextPosition(_userId, categoryId)),
  });

  return habit.toJSON();
};

/* ============================================================
   READ
   ============================================================ */

export const listHabits = async (
  userId: string,
  options: {
    categoryId?: string;
    includeArchived?: boolean;
    onlyArchived?: boolean;
  } = {},
) => {
  // Objeto plano en vez de FilterQuery<IHabit>: evita depender de los tipos
  // de mongoose (si tienes @types/mongoose instalado, sombrea los buenos → bórralo)
  const filter: Record<string, unknown> = { userId: toObjectId(userId, 'userId') };

  if (options.categoryId) {
    filter.categoryId = toObjectId(options.categoryId, 'categoryId');
  }
  if (options.onlyArchived) {
    filter.archivedAt = { $ne: null };
  } else if (!options.includeArchived) {
    filter.archivedAt = null;
  }

  return Habit.find(filter).sort({ position: 1, createdAt: 1 }).lean();
};

export const getHabitById = async (userId: string, id: string) => {
  const habit = await Habit.findOne({
    _id: toObjectId(id),
    userId: toObjectId(userId, 'userId'),
  }).lean();

  if (!habit) {
    throw new AppError('Hábito no encontrado', 404, 'HABIT_NOT_FOUND');
  }
  return habit;
};

/* ============================================================
   UPDATE
   ============================================================ */

export const updateHabit = async (userId: string, id: string, input: UpdateHabitInput) => {
  const _userId = toObjectId(userId, 'userId');
  const habit = await Habit.findOne({ _id: toObjectId(id), userId: _userId });

  if (!habit) {
    throw new AppError('Hábito no encontrado', 404, 'HABIT_NOT_FOUND');
  }

  // Mezcla lo que llega con lo que ya existe para validar el resultado final
  const merged = {
    trackingType: input.trackingType ?? habit.trackingType,
    frequency: input.frequency ?? habit.frequency,
    targetValue: input.targetValue ?? habit.targetValue,
    targetValueMax: input.targetValueMax,
    targetTime: input.targetTime ?? habit.targetTime,
    targetTimeMax: input.targetTimeMax,
    daysOfWeek: input.daysOfWeek ?? habit.daysOfWeek,
  } as UpdateHabitInput;

  validateBusinessRules(merged);

  if (input.categoryId !== undefined) {
    habit.categoryId = await assertCategoryOwnership(userId, input.categoryId);
  }

  const payload = normalizeHabitPayload(merged);
  Object.assign(habit, payload);

  if (input.name !== undefined) habit.name = input.name.trim();
  if (input.position !== undefined) habit.position = input.position;

  await habit.save();
  return habit.toJSON();
};

/* ============================================================
   ARCHIVE / RESTORE / DELETE
   ============================================================ */

export const archiveHabit = async (userId: string, id: string) => {
  const habit = await Habit.findOneAndUpdate(
    { _id: toObjectId(id), userId: toObjectId(userId, 'userId'), archivedAt: null },
    { archivedAt: new Date() },
    { new: true },
  );

  if (!habit) {
    throw new AppError('Hábito no encontrado o ya archivado', 404, 'HABIT_NOT_FOUND');
  }
  return habit.toJSON();
};

export const restoreHabit = async (userId: string, id: string) => {
  const habit = await Habit.findOneAndUpdate(
    { _id: toObjectId(id), userId: toObjectId(userId, 'userId'), archivedAt: { $ne: null } },
    { archivedAt: null },
    { new: true },
  );

  if (!habit) {
    throw new AppError('Hábito no encontrado o no está archivado', 404, 'HABIT_NOT_FOUND');
  }
  return habit.toJSON();
};

export const deleteHabit = async (userId: string, id: string) => {
  const result = await Habit.deleteOne({
    _id: toObjectId(id),
    userId: toObjectId(userId, 'userId'),
  });

  if (result.deletedCount === 0) {
    throw new AppError('Hábito no encontrado', 404, 'HABIT_NOT_FOUND');
  }
};

/* ============================================================
   REORDER
   ============================================================ */

export const reorderHabits = async (userId: string, orderedIds: string[]) => {
  const _userId = toObjectId(userId, 'userId');
  const ids = orderedIds.map((id) => toObjectId(id));

  // Todos los ids deben pertenecer al usuario
  const count = await Habit.countDocuments({ _id: { $in: ids }, userId: _userId });
  if (count !== ids.length) {
    throw new AppError('Algún hábito no existe o no te pertenece', 400, 'INVALID_ORDER');
  }

  await Habit.bulkWrite(
    ids.map((_id, index) => ({
      updateOne: {
        filter: { _id, userId: _userId },
        update: { $set: { position: index } },
      },
    })),
  );

  return Habit.find({ _id: { $in: ids } })
    .sort({ position: 1 })
    .lean();
};