const { MongoClient } = require('mongodb');
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

const db_mongo_host = process.env.DB_MONGO_HOST;
const db_mongo_port = process.env.DB_MONGO_PORT;
const db_mongo_database = process.env.DB_MONGO_DATABASE;

const db_url = `mongodb://${db_mongo_host}:${db_mongo_port}`;

const connect = () => {
  console.log(`Connecting to mongo container at ${db_url}`);

  return new Promise((resolve, reject) => {
    client.connect()  
    .then((d) => {
      const db = client.db(db_mongo_database);
      resolve(db);
    }).catch(err => {
      console.error('Connection failed. ', err);
      reject(err);
    })  
  });
}




module.exports = connect;