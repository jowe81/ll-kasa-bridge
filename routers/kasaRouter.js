/***** Router code below. */

const express = require('express');
const kasaRouter = express.Router();
  
kasaRouter.use((err, req, res, next) => {
  console.log('- An error occurred: ', err);
  res.status(500).send(err);
  next(err);
});

kasaRouter.get([ '/setPowerState', '/setpowerstate', '/switch' ], (req, res, next) => {
  processRequest(req, res, 'setPowerState').catch(next);
});
  
kasaRouter.get([ '/setLightState', '/setlightstate', '/set' ], (req, res, next) => {
  processRequest(req, res, 'setLightState').catch(next);
});


/***** Request processing code below. */

const utils = require('../helpers/utils');

// Instantiate and initialize the device pool.
const devicePool = require('../modules/DevicePool');
devicePool.initialize(utils.updateLL);

const processRequest = (req, res, routeCommand) => {
  const channel  = req.query.channel ?? req.query.ch;

  // Find the deviceWrapper in the pool
  const deviceWrapper = devicePool.getDeviceWrapperByChannel(parseInt(channel));
  
  if (deviceWrapper) {
    // Transform the query into a kasa command object
    const commandObject = utils.buildCommandObjectFromQuery(req.query);
    console.log(`Request from ${req.socket.remoteAddress}: ${routeCommand} ${JSON.stringify(commandObject)}`);

    switch (routeCommand) {
      case 'setPowerState':
        return deviceWrapper
          .setPowerState(commandObject.on_off == 1 ? true : false)
          .then(() => res.send('ok'))
          .catch(err => {/* handled in DevicePool */});
        break;

      case 'setLightState':
        return deviceWrapper
          .setLightState(commandObject)
          .then(() => res.send('ok'))
          .catch(err => {/* handled in DevicePool */});
        break;

      default:
        return Promise.reject(`Unknown device command.`);
    }
  } else {
    return Promise.reject(`Device on channel ${channel} not found.`);
  }
}

module.exports = kasaRouter;