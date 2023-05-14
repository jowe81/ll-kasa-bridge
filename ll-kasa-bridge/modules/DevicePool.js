import chalk from 'chalk';
import TplinkSmarthomeApi from 'tplink-smarthome-api';
import fs from 'fs';


import { getFormattedDate, pad } from '../helpers/jUtils.js';
const cmdPrefix = '[CMD]';
const cmdFailPrefix = '[FAIL]';

const log = (t, deviceWrapper, color, err) => {
  let date = getFormattedDate() + ' ';
  let prefix = ``;

  const channel = deviceWrapper?.channel ? pad(deviceWrapper?.channel, 2) : 0;
  if (channel) {
    prefix += `Ch ${channel}` + (deviceWrapper.device ? ` (${deviceWrapper.alias})` : ``);
  }

  let line;
  const colon = channel ? ': ' : '';

  if (err) {
    if (t) {
      //A message was sent along
      line = `${prefix}${colon}${t}:`;
    } else {
      //No message, use err.message
      const msg = err.message ? err.message : 'unknown error'; 
      line = `${prefix}${colon}Error: ${msg}`;
    }
    console.log(date + chalk.red(line), typeof(err) === 'string' ? chalk.red(err) : err);
  } else {
    // Regular message.
    line = `${prefix}${colon}${t}`;
    console.log(date + chalk[color ?? 'green'](line));
  }

  if (deviceWrapper) {
    const logToFile = process.env.LOG_DEVICE_EVENTS_TO_FILE;
    const logDirectory = process.env.LOG_DIRECTORY;
    const logFileName = channel ?
      `Channel ${pad(channel, 2 , '0')} - ${deviceWrapper.alias}.log` :
      `Unmapped devices.log`;

    if (logToFile) {
      try {
        if (!fs.existsSync(logDirectory)){
          fs.mkdirSync(logDirectory);
        }
        fs.appendFileSync(
          logDirectory + logFileName,
          getFormattedDate(null, null) + ' ' + line + '\n'
        );
      } catch (err) {
        log(`Could not write to log file at ${logDirectory + logFileName}`, null, null, err);
      }
    }
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

    // Send the meta for this device as the origin of the request (used with switches)
    const { type, channel, id, alias } = this;
    const origin = {
      type,
      channel,
      id,
      alias,
    }
    
    const switchOnOffListener = (event) => {
      let targetsA = event === 'power-on' ? this.switchTargets : this.switchTargetsOff;
      let targetsB = event === 'power-on' ? this.switchTargetsOff : this.switchTargets;

      if (!targetsA) {
        targetsA = [];
      }
      if (!targetsB) {
        targetsB = [];
      }

      log(`${event}, on-targets: [${targetsA.join(', ')}] off-targets: [${targetsB.join(', ')}].`, this);

      targetsA.forEach(channel => {
        const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(channel)
        if (deviceWrapper) {
          console.log('A - isonline: ', deviceWrapper.isOnline);
          deviceWrapper
            .setPowerState(true, origin)
            .catch(err => {
              console.log(err);
            });              
        }
      });

      targetsB.forEach(channel => {            
        const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(channel)
        if (deviceWrapper) {
          console.log('B: ', deviceWrapper.alias);
          deviceWrapper
            .setPowerState(false, origin)
            .catch(err => {
              console.log(err);
            });              
        }
      });

      callback(event, this);
    }

    switch (this.device.type) {
      case 'IOT.SMARTPLUGSWITCH':
        this.device.on('power-on', () => switchOnOffListener('power-on'));
        this.device.on('power-off', () => switchOnOffListener('power-off'));
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
              log(`Updating alias failed.`, this, null, err);
            });
        }

        log(`Discovered device at ${device.host}`, this);

        this.addListeners();
      }
    } else {
      if (device) {
        log(`Found unmapped device at ${device.host} - ID ${device.id}, type ${device.type}`, this);
      }
    }
  },

  async setLightState(commandObject, origin) {    
    let originText = origin.alias ?? origin.id ?? origin.ip ?? 'unknown origin';
    log(`Command from ${originText}`, this);

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
    let originText = origin.alias ?? origin.id ?? origin.ip ?? 'unknown origin';
    log(`Command from ${originText}`, this);

    if (this.device && this.isOnline) {
      try {
        const data = await this.device.setPowerState(state);
        log(`${cmdPrefix} setPowerState ${state ? 'on' : 'off'}`, this, 'cyan');  
      } catch(err) {
        log(`${cmdPrefix} ${cmdFailPrefix} setPowerState returned an error`, this, null, err);
      }
    } else {
      log(`${cmdPrefix} ${cmdFailPrefix} setPowerState failed: device is offline.`, this, 'red');
    }
  },


  startPolling() {

    if (this.device && this.isOnline) {

      const { tBulb, tStrip, tPlug, tSwitch } = this.globalConfig.subTypes;

      this.config = this.globalConfig[this.subType];

      this.device.on('polling-error', (err) => {
        if (this.isOnline) {
          log("Polling error. Device probably went offline.", this, null, err?.message);
        }
        console.log(err);
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

  async initialize(db, callbackFn) {
    this.db = db;
    this.dbDeviceMap = db.collection('deviceMap');
    this.dbConfig = this.db.collection('config');

    log(`Initializing device pool.`, null, 'white');

    // If a callback function has been passed in, store it.
    if (callbackFn) {
      this.deviceEventCallbackFn = callbackFn;
      log(`Registered callback function '${callbackFn.name}' in device pool.`, null, 'white');
    }

    // This will call startDiscovery once things have been loaded from Mongo
    await this.loadGlobalConfiguration();
    this.startDiscovery();
  },

  startDiscovery() {
    log(`Starting device discovery...`, null, 'white');
    this.devices = [];

    const client = new TplinkSmarthomeApi.Client();

    const addDevice = async device => {
      const deviceWrapper = Object.create(DeviceWrapper);      
      const mapItem = await this.getDeviceMapItemById(device.id);

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
        log(`Device came online.`, deviceWrapper);
        deviceWrapper.isOnline = true;
        deviceWrapper.startPolling();
      }
    });
    
  },
  
  getDeviceWrapperByChannel(channel) {
    return this.devices.find(deviceWrapper => deviceWrapper.channel === channel);
  },

  async getDeviceMapItemById(id) {
    return this.dbDeviceMap.findOne({id});
  },

  async getDeviceWrapperById(id) {
    const mapItem = await this.getDeviceMapItemById(id);
    if (mapItem) {
      return Promise.resolve(this.getDeviceWrapperByChannel(mapItem.ch));
    }
  },

  async loadGlobalConfiguration() {
    const globalConfig = await this.dbConfig.findOne();
    this.globalConfig = globalConfig;
    const noMapItems = await this.dbDeviceMap.countDocuments();
    log(`Loaded global configuration and found ${noMapItems} registered devices in the database.`, null, 'white');
  }, 

}


export default DevicePool;