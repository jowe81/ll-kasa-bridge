const { Client } = require('tplink-smarthome-api');
const client = new Client();
const axios = require('axios');

const { getFormattedDate, pad } = require('../jUtils');

// Keep live (discovered) devices here.
const devices = [];


const getDeviceById = id => {
  return deviceMap.find(element => element.id === id);  
}

const getDeviceMapEntryByChannel = ch => {
  const deviceMapItem = deviceMap.find(element => element.ch == ch);
  return deviceMapItem;
}

const getDeviceObjectByChannel = ch => {
  return devices.find(deviceObject => deviceObject.ch == ch);
};


const log = (t, ch, err) => {
  let prefix = ``;

  if (ch) {
    ch = pad(ch, 2, ' ');
    prefix = `Ch ${ch}`;
    const deviceObject = getDeviceObjectByChannel(ch);
    if (deviceObject && deviceObject.device) {
      prefix += ` (${deviceObject.localAlias})`;
    } else {
      prefix += ` (device absent!)`;
    }
  }

  let line;
  const colon = ch ? ': ' : '';

  if (err) {
    if (t) {
      //If a string was sent, put it in brackets
      line = `${getFormattedDate()} ${prefix}${colon}Error (${t}):`;
    } else {
      line = `${getFormattedDate()} ${prefix}${colon}Error:`;
    }
    console.log(line, err);
  } else {
    line = `${getFormattedDate()} ${prefix}${colon}${t}`;
    console.log(line);
  }
}

// Import an array of objects mapping device IDs to channel numbers.
const deviceData = require('../deviceMap');
const { deviceMap } = deviceData;
log(null, "Loaded device map: ", deviceMap);

const addDeviceToLiveMap = device => {
  deviceObject = getDeviceById(device.id);
  if (deviceObject) {
    deviceObject.device = device;
    deviceObject.isOnline = true;
    log(`Found device: ${device.id}, ${device.host}, ${device.type}, ${device.alias} / ${deviceObject.localAlias}.`, deviceObject.ch); 

    addListeners(deviceObject);
    startPolling(deviceObject);
    devices.push(deviceObject);
  } else {
    log(`No map entry for device '${device.alias}' (${device.host}, ${device.id}).`);
  }
}

const markDeviceOffline = (device, err) => {
  deviceObject = getDeviceById(device.id);
  deviceObject.isOnline = false;
  console.log(deviceObject.device.sysInfo);
  log("Device went offline", deviceObject.ch, err?.message);
}


const updateLL = (event, ch) => {
  const LL_URL = 'http://lifelog.wnet.wn/?page=kasa_event';
  const url = `${LL_URL}&event=${event}&ch=${ch}`;
  log(`Updating LifeLog`, ch);
  axios.get(url)
    .catch(err => {
      log("while calling LifeLog", ch, err);
    });
};

const startPolling = (deviceObject) => {

  device = deviceObject.device;

  if (device) {
    let interval = deviceData.pollIntDefault;

    switch (device.type) {
      case 'IOT.SMARTPLUGSWITCH':
        //Unfortunately both, the wall switches and the little plugs have the same type descriptor.
        interval = (deviceObject.switchType === deviceData.switchTypePlug) ? deviceData.pollIntPlug : deviceData.pollIntSwitch;
        break;
      
      case 'IOT.SMARTBULB':
        interval = deviceData.pollIntBulb;
        break;
    }
  
    device.startPolling(interval);
    device.on('polling-error', (err) => {
      processPollingError(err, deviceObject);
    });

    log(`Polling this ${device.type} at ${interval}ms.`, deviceObject.ch);  
  }
}

const setPowerState = (ch, state) => {
  targetDeviceObject = getDeviceObjectByChannel(ch);
  if (targetDeviceObject?.device) {
    targetDeviceObject.device.setPowerState(state).catch(err => {
      log(`setPowerState`, ch, err);
    });
  }
}

const addListeners = deviceObject => {
  const device = deviceObject.device;
  const ch = deviceObject.ch;
  const tag = `Channel ${deviceObject.ch} (${deviceObject.localAlias ?? device.alias}): `;
  log(`Adding listeners.`, ch);

  switch (device.type) {
    case 'IOT.SMARTPLUGSWITCH':

      device.on('power-on', (e) => {
        log('power-on', ch);
        deviceObject.switchTargetsA?.forEach(ch => setPowerState(ch, true));
        deviceObject.switchTargetsB?.forEach(ch => setPowerState(ch, false));
        updateLL('power-on', ch);
      });

      device.on('power-off', (e) => {
        log('power-off', ch);
        deviceObject.switchTargetsA?.forEach(ch => setPowerState(ch, false));
        deviceObject.switchTargetsB?.forEach(ch => setPowerState(ch, true));
        updateLL('power-off', ch);
      });
      break;

    case 'IOT.SMARTBULB':
      device.on('lightstate-on', (e) => {
        log('lightstate-on', ch);
        updateLL('lightstate-on', ch);
      });
      
      device.on('lightstate-off', (e) => {
        log('lightstate-off', ch);
        updateLL('lightstate-off', ch);
      });
      break;
  }
}

// Look for devices and add them to the map
client.startDiscovery().on('device-new', (device) => {
  device.getSysInfo().then(info => {
    addDeviceToLiveMap(device);
  });
});


// Router code below
const express = require('express')
const router = express.Router()



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

// Device is probably offline
const processPollingError = (err, deviceObject) => {
  markDeviceOffline(deviceObject.device, err);
}

const processRequest = (req, res, routeCommand) => {
  const { ch }  = req.query;

  const deviceMapItem = getDeviceMapEntryByChannel(ch);
  const device = deviceMapItem?.device;

  if (deviceMapItem && device) {

    const commandObject = buildCommandObject(req.query);

    let info = `Channel ${commandObject.ch} (${device.alias}@${device.host}): ${routeCommand} `;
    log(`Request from ${req.socket.remoteAddress}: ${routeCommand} ${JSON.stringify(commandObject)}`, commandObject.ch);

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


module.exports = {
  getDeviceObjectByChannel,
  log,
}