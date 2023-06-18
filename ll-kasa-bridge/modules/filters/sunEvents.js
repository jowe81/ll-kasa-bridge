import { getNighttimePercent, getFromSettingsForNextSunEvent } from "../../helpers/jDateTimeUtils.js";
import { scale } from "../../helpers/jUtils.js";

const sunEvents = () => {

  /**
   * Adjust values linked to sunrise/sunset
   */
  const execute = (filterObject, commandObject, deviceWrapper) => {  
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
    const offset = getFromSettingsForNextSunEvent('offset', settings);
    const transitionTime = getFromSettingsForNextSunEvent('transitionTime', settings);

    const nightTimePercent = getNighttimePercent(transitionTime, new Date(), offset);
    
    let resultValue;

    switch (stateKey) {
      case 'on_off':
        // on_off is a special case: set to 1 as soon as scaling begins.
        resultValue = nightTimePercent > 0 ? 1 : 0
        break;
      
      default:
        resultValue = scale(
          valueToProcess,
          altValue,
          nightTimePercent
        );      
        break;
    }

    return resultValue;
  }

  return { execute };
}

export default sunEvents;