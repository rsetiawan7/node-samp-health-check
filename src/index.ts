import net from 'net';
import dotenv from 'dotenv';
const samp = require('samp-query');

dotenv.config();

interface ISAMPServer {
  status: 'up' | 'down',
  player: number
}

const {
  DEBUG_ENABLED,
  APP_ADDRESS,
  APP_PORT,
  SAMP_ADDRESS,
  SAMP_PORT,
  SAMP_TIMEOUT = 1000,
} = process.env;

const server = net.createServer((socket: net.Socket) => {
  const checkSamp = (callback: (response: ISAMPServer) => void) => {
    samp({
      host: SAMP_ADDRESS,
      port: SAMP_PORT,
      timeout: SAMP_TIMEOUT,
    }, (error: any, response: any) => {
      if (error) {
        if (DEBUG_ENABLED) {
          console.log(`[DEBUG] SA-MP server [${SAMP_ADDRESS}:${SAMP_PORT}] timed out`);
        }

        callback({ status: 'down', player: 0 });
      } else {
        callback({ status: 'up', player: response.online });
      }
    });
  };

  socket.on('connect', () => {
    socket.setTimeout(SAMP_TIMEOUT as number);

    if (DEBUG_ENABLED) {
      console.info(`Remote ${socket.remoteAddress}:${socket.remotePort} connected.`);
    }

    checkSamp((response) => {
      if (response.status === 'up') {
        socket.end(JSON.stringify(response));
      }
    });
  });

  socket.on('lookup', (err: Error, address: string, family: string, host: string) => {
    socket.setTimeout(SAMP_TIMEOUT as number);

    console.info(`[DEBUG] Remote [address: ${address} | family: ${family} | host: ${host}] is looking up.`);

    if (err) {
      console.error('An error occured while remote looking up.');
      console.error(err);
    } else {
      checkSamp((response) => {
        if (response.status === 'up') {
          socket.end(JSON.stringify(response));
        }
      });
    }
  });

  socket.on('timeout', () => {
    if (DEBUG_ENABLED) {
      console.log(`[DEBUG] Remote ${socket.remoteAddress}:${socket.remotePort} timed out.`);
    }
  });

  socket.on('data', (data: Buffer) => {
    console.info(`Remote ${socket.remoteAddress}:${socket.remotePort} sends data.`);

    if (DEBUG_ENABLED) {
      console.log(`[DEBUG] Data from remote: ${data.toString()}`);
    }

    checkSamp((response) => {
      if (response.status === 'up') {
        socket.end(JSON.stringify(response));
      } else {
        socket.end();
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
