require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT ?? 3000;

const mongoConnect = require('./db/mongodb');

mongoConnect().then(db => {
  console.log('Established db connection');

  // Import utilities for the ll-bridge functions.
  const utils = require('./helpers/ll-bridge-utils');

  // Initialize the device pool with a callback to update the LL db on device events.
  const devicePool = require('./modules/DevicePool');
  devicePool.initialize(utils.updateLL);

  // Initialize the router.
  const { initRouter } = require('./routers/kasaRouter');
  const kasaRouter = initRouter(express, utils.processRequest);
  app.use('/kasa', kasaRouter);

  // Start the server.
  app.listen(port, () => {
    console.log(`LifeLog-Kasa-Bridge server listening on port ${port}.`);
  })
})

