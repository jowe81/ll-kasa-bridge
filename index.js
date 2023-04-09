const express = require('express')
const app = express()
const port = 3000


const kasa = require('./kasa')
app.use('/kasa', kasa)

app.listen(port, () => {
  console.log(`LifeLog-Kasa-Bridge server listening on port ${port}.`);
})