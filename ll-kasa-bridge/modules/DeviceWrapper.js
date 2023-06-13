import _ from 'lodash';

import { log } from './Log.js';
import { filter, getCommandObjectFromTargetData } from './TargetDataProcessor.js';
import { allAreBoolean } from '../helpers/jUtils.js';

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
    //If no callback function is present create a dummy.
    const deviceEventCallback = this.deviceEventCallback ? this.deviceEventCallback : () => {};

    // Send the meta for this device as the origin of the request (used with switches)
    const { type, channel, id, alias } = this;
    const origin = {
      type,
      channel,
      id,
      alias,
    }

    const switchOnOffListener = (event) => {
      if (![this.globalConfig.subTypes.tSwitch, this.globalConfig.subTypes.tStrip].includes(this.subType)) {
        // The trigger did not come from a switch (as opposed to a plug or bulb)
        return;
      }

      // See if we should ignore this event
      if (['power-on', 'power-off'].includes(event)) {
        if (this.__ignoreNextChangeByBackend) {
          // Ignore this change and remove the flag.
          this.__ignoreNextChangeByBackend = undefined;
          return;
        }
      }



      this.executeCommands(event, this);

      deviceEventCallback(event, this);
    }

    switch (this.device.type) {
      case 'IOT.SMARTPLUGSWITCH':
        this.device.on('power-on', () => switchOnOffListener('power-on'));
        this.device.on('power-off', () => switchOnOffListener('power-off'));
        this.device.on('power-update', (state) => {          
          this.updateState(state);
        });
        break;
  
      case 'IOT.SMARTBULB':
        this.device.on('lightstate-on', (e) => {
          log('lightstate-on', this);
          deviceEventCallback('lightstate-on', this);
        });
        
        this.device.on('lightstate-off', (e) => {
          log('lightstate-off', this);
          deviceEventCallback('lightstate-off', this);
        });

        this.device.on('lightstate-update', (newState) => {

          const changeInfo = this.analyzeStateChange(newState);
          this.updateState(newState);

          // Remove this eventually
          const l = ([38].includes(this.channel));
          if (l) {

            if (changeInfo && changeInfo.changed && changeInfo.origin !== 'backend') {
              // Change did not originate from the backend

              if (!changeInfo.on_off && !this.linkedDevices) {
                // Either it wasn't an on/off change or there are no linked devices
                return;
              }

              // This was an on-off change. See if there are linked devices to process.

              // Do we have state data for this device?
              const newStateBool = this.getPowerState();

              if (!typeof newStateBool === 'boolean') {
                log(`Connected devices check failed (no state data for this device)`, this, 'red');
                return;
              }

              this.linkedDevices.forEach(linkInfo => {                    
                const linkedWrapper = this.devicePool.getDeviceWrapperByChannel(linkInfo.channel);

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
                }

                // Is the connected device live?
                if (!linkedWrapper.isOnline) {
                  log(`Connected device check failed for channel ${linkInfo.channel} (device went offline)`, this, 'red');
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
                  linkedWrapper.setPowerState(!linkedWrapperStateBool);
                }
            
              });
            }  
          }          

          
        })
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
        changeInfo.origin = backendChange ? 'backend' : 'other';
      } else {
        // Only the transition changed; not sure of the origin but most likely a backend change.
        changeInfo.origin = 'backend';
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
          setTimeout(() => deviceWrapper.setPowerState(target.data, originDeviceWrapper), delay);
        }
      });    
    }

    // Have targets to switch powerState on?
    if (targets.lightState) {
      const list = targets.lightState.map(target => JSON.stringify(target));

      log(`${event}, targets: [${list.join(', ')}]`, this);

      targets.lightState.forEach(target => {
        const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(target.channel)
        if (deviceWrapper) {
          
          // Is there data in this target object?
          if (target.data) {
            const delay = target.delay ?? 0;

            const commandObject = getCommandObjectFromTargetData(target.data);

            console.log('CommandObject: ', commandObject);

            if (this.channel === 14) {
              console.log("Switch Position: ", this.alias, triggerSwitchPosition);
            }
    
            setTimeout(() => deviceWrapper.setLightState(commandObject, triggerSwitchPosition, originDeviceWrapper), delay);

          } else {
            log(`Ignoring empty target object`, this);
          }

        }
      });    
    }
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

        this.addListeners();
      }
    } else {
      if (device) {
        log(`Found unmapped device at ${device.host} - ID ${device.id}, type ${device.type}`, this, 'magenta');
      }
    }
  },

  async setLightState(commandObject, triggerSwitchPosition, origin) {    
    let originText = typeof origin === 'object' ? (origin.alias ?? origin.id ?? origin.ip ?? origin.text) : 'unknown origin';

    // Apply filters
    if (this.filters) {
      this.filters.forEach(filterObject => {
        if (filterObject.switchPosition !== null && filterObject.switchPosition === triggerSwitchPosition) {
          commandObject = filter(filterObject, commandObject);
        } else {
          console.log("Filter doesn't apply");
        }
      });
    }

    if (this.device && this.isOnline) {
      try {
        const data = await this.device.lighting.setLightState(commandObject);
        log(`${cmdPrefix} setLightState ${JSON.stringify(commandObject)}`, this, 'cyan');
      } catch(err) {
        log(`${cmdPrefix} ${cmdFailPrefix} setLightState returned an error`, this, null, err);
      }
    } else {
      log(`${cmdPrefix} ${cmdFailPrefix} setLightState failed: device is offline.`, this, 'red');
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

      const { tBulb, tStrip, tPlug, tSwitch } = this.globalConfig?.subTypes;

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