import TplinkSmarthomeApi from 'tplink-smarthome-api';
import _ from 'lodash';

import constants from '../constants.js';
import DeviceWrapper from './DeviceWrapper.js';
import { getPreset } from './Presets.js';
import { log } from './Log.js';

import { isBetweenDuskAndDawn, isDawnOrDusk, isDawn, isDusk, getFromSettingsForNextSunEvent } from '../helpers/jDateTimeUtils.js';
import { loadFilterPlugins } from './Filters.js';

/**
 * The DevicePool encapsulates all automation device functionality.
 * It keeps an array of deviceWrappers to keep track of device status and
 * additional meta information (mapItem properties).
 * A callback function can be passed into intialize() that will be called 
 * on device events (powerstate/lightstate changes).
 */

const devicePool = {

  async initialize(db, io, deviceEventCallback) {
    this.db = db;
    this.dbDeviceMap = db.collection('DeviceMap');
    this.dbConfig = this.db.collection('Config');
    this.devices = [];

    // This function will be injected into the device wrapper and called on device events
    this.deviceEventCallback = (event, deviceWrapper) => {

      //Push device event to sockets
      io.emit('auto/devicestate', { 
        event: event, 
        data: { state: deviceWrapper.state}
      });
      
      // Run the callback if one was passed in
      if (deviceEventCallback) {
        deviceEventCallback(event, deviceWrapper);
      };

    }


    // If a callback function has been passed in, store it.
    if (deviceEventCallback) {
      log(`Registered callback function '${deviceEventCallback.name}' in device pool.`, null, 'white');
    }

    log(`Initializing device pool.`, null, 'white');

    await this.loadGlobalConfiguration();

    loadFilterPlugins();
    this.startPeriodicFilterService();

    this.initDeviceWrappers();
    this.startDiscovery();
  },

  startPeriodicFilterService() {    
    const settings = this.globalConfig?.defaults?.periodicFilters;
    const interval = settings?.checkInterval ?? constants.MINUTE;
  
    log(`Starting periodic filter service at check interval (ms): ${interval}`, null, 'white');
    setInterval(() => this._runPeriodicFilters(this), interval);
  },

  startDiscovery() {
    log(`Starting device discovery...`, null, 'white');

    const client = new TplinkSmarthomeApi.Client();

    // Add a newly discovered device.
    const addDevice = async device => {
      let deviceWrapper;

      const mapItem = await this.getDeviceMapItemById(device.id);

      if (mapItem) {
        // Device is in the map and therefore has an existing wrapper.
        deviceWrapper = this.getDeviceWrapperByChannel(mapItem.channel);
        mapItem.groups = this.getGroupsForChannel(mapItem.channel);
      } else {
        // This device is not in the map (and therefore not in the pool); wrap and add it.
        deviceWrapper = Object.create(DeviceWrapper);
        this.devices.push(deviceWrapper);
      }
      
      deviceWrapper.injectDevice(device, mapItem, this.globalConfig, this.deviceEventCallback);
      deviceWrapper.startPolling();
    }

    const options = {
      // Number of subsequent polling attempts before 'device-offline' is emitted.
      offlineTolerance: this.globalConfig.defaults.offlineTolerance
    }

    log(`Global offline tolerance is ${options.offlineTolerance} attempts.`, null, 'white');
    client.startDiscovery(options).on('device-new', (device) => {
      device.getSysInfo().then(info => {
        addDevice(device);
      });
    });

    log(`Attaching event listeners.`, null, 'white');

    // Attach event listeners for device-online/device-offline    
    client.on('device-offline', async device => {
      const deviceWrapper = await this.getDeviceWrapperById(device.id);
      if (deviceWrapper && deviceWrapper.isOnline) {
        log(`Device went offline.`, deviceWrapper, 'yellow');
        deviceWrapper.isOnline = false;
        deviceWrapper.stopPolling();
      }
    });

    client.on('device-online', async device => {
      const deviceWrapper = await this.getDeviceWrapperById(device.id);
      if (deviceWrapper && !deviceWrapper.isOnline) {
        log(`Device came online.`, deviceWrapper, 'yellow');        
        deviceWrapper.isOnline = true;
        deviceWrapper.flushCommandCache();
        deviceWrapper.startPolling();
        deviceWrapper.lastSeenAt = Date.now();        
      }
    });
    
  },

  /**
   * Apply a preset to a set of devices by target type / target id
   */  
  applyPresetTo(targetType, targetId, presetId, options, origin = 'API') {    
    const deviceWrappers = this.getDeviceWrappers(targetType, targetId);   
    this.applyPreset(deviceWrappers, presetId, options, origin);
  },

  /**
   * Apply a preset to a set of devices
   */  
  applyPreset(deviceWrappers, presetId, options, origin) {
    const preset = getPreset(presetId);        
    
    deviceWrappers.forEach(deviceWrapper => {
      log(`Applying preset ${presetId}`, deviceWrapper);

      if (preset?.stateData?.lightState) {
        deviceWrapper.setLightState(preset.stateData.lightState, null, origin, null, true);        
      }

      if (preset?.stateData?.powerState) {
        deviceWrapper.setPowerState(preset.stateData.powerState, null, origin, null, true);        
      }      
    });
  },

  /**
   * Apply options to a set of devices by target type / target id
   */
  applyOptionsTo(targetType, targetId, options, origin = 'API') {
    if (!(typeof options === 'object' && Object.keys(options).length)) {
      return;
    }

    const deviceWrappers = this.getDeviceWrappers(targetType, targetId);
    this.applyOptions(deviceWrappers, options, origin);
  },

  /**
   * Apply options to a set of devices
   */
  applyOptions(deviceWrappers, options, origin) {
    deviceWrappers.forEach(deviceWrapper => {
      const optionsText = [];

      if (options.suspendPeriodicFilters) { 
        deviceWrapper.suspendPeriodicFilters();
        optionsText.push(`suspend periodic filters`);
      }

      if (options.resumePeriodicFilters) { 
        deviceWrapper.resumePeriodicFilters();
        optionsText.push(`resume periodic filters`);
      }

      const optionsTextStr = optionsText.join(', ');

      log(`Applied options: ${optionsTextStr}`, deviceWrapper);
    });
  },

  /**
   * Get device wrappers by target type / target id
   */
  getDeviceWrappers(targetType, targetId) {
    let deviceWrappers = [];

    switch (targetType) {
      case 'channel':
        const deviceWrapper = this.getDeviceWrapperByChannel(parseInt(targetId));
        if (!deviceWrapper) {
          log(`Device on channel ${targetId} not found.`);
        } else {
          deviceWrappers = [ deviceWrapper ];
        }        
        break;
      
      case 'class':
        deviceWrappers = this.getDeviceWrappersByClassName(targetId);
        if (!deviceWrappers.length) {
          log(`No devices in class ${targetId}.`);
        }    
        break;
        
      case 'group':
        // Todo
        break;
    }

    return deviceWrappers;
  },

  getDeviceWrapperByChannel(channel) {
    return this.devices.find(deviceWrapper => deviceWrapper.channel === channel);
  },

  /**
   * Return an array of group ids that this channel belongs to
   */
  getGroupsForChannel(channel) {
    if (!Array.isArray(this.globalConfig.groups)) {
      return [];
    }

    const groups = this.globalConfig.groups
      .map(groupDefinition => {
        if (Array.isArray(groupDefinition.channels)) {
          if (groupDefinition.channels.includes(channel)) {
            return groupDefinition.id;
          };
        }

        return null;
      }).filter(item => item);

      return groups;
  },

  getDeviceWrappersByClassName(className) {
    const deviceWrappers = [];

    this.devices.forEach(deviceWrapper => {
      if (Array.isArray(deviceWrapper.classes) && deviceWrapper.classes.includes(className)) {
        deviceWrappers.push(deviceWrapper);
      }
    })

    return deviceWrappers;
  },

  getLiveDeviceMap() {
    const map = [];
    this.devices.forEach(deviceWrapper => map.push(this.getLiveDevice(deviceWrapper)));
    return map;
  },

  getLiveDevice(deviceWrapper) {
    const { channel, id, alias, subType, targets, type, host, isOnline, lastSeenAt, powerState, state } = deviceWrapper;
      
    const item = {
      channel,
      id,
      alias,
      subType,
      targets,
      type,
      host,
      isOnline,
      lastSeenAt,
      powerState,
      state,
    };

    return item;
  },

  async getDeviceMapItemById(id) {
    return this.dbDeviceMap.findOne({id});
  },

  async getDeviceMapFromDb() {
    return this.dbDeviceMap.find({}).toArray();
  },

  async getDeviceWrapperById(id) {
    const mapItem = await this.getDeviceMapItemById(id);
    if (mapItem) {
      return Promise.resolve(this.getDeviceWrapperByChannel(mapItem.channel));
    }
  },

  // Create deviceWrappers for all devices on the map.
  async initDeviceWrappers() {
    const deviceMap = await this.getDeviceMapFromDb();

    if (Array.isArray(deviceMap)) {
      deviceMap.forEach(mapItem => {
        const deviceWrapper = Object.create(DeviceWrapper);      
  
        mapItem.groups = this.getGroupsForChannel(mapItem.channel);
  
        // Store a backreference to the pool and to the socket handler in each wrapper
        deviceWrapper.devicePool = this;
        deviceWrapper.socketHandler = this.socketHandler;
        
        // Call this here with a null device. It will be called again once the device is discovered.
        deviceWrapper.injectDevice(null, mapItem, this.globalConfig, this.deviceEventCallback);  
        this.devices.push(deviceWrapper);      
      });
    }
  },

  async loadGlobalConfiguration() {
    const globalConfig = await this.dbConfig.findOne();
    this.globalConfig = globalConfig;
    const noMapItems = await this.dbDeviceMap.countDocuments();
    log(`Loaded global configuration and found ${noMapItems} registered devices in the database.`, null, 'white');
  }, 

  // Internal

  // Any filter configured on a device that has an interval property > 0 set, will be applied by this function.
  _runPeriodicFilters() {
    const serviceName = 'Periodic Filter Service';
    const tag = `${serviceName}: `;
    log(`${tag}Run filters...`, null);

    let devicesProcessed = 0, devicesSkipped = 0;
    let filtersProcessed = 0, filtersSkipped = 0;

    if (Array.isArray(this.devices)) {
      this.devices.forEach(deviceWrapper => {
              
        const filtersToRun = this._getCurrentlyActivePeriodicFilters(deviceWrapper.filters);

        if (Array.isArray(filtersToRun) && filtersToRun.length) {        
          if (!deviceWrapper.periodicFiltersSuspended) {
            deviceWrapper.setLightState({}, null, serviceName, filtersToRun);
            filtersProcessed += filtersToRun.length;
            devicesProcessed++;
          } else {
            filtersSkipped += filtersToRun.length;
          }
        }  

        if (deviceWrapper.periodicFiltersSuspended) {      
          devicesSkipped++;
        }
    
      });
    }

    let t = '';
    if (devicesProcessed) {      
      t += `Processed ${filtersProcessed} filters on ${devicesProcessed} devices. `;
    }
    
    if (devicesSkipped) {
      t += `Skipped ${filtersSkipped} filters on ${devicesSkipped} devices. `;
    }

    log(tag + (t ? t : `Nothing to do.`));
  },

  // Filter out filters that shouldn't run
  _getCurrentlyActivePeriodicFilters(allFilters) {
    const filtersToRun = [];

    if (Array.isArray(allFilters) && allFilters.length) {
      // Get the default for all periodic filters
      const defaultPaddingFromSunEvent = this.globalConfig?.defaults?.periodicFilters?.paddingFromSunEvent ?? constants.HOUR * 2;

      allFilters.forEach(filterObject => {

        // Has periodicallyActive set?
        if (filterObject && filterObject.periodicallyActive) {

          const periodicallyActive = filterObject.periodicallyActive;

          // Has a restriction set?
          if (periodicallyActive.restriction) {
            // Is restricted - evaluate.

            // See if this filter has custom padding, otherwise use the default
            const paddingFromSunEvent = getFromSettingsForNextSunEvent('paddingFromSunEvent', periodicallyActive) ?? defaultPaddingFromSunEvent;

            let runThisFilter = false;

            switch (filterObject.periodicallyActive?.restriction) {
              case 'always':
                runThisFilter = true;
                break;

              case 'duskToDawn':
                runThisFilter = isBetweenDuskAndDawn(null, null, paddingFromSunEvent);
                break;

              case 'dawnAndDusk':
              case 'duskAndDawn':
                runThisFilter = isDawnOrDusk(null, null, paddingFromSunEvent);
                break;

              case 'dusk':
                runThisFilter = isDusk(null, null, paddingFromSunEvent);

              case 'dawn':
                runThisFilter = isDawn(null, null, paddingFromSunEvent);
            }
  
            if (runThisFilter) {
              filtersToRun.push(filterObject);
            }
            
          } else {
            // No restriction - run around the clock.
            filtersToRun.push(filterObject);
          }

        }
      });
    }

    return filtersToRun;
  }
}


export { 
  devicePool, 
  constants 
};