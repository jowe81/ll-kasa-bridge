import { globalConfig } from '../deviceMap.js';

const importDeviceMapItem = (db, deviceMapItem, overwriteExisting) => {
  return new Promise((resolve, reject) => {
    const dbDeviceMap = db.collection('deviceMap');
    if (deviceMapItem) {
      const query = { 'id': deviceMapItem.id };
      dbDeviceMap
        .findOne(query)
        .then(data => {
          if (data === null) {
            console.log(`Inserting ${deviceMapItem.id} (${deviceMapItem.alias})`); 
            dbDeviceMap
              .insertOne(deviceMapItem)
              .then(resolve);
          } else {
            if (overwriteExisting) {
              console.log(`Overwriting ${deviceMapItem.id} (${deviceMapItem.alias})`); 
              dbDeviceMap
                .replaceOne(query, deviceMapItem)
                .then(resolve);
            } else {
              console.log('not overwriting');
              resolve(data);
            }
          }
        })
    } else {
      reject('No valid devicemap object was passed.');        
    }
  });
}

const importDeviceMap = (db, deviceMap, options) => {
  return new Promise((resolve, reject) => {
    if (Array.isArray(deviceMap)) {
      const promises = [];

      deviceMap.forEach(mapItem => {
        promises.push(importDeviceMapItem(db, mapItem, options.overwriteExisting));
      });

      console.log(`Importing device map ...`);

      Promise
        .all(promises)
        .then(data => {
          console.log(`Device map import complete. Got ${data.length} items.`);
          return resolve(data);
        })
        .catch(reject);
    } else {
      reject('Import failed - Invalid deviceMap.');
    }
  });
}

const importGlobalConfig = (db, globalConfig) => {
  return new Promise((resolve, reject) => {
    const dbConfig = db.collection('config');
    if (globalConfig) {

      console.log(`Importing configuration ...`);

      dbConfig
        .deleteMany({})
        .then(() => dbConfig.insertOne(globalConfig))
        .then(data => { 
          console.log(`Config import complete. `);
          resolve(data);
        })
        .catch(err => {
          console.log(`Config import failed. `, err);
          reject(err);
        });
    }
  });  
}

export {
  importDeviceMap,
  importGlobalConfig
}