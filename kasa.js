const { Client } = require('tplink-smarthome-api');
const client = new Client();

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
  deviceObject.device = device;
  console.log(`Added new device to map: ${device.id}, ${device.host}, ${device.alias}`);
}

// Look for devices and add them to the map
client.startDiscovery().on('device-new', (device) => {
  device.getSysInfo().then(info => {
    console.log(`Found '${device.alias}' at ${device.host}`);
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