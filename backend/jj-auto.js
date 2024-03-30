import dotenv from 'dotenv';
dotenv.config();

// Project files
import mongoConnect from './db/mongodb.js';
import { devicePool } from './modules/DevicePool.js';
import utils from './helpers/ll-bridge-utils.js';
import { initRouter } from './routers/kasaRouter.js';
import devicesRouter from './routers/devices.js';
import remoteRouter from './routers/remoteRouter.js';
import getDevicePoolRouter from './routers/devicePool.js';
import { socketHandler } from './modules/SocketHandler.js';
import { log } from './helpers/jUtils.js';

import { importDeviceMap, importGlobalConfig } from './modules/ImportDeviceMap.js';
import { deviceMap, globalConfig } from './configuration.js';

// Packages
import cors from 'cors';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

process.on("uncaughtException", (err) => {
    console.error("An uncaught exception occurred:", err);
    log("An uncaught exception occurred.", "bgRed");
});

const app = express();
app.use(cors());
app.use(express.urlencoded());

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
const useUdpDiscovery = process.env.USE_UDP_DISCOVERY === '0' ? false : true;

log(`Welcome to ${appName}. Backend is starting up...`);

mongoConnect().then(db => {
  log('Connected to database.');


  const promises = [];

  // Check if we need to import a device map
  if (process.argv.includes('--import-map')) {
    const options = { 'overwriteExisting' : true };
    promises.push(importDeviceMap(db, deviceMap, options));
  }

  // Check if need to import the configuration
  if (process.argv.includes('--import-config')) {
    promises.push(importGlobalConfig(db, globalConfig));
  }

  Promise
    .allSettled(promises)
    .then(() => {
      // Initialize the device pool from stored sysinfo or via udpDiscovery.
      devicePool.initialize(db, useUdpDiscovery);

      // Initialize the routers.
      const kasaRouter = initRouter(express, devicePool, utils.processRequest);
      app.use('/kasa', kasaRouter);

      const devices = devicesRouter(express, devicePool);
      app.use('/auto/devices', devices);

      const devicePoolRouter = getDevicePoolRouter(express, devicePool);
      app.use('/auto/devicePool', devicePoolRouter);

      const remote = remoteRouter(express, devicePool, utils.processRemoteRequest);
      app.use('/auto/remote', remote);

      socketHandler.initialize(io, devicePool);
      socketHandler.startSocketServer();

      // Start the API server.
      server.listen(port, () => {
        log(`API Server is listening on port ${port}.`);
      })

    });

  
}).catch(err => {
  log(`Unable to connect to database. Exiting.`, null, err);
});

