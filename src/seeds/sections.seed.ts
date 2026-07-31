import { Section } from '../models/Section.model';
import { SECTIONS_SEED, SECTION_SLUGS } from '../constants/sections';

export const seedSections = async (): Promise<void> => {
  // Validación de seguridad para saber si tus constantes tienen datos
  if (!SECTIONS_SEED || SECTIONS_SEED.length === 0) {
    console.warn('[seed] Advertencia: SECTIONS_SEED está vacío. No hay nada que sembrar.');
    return;
  }

  const ops = SECTIONS_SEED.map((s) => ({
    updateOne: {
      filter: { slug: s.slug },
      update: { 
        $set: { 
          slug: s.slug, // 👈 ¡Clave! Asegura que el slug se guarde en el documento
          name: s.name, 
          isAvailable: s.isAvailable 
        } 
      },
      upsert: true,
    },
  }));

  try {
    const result = await Section.bulkWrite(ops);
    console.log(`[seed] sections -> creadas (upserted): ${result.upsertedCount}, modificadas: ${result.modifiedCount}`);
  } catch (err: any) {
    if (err?.code === 11000) {
      console.warn('[seed] sections ya existían (arranque concurrente)');
      return;
    }
    throw err;
  }

  // Apagar secciones obsoletas que ya no estén en el catálogo
  if (SECTION_SLUGS && SECTION_SLUGS.length > 0) {
    await Section.updateMany(
      { slug: { $nin: SECTION_SLUGS } },
      { $set: { isAvailable: false } },
    );
  }
};