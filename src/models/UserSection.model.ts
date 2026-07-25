import { Schema, model, Types  } from 'mongoose';

/* ============================================================
   TIPOS
   ============================================================ */

export interface IUserSection {
  userId: Types.ObjectId;
  sectionId: Types.ObjectId;
  isEnabled: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}



/* ============================================================
   SCHEMA
   ============================================================ */

const userSectionSchema = new Schema<IUserSection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    position: {
      type: Number,
      default: 0,
      min: 0,
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

// Equivalente a tu unique compuesto (user_id, section_id)
userSectionSchema.index({ userId: 1, sectionId: 1 }, { unique: true });
userSectionSchema.index({ userId: 1, isEnabled: 1, position: 1 });


export const UserSection = model<IUserSection>('UserSection', userSectionSchema);

export default UserSection;