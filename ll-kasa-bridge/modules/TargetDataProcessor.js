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

  'sunEvents': function sunEvents(commandObject, filter, triggerSwitchPosition) {
    const { stateData, settings, switchPosition } = filter;

    if (!stateData) {
      return commandObject;
    }

    if (!(triggerSwitchPosition !== null && triggerSwitchPosition === switchPosition)) {
      // Wrong trigger switch position; filter does not apply
      return commandObject;
    }

    const stateKeys = Object.keys(stateData);
    stateKeys.forEach(stateKey => {
      // If no value is set in device config, use the one passed in with the command
      const value = stateData[stateKey].value ?? commandObject[stateKey];
            
      commandObject[stateKey] = scale(
        value, 
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