import { Schema, model} from 'mongoose';

/* ============================================================
   TIPOS
   ============================================================ */

export interface ISection {
  name: string;
  slug: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================
   SCHEMA
   ============================================================ */

const sectionSchema = new Schema<ISection>(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la sección es obligatorio'],
      trim: true,
      maxlength: 80,
    },
    // slug para consultar por código ("habits", "finance", "notes") sin depender del texto
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug inválido (solo a-z, 0-9 y guiones)'],
      maxlength: 80,
    },
    isAvailable: {
      type: Boolean,
      default: true,
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

sectionSchema.index({ slug: 1 }, { unique: true });
sectionSchema.index({ isAvailable: 1 });


export const Section = model<ISection>('Section', sectionSchema);

export default Section;