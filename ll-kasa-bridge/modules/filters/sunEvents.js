import { getNighttimePercent, isAm } from "../../helpers/jDateTimeUtils.js";
import { scale } from "../../helpers/jUtils.js";

/**
 * Adjust values linked to sunrise/sunset
 */
const sunEvents = (filterObject, commandObject) => {  
  const { stateData } = filterObject;
  
  if (!stateData) {
    return commandObject;
  }

  Object.keys(stateData).forEach(stateKey => {
    commandObject[stateKey] = filterParameter(
      filterObject, 
      stateKey, 
      commandObject[stateKey], // Default value to use if none is provided in filter configuration      
    );  
  });

  return commandObject;
}

/**
 * Process one parameter
 */
 const filterParameter = (filterObject, stateKey, defaultValue) => {  

  const { stateData, settings } = filterObject;

  // If no value is set in device config, use the one passed in with the command
  const valueToProcess = stateData[stateKey].value ?? defaultValue ?? 100; //The last default 100 should be properly resolved to the max value of the property stateKey

  // Default altValue and missing settings to 0
  const altValue = stateData[stateKey].altValue ?? 0;
  const offset = getFromSettings('offset', settings);
  const transitionTime = getFromSettings('transitionTime', settings);

  const resultValue = scale(
    valueToProcess,
    altValue,
    getNighttimePercent(transitionTime, new Date(), offset)
  );  

  return resultValue;

}

/**
 * Determine the value of paramName. It may have been provided as a number or as an object, or not at all.
 */
 const getFromSettings = (paramName, settings) => {

  if (!(settings && settings[paramName])) {
    // paramName not set at all - default to 0
    return 0;
  }

  let paramValue;

  switch (typeof settings[paramName]) {
    case 'number':
      // It's a number, use it for both sunrise and sunset
      paramValue = settings[paramName];
      break;

    case 'object':
      // It's an object, use sunrise/sunset properties
      paramValue = isAm() ? settings[paramName].sunrise : settings[paramName].sunset;
      break;

  }
  
  if (typeof paramValue !== 'number') {
    // Couldn't determine a value - default to 0
    paramValue = 0;
  }

  return paramValue;
};

export default sunEvents;