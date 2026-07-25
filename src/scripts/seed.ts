import { connectDB, disconnectDB, syncAllIndexes } from '../config/db';
import { seedSections } from '../seeds/sections.seed';

(async () => {
  try {
    await connectDB();
    await syncAllIndexes();
    await seedSections();
    console.log('[seed] listo');
  } catch (err) {
    console.error('[seed] falló:', err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
})();