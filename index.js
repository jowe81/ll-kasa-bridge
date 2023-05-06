const express = require('express')
const app = express()
const port = 3000

const kasaModule = require('./modules/kasa')
const { kasaRouter, passInKasaModule } = require('./routers/kasaRouter');
passInKasaModule(kasaModule);

app.use('/kasa', kasaRouter);

app.listen(port, () => {
  console.log(`LifeLog-Kasa-Bridge server listening on port ${port}.`);
})