const { getFormattedDate, pad } = require('../helpers/jUtils');

const log = (t, deviceWrapper, err) => {
  let prefix = ``;

  channel = deviceWrapper?.channel ? pad(deviceWrapper?.channel, 2) : 0;
  if (channel) {
    prefix += `Ch ${channel}` + (deviceWrapper.device ? ` (${deviceWrapper.alias})` : ``);
  }

  let line;
  const colon = channel ? ': ' : '';

  if (err) {
    if (t) {
      //If a string was sent, put it in brackets
      line = `${getFormattedDate()} ${prefix}${colon}Error (${t}):`;
    } else {
      line = `${getFormattedDate()} ${prefix}${colon}Error:`;
    }
    console.log(line, err);
  } else {
    line = `${getFormattedDate()} ${prefix}${colon}${t}`;
    console.log(line);
  }
}


/**
 * A Wrapper around the device object that stores additional mapItem properties
 * and manages an isOnline flag based on device-online/device-offline events
 * emitted by the client object.  
 */

const DeviceWrapper = {
  device: null,

  addListeners(callbackFn) {
    //If no callback function is present create a dummy.
    const callback = this.deviceEventCallbackFn ? this.deviceEventCallbackFn : () => {};

    switch (this.device.type) {
      case 'IOT.SMARTPLUGSWITCH':
  
        this.device.on('power-on', (e) => {
          log('power-on', this);
          this.switchTargets?.forEach(channel => {
            targetDeviceWrapper = this.devicePool.getDeviceWrapperByChannel(channel);
            targetDeviceWrapper?.setPowerState(true);
          });
          this.switchTargetsOff?.forEach(channel => {
            targetDeviceWrapper = this.devicePool.getDeviceWrapperByChannel(channel);
            targetDeviceWrapper?.setPowerState(false);
          });
          callback('power-on', this);
        });
  
        this.device.on('power-off', (e) => {
          log('power-off', this);
          this.switchTargetsOff?.forEach(channel => {
            targetDeviceWrapper = this.devicePool.getDeviceWrapperByChannel(channel);
            targetDeviceWrapper?.setPowerState(true);
          });
          this.switchTargets?.forEach(channel => {
            targetDeviceWrapper = this.devicePool.getDeviceWrapperByChannel(channel);
            targetDeviceWrapper?.setPowerState(false);
          });
          callback('power-off', this);
        });
        break;
  
      case 'IOT.SMARTBULB':
        this.device.on('lightstate-on', (e) => {
          log('lightstate-on', this);
          callback('lightstate-on', this);
        });
        
        this.device.on('lightstate-off', (e) => {
          log('lightstate-off', this);
          callback('lightstate-off', this);
        });
        break;
    }
  
  },

  injectDevice(device, mapItem, globalConfig, deviceEventCallbackFn) {
    this.device = device;
    this.deviceEventCallbackFn = deviceEventCallbackFn;

    if (mapItem) {
      // Copy in the mapItem properties.
      this.channel = mapItem.ch;
      this.id = mapItem.id;
      this.alias = mapItem.alias;
      this.subType = mapItem.subType;
      this.switchTargets = mapItem.switchTargets;
      this.switchTargetsOff = mapItem.switchTargetsOff;

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
              log(`Updating alias failed.`, this, err);
            });
        }

        log(`Discovered device at ${device.host}`, this);

        this.addListeners();
      }
    } else {
      if (device) {
        log(`Found unmapped device at ${device.host} - ID: ${device.id}`, this);  
      }
    }
  },

  setLightState(commandObject) {
    return new Promise((resolve, reject) => {
      if (this.device) {
        if (this.isOnline) {
          this.device
            .setLightState(commandObject)
            .then(data => {
              log(`setLightState ${JSON.stringify(commandObject)}`, this, err);
              this.PowerState = state;  
              resolve();
            })
            .catch(err => {
              log(`setLightState failed`, this, err);
              reject(err);
            });
        } else {
          log(`setLightState failed because device is offline.`, this);
        }
      }
    });
  },

  setPowerState(state) {
    return new Promise((resolve, reject) => {
      if (this.device) {
        if (this.isOnline) {
          this.device
            .setPowerState(state)
            .then(data => {
              log(`setPowerState ${state ? 'on' : 'off'}`, this);
              this.PowerState = state;
              resolve();  
            })
            .catch(err => {
              log(`setPowerState failed`, this, err);
              reject(err);
            });
        } else {
          log(`setPowerState failed because device is offline.`, this);
        }
      }
    })
  },


  startPolling() {

    if (this.device && this.isOnline) {

      const { tBulb, tStrip, tPlug, tSwitch } = this.globalConfig.subTypes;

      this.config = this.globalConfig[this.subType];

      this.device.on('polling-error', (err) => {
        if (this.isOnline) {
          log("Polling error. Device probably went offline.", this, err?.message);
        }
      });
  
      const pollInterval = this.config?.pollInterval ?? 10000;

      this.device.startPolling(pollInterval);
      log(`Polling this ${this.subType ? this.subType : `unknown device`} at ${pollInterval} ms.`, this);  
    }

  },

  stopPolling() {
    if (this.device) {
      log(`Suspending polling.`, this);  
      this.device.stopPolling();
    }
  }
}


