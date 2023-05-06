const express = require('express');
let kasaModule; //will be passed in
const kasaRouter = express.Router();

const errorHandler = (err, req, res, next) => {
  console.log('- An error occurred: ', err);
  res.status(500).send(err);
  next(err);
}
  
kasaRouter.use(errorHandler);

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

  const deviceObject = kasaModule.getDeviceObjectByChannel(ch);
  const device = deviceObject?.device;

  if (device) {

    const commandObject = buildCommandObject(req.query);

    let info = `Channel ${commandObject.ch} (${device.alias}@${device.host}): ${routeCommand} `;
    kasaModule.log(`Request from ${req.socket.remoteAddress}: ${routeCommand} ${JSON.stringify(commandObject)}`, commandObject.ch);

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

kasaRouter.get([ '/setPowerState', '/setpowerstate', '/switch' ], (req, res, next) => {
  processRequest(req, res, 'setPowerState').catch(next);
});
  
kasaRouter.get([ '/setLightState', '/setlightstate', '/set' ], (req, res, next) => {
  processRequest(req, res, 'setLightState').catch(next);
});
  

const passInKasaModule = (module) => {
  kasaModule = module;  
};

module.exports = {
  kasaRouter,
  passInKasaModule
}