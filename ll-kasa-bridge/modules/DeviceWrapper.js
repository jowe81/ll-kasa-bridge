import { log } from './Log.js';
import { filter, getCommandObjectFromTargetData } from './TargetDataProcessor.js';

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

      // Get targets and data from device configuration
      const targetsForOnPosition = {
        'powerState': this.targets?.on?.powerState,
        'lightState': this.targets?.on?.lightState,
      };

      const targetsForOffPosition = {
        'powerState': this.targets?.off?.powerState,
        'lightState': this.targets?.off?.lightState,
      };
      
      // Was the switch turned on or off?
      let triggerSwitchPosition = null;

      switch (event) {
        case 'power-on':
          triggerSwitchPosition = true;
          break;
        
        case 'power-off':
          triggerSwitchPosition = false;
          break;
      }

      let targets = null;

      if (triggerSwitchPosition !== null) {
        targets = triggerSwitchPosition ? targetsForOnPosition : targetsForOffPosition;
      }


      // Are there any targets?
      if (targets) {

        // Have targets to switch powerState on?
        if (targets.powerState) {
          const list = targets.powerState.map(target => JSON.stringify(target));

          log(`${event}, targets: [${list.join(', ')}]`, this);

          targets.powerState.forEach(target => {
            const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(target.channel)
            if (deviceWrapper) {
              const delay = target.delay ?? 0;
              setTimeout(() => deviceWrapper.setPowerState(target.data, origin), delay);
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
        
                setTimeout(() => deviceWrapper.setLightState(commandObject, triggerSwitchPosition, origin), delay);

              } else {
                log(`Ignoring empty target object`, this);
              }

            }
          });    
        }

      }

      deviceEventCallback(event, this);
    }

    switch (this.device.type) {
      case 'IOT.SMARTPLUGSWITCH':
        this.device.on('power-on', () => switchOnOffListener('power-on'));
        this.device.on('power-off', () => switchOnOffListener('power-off'));
        this.device.on('power-update', (data) => this.updateLastSeen({ 'powerstate': data }));
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

        this.device.on('lightstate-update', (data) => {
          this.updateLastSeen({ 'lightstate': data });
        })
        break;
    }
  
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

  updateLastSeen(data) {
    this.lastSeenAt = Date.now();
    this.state = data ;
  }
}

export default DeviceWrapper;