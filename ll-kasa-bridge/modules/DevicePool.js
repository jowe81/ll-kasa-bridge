import TplinkSmarthomeApi from 'tplink-smarthome-api';
import _ from 'lodash';

import constants from '../constants.js';
import DeviceWrapper from './DeviceWrapper.js';
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

    // Load the filter plugins
    loadFilterPlugins();

    this.startPeriodicFilterService();
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

    const addDevice = async device => {
      const deviceWrapper = Object.create(DeviceWrapper);      
      const mapItem = await this.getDeviceMapItemById(device.id);

      if (mapItem) {
        mapItem.groups = this.getGroupsForChannel(mapItem.channel);
      }

      // Store a backreference to the pool in each wrapper to enable event listeners to execute functinos on other devices
      deviceWrapper.devicePool = this;
      deviceWrapper.injectDevice(device, mapItem, this.globalConfig, this.deviceEventCallback);
      
      this.devices.push(deviceWrapper);      
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
        deviceWrapper.startPolling();
      }
    });
    
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

  getLiveDeviceMap() {
    const map = [];

    this.devices.forEach(deviceWrapper => {

      const { channel, id, alias, subType, targets, type, host, isOnline, lastSeenAt, state } = deviceWrapper;
      
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
        state,
      };

      map.push(item);
    });

    return map;
  },

  async getDeviceMapItemById(id) {
    return this.dbDeviceMap.findOne({id});
  },

  async getDeviceWrapperById(id) {
    const mapItem = await this.getDeviceMapItemById(id);
    if (mapItem) {
      return Promise.resolve(this.getDeviceWrapperByChannel(mapItem.channel));
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

    let filtersProcessed = 0;

    if (Array.isArray(this.devices)) {
      this.devices.forEach(deviceWrapper => {

      const filtersToRun = this._getCurrentlyActivePeriodicFilters(deviceWrapper.filters);

      if (Array.isArray(filtersToRun) && filtersToRun.length) {        
        deviceWrapper.setLightState({}, null, serviceName, filtersToRun);
        filtersProcessed++;
      }          
  
    });

    if (filtersProcessed) {
      log(`${tag}Processed ${filtersProcessed} filters.`);
    } else {
      log(`${tag}Nothing to do.`);
    }
    }
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