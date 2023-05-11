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

module.exports = {
  updateLL,
  buildCommandObjectFromQuery,
}