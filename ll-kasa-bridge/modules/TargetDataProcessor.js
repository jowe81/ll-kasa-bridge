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
    return {};
  }

  const groups0 = deviceWrapper.state.groups[0];
  if (!Array.isArray(groups0) && groups0.length) {
    // Invalid or corrupt state info
    return {};
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

  if (currentStateAsCommandObject === null) {
    // Have no live device.
    return null;
  }

  let result = true;
  
  if (currentStateAsCommandObject) {
    Object.keys(commandObject).every(paramName => {
      if (!currentStateAsCommandObject[paramName] || commandObject[paramName] !== currentStateAsCommandObject[paramName]) {
        // The parameter either doesn't exist in current state or differs.
        result = false;
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
  const { pluginName } = filterObject;

  if (!pluginName) {
    return commandObject;
  }

  console.log("Unfiltered commandObject", commandObject);
  
  const filterFunction = getFilterFunctions()[pluginName];

  if (filterFunction) {
    console.log(`Found filter ${pluginName}`);

    // Execute the filter plugin.
    commandObject = filterFunction(
      filterObject,
      commandObject,
    );

  } else {
    console.log(`Filter ${pluginName} doesn't exist`);
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
    commandObject[key] = paramValue;
  });

  return commandObject;
};

export {
  commandMatchesCurrentState,
  filter,
  getCommandObjectFromTargetData,
}