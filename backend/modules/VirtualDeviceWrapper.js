import _ from 'lodash';
import axios, { all } from 'axios';
import constants from '../constants.js';
import { log, debug } from './Log.js';
import { globalConfig } from '../configuration.js';
import { resolveDeviceDependencies } from './DependencyResolver.js';
import { makeLiveDeviceObject } from './TargetDataProcessor.js';
import DeviceWrapper from './DeviceWrapper.js';
import e from 'cors';

const localConstants = {

  thermostat: {
    // Do not check more often than the minimum set here.
    MIN_CHECKING_INTERVAL: 10 * constants.SECOND,

    // Boundaries for target temperature settings.
    TARGET_MAX: 30,
    TARGET_MIN: 10,
    TARGET_DEFAULT: 22,
  }
  
};


const EspDeviceWrapper = {
  device: null,
  initialized: false,

  addCallback(callbackFn, event) {
    log(`Adding callback to '${event}`, this);
  },

  init(mapItem, globalConfig, deviceEventCallback, devicePool, socketHandler) {
    this.globalConfig = globalConfig;
    this.deviceEventCallback = deviceEventCallback;
    this.devicePool = devicePool;
    this.socketHandler = socketHandler;

    const requiredFields = ['alias', 'channel', 'id', 'settings', 'display', 'locationId', 'type', 'subType'];

    this.alias = mapItem.alias;
    this.channel = mapItem.channel;
    this.id = mapItem.id;
    this.host = 'localhost';
    this.settings = mapItem.settings;
    this.display = mapItem.display;
    this.displayLabel = mapItem.displayLabel;
    this.displayType = mapItem.displayType;
    this.locationId = mapItem.locationId;
    this.type = mapItem.type;
    this.subType = mapItem.subType;
    
    resolveDeviceDependencies(this);
        
    requiredFields.forEach(field => {       
      if (!this.field) { 
        return false;
      }
    });
    

    let modes = [];
    if (this.settings.heat) modes.push('heat');
    if (this.settings.cool) modes.push('cool');

    if (!modes.length) {
      // No mode configured.
      return false;
    }

    log(`Initializing ${this.subType} for location ${this.location}. Mode is ${ modes.join(' and ') }, hysteresis is ${this.settings.hysteresis}°C.`, this);
    this.start();
  },

  // Start operating.
  start() {
    const interval = this._runPreChecks();

    if (!interval) {
      log(`Unable to start thermostat for ${this.location}. Check configuration.`, this, 'bgRed');
      return;
    }

    let modes = [];
    if (this.settings.heat) modes.push('heat');
    if (this.settings.cool) modes.push('cool');
    
    log(`Check-Interval: ${ Math.ceil(interval / constants.SECOND) } seconds. Target: ${this.settings.target}°C.`, this);

    this._checkingIntervalHandler = setInterval(async () => {
      
    }, interval);
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

    let changeInfo = {};
    changeInfo.changed = !_.isEqual(this.state, newState);

    switch (this.subType) {
      case constants.SUBTYPE_BULB:
      case constants.SUBTYPE_MAIL_COMPARTMENT:
        // These only have a boolean. So if 'state' changed, on_off changed too.
        changeInfo.on_off = changeInfo.changed;
        break;
    }

    return changeInfo;
  },

  getLiveDevice() {
    return makeLiveDeviceObject(
      this, [
        // Include
      ], {
        // Default
        'display': true,
      }, [
        // Exclude
      ],
      // Use global defaults
      true,
    );
  },

  /**
   * Return a state update to be emitted to the sockets
   */
  getLiveDeviceStateUpdate() {
    const data = {
      state: this.state,
      channel: this.channel,
      isOnline: this.isOnline,
    };

    switch (this.type) {
      case constants.DEVICETYPE_ESP_RELAY:
        data.powerState = this.getPowerState();
    }

    return data;
  },

  getPowerState() {
    switch (this.type) {
      case constants.DEVICETYPE_ESP_RELAY: // Includes mailbox lights, mailbox lock      
        return !!this.state;
    }
  },

  /**
   * Run checks to make sure required devices are present and settings ok. Returns interval > 0 or false.
   * @returns integer|boolean
   */
  _runPreChecks() {
    const { settings } = this;

    // Check interval
    let interval = settings.checkInterval ?? (globalConfig[this.type] && globalConfig[this.type].pollInterval) ?? constants.ESP_DEFAULT_POLL_INTERVAL;

    if (interval < localConstants.thermostat.MIN_CHECKING_INTERVAL) {
      interval = localConstants.thermostat.MIN_CHECKING_INTERVAL;
      settings.checkInterval = interval;      
    }

    // Target temperature
    let target = settings.target;

    if (!(target >= localConstants.thermostat.TARGET_MIN && target <= localConstants.thermostat.TARGET_MAX)) {
      target = localConstants.thermostat.TARGET_DEFAULT;
      settings.target = target;
    }

    let heatersVerified = false;
    let acsVerified = false;

    // Verify required device(s)
    if (settings.heat) {
      heatersVerified = this._verifyDevices(constants.SUBTYPE_AIR_HEAT, settings.heaters);
    } else {
      heatersVerified = true;      
    }

    if (settings.cool) {
      acsVerified = this._verifyDevices(constants.SUBTYPE_AIR_HEAT, settings.acs);
    } else {
      acsVerified = true;      
    }

    const allDevicesVerified = heatersVerified && acsVerified;

    if (!allDevicesVerified) {
      log(`Thermostat error: could not verify devices required for the configured mode.`, this);
      return false;
    }

    log(`Verified ${settings.heaters?.length ?? 0} heater(s), ${settings.acs?.length ?? 0} air conditioner(s).`, this);

    return interval;
  },

  _verifyDevices(hvacType, channels) {
    if (!(hvacType && channels && channels.length)) {
      return false;
    }

    let verified = true;

    channels.every(channel => {
      const deviceWrapper = this.devicePool.getDeviceWrapperByChannel(channel);

      if (!(deviceWrapper && deviceWrapper.locationId === this.locationId && deviceWrapper.hvacType === hvacType)) {
        // Quit early if non-compliant device was found.
        verified = false;
        return false;
      }
    });

    return verified;
  },

  _updateOnlineState(isRunning) {
    if (isRunning) {
      this.isOnline = isRunning;
      this.lastSeenAt = Date.now();
    }      
  },

  _updateState(payload, trendData) {
    this.lastSeenAt = Date.now();
    this.state = _.cloneDeep(payload);
  }
  

};

export default EspDeviceWrapper;