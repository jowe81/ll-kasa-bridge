// Packages
import dotenv from 'dotenv';
import express from 'express';

// Project files
import mongoConnect from './db/mongodb.js';
import devicePool from './modules/DevicePool.js';
import utils from './helpers/ll-bridge-utils.js';
import { initRouter } from './routers/kasaRouter.js';
import { log } from './helpers/jUtils.js';

import { importDeviceMap, importGlobalConfig } from './modules/ImportDeviceMap.js';
import { deviceMap, globalConfig } from './deviceMap.js';

dotenv.config();

const app = express();
const port = process.env.PORT ?? 3000;

log(`Welcome to JJ-Auto. Backend is starting up...`);

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
  devicePool.initialize(db, utils.updateLL);

  // Initialize the router.
  const kasaRouter = initRouter(express, devicePool, utils.processRequest);
  app.use('/kasa', kasaRouter);

  // Start the server.
  app.listen(port, () => {
    log(`LifeLog-Kasa-Bridge server listening on port ${port}.`);
  })
}).catch(err => {
  log(`Unable to connect to database. Exiting.`, null, err);
});

