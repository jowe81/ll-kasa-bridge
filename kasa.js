const { Client } = require('tplink-smarthome-api');
const client = new Client();
const axios = require('axios');

// Import an array of objects mapping device IDs to channel numbers.
const deviceMap = require('./deviceMap');
console.log("Loaded device map: ", deviceMap);

// Keep live (discovered) devices here.
const devices = [];

const getDeviceById = id => {
  return deviceMap.find(element => element.id === id);  
}

const getDeviceByChannel = ch => {
  const deviceMapItem = deviceMap.find(element => element.ch == ch);
  return deviceMapItem;
}

const addDeviceToMap = device => {
  deviceObject = getDeviceById(device.id);
  if (deviceObject) {
    deviceObject.device = device;
    console.log(`Found device on channel ${deviceObject.ch}: ${device.id}, ${device.host}, ${device.type}, ${device.alias} / ${deviceObject.localAlias}.`); 

    addListeners(deviceObject);
    device.startPolling(10000);
  } else {
    console.log(`No map entry for device ${device.alias} (${device.host}, ${device.id}).`);
  }
}

const updateLL = (event, ch) => {
  const LL_URL = 'http://lifelog.wnet.wn/?page=kasa_event';
  const url = `${LL_URL}&event=${event}&ch=${ch}`;
  //console.log('calling')
  axios.get(url)
    .then(data => {
      console.log('LL response: ', data.data);
    })
    .catch(err => {
      console.log("Error calling LL: ", err);
    });
};

const addListeners = deviceObject => {
  const device = deviceObject.device;
  const ch = deviceObject.ch;
  const tag = `Channel ${deviceObject.ch} (${deviceObject.localAlias ?? device.alias}): `;
  console.log(`Adding listeners to channel ${deviceObject.ch} (${device.type})`);

  switch (device.type) {
    case 'IOT.SMARTPLUGSWITCH':
      device.on('power-on', (e) => {
        l = tag + 'power-on';
        console.log(l);
        updateLL('power-on', ch);
      });
      
      device.on('power-off', (e) => {
        l = tag + 'power-off';

        console.log(l);
        updateLL('power-off', ch);
      });
      break;

    case 'IOT.SMARTBULB':
      device.on('lightstate-on', (e) => {
        l = tag + 'lightstate-on';
        console.log(l);
        updateLL('lightstate-on', ch);

      });
      
      device.on('lightstate-off', (e) => {
        l = tag + 'lightstate-off';
        console.log(l);
        updateLL('lightstate-off', ch);

      });
      break;
  }
}

// Look for devices and add them to the map
client.startDiscovery().on('device-new', (device) => {
  device.getSysInfo().then(info => {
    addDeviceToMap(device);
  });
});


// Router code below
const express = require('express')
const router = express.Router()

const errorHandler = (err, req, res, next) => {
  console.log('- An error occurred: ', err);
  res.status(500).send(err);
  next(err);
}

router.use(errorHandler);

const buildCommandObject = query => {
  const intParams =  [ 'on_off', 'ch', 'brightness', 'color_temp', 'hue', 'saturation', 'ignore_default', 'transition_period'];
  const stringParams = [ 'mode' ];
  const commandObject = {};

  for (const [key, value] of Object.entries(query)) {
    if (intParams.includes(key)) {
      commandObject[key] = parseInt(value);
    } else if (stringParams.includes(key)) {
      commandObject[key] = value;
    }
  };
  
  return commandObject;
}

const processDeviceError = (err, res, device) => {
  res.send('A device error occurred (likely it timed out).');
  console.log('Device error: ', err);
}

const processRequest = (req, res, routeCommand) => {
  const { ch }  = req.query;

  const deviceMapItem = getDeviceByChannel(ch);
  const device = deviceMapItem?.device;

  if (deviceMapItem && device) {

    const commandObject = buildCommandObject(req.query);

    let info = `Channel ${commandObject.ch} (${device.alias}@${device.host}): ${routeCommand} `;
    console.log(info, commandObject);

    switch (routeCommand) {
      case 'setPowerState':
        return device
          .setPowerState(commandObject.on_off == 1 ? true : false)
          .then(() => res.send('ok'))
          .catch(err => processDeviceError(err, res, device));
        break;

      case 'setLightState':
        return device.lighting
          .setLightState(commandObject)
          .then(() => res.send('ok'))
          .catch(err => processDeviceError(err, res, device));
        break;

      default:
        return Promise.reject(`Unknown device command.`);
    }
  } else {
    return Promise.reject(`Device on channel ${ch} not found.`);
  }
}

router.get([ '/setPowerState', '/setpowerstate', '/switch' ], (req, res, next) => {
  processRequest(req, res, 'setPowerState').catch(next);
})

router.get([ '/setLightState', '/setlightstate', '/set' ], (req, res, next) => {
  processRequest(req, res, 'setLightState').catch(next);
})


module.exports = router