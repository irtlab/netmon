import express from 'express';
import { BadRequestError } from '../utils/errors';
import { jsonify } from '../utils/utils';


export default async function ids_api(db: any) {
  const api = express.Router();
  api.use(express.json());


  api.get(/^\/$/, jsonify(async (req: any, res: any) => {
    return {};
  }));


  return api;
}
