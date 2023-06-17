import sunEvents from "./sunEvents.js";

/**
 * Adjust values linked to sunrise/sunset
 */
const naturalLight = (filterObject) => {  
  const { settings } = filterObject;

  const stateData = {
    color_temp: { 
      value: 5000,
      altValue: 2700,
    },
  }

  const commandObject = {
    // Doesn't matter what to set it to - the filter will overwrite it.
    color_temp: 2500,
  }

  return sunEvents({ stateData, settings }, commandObject);
}

export default naturalLight;