/**
 * The DevicePool encapsulates all automation device functionality.
 * It keeps an array of deviceWrappers to keep track of device status and
 * additional meta information (mapItem properties).
 * A callback function can be passed into intialize() that will be called 
 * on device events (powerstate/lightstate changes).
 */
const DevicePool = {

  initialize(db, callbackFn) {
    this.db = db;
    this.dbDeviceMap = db.collection('deviceMap');
    this.dbConfig = this.db.collection('config');


    // This will call startDiscovery once things have been loaded from Mongo
    this.loadDeviceMap();

    // If a callback function has been passed in, store it.
    if (callbackFn) {
      this.deviceEventCallbackFn = callbackFn;
      log(`Registered callback function.`);
    }
  },

  startDiscovery() {
    log(`Starting device discovery...`);
    this.devices = [];

    const { Client } = require('tplink-smarthome-api');
    const client = new Client();

 

    const addDevice = device => {
      const deviceWrapper = Object.create(DeviceWrapper);      
      const mapItem = this.getDeviceMapItemById(device.id);

      // Store a backreference to the pool in each wrapper to enable event listeners to execute functinos on other devices
      deviceWrapper.devicePool = this;

      deviceWrapper.injectDevice(device, mapItem, this.globalConfig, this.deviceEventCallbackFn);
      this.devices.push(deviceWrapper);      
    }

    const options = {
      // Number of subsequent polling attempts before 'device-offline' is emitted.
      offlineTolerance: 1
    }

    client.startDiscovery(options).on('device-new', (device) => {
      device.getSysInfo().then(info => {
        addDevice(device);
      });
    });

    // Attach event listeners for device-online/device-offline    
    client.on('device-offline', device => {
      const deviceWrapper = this.getDeviceWrapperById(device.id);
      if (deviceWrapper && deviceWrapper.isOnline) {
        log(`Device went offline.`, deviceWrapper);
        deviceWrapper.isOnline = false;
        deviceWrapper.stopPolling();
      }
    });

    client.on('device-online', device => {
      const deviceWrapper = this.getDeviceWrapperById(device.id);
      if (deviceWrapper && !deviceWrapper.isOnline) {
        log(`Device came online.`, deviceWrapper);
        deviceWrapper.isOnline = true;
        deviceWrapper.startPolling();
      }
    });
    
  },
  
  getDeviceMapItemById(id) {
    return this.deviceMap.find(item => item.id === id);  
  },

  getDeviceWrapperByChannel(channel) {
    return this.devices.find(deviceWrapper => deviceWrapper.channel === channel);
  },

  getDeviceWrapperById(id) {
    mapItem = this.getDeviceMapItemById(id);
    if (mapItem) {
      return this.getDeviceWrapperByChannel(mapItem.ch);
    }
  },

  loadDeviceMap() {
    this.dbDeviceMap.find({}).toArray().then(deviceMap => {

      log(`Loaded ${deviceMap.length} devices from the database.`);
      this.deviceMap = deviceMap;

    }).then(this.dbConfig.findOne()
    .then(globalConfig => {

      log(`Loaded global configuration from the database.`);
      this.globalConfig = globalConfig;

      this.startDiscovery();      
    }));


  }, 

}


module.exports = DevicePool;