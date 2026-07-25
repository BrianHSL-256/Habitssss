import { Schema, model,  Types,  } from 'mongoose';

/* ============================================================
   TIPOS
   ============================================================ */

export interface ICategoryHabit {
  userId: Types.ObjectId;
  name: string;
  color?: string;
  icon?: string;
  position: number;
  userSectionId?: Types.ObjectId;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}



/* HEX de 3, 6 u 8 dígitos (#RGB, #RRGGBB, #RRGGBBAA) */
export const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/* ============================================================
   SCHEMA
   ============================================================ */

const categoryHabitSchema = new Schema<ICategoryHabit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre de la categoría es obligatorio'],
      trim: true,
      maxlength: 80,
    },
    color: {
      type: String,
      trim: true,
      maxlength: 9,
      match: [HEX_COLOR_RE, 'Color inválido (usa formato hex: #CCFF00)'],
    },
    icon: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    position: {
      type: Number,
      default: 0,
      min: 0,
    },
    userSectionId: {
      type: Schema.Types.ObjectId,
      ref: 'UserSection',
      default: null,
    },
    // soft delete: no borres categorías con histórico
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

// unique (user_id, name) — solo aplica a categorías vivas
categoryHabitSchema.index(
  { userId: 1, name: 1 },
  { unique: true, partialFilterExpression: { archivedAt: null } },
);
categoryHabitSchema.index({ userId: 1, position: 1 });

/* ============================================================
   VIRTUALS
   ============================================================ */

categoryHabitSchema.virtual('habits', {
  ref: 'Habit',
  localField: '_id',
  foreignField: 'categoryId',
});

export const CategoryHabit = model<ICategoryHabit>('CategoryHabit', categoryHabitSchema);

export default CategoryHabit;