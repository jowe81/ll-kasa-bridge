import { getNighttimePercent, getSunrise, getSunset, isDaytime } from "../helpers/jDateTimeUtils.js";
import { scale } from "../helpers/jUtils.js";
import constants from '../constants.js';

const filterFunctions = {

  /**
   * Adjust values linked to sunrise/sunset
   */
  'sunEvents': function (filterObject, stateKey, defaultValue) {  
    // Add padding on both sides of the window
    const { stateData, settings } = filterObject;

    const valueToProcess = stateData[stateKey].value ?? defaultValue;

    const sunEvent = isDaytime() ? getSunset() : getSunrise();

    const sunEventMs = sunEvent.getTime();
    const halfTransitionTime = (settings.transitionTime ?? 0) / 2;
    const padding = settings.padding ?? 0;
    const offset = settings.offset ?? 0;

    const windowOpensMs = sunEventMs - halfTransitionTime - padding + offset;
    const windowClosesMs = sunEventMs + halfTransitionTime + padding + offset;

    const windowOpens = new Date(windowOpensMs);
    const windowCloses = new Date(windowClosesMs);

    const now = new Date();

    let resultValue = valueToProcess;

    if (windowOpens < now && windowCloses > now) {
      resultValue = scale(
        // If no value is set in device config, use the one passed in with the command
        valueToProcess,
        stateData[stateKey].altValue, 
        getNighttimePercent(settings.transitionTime, new Date(), offset),
      );  
    } else {
      console.log('Not within window - returning default');
    }

    return resultValue;
  },

}

export default filterFunctions;