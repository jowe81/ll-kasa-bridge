import dotenv from 'dotenv';
dotenv.config();

// Project files
import mongoConnect from './db/mongodb.js';
import devicePool from './modules/DevicePool.js';
import utils from './helpers/ll-bridge-utils.js';
import { initRouter } from './routers/kasaRouter.js';
import devicesRouter from './routers/devices.js';
import { log } from './helpers/jUtils.js';

import { importDeviceMap, importGlobalConfig } from './modules/ImportDeviceMap.js';
import { deviceMap, globalConfig } from './deviceMap.js';

// Packages
import cors from 'cors';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: false
  }  
});

const appName = process.env.APP_NAME ?? "JJ-Auto";
const port = process.env.PORT ?? 3000;
const socketPort = process.env.SOCKET_PORT ?? 4000;

log(`Welcome to ${appName}. Backend is starting up...`);

mongoConnect().then(db => {
  log('Connected to database.');

  // Check if we need to import a device map
  if (process.argv[2] === '-import') {
    const options = { 'overwriteExisting' : process.argv[3] === 'overwrite' };
    importDeviceMap(db, deviceMap, options);

    if (process.argv.includes('-config')) {
      importGlobalConfig(db, globalConfig);
    }
  }

  // Initialize the device pool with a callback to update the LL db on device events.
  devicePool.initialize(db, io, utils.updateLL);

  // Initialize the routers.
  const kasaRouter = initRouter(express, devicePool, utils.processRequest);
  app.use('/kasa', kasaRouter);

  const devices = devicesRouter(express, devicePool);
  app.use('/auto/devices', devices);

  // Initialize socket server.
  io.on('connection', (socket) => {

    const address = socket.handshake.address;
    log(`Socket connection from ${address}`, `bgBlue`);

    // Clients request the full map when connecting
    socket.on('auto/getDevices', (data) => {
      socket.emit('auto/devices', devicePool.getLiveDeviceMap());
    });

    // Clients may execute macros
    socket.on('auto/command/macro', ({ channel, name, commandObject }) => {
      log(`Ch ${channel} ${address}: ${name}`, `bgBlue`);

      if (name === 'toggle') {
        devicePool.getDeviceWrapperByChannel(channel)?.toggle('ws:' + address);
      }
    } )
  
  });

  io.listen(4000);
  log(`${appName} Socket Server is listening on port ${socketPort}.`);

  // Start the API server.
  server.listen(port, () => {
    log(`${appName} API Server is listening on port ${port}.`);
  })
}).catch(err => {
  log(`Unable to connect to database. Exiting.`, null, err);
});

