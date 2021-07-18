import net from 'net';
import dotenv from 'dotenv';
const samp = require('samp-query');

dotenv.config();

const {
  DEBUG_ENABLED,
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

    samp.query({
      host: SAMP_ADDRESS,
      port: SAMP_PORT,
      timeout: SAMP_TIMEOUT,
    }, (error: any, response: any) => {
      if (error) {
        socket.write(JSON.stringify({ status: 'down', players: 0 }));
      } else {
        socket.write(JSON.stringify({ status: 'up', players: response.online }));
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
