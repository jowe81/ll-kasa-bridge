const axios = require('axios');

const updateLL = (event, deviceWrapper) => {
  const LL_URL = 'http://lifelog.wnet.wn/?page=kasa_event';
  const url = `${LL_URL}&event=${event}&ch=${deviceWrapper.channel}`;
  console.log(`* Lifelog * ${deviceWrapper.alias} (ch ${deviceWrapper.channel}): ${event} `);
  axios.get(url)
    .catch(err => {
      log("while calling LifeLog", deviceWrapper.channel, err);
    });
};

const buildCommandObjectFromQuery = query => {
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

const processRequest = (req, res, routeCommand, devicePool) => {
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

module.exports = {
  updateLL,
  buildCommandObjectFromQuery,
  processRequest,
}