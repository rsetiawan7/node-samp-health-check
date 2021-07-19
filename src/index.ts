import net from 'net';
import dotenv from 'dotenv';
const samp = require('samp-query');

dotenv.config();

const {
  DEBUG_ENABLED,
  APP_ADDRESS,
  APP_PORT,
  SAMP_ADDRESS,
  SAMP_PORT,
  SAMP_TIMEOUT = 1000,
} = process.env;

const server = net.createServer((socket: net.Socket) => {
  socket.on('connect', () => {
    if (DEBUG_ENABLED) {
      console.info(`Remote ${socket.remoteAddress}:${socket.remotePort} connected.`);
    }
  });

  socket.on('data', (data: Buffer) => {
    if (DEBUG_ENABLED) {
      console.info(`Remote ${socket.remoteAddress}:${socket.remotePort} sends data.`);
      console.log(`[DEBUG] Data from remote: ${data.toString()}`);
    }

    samp({
      host: SAMP_ADDRESS,
      port: SAMP_PORT,
      timeout: SAMP_TIMEOUT,
    }, (error: any, response: any) => {
      if (error) {
        socket.destroy();
      } else {
        socket.end(JSON.stringify({ status: 'up', players: response.online }), 'utf8')
      }
    });
  });
  
  socket.on('timeout', () => {
    console.info(`Timeout for remote ${socket.remoteAddress}:${socket.remotePort}`);
  });
  
  socket.on('close', () => {
    if (DEBUG_ENABLED) {
      console.log(`[DEBUG] ${socket.remoteAddress}:${socket.remotePort} terminated the connection.`);
    }
  });

  socket.on('error', (error: Error) => {
    console.error(`An error occured on remote ${socket.remoteAddress}:${socket.remotePort}`);
    console.error(error);
  });
});

server.listen({
  host: APP_ADDRESS,
  port: APP_PORT,
}, () => {
  console.info(`Server running at ${APP_ADDRESS}:${APP_PORT}`);
});
