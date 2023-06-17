import sunEvents from "./sunEvents.js";

/**
 * Adjust values linked to sunrise/sunset
 */
const naturalLight = (filterObject, commandObject, deviceWrapper) => {  
  const { settings } = filterObject;

  let stateData;

  switch (deviceWrapper?.subType) {
    case 'led-strip':
      // Values describe daylight, altValues describe 'warm' light on led strip
      stateData = {
        hue: {
          value: 227,
          altValue: 20,
        },
        saturation: {
          value: 23,
          altValue: 20,
        }    
      }

      // Values do not matter here but property must exist
      commandObject.hue = 1;
      commandObject.saturation = 1;
      break;

    case 'bulb':
      // Values describe daylight, altValues describe 'warm' light on bulb
      stateData = {
        color_temp: { 
          value: 6000,
          altValue: 2700,
        },    
      }
      // Values do not matter here but property must exist
      commandObject.color_temp = 1;
      break;
  }
  filterObject = { stateData, settings };

  return sunEvents(filterObject, commandObject);
}

export default naturalLight;