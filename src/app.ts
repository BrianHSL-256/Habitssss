import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: "*",
  exposedHeaders: [
    'Authorization',
    'x-access-token',
    'x-refresh-token'
  ]
}));

app.use(express.json());


export default app;


