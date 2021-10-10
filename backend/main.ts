import http from 'http';
import app from './app';
import 'dotenv/config';

process.env.UV_THREADPOOL_SIZE = '128';


function abort(error, signame = 'SIGTERM') {
  if (typeof error !== 'undefined') {
    console.error('Aborting: ', error);
  }
  process.kill(process.pid, signame);
}


(async () => {
  const port: number = 3001;
  const server = http.createServer(app);

  const mode: boolean = process.env.NODE_ENV === 'development';
  console.log(`Starting in ${mode ? 'development' : 'production'} mode`);

  // Event listener for HTTP server "error" event.
  const on_error = (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind: string = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  };

  // Event listener for HTTP server "listening" event.
  const on_listening = () => {
    const addr: any = server.address();
    const bind: string = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    console.log(`Listening on ${bind}`);
  };

  // Listen on provided port, on all network interfaces.
  server.listen(port);
  server.on('error', on_error);
  server.on('listening', on_listening);
})().catch(abort);
