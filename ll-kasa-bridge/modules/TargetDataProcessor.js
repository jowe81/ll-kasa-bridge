import { isDaytime, getNighttimePercent } from "../helpers/jDateTimeUtils.js";
import { scale } from "../helpers/jUtils.js";

const getCommandObjectFromTargetData = (targetData) => {
  console.log("GetCommandObjectFromTargetData", targetData);
  
  const commandObject = {};

  const keys = Object.keys(targetData)

  keys.forEach(key => {

    const paramValue = targetData[key];

    if (typeof paramValue === 'object') {

      // Macro?
      const { value, modValue, macro } = paramValue;

      if (macro) {
        switch (macro) {
          case 'sleep_wake':
            commandObject[key] = isDaytime() ? value : modValue;
            break;

          default:
            commandObject[key] = value;
        }        

      } else {
        commandObject[key] = value;
      }

    } else {
      // Plain value
      commandObject[key] = paramValue;
      
    }    
  });

  return commandObject;
};


const filters = {

  'sunEvents': function sunEvents(commandObject, filter) {
    const { stateData, settings } = filter;

    if (!stateData) {
      return commandObject;
    }

    Object.keys(stateData).forEach(stateKey => {
                  
      commandObject[stateKey] = scale(
        // If no value is set in device config, use the one passed in with the command
        stateData[stateKey].value ?? commandObject[stateKey], 
        stateData[stateKey].altValue, 
        getNighttimePercent(settings.transitionTime, new Date(), settings.offset),
      );
            
    })

    return commandObject;
  }

};

export {
  getCommandObjectFromTargetData,
  filters,
}