import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import {connectDB} from "./config/db";
import { seedSections } from './seeds/sections.seed';

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB(); 
    console.log("DB connected");
    await seedSections();
     
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("DB connection failed:", error);
  }
})();