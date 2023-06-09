import chalk from 'chalk';
import TplinkSmarthomeApi from 'tplink-smarthome-api';
import fs from 'fs';


import { getFormattedDate, pad } from '../helpers/jUtils.js';
import { globalConfig } from '../deviceMap.js';
import { timingSafeEqual } from 'crypto';

const masterLogFile = 'jj-auto.log';
const cmdPrefix = '[CMD]';
const cmdFailPrefix = '[FAIL]';

/**
 * 
 * @param {string} t                  The text to log
 * @param {object} deviceWrapper      The device the message is about
 * @param {string} color              Chalk compatible color
 * @param {object} err 
 * @param {bool} writeToFileOverride  Do not write to file even if the env file says to.
 */
const log = (t, deviceWrapper, color, err, writeToFileOverride = false) => {
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

  const logToFile = process.env.LOG_DEVICE_EVENTS_TO_FILE;

  if (logToFile && !writeToFileOverride) {

    const logDirectory = process.env.LOG_DIRECTORY;
    const logline = getFormattedDate(null, null) + ' ' + line + '\n';

    try {

      // Verify the directory.
      if (!fs.existsSync(logDirectory)){
        fs.mkdirSync(logDirectory);
      }

      // Device specific logging.
      if (deviceWrapper) {

        const logFileName = channel ?
          `Channel ${pad(channel, 2 , '0')} - ${deviceWrapper.alias}.log` :
          `Unmapped devices.log`;
    
        fs.appendFileSync(
          logDirectory + logFileName, logline
        );
      }

      // Master log file.
      fs.appendFileSync(
        logDirectory + masterLogFile, logline
      )

    } catch (err) {
      console.log(`Could not write to log file in path ${logDirectory}: ${err.message}`, null, null, err);
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
      let targetsOn;
      let targetsOff;

      switch (event) {
        case 'power-on':
          targetsOn = this.switchTargetsA?.on ? [ ...this.switchTargetsA?.on ] : [];
          targetsOff = this.switchTargetsA?.off ? [ ...this.switchTargetsA?.off ] : []; 
          break;
        
        case 'power-off':
          targetsOn = this.switchTargetsB?.on ? [ ...this.switchTargetsB?.on ] : [];
          targetsOff = this.switchTargetsB?.off ? [ ...this.switchTargetsB?.off ] : []; 
          break;
      }
      
      log(`${event}, on-targets: [${targetsOn.join(', ')}] off-targets: [${targetsOff.join(', ')}].`, this);

      targetsOn.forEach(channel => {
        const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(channel)
        if (deviceWrapper) {
          deviceWrapper.setPowerState(true, origin);
        }
      });

      targetsOff.forEach(channel => {            
        const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(channel)
        if (deviceWrapper) {
          deviceWrapper.setPowerState(false, origin);
        }
      });

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
      this.channel = mapItem.ch;
      this.id = mapItem.id;
      this.alias = mapItem.alias;
      this.subType = mapItem.subType;
      this.switchTargetsA = mapItem.switchTargetsA;
      this.switchTargetsB = mapItem.switchTargetsB;

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

  async setLightState(commandObject, origin) {    
    let originText = typeof origin === 'object' ? (origin.alias ?? origin.id ?? origin.ip ?? origin.text) : 'unknown origin';
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

      const { channel, id, alias, subType, switchTargetsA, switchTargetsB, type, host, isOnline, lastSeenAt, state } = deviceWrapper;
      
      const item = {
        channel,
        id,
        alias,
        subType,
        switchTargetsA,
        switchTargetsB,
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