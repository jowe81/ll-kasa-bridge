
import { getNextSunEvent, getNighttimePercent, getSunrise, getSunset, isDaytime, logDates } from "../../helpers/jDateTimeUtils.js";
import { scale } from "../../helpers/jUtils.js";

/**
 * Adjust values linked to sunrise/sunset
 */
const sunEvents = (filterObject, stateKey, defaultValue) => {  
  const { stateData, settings } = filterObject;

  // If no value is set in device config, use the one passed in with the command
  const valueToProcess = stateData[stateKey].value ?? defaultValue ?? 100; //The last default 100 should be properly resolved to the max value of the property stateKey

  // Default the altValue and the offset to 0
  const altValue = stateData[stateKey].altValue ?? 0;
  const offset = settings.offset ?? 0;

  const resultValue = scale(
    valueToProcess,
    altValue,
    getNighttimePercent(settings.transitionTime, new Date(), offset)
  );  

  return resultValue;

}

export default sunEvents;