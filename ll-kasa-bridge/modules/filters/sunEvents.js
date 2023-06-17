
import { getNighttimePercent } from "../../helpers/jDateTimeUtils.js";
import { scale } from "../../helpers/jUtils.js";

/**
 * Adjust values linked to sunrise/sunset
 */
const sunEvents = (filterObject, commandObject) => {  
  const { stateData } = filterObject;
  
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
  const offset = settings?.offset ?? 0;
  const transitionTime = settings?.transitionTime ?? 0;

  const resultValue = scale(
    valueToProcess,
    altValue,
    getNighttimePercent(transitionTime, new Date(), offset)
  );  

  return resultValue;

}

export default sunEvents;