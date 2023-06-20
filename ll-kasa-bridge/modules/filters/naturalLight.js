import { scale } from "../../helpers/jUtils.js";
import { log } from "../Log.js";

import constants from "../../constants.js";

const naturalLight = () => {  

  /**
   * Adjust values linked to sunrise/sunset
   */
  const execute = (filterObject, commandObject, deviceWrapper, filterFunctions) => {  

    let stateData;

    const { daytimeState, nighttimeState } = filterObject.settings;
    
    /**
     * Get the correct stateData defaults for daytime and nighttime.
     * 
     * This could be written in a more compact manner but leaving this for now as
     * it is easier to grasp when written explicitly.
     */
    switch (deviceWrapper?.subType) {
      case constants.SUBTYPE_LED_STRIP:
        // Values describe daylight, altValues describe 'warm' light on led strip
        stateData = {
          hue: {
            value: daytimeState.ledStrip.hue ?? 227,
            altValue: nighttimeState.ledStrip.hue ?? 20,
          },
          saturation: {
            value: daytimeState.ledStrip.saturation ?? 23,
            altValue: nighttimeState.ledStrip.saturation ?? 20,
          }    
        }

        // Values do not matter here but property must exist
        commandObject.hue = 1;
        commandObject.saturation = 1;
        break;

      case constants.SUBTYPE_BULB:
        // Values describe daylight, altValues describe 'warm' light on bulb
        stateData = {
          color_temp: { 
            value: daytimeState.bulb.color_temp ?? 6000,
            altValue: nighttimeState.bulb.color_temp ?? 2700,
          },    
        }
        // Values do not matter here but property must exist
        commandObject.color_temp = 1;
        break;
    }

    filterObject.stateData = stateData;

    // Need the sunEvents filter
    const sunEvents = filterFunctions?.sunEvents;

    if (!sunEvents) {
      // Don't have the sunEvents filter - do nothing
      log(`naturalLight filter error:`, deviceWrapper, null, `sunEvents filter is missing`)
      return commandObject;
    }

    // Run the sunEvents filter
    const afterSunEvents = sunEvents(filterObject, commandObject);

    // Return the result unless it is to be partially applied, 
    if (!(filterObject.applyPartially > 0 && filterObject.applyPartially < 1)) {
      return afterSunEvents;
    }
    
    return applyPartialFiltering(filterObject, commandObject, deviceWrapper);
  }

  const applyPartialFiltering = (filterObject, commandObject, deviceWrapper) => {
    /**
     * For partial application we're interested in what sunEvents did NOT do.
     * 
     * The below can still be optimized - should be possible to just use the sunEvents filter twice.
     */

    Object.keys(commandObject).forEach(stateKey => {
      const paramSettings = filterObject.stateData[stateKey];
      const paramValue = commandObject[stateKey];

      const range = (paramSettings.value - paramSettings.altValue);
      const adjustment = paramSettings.value - paramValue;

      const appliedScaleFactor = adjustment / range;
      const newScaleFactor =  (1 - filterObject.applyPartially) * (1 - appliedScaleFactor);
      const partiallyAppliedValue = scale(paramSettings.value, paramSettings.altValue, newScaleFactor) - (paramSettings.value - paramValue);

      commandObject[stateKey] = partiallyAppliedValue;
    });

    return commandObject;
  }

  return { execute };
}

export default naturalLight;