import type { IHabit } from '../models/Habit.model';

// Guárdalo en: src/utils/habitCompletion.ts
//
// ÚNICO lugar donde se decide si un día cuenta como cumplido.
// Soporta metas simples y RANGOS. Lo usa el service al crear o
// actualizar un HabitRegister, y también los reportes/estadísticas.

/** 'HH:mm' → minutos desde medianoche */
export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export interface CompletionInput {
  /** check: lo que marcó el usuario */
  completed?: boolean;
  /** quantity / duration: cantidad o minutos reales */
  value?: number | null;
  /** time: minutos desde 00:00 */
  timeMinutes?: number | null;
}

/**
 * Decide si el registro cumple la meta del hábito.
 *
 * - check     → lo que marcó el usuario
 * - quantity  → value >= target   · o dentro de [target, targetMax] si es rango
 * - duration  → igual que quantity, en minutos
 * - time      → timeMinutes <= target · o dentro de la ventana si es rango
 */
export function evaluateCompletion(habit: IHabit, input: CompletionInput): boolean {
  switch (habit.trackingType) {
    case 'check':
      return input.completed === true;

    case 'quantity':
    case 'duration': {
      if (input.value == null) return false;
      const min = habit.targetValue;
      if (min == null) return false;

      // RANGO: tiene que caer dentro de [min, max]
      if (habit.targetValueMax != null) {
        return input.value >= min && input.value <= habit.targetValueMax;
      }
      // Meta simple: alcanzar o superar
      return input.value >= min;
    }

    case 'time': {
      if (input.timeMinutes == null) return false;
      if (!habit.targetTime) return false;
      const start = timeToMinutes(habit.targetTime);

      // VENTANA: tiene que caer entre las dos horas
      if (habit.targetTimeMax) {
        return (
          input.timeMinutes >= start && input.timeMinutes <= timeToMinutes(habit.targetTimeMax)
        );
      }
      // Meta simple: a esa hora o antes
      return input.timeMinutes <= start;
    }

    default:
      return false;
  }
}

/**
 * % de avance hacia la meta (0-100). Útil para barras de progreso.
 * En rangos, el 100% se alcanza al entrar al rango; pasarse lo baja.
 */
export function completionPercent(habit: IHabit, input: CompletionInput): number {
  if (habit.trackingType === 'check') return input.completed ? 100 : 0;

  if (habit.trackingType === 'time') {
    return evaluateCompletion(habit, input) ? 100 : 0;
  }

  if (input.value == null || habit.targetValue == null) return 0;

  // Rango: dentro = 100, fuera por arriba = penaliza según qué tanto se pasó
  if (habit.targetValueMax != null) {
    if (input.value < habit.targetValue) {
      return Math.round((input.value / habit.targetValue) * 100);
    }
    if (input.value <= habit.targetValueMax) return 100;
    const overflow = (input.value - habit.targetValueMax) / habit.targetValueMax;
    return Math.max(0, Math.round((1 - overflow) * 100));
  }

  return Math.min(100, Math.round((input.value / habit.targetValue) * 100));
}