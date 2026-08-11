  import { Schema, model,  Types,  } from 'mongoose';

  /* ============================================================
    HELPERS DE FECHA (clave para no romperte con timezones)
    ============================================================ */



  /** Normaliza cualquier input a medianoche UTC (para el campo logDate) */
  export function toUtcMidnight(value: Date | string): Date {
    if (typeof value === 'string') {
      const [y, m, d] = value.slice(0, 10).split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, d));
    }
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  /* ============================================================
    TIPOS
    ============================================================ */

  export interface IHabitRegister {
    habitId: Types.ObjectId;
    userId: Types.ObjectId;
    logDate: Date; // siempre medianoche UTC = día calendario del usuario
    dayKey: string; // 'YYYY-MM-DD' listo para el front
    completed: boolean;
    value?: number | null; // cantidad o minutos REALES
    timeMinutes?: number | null; // minutos desde 00:00 si el hábito es de tipo 'time'
    hour?: Date | null; // instante exacto marcado por el usuario
    completedAt?: Date | null;
    note?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }





  /* ============================================================
    SCHEMA
    ============================================================ */

  const round2 = (v: unknown): number | null =>
    v === null || v === undefined || v === '' ? null : Math.round(Number(v) * 100) / 100;

  const habitRegisterSchema = new Schema<IHabitRegister>(
    {
      habitId: {
        type: Schema.Types.ObjectId,
        ref: 'Habit',
        required: true,
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      logDate: {
        type: Date,
        required: true,
        set: (v: Date | string) => toUtcMidnight(v),
      },
      dayKey: {
        type: String,
        required: true,
        match: [/^\d{4}-\d{2}-\d{2}$/, 'dayKey debe ser YYYY-MM-DD'],
        default: function (this: { logDate?: Date }) {
          return this.logDate ? this.logDate.toISOString().slice(0, 10) : undefined;
        },
      },
      completed: {
        type: Boolean,
        default: false,
      },
      value: {
        type: Number,
        min: 0,
        max: 99_999_999.99,
        default: null,
        set: round2,
      },
      timeMinutes: {
        type: Number,
        min: 0,
        max: 1439, // 23:59
        default: null,
      },
      hour: {
        type: Date,
        default: null,
      },
      completedAt: {
        type: Date,
        default: null,
      },
      note: {
        type: String,
        trim: true,
        maxlength: 500,
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
    ÍNDICES — los que te salvan la vida
    ============================================================ */

  habitRegisterSchema.index({ habitId: 1, logDate: 1 }, { unique: true });
  habitRegisterSchema.index({ userId: 1, logDate: -1 });
  habitRegisterSchema.index({ userId: 1, habitId: 1, logDate: -1 });




  export const HabitRegister = model<IHabitRegister>('HabitRegister', habitRegisterSchema);

  export default HabitRegister;