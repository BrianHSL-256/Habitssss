
import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "./app";
import {connectDB } from "./config/db"; 


let cached = globalThis as any;
if (!cached.db) {
  cached.db = connectDB(); 
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await cached.db; 
  return app(req, res);
}