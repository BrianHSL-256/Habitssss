import { Section } from '../models/Section.model';
import { SECTIONS_SEED, SECTION_SLUGS } from '../constants/sections';

export const seedSections = async (): Promise<void> => {

  const ops = SECTIONS_SEED.map((s) => ({
    updateOne: {
      filter: { slug: s.slug },
      update: { $set: { name: s.name, isAvailable: s.isAvailable } },
      upsert: true,
    },
  }));

  //const result = await Section.bulkWrite(ops);
    try {
    const result = await Section.bulkWrite(ops);
    console.log(`[seed] sections -> creadas: ${result.upsertedCount}, actualizadas: ${result.modifiedCount}`);
  } catch (err: any) {
    // dos instancias arrancando al mismo tiempo: otra ya la creó, todo bien
    if (err?.code === 11000) {
      console.warn('[seed] sections ya existían (arranque concurrente)');
      return;
    }
    throw err;
  }

  // Si quitas una sección del catálogo, NO la borres: hay user_sections apuntando a ella.
  // Solo la apagas y desaparece del front sin romper relaciones.
  await Section.updateMany(
    { slug: { $nin: SECTION_SLUGS } },
    { $set: { isAvailable: false } },
  );

//   console.log(
//     `[seed] sections -> creadas: ${result.upsertedCount}, actualizadas: ${result.modifiedCount}`,
//   );
};