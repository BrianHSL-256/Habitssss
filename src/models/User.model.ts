import { Schema, model } from 'mongoose';


/* ============================================================
   TIPOS
   ============================================================ */

export interface IUser {
  name?: string;
  email: string;
  password: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
    role: 'customer' | 'admin' ;
}




/* ============================================================
   SCHEMA
   ============================================================ */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_RE, 'Email inválido'],
    },
    password: {
      type: String,
      required: [true, 'El password es obligatorio'],
      minlength: [8, 'Mínimo 8 caracteres'],
      maxlength: 255,
      select: false, // nunca se devuelve por default
    },
    timezone: {
      type: String,
      required: true,
      default: 'America/Mexico_City',
      maxlength: 64,
      validate: {
        validator: (tz: string) => {
          try {
            new Intl.DateTimeFormat('en-US', { timeZone: tz });
            return true;
          } catch {
            return false;
          }
        },
        message: 'Timezone IANA inválida (ej. America/Mexico_City)',
      },
    },
    role: {
            type: String, 
            enum: ['admin', 'customer'],
            default: 'customer'
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.password;
        delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
  
);

/* ============================================================
   ÍNDICES
   ============================================================ */

userSchema.index({ email: 1 }, { unique: true });


export const User = model<IUser>('User', userSchema);

export default User;