import { Schema, model, Types } from 'mongoose';
import { HEX_COLOR_RE } from './CategoryHabit.model';

/* ============================================================
   ENUMS
   ============================================================ */

export const HABIT_TRACKING_TYPES = ['check', 'quantity', 'duration', 'time'] as const;
export type HabitTrackingType = (typeof HABIT_TRACKING_TYPES)[number];

export const HABIT_FREQUENCIES = ['daily', 'weekly_days', 'times_per_week'] as const;
export type HabitFrequency = (typeof HABIT_FREQUENCIES)[number];

/**
 * daysOfWeek usa el estándar de JS Date.getDay():
 * 0 = domingo, 1 = lunes ... 6 = sábado
 */

/* ============================================================
   TIPOS
   ============================================================ */

export interface IHabit {
  userId: Types.ObjectId;
  categoryId?: Types.ObjectId | null;
  name: string;

  trackingType: HabitTrackingType;
  targetValue?: number | null;
  unit?: string | null;
  targetTime?: string | null; // 'HH:mm' en la timezone del usuario

  frequency: HabitFrequency;
  daysOfWeek: number[];
  targetPerWeek?: number | null;


  position: number;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}




/* ============================================================
   HELPERS
   ============================================================ */

const round2 = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : Math.round(Number(v) * 100) / 100;

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/* ============================================================
   SCHEMA
   ============================================================ */

const habitSchema = new Schema<IHabit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'CategoryHabit',
      default: null,
    },
    name: {
      type: String,
      required: [true, 'El nombre del hábito es obligatorio'],
      trim: true,
      maxlength: 120,
    },

    /* ---------- Cómo se mide ---------- */
    trackingType: {
      type: String,
      enum: { values: [...HABIT_TRACKING_TYPES], message: 'trackingType inválido: {VALUE}' },
      required: true,
      default: 'check',
    },
    targetValue: {
      type: Number,
      min: [0, 'El objetivo no puede ser negativo'],
      max: 99_999_999.99, // numeric(10,2)
      default: null,
      set: round2,
      required: [
        function (this: IHabit) {
          return this.trackingType === 'quantity' || this.trackingType === 'duration';
        },
        'targetValue es obligatorio para hábitos de cantidad o duración',
      ],
    },
    unit: {
      type: String,
      trim: true,
      maxlength: 20,
      default: null, // 'L', 'min', 'vasos', 'pág'
    },
    targetTime: {
      type: String,
      trim: true,
      default: null,
      match: [TIME_RE, 'targetTime debe ir en formato HH:mm (24h)'],
      required: [
        function (this: IHabit) {
          return this.trackingType === 'time';
        },
        'targetTime es obligatorio para hábitos de tipo hora',
      ],
    },

    /* ---------- Cada cuándo ---------- */
    frequency: {
      type: String,
      enum: { values: [...HABIT_FREQUENCIES], message: 'frequency inválida: {VALUE}' },
      required: true,
      default: 'daily',
    },
    daysOfWeek: {
      type: [Number],
      default: [],
      validate: {
        validator: (arr: number[]) =>
          arr.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) &&
          new Set(arr).size === arr.length,
        message: 'daysOfWeek debe traer enteros únicos entre 0 (dom) y 6 (sáb)',
      },
    },
    targetPerWeek: {
      type: Number,
      min: 1,
      max: 7,
      default: null,
      required: [
        function (this: IHabit) {
          return this.frequency === 'times_per_week';
        },
        'targetPerWeek es obligatorio cuando frequency = times_per_week',
      ],
    },

    /* ---------- UI ---------- */
    // color: {
    //   type: String,
    //   trim: true,
    //   maxlength: 9,
    //   match: [HEX_COLOR_RE, 'Color inválido (usa formato hex: #CCFF00)'],
    // },

    position: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ---------- Soft delete ---------- */
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ============================================================
   ÍNDICES
   ============================================================ */

habitSchema.index({ userId: 1, archivedAt: 1, position: 1 });
habitSchema.index({ categoryId: 1 });


export const Habit = model<IHabit>('Habit', habitSchema);

export default Habit;