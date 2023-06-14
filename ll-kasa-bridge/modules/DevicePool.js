import TplinkSmarthomeApi from 'tplink-smarthome-api';

import DeviceWrapper from './DeviceWrapper.js';
import { log } from './Log.js';
import { filter, getCommandObjectFromTargetData } from './TargetDataProcessor.js';

/**
 * The DevicePool encapsulates all automation device functionality.
 * It keeps an array of deviceWrappers to keep track of device status and
 * additional meta information (mapItem properties).
 * A callback function can be passed into intialize() that will be called 
 * on device events (powerstate/lightstate changes).
 */
const DevicePool = {

  async initialize(db, io, deviceEventCallback) {
    this.db = db;
    this.dbDeviceMap = db.collection('deviceMap');
    this.dbConfig = this.db.collection('config');
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
        deviceEventCallback();
      };

    }


    // If a callback function has been passed in, store it.
    if (deviceEventCallback) {
      log(`Registered callback function '${deviceEventCallback.name}' in device pool.`, null, 'white');
    }

    log(`Initializing device pool.`, null, 'white');

    await this.loadGlobalConfiguration();

    this.startPeriodicFilterService();
    this.startDiscovery();
  },

  startPeriodicFilterService() {    
    const interval = this.globalConfig?.defaults?.periodicFilterServiceCheckInterval ?? 60 * 1000;

    log(`Starting periodic filter service at check interval (ms): ${interval}`, null, 'white');
    setInterval(() => this._runPeriodicFilters(this), interval);
  },

  startDiscovery() {
    log(`Starting device discovery...`, null, 'white');

    const client = new TplinkSmarthomeApi.Client();

    const addDevice = async device => {
      const deviceWrapper = Object.create(DeviceWrapper);      
      const mapItem = await this.getDeviceMapItemById(device.id);

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
    log(`Checking filters...`, null, 'bgGray');
      if (Array.isArray(this.devices)) {
        this.devices.forEach(deviceWrapper => {
          const filters = deviceWrapper.getPeriodicFilters();

          if (filters) {
            deviceWrapper.setLightState({}, null, 'periodic filter service', filters);
          }          
      });
    }
  }

}


export default DevicePool;