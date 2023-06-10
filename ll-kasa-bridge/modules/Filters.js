import { getNighttimePercent } from "../helpers/jDateTimeUtils.js";
import { scale } from "../helpers/jUtils.js";

const filterFunctions = {

  'sunEvents': function (filterObject, stateKey, defaultValue) {  
    const { stateData, settings } = filterObject;

    const resultValue = scale(
      // If no value is set in device config, use the one passed in with the command
      stateData[stateKey].value ?? defaultValue, 
      stateData[stateKey].altValue, 
      getNighttimePercent(settings.transitionTime, new Date(), settings.offset),
    );

    return resultValue;
  },

}

export default filterFunctions;