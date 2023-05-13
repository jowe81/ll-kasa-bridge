require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT ?? 3000;

const mongoConnect = require('./db/mongodb');

mongoConnect().then(db => {
  console.log('Established db connection');

  // Check if we need to import a device map
  if (process.argv[2] === '-import') {
    const options = { 'overwriteExisting' : process.argv[3] === 'overwrite' };
    const { importDeviceMap, importGlobalConfig } = require('./modules/ImportDeviceMap');
    const { deviceMap, globalConfig } = require('./deviceMap');
    importDeviceMap(db, deviceMap, options);

    if (process.argv.includes('-config')) {
      importGlobalConfig(db, globalConfig);
    }
  }


  // Import utilities for the ll-bridge functions.
  const utils = require('./helpers/ll-bridge-utils');
  
  // Initialize the device pool with a callback to update the LL db on device events.
  const devicePool = require('./modules/DevicePool');
  devicePool.initialize(db, utils.updateLL);

  // Initialize the router.
  const { initRouter } = require('./routers/kasaRouter');
  const kasaRouter = initRouter(express, devicePool, utils.processRequest);
  app.use('/kasa', kasaRouter);

  // Start the server.
  app.listen(port, () => {
    console.log(`LifeLog-Kasa-Bridge server listening on port ${port}.`);
  })
})

