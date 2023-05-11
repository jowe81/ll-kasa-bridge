require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT ?? 3000;

// Load the router, which in turns instantiates the Device Pool.
const kasaRouter = require('./routers/kasaRouter');
app.use('/kasa', kasaRouter);

// Start the server.
app.listen(port, () => {
  console.log(`LifeLog-Kasa-Bridge server listening on port ${port}.`);
})