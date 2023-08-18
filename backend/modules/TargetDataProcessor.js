import _ from "lodash";

import constants from "../constants.js";

/**
 * Reverse-generate a command object from a device's current state
 * @param {} deviceWrapper
 */
const buildCommandObjectFromCurrentState = (deviceWrapper) => {

  let commandObject = {};

  switch (deviceWrapper.subType) {
    case constants.SUBTYPE_BULB:
      commandObject = buildCommandObjectFromBulbState(deviceWrapper);
      break;

    case constants.SUBTYPE_LED_STRIP:
      commandObject = buildCommandObjectFromLedStripState(deviceWrapper);
      break;

    case constants.SUBTYPE_PLUG:
    case constants.SUBTYPE_SWITCH:
      // Nothing to do - powerState gets added below.
      break;
  }

  // Add in power state regardless of device type.
  commandObject.on_off = deviceWrapper.getPowerState() ? 1 : 0;

  return commandObject;
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

const makeLiveDeviceObject = (deviceWrapper, includeKeys, defaults, excludeKeys, useGlobalDefaultKeys = true) => {
    // Include these keys for all devices.
    const globalIncludeKeys = [
      'channel',
      'id',
      'type',
      'alias',
      'displayLabel',
      'display',
      'subType',
      'displayType',
      'location',
      'host',
      'groups',
      'classes',
      'isOnline',
      'lastSeenAt',
      'state',
    ];

  
    // Use these defaults for all devices.
    const globalDefaults = {
      'display': true 
    };

    // Exclude these keys for all devices.
    const globalExcludeKeys = [
      'socketHandler', 
      'devicePool', 
      'globalConfig', 
      'deviceEventCallback'
    ];

    // Assign the global defaults if requested.
    if (useGlobalDefaultKeys) {
      globalIncludeKeys.forEach(key => includeKeys.push(key));
      globalExcludeKeys.forEach(key => excludeKeys.push(key));      
      Object.keys(globalDefaults).forEach(key => {
        // Add this key/value into defaults if it's not in there yet.
        if (typeof(defaults[key]) === 'undefined') {
          defaults[key] = globalDefaults[key];
        }
      });
    }

    const item = {};

    // Put the defaults on the new object.
    Object.keys(defaults).forEach(key => item[key] = defaults[key]);

    // Get the data from the deviceWrapper.
    includeKeys.forEach(key => (typeof deviceWrapper[key] !== 'undefined') && (item[key] = deviceWrapper[key]));

    return item;
}

export {
  commandMatchesCurrentState,
  buildCommandObjectFromCurrentState,
  getCommandObjectFromTargetData,
  makeLiveDeviceObject,
}