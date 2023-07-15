import { log } from "../helpers/jUtils.js";

const importDeviceMapItem = (db, deviceMapItem, overwriteExisting) => {
  return new Promise((resolve, reject) => {
    const dbDeviceMap = db.collection('DeviceMap');
    if (deviceMapItem) {
      const query = { 'id': deviceMapItem.id };
      dbDeviceMap
        .findOne(query)
        .then(data => {
          if (data === null) {
            log(`Inserting ${deviceMapItem.id} (${deviceMapItem.alias})`); 
            dbDeviceMap
              .insertOne(deviceMapItem)
              .then(resolve);
          } else {
            if (overwriteExisting) {
              log(`Overwriting ${deviceMapItem.id} (${deviceMapItem.alias})`); 
              dbDeviceMap
                .replaceOne(query, deviceMapItem)
                .then(resolve);
            } else {
              log('not overwriting');
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

      log(`Importing device map ...`);

      Promise
        .all(promises)
        .then(data => {
          log(`Device map import complete. Got ${data.length} items.`);
          return resolve(data);
        })
        .catch(reject);
    } else {
      reject('Import failed - Invalid deviceMap.');
    }
  });
}

const importArray = (db, array, name) => {
  return new Promise((resolve, reject) => {
    if (!array) {
      reject(`${name} import failed. Nothing to import.`);
    }
    if (array) {

      log(`Importing ${name} ...`);

      const collection = db.collection(name);

      collection
        .deleteMany({})
        .then(() => collection.insertOne(array))
        .then(data => { 
          log(`${name} import complete. `);
          resolve(data);
        })
        .catch(err => {
          log(`${name} import failed. `, err);
          reject(err);
        });
    }
  });  
};

const importGlobalConfig = (db, globalConfig) => {
  return importArray(db, globalConfig, 'Config');
}

export {
  importDeviceMap,
  importGlobalConfig,
}