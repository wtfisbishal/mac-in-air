import { app } from 'electron';
import * as path from 'path';
import * as dotenv from 'dotenv';

const isDev = !app.isPackaged;
const envPath = isDev 
  ? path.join(__dirname, '../../../.env') 
  : path.join(process.resourcesPath, '.env');

dotenv.config({ path: envPath });

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;
