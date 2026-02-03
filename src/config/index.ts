import dotenv from 'dotenv';
dotenv.config();

// application level constant and config

export const PORT:number = process.env.PORT ? parseInt(process.env.PORT) :5000;
//if port is not deinfed in .env use 5000as default

export const MONGODB_URI = process.env.MONGODB_URL;

//if mongodb url is not defined in .env use local mongodb url as default



export const JWT_SECRET = process.env.JWT_SECRET;
export const PYTHON_API = process.env.PYTHON_API || "http://127.0.0.1:8000";