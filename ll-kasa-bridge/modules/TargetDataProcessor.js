import _ from "lodash";

import constants from "../constants.js";
import { devicePool } from "./DevicePool.js";
import { getFilterFunctions } from "./Filters.js";
import { log } from './Log.js';

/**
 * Reverse-generate a command object from a device's current state
 * @param {} deviceWrapper
 */
const buildCommandObjectFromCurrentState = (deviceWrapper) => {

  const state = deviceWrapper?.state;

  if (!state) {
    // Have no state info
    return null;
  }

  switch (deviceWrapper.subType) {
    case constants.SUBTYPE_BULB:
      return buildCommandObjectFromBulbState(deviceWrapper);

    case constants.SUBTYPE_LED_STRIP:
      return buildCommandObjectFromLedStripState(deviceWrapper); 
  }

}

const buildCommandObjectFromBulbState = (deviceWrapper) => {
  if (deviceWrapper.subType !== constants.SUBTYPE_BULB || !deviceWrapper.state) {
    // Wrong type or no state
    return {}
  }

  const directState = deviceWrapper.state.dft_on_state ?
  _.cloneDeep(deviceWrapper.state.dft_on_state) :
  _.cloneDeep(deviceWrapper.state);

  if (!directState) {
    // Invalid or corrupt state data.
    return {};
  }

  // Found something
  delete directState.mode;
  delete directState.err_code;

  return directState;
}

const buildCommandObjectFromLedStripState = (deviceWrapper) => {
  if (deviceWrapper.subType !== constants.SUBTYPE_LED_STRIP || !deviceWrapper.state) {
    // Wrong type or no state
    return {}
  }

  const groups = deviceWrapper.state.groups;

  if (!Array.isArray(groups) || !groups.length) {
    // Bad state data
    return {}
  }

  const groups0 = groups[0];

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

      if (typeof currentStateAsCommandObject[paramName] !== 'number') {
        //Parameter does not exist in current state.
        result = false;
        return false;
      }

      if (commandObject[paramName] !== currentStateAsCommandObject[paramName]) {
        // The parameter exists in the current state but is different.
        result = false;
        return false;
      }

      return true;
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
const filter = (filterObject, commandObject, deviceWrapper) => {
  const { pluginName } = filterObject;

  if (!pluginName) {
    return commandObject;
  }

  const filterFunctions = getFilterFunctions();

  const filterFunction = filterFunctions[pluginName];
  
  if (filterFunction) {  
    // Execute the filter plugin.
    commandObject = filterFunction(
      filterObject,
      commandObject,
      deviceWrapper,
      filterFunctions, // Pass in the array of filter functions so filters can cross-reference.
    );

    if (constants.DEBUG) {
      log(`Executed ${pluginName}/${filterObject.label}. Returned: ${JSON.stringify(commandObject)}`, deviceWrapper, 'debug');
    }
  } else {
    log(`Filter plugin '${pluginName}' not found.`, deviceWrapper, 'red');
  }

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