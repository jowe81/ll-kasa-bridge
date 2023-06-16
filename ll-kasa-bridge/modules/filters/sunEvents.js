
import { getNextSunEvent, getNighttimePercent, getSunrise, getSunset, isDaytime, logDates } from "../../helpers/jDateTimeUtils.js";
import { scale } from "../../helpers/jUtils.js";

/**
 * Adjust values linked to sunrise/sunset
 */
const sunEvents = (filterObject, stateKey, defaultValue) => {  
  const { stateData, settings } = filterObject;

  const valueToProcess = stateData[stateKey].value ?? defaultValue;

  const offset = settings.offset ?? 0;

  let resultValue = valueToProcess;

  resultValue = scale(
    // If no value is set in device config, use the one passed in with the command
    valueToProcess,
    stateData[stateKey].altValue, 
    getNighttimePercent(settings.transitionTime, new Date(), offset)
  );  

  return resultValue;

}

export default sunEvents;