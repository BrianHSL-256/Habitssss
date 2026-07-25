import { Types, isValidObjectId } from 'mongoose';
import { HabitRegister, IHabitRegister, toUtcMidnight } from '../models/HabitRegister.model'; 
import { Habit } from '../models/Habit.model';
import { AppError } from '../errors/AppError';
import { localDayKey } from '../utils/date';

/* ============================================================
   TIPOS DE ENTRADA
   ============================================================ */

type OwnerId = Types.ObjectId | string;

export interface LogInput {
  habitId: string;
  /** 'YYYY-MM-DD' o Date. Si no viene: hoy en la timezone del usuario */
  date?: string | Date;
  timezone?: string;
  completed?: boolean;
  value?: number | null;
  timeMinutes?: number | null;
  hour?: string | Date | null;
  note?: string | null;
}

export type UpdateLogInput = Omit<LogInput, 'habitId' | 'date' | 'timezone'>;

export interface RangeQuery {
  from: string;
  to: string;
  habitId?: string;
}

/* ============================================================
   HELPERS
   ============================================================ */

const assertObjectId = (id: string, campo = 'id'): void => {
  if (!isValidObjectId(id)) {
    throw new AppError(`Invalid ${campo}`, 400, 'INVALID_ID');
  }
};

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

const assertDayKey = (s: string, campo: string): void => {
  if (!DAY_RE.test(s) || isNaN(toUtcMidnight(s).getTime())) {
    throw new AppError(`${campo} debe ser YYYY-MM-DD válido`, 400, 'INVALID_DATE');
  }
};

/** El hábito debe existir, ser del usuario y estar vivo */
const assertOwnHabit = async (userId: OwnerId, habitId: string) => {
  assertObjectId(habitId, 'habitId');

  const habit = await Habit.findOne({ _id: habitId, userId, archivedAt: null })
    .select('trackingType')
    .lean();

  if (!habit) {
    throw new AppError('Habit not found', 404, 'HABIT_NOT_FOUND');
  }

  return habit;
};

/** Whitelist de campos editables + regla de completedAt */
const pickWritableFields = (input: UpdateLogInput) => {
  const data: Partial<IHabitRegister> = {};

  if (input.completed !== undefined) {
    data.completed = Boolean(input.completed);
    data.completedAt = data.completed ? new Date() : null;
  }
  if (input.value !== undefined) data.value = input.value;
  if (input.timeMinutes !== undefined) data.timeMinutes = input.timeMinutes;
  if (input.hour !== undefined) data.hour = input.hour === null ? null : new Date(input.hour);
  if (input.note !== undefined) data.note = input.note;

  return data;
};

/* ============================================================
   CREATE / UPDATE DEL DÍA (upsert idempotente)
   ============================================================ */

export const upsertLog = async (userId: OwnerId, input: LogInput) => {
  await assertOwnHabit(userId, input.habitId);

  let dayKey: string;
  if (input.date === undefined) {
    dayKey = localDayKey(new Date(), input.timezone);
  } else if (typeof input.date === 'string') {
    assertDayKey(input.date, 'date');
    dayKey = input.date;
  } else {
    dayKey = input.date.toISOString().slice(0, 10);
  }

  const logDate = toUtcMidnight(dayKey);
  const data = pickWritableFields(input);

  const write = () =>
    HabitRegister.findOneAndUpdate(
      { habitId: input.habitId, logDate },
      {
        $set: { ...data, dayKey },
        $setOnInsert: { habitId: input.habitId, userId, logDate },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    ).lean();

  try {
    return await write();
  } catch (err: any) {
    // doble tap del usuario: dos upserts en carrera, el unique detiene al segundo
    if (err?.code === 11000) return await write();
    throw err;
  }
};

/* ============================================================
   LECTURA
   ============================================================ */

export const getLogById = async (userId: OwnerId, id: string) => {
  assertObjectId(id);

  const log = await HabitRegister.findOne({ _id: id, userId }).lean();

  if (!log) {
    throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
  }

  return log;
};

/** Registros de un rango de días (calendario / dashboard) */
export const listLogsByRange = async (userId: OwnerId, query: RangeQuery) => {
  assertDayKey(query.from, 'from');
  assertDayKey(query.to, 'to');

  const from = toUtcMidnight(query.from);
  const to = toUtcMidnight(query.to);

  if (from > to) {
    throw new AppError('from no puede ser mayor que to', 400, 'INVALID_RANGE');
  }

  const filter: Record<string, unknown> = {
    userId,
    logDate: { $gte: from, $lte: to },
  };

  if (query.habitId) {
    assertObjectId(query.habitId, 'habitId');
    filter.habitId = query.habitId;
  }

  return HabitRegister.find(filter).sort({ logDate: 1 }).lean();
};

/* ============================================================
   UPDATE POR ID
   ============================================================ */

export const updateLog = async (userId: OwnerId, id: string, input: UpdateLogInput) => {
  assertObjectId(id);

  const data = pickWritableFields(input);

  if (Object.keys(data).length === 0) {
    throw new AppError('Nada que actualizar', 400, 'EMPTY_UPDATE');
  }

  const log = await HabitRegister.findOneAndUpdate(
    { _id: id, userId },
    { $set: data },
    { new: true, runValidators: true },
  ).lean();

  if (!log) {
    throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
  }

  return log;
};

/* ============================================================
   DELETE
   ============================================================ */

/** Borrado real. Si fue error del usuario, el upsert lo recrea en un tap. */
export const deleteLog = async (userId: OwnerId, id: string) => {
  assertObjectId(id);

  const deleted = await HabitRegister.findOneAndDelete({ _id: id, userId }).lean();

  if (!deleted) {
    throw new AppError('Register not found', 404, 'REGISTER_NOT_FOUND');
  }

  return deleted;
};