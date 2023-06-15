import _ from "lodash";
import { isDaytime } from "../helpers/jDateTimeUtils.js";
import { getFilterFunctions } from "./Filters.js";

/**
 * Reverse-generate a command object from a device's current state
 * @param {} deviceWrapper
 */
const buildCommandObjectFromCurrentState = (deviceWrapper) => {
  if (!(deviceWrapper && deviceWrapper.device)) {
    // Have no device
    return null;
  }

  if (!(Array.isArray(deviceWrapper.state?.groups) && deviceWrapper.state.groups.length)) {
    // Invalid or missing state info
    return null;
  }

  const groups0 = deviceWrapper.state.groups[0];
  if (!Array.isArray(groups0) && groups0.length) {
    // Invalid or corrupt state info
    return null;
  }

  const commandObject = {};

  // These are the parameters that the values in the groups item represent (left ot right)
  const orderOfValues = [ null, null, 'hue', 'saturation', 'brightness', 'color_temp' ];
  
  let index = 0;
  while (index < groups0.length && index < orderOfValues.length) {

    const paramName = orderOfValues[index];
    if (paramName) {
      commandObject[paramName] = groups0[index];
    }
    
    index++;
  }

  return commandObject;
}

/**
 * Return false only if issuing the command would change the device state.
 * 
 * @param {*} deviceStateObject 
 * @param {*} commandObject 
 * @return boolean
 */
const commandMatchesCurrentState = (deviceWrapper, commandObject) => {

  if (!(deviceWrapper && deviceWrapper.device)) {
    // Don't have a live device
    return null;
  }

  if (typeof commandObject === 'boolean') {
    // This is a power state change command
    return deviceWrapper.getPowerState() === commandObject;
  }

  if (!(typeof commandObject === 'object' && Object.keys(commandObject).length)) {
    return null
  }
  // This is a lightstate command

  const currentStateAsCommandObject = buildCommandObjectFromCurrentState(deviceWrapper);

  let result = true;
  
  if (currentStateAsCommandObject) {
    Object.keys(commandObject).every(paramName => {
      if (commandObject[paramName] !== currentStateAsCommandObject[paramName]) {
        result = false;
        console.log(`${paramName} differs: ${commandObject[paramName]} != ${currentStateAsCommandObject[paramName]}` );
        return false;
      }
    });  
  }

  return result;
}

/**
 * Perform filtering of a commandObject
 * @param {*} filterObject 
 * @param {*} commandObject 
 * @returns the filtered commandObject
 */
const filter = (filterObject, commandObject) => {
  const { name, stateData } = filterObject;

  if (!name || !stateData) {
    return commandObject;
  }

  console.log("Unfiltered commandObject", commandObject);
  
  const filterFunction = getFilterFunctions()[name];

  // Loop over the stateData items and apply the filter to each in turn.
  if (filterFunction) {
    console.log(`Found filter ${name}`);

    Object.keys(stateData).forEach(stateKey => {
      console.log(`Processing ${stateKey}`);
      commandObject[stateKey] = filterFunction(
        filterObject, 
        stateKey, 
        commandObject[stateKey] // Default value to use if none is provided in filter configuration
      );  
    });
  } else {
    console.log(`Filter ${name} doesn't exist`);
  }

  console.log("Filtered commandObject", commandObject);

  return commandObject;
}

const getCommandObjectFromTargetData = (targetData) => {
  const commandObject = {};

  const keys = Object.keys(targetData);

  if (!keys.length) {
    // There's no data to put in command object.
    return null;
  }

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

export {
  commandMatchesCurrentState,
  filter,
  getCommandObjectFromTargetData,
}