export const SECTION_SLUGS = [
  'habits',
  'finance',
] as const;

export type SectionSlug = (typeof SECTION_SLUGS)[number];

export const SECTIONS_SEED: { slug: SectionSlug; name: string; isAvailable: boolean }[] = [
  { slug: 'habits',  name: 'Hábitos',   isAvailable: true },
  { slug: 'finance', name: 'Finanzas',  isAvailable: true },
];