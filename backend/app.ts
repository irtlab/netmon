import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import logger from 'morgan';
import { getMongoDB } from './db';

// INSTRUCTION 1. Import your new route module here.
import network_topology_api from './routes/network_topology';
import traffic_api from './routes/traffic';
import devices_api from './routes/devices';
import notofications_api from './routes/notifications';
import ids_api from './routes/ids';


const app = express();


(async () => {
  const mongo_db: any = await getMongoDB();

  // Allow CORS on ExpressJS.
  if (app.get('env') === 'development') {
    // Note that cors_options is provided only for development mode.
    const cors_options = {
      credentials: true,
      origin: ['http://localhost:3000']
    };
    app.use(cors(cors_options));
  } else {
    app.use(cors());
  }
  app.options('*', cors());


  if (app.get('env') === 'production') {
    // If you have your node.js behind a proxy and are using secure: true,
    // you need to set "trust proxy" in express:
    app.set('trust proxy', 1);
  }

  app.set('views', path.join(path.resolve(), '../frontend/dist'));
  app.set('view engine', 'ejs');

  app.use(helmet());
  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({extended: true}));
  app.use(express.static('public'));


  // INSTRUCTION 2. Use/Invoke your new route API here.
  app.use('/api/network_topology', await network_topology_api(mongo_db));
  app.use('/api/traffic', await traffic_api(mongo_db));
  app.use('/api/devices', await devices_api(mongo_db));
  app.use('/api/notofications', await notofications_api(mongo_db));
  app.use('/api/ids', await ids_api(mongo_db));


  app.get('*', (req: any, res: any) => {
    res.sendFile(path.join(path.resolve(), '/public', 'index.html'));
  });


  // catch 404 and forward to error handler
  app.use((req: any, res: any, next: any) => {
    const err: any = new Error('Not Found');
    err.status = 404;
    next(err);
  });


  // error handler
  app.use((err: any, req: any, res: any, next: any) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render({error: err});
  });
})();

export default app;
