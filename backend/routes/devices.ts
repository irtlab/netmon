import express from 'express';
import { agents_coll } from '../constants';
import { BadRequestError } from '../utils/errors';
import { jsonify, getAllDevices } from '../utils/utils';


export default async function devices_api(db: any) {
  const api = express.Router();
  api.use(express.json());


  api.get(/^\/$/, jsonify(async (req: any, res: any) => {
    const coll = db.collection(agents_coll);
    const agents = await coll.find({}).toArray();
    if (!agents) new BadRequestError('Database query failed');

    return getAllDevices(agents);
  }));


  return api;
}
