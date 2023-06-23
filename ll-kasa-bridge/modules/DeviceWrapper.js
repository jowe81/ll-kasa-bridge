import _ from 'lodash';

import constants from '../constants.js';
import { log } from './Log.js';
import { commandMatchesCurrentState, getCommandObjectFromTargetData } from './TargetDataProcessor.js';
import { getFilterPlugins } from "./Filters.js";
import { resolveDeviceDependencies } from './DependencyResolver.js';


const cmdPrefix = '[CMD]';
const cmdFailPrefix = '[FAIL]';

/**
 * A Wrapper around the device object that stores additional mapItem properties
 * and manages an isOnline flag based on device-online/device-offline events
 * emitted by the client object.  
 */

 const DeviceWrapper = {
  device: null,

  addCallback(callbackFn, event) {
    log(`Adding callback to '${event}`, this);
  },

  addListeners(callbackFn) {

    // Handles actions after power-update events on IOT.SMARTPLUGSWITCH
    const onOffListener = (newState) => {

      // This call must come before updateState (it needs the old state).
      const changeInfo = this.analyzeStateChange(newState);
      this.updateState(newState);

      // There was no change.
      if (!(changeInfo && changeInfo.changed)) {
        return;
      }

      const event = this.getPowerState() ? 'power-on' : 'power-off';
      log(event, this);

      // See if we should ignore this event.
      if (this.__ignoreNextChangeByBackend) {
        // Ignore this change and remove the flag.
        this.__ignoreNextChangeByBackend = undefined;
        return;
      }

      if (!this.type === 'IOT.SMARTPLUGSWITCH' && this.subType === constants.SUBTYPE_SWITCH) {
        // This isn't an actual switch (does it matter?)
        return;
      }
      
      // Process target devices
      this.executeCommands(event, this);

      deviceEventCallback(event, this);
    }

    // Handles actions after lightstate-update events on IOT.SMARTBULB
    const lightStateListener = (newState) => {

      // This call must come before updateState (it needs the old state).
      const changeInfo = this.analyzeStateChange(newState);
      this.updateState(newState);

      // Was this a change at all?
      if (!(changeInfo && changeInfo.changed)) {
        return;
      }

      // Was it an on/off change?
      if (!changeInfo.on_off) {
        return;
      }

      // This was an on-off change; which way?
      const event = this.getPowerState() ? 'lightstate-on' : 'lightstate-off';
      log(event, this);

      // Process linked devices
      this.processLinkedDevices(changeInfo);

      deviceEventCallback(event, this);
    }

    //If no callback function is present create a dummy.
    const deviceEventCallback = this.deviceEventCallback ? this.deviceEventCallback : () => {};

    switch (this.device.type) {
      case 'IOT.SMARTPLUGSWITCH':
        this.device.on('power-update', onOffListener);
        break;
  
      case 'IOT.SMARTBULB':
        this.device.on('lightstate-update', lightStateListener);
        break;
    }
  
  },


  /**
   * Compare newState against the current state of the device.
   * 
   * @param   {} newState 
   * @returns {} Infomation about the change or undefined if current state doesn't exist.
   */
  analyzeStateChange(newState) {
    if (this.state === undefined) {
      // Have no current state. Just received the first update.
      return undefined;
    } 

    /*
        Gleaned from observation:

        ## Lightstate-on:

        [dft_on_state] present ?
          it was turned on by the backend :
          it was turned on on the device or via the kasa app

        ## Lightstate-off:

        [mode, groups] present ?
          it was turned on by the backend :
          it was turned on on the device or via the kasa app
     */

    const changeInfo = {};
    changeInfo.changed = !_.isEqual(this.state, newState);

    if (changeInfo.changed) {

      // If this is a power-state change then there's nothing to analyse
      if (this.type === 'IOT.SMARTPLUGSWITCH') {
        return changeInfo;
      }

      let backendChange;

      changeInfo.on_off = this.state.on_off !== newState.on_off;
      changeInfo.transition = this.state.transition !== newState.transition;

      if (changeInfo.on_off) {
        if (newState.on_off === 1) {
          // Was turned on
          backendChange = newState.dft_on_state ? true : false;

          if (backendChange) {
            changeInfo.settings = !_.isEqual(this.state.dft_on_state.groups, newState.dft_on_state.groups);
          } else {
            changeInfo.settings = !_.isEqual(this.state.dft_on_state.groups, newState.groups);
          }
        } else {
          // Was turned off
          backendChange = newState.mode && newState.groups;

          if (backendChange) {            
            changeInfo.settings = !_.isEqual(this.state.groups, newState.groups);
          } else {
            changeInfo.settings = !_.isEqual(this.state.groups, newState.dft_on_state.groups);
          }
        }
      } else {
        // Was not an on_off change
        if (this.state.on_off === 1) {
          changeInfo.settings = !_.isEqual(this.state.groups, newState.groups);
        } else {
          changeInfo.settings = !_.isEqual(this.state.dft_on_state.groups, newState.dft_on_state.groups);
        }
        
      }
            
      if (changeInfo.on_off || changeInfo.settings) {
        // Either on_off or the settings changed; we have the origin for this case.
        changeInfo.origin = backendChange ? constants.SERVICE_BACKEND : 'other';
      } else {
        // Only the transition changed; not sure of the origin but most likely a backend change.
        changeInfo.origin = constants.SERVICE_BACKEND;
      }

    }

    if (changeInfo.changed && !(changeInfo.on_off || changeInfo.settings || changeInfo.transition)) {
      // The state objects weren't equal but nothing actually changed in the state.
      return { changed: false };
    }

    return changeInfo;
  },

  executeCommands(event, originDeviceWrapper) {

    // Get targets and data from device configuration
    const targetsForOnPosition = {
      'powerState': this.targets?.on?.powerState,
      'lightState': this.targets?.on?.lightState,
    };

    const targetsForOffPosition = {
      'powerState': this.targets?.off?.powerState,
      'lightState': this.targets?.off?.lightState,
    };
    
    // Also support definitions with no separation between powerState and lightState
    if (Array.isArray(this.targets?.on)) {
      targetsForOnPosition.powerState = this.targets.on.filter(target => typeof target.stateData === 'boolean');
      targetsForOnPosition.lightState = this.targets.on.filter(target => typeof target.stateData === 'object');
    }

    if (Array.isArray(this.targets?.off)) {
      targetsForOffPosition.powerState = this.targets.off.filter(target => typeof target.stateData === 'boolean');
      targetsForOffPosition.lightState = this.targets.off.filter(target => typeof target.stateData === 'object');
    }
    
    let targets = null;
    let triggerSwitchPosition = null;

    switch (event) {
      case 'power-on':
        triggerSwitchPosition = true;
        break;
      
      case 'power-off':
        triggerSwitchPosition = false;
        break;
    }

    if (triggerSwitchPosition !== null) {
      targets = triggerSwitchPosition ? targetsForOnPosition : targetsForOffPosition;
    }


    if (!targets) {
      return;
    }    

    // Have targets to switch powerState on?
    if (targets.powerState) {
      const list = targets.powerState.map(target => JSON.stringify(target));

      log(`${event}, targets: [${list.join(', ')}]`, this);

      targets.powerState.forEach(target => {
        const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(target.channel)
        if (deviceWrapper) {
          const delay = target.delay ?? 0;
          setTimeout(() => deviceWrapper.setPowerState(target.stateData, originDeviceWrapper), delay);
        }
      });    
    }

    // Have targets to change lightState on?
    if (targets.lightState) {
      const list = targets.lightState.map(target => JSON.stringify(target));

      log(`${event}, targets: [${list.join(', ')}]`, this);

      targets.lightState.forEach(target => {
        const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(target.channel)
        if (deviceWrapper) {
          
          // Is there data in this target object?
          if (target.stateData) {
            const commandObject = getCommandObjectFromTargetData(target.stateData);          

            if (!commandObject) {
              return;
            }

            const filtersToRun = target.filters;
            
            const delay = target.delay ?? 0;                
            setTimeout(() => deviceWrapper.setLightState(commandObject, triggerSwitchPosition, originDeviceWrapper, filtersToRun), delay);

          } else {
            log(`Ignoring empty target object`, this);
          }

        }
      });    
    }
  },

  /**
   * Perform filtering of a commandObject
   * @param {*} filterObject 
   * @param {*} commandObject 
   * @returns the filtered commandObject
   */
  filter(filterObject, commandObject) {
    const { pluginName } = filterObject;

    if (!pluginName) {
      return commandObject;
    }

    const filterPlugins = getFilterPlugins();
    const { execute, data } = filterPlugins[pluginName];
    
    if (!execute) {
      log(`Filter plugin '${pluginName}' not found.`, this, 'red');
      return commandObject;
    }

    // Execute the filter plugin.
    commandObject = execute(
      filterObject,
      commandObject,
      this,
      filterPlugins, // Pass in the array of plugins so filters can cross-reference.
    );

    if (constants.DEBUG) {
      log(`Executed ${pluginName}/${filterObject.label}. Returned: ${JSON.stringify(commandObject)}`, this, 'debug');
    }

    return commandObject;
  },


  // Return power state as a boolean, regardless of the type of device
  getPowerState() {
    let powerState = undefined;

    switch (this.type) {
      case 'IOT.SMARTBULB':
        if ([0, 1].includes(this.state?.on_off)) {
          powerState = this.state.on_off === 1 ? true : false;
        }
        break;

      case 'IOT.SMARTPLUGSWITCH':
        if (typeof this.state === 'boolean') {
          powerState = this.state;
        }
        break;

    }

    return powerState;
  },

  /**
   * Return linked devices that are defined on linked groups
   */
  getLinkedDevicesFromGroups() {

    const linkedDevices = [];

    const haveLinkedDeviceDefinitionAlready = (linkedDeviceDefinition) => {
      return linkedDevices.find(existingDefinition => existingDefinition.channel === linkedDeviceDefinition.channel)
    }

    if (Array.isArray(this.groups)) {
      
      // Go through each group
      this.groups.forEach(groupId => {
        const group = this.globalConfig.groups?.find(group => group.id === groupId);

        if (group && Array.isArray(group.linkedDevices)) {
          // Go through each linked device definition on this group
          group.linkedDevices.forEach(groupLinkedDeviceDefinition => {

            // Add this definition only if a definition for this channel hasn't been collected yet.
            if (!haveLinkedDeviceDefinitionAlready(groupLinkedDeviceDefinition)) {
              linkedDevices.push(groupLinkedDeviceDefinition);
            }
          });          
        }        
      });
    }

    return linkedDevices;    
  },
 
  injectDevice(device, mapItem, globalConfig, deviceEventCallback) {
    this.device = device;
    this.deviceEventCallback = deviceEventCallback;

    if (mapItem) {
      // Copy in the mapItem properties.
      Object.keys(mapItem).forEach(key => { 
        this[key] = mapItem[key];
      });

      this.globalConfig = globalConfig;

      if (device) {
        this.id = device.id;
        this.type = device.type;
        this.host = device.host;

        // If the device alias doesn't match the one from the map, update it.
        if (this.alias != device.alias) {
          device
            .setAlias(this.alias)
            .then(data => {
              log(`Updated alias from ${device.alias} to ${this.alias}.`, this);
            })
            .catch(err => {
              log(`Updating alias failed.`, this, null, err);
            });
        }

        log(`Discovered device at ${device.host}`, this, 'yellow');
        resolveDeviceDependencies(this);
        this.addListeners();
      }
    } else {
      if (device) {
        log(`Found unmapped device at ${device.host} - ID ${device.id}, type ${device.type}`, this, 'magenta');
      }
    }
  },

  // After a change, see if linked devices need to be adjusted
  processLinkedDevices(changeInfo) {

    // Do we have state data for this device?
    const newStateBool = this.getPowerState();

    if (!typeof newStateBool === 'boolean') {
      log(`Connected devices check failed (no state data for this device)`, this, 'red');
      return;
    }

    // If this device is a member of a group with a linkedDevices property, use those instead of a possibly existing local linkedDevices array    
    let linkedDevices = this.getLinkedDevicesFromGroups();

    if (!linkedDevices.length) {
      // Not a member of groups with linked devices. Use the local definition.
      if (Array.isArray(this.linkedDevices)) {
        linkedDevices = this.linkedDevices;
      }
    }

    if (!(linkedDevices && linkedDevices.length)) {
      return;
    }
    
    linkedDevices.forEach(linkInfo => {      
      const linkedWrapper = this.devicePool.getDeviceWrapperByChannel(linkInfo.channel);

      if (this.type !== 'IOT.SMARTBULB' && changeInfo.origin === constants.SERVICE_BACKEND && linkedWrapper.type === 'IOT.SMARTPLUGSWITCH') {
        /**
         * Ignoring change for the linked device, because this is not a smart bulb,  
         * the change was backend originated, and the linked device is a smartplugswitch.
         * Not catching this case will result in an unstable switch (infinite flips).
         */
        return;
      }

      // Do we care about this change?
      if (newStateBool && linkInfo.onPosition === false) {
        return;
      }                

      if (!newStateBool && linkInfo.offPosition === false) {
        return;
      }                

      // Has the connected device been discovered?
      if (!linkedWrapper) {
        log(`Connected device check failed for channel ${linkInfo.channel} (device not discovered)`, this, 'red');
        return;
      }

      // Is the connected device live?
      if (!linkedWrapper.isOnline) {
        log(`Connected device check failed for channel ${linkInfo.channel} (device went offline)`, this, 'red');
        return;
      }
      
      // Do we have power state for this device?
      const linkedWrapperStateBool = linkedWrapper.getPowerState();
      
      if (typeof linkedWrapperStateBool !== 'boolean') {
        log(`Connected device check failed for channel ${linkedWrapper.channel} (no state data)`, this, 'red');
        return;
      }

      let flipPowerstate = false;
    
      // See if we need to flip this device
      if (linkInfo.sync) {
        // Keep the target device in sync                      
        if (linkInfo.inverse) {
          // Inverse sync
          flipPowerstate = newStateBool === linkedWrapperStateBool;
        } else {
          // Same direction sync
          flipPowerstate = newStateBool !== linkedWrapperStateBool;
        }
      } else {
        // Toggle the target device, regardless of its current position
        flipPowerstate = true;
      }

      // Flip the device if needed
      if (flipPowerstate) {
        // Set a flag on it to ignore the next power state change originating from the backend
        linkedWrapper.__ignoreNextChangeByBackend = true;

        log(`Flipping connected device: ${linkedWrapper.alias}`, this);
        linkedWrapper.setPowerState(!linkedWrapperStateBool, constants.SERVICE_BACKEND);
      }
  
    });

  },

  async setLightState(commandObject, triggerSwitchPosition, origin, filters = null) {    
    let originText = typeof origin === 'object' ? (origin.alias ?? origin.id ?? origin.ip ?? origin.text) : origin ? origin : 'unknown origin';

    if (!this.device) {
      log(`${cmdPrefix} ${cmdFailPrefix} setLightState failed: device not found.`, this, 'red');
      return;
    }

    // Apply filters    
    if (filters === null) {
      // No filters were passed in; use filters configured on this device.
      filters = this.filters;
    }

    if (Array.isArray(filters) && filters.length) {
      filters.forEach(filterObject => {
        const switchPositionSetting = filterObject.switchPosition;
  
        // Execute the filter if:
        if (
          // the origin of the request the periodic filter service, or
          (origin === constants.SERVICE_PERIODIC_FILTER) ||
          // a switchPosition setting has not been defined for the filter, or
          (typeof switchPositionSetting !== 'boolean') || 
          // the trigger switch position matches the switchPosition setting.
          (switchPositionSetting !== null && switchPositionSetting === triggerSwitchPosition)
        ) {
          // switchPosition either is not set on the filter, or it matches the trigger switch position.
          commandObject = this.filter(filterObject, commandObject, true);
        }
      });  
    }
    
    if (!Object.keys(commandObject).length) {
      // No point in sending an empty command object.
      return;
    }

    if (origin === constants.SERVICE_PERIODIC_FILTER) {
      const stateCheck = commandMatchesCurrentState(this, commandObject);

      if (stateCheck) {
        // No point in issuing a command that would change nothing.
        return;
      }
  
    }

    if (!this.isOnline) {
      log(`${cmdPrefix} ${cmdFailPrefix} setLightState failed: device is offline.`, this, 'red');
      return;
    }

    try {
      const data = await this.device.lighting.setLightState(commandObject);
      log(`${cmdPrefix} [${originText}] setLightState ${JSON.stringify(commandObject)}`, this, 'cyan');
    } catch(err) {
      log(`${cmdPrefix} [${originText}] ${cmdFailPrefix} setLightState returned an error`, this, null, err);
    }
  },

  async setPowerState(state, origin) {    
    let originText = typeof origin === 'object' ? (origin.alias ?? origin.id ?? origin.ip ?? origin.text) : origin ? origin : 'unknown origin';

    if (this.device && this.isOnline) {
      try {
        const data = await this.device.setPowerState(state);
        log(`${cmdPrefix} [${originText}] setPowerState ${state ? 'on' : 'off'}`, this, 'cyan');  
      } catch(err) {
        log(`${cmdPrefix} [${originText}]${cmdFailPrefix} setPowerState returned an error`, this, null, err);
      }
    } else {
      log(`${cmdPrefix} ${cmdFailPrefix} setPowerState failed: device is offline.`, this, 'red');
    }
  },

  async toggle(origin) {
    console.log("Toggle", origin)    ;
    if (this.device) {
      if (this.isOnline) {
        let state = null;
        switch (this.type) {
          case 'IOT.SMARTBULB':
            state = this.state.lightstate.on_off;
            break;
          case 'IOT.SMARTPLUGSWITCH':
            state = this.state.powerstate;            
        }

        if (state !== null) {
          log(`${cmdPrefix} toggle`, this, 'bgBlue');
          this.setPowerState(!state, origin);
        }
        console.log(this.type, !state);
        //if (this.subType ===)
      }
    }
  },


  startPolling() {

    if (this.device && this.isOnline) {

      this.config = this.globalConfig[this.subType];

      this.device.on('polling-error', (err) => {
        if (this.isOnline) {
          log("Polling error. Device probably went offline.", this, null, err?.message);
        }
        console.log(err);
      });
  
      const pollInterval = this.config?.pollInterval ?? 10000;

      this.device.startPolling(pollInterval);
      log(`Polling this ${this.subType ? this.subType : `unknown device`} at ${pollInterval} ms.`, this, 'yellow');  
    }

  },

  stopPolling() {
    if (this.device) {
      log(`Suspending polling.`, this);  
      this.device.stopPolling();
    }
  },

  updateState(data) {
    this.lastSeenAt = Date.now();
    this.state = _.cloneDeep(data);
  }
}

export default DeviceWrapper;