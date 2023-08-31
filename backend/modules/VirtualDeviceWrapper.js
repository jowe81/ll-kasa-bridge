import _ from 'lodash';
import axios, { all } from 'axios';
import constants from '../constants.js';
import { log, debug } from './Log.js';
import { globalConfig } from '../configuration.js';
import { resolveDeviceDependencies } from './DependencyResolver.js';
import { makeLiveDeviceObject } from './TargetDataProcessor.js';
import { thermostatIntervalHandler } from './virtualDeviceProcessing/thermostat.js';

const cmdPrefix = '[CMD]';
const cmdFailPrefix = '[FAIL]';

const localConstants = constants.DEVICETYPE_DEFAULTS[constants.DEVICETYPE_VIRTUAL];

const VirtualDeviceWrapper = {
  device: null,
  initialized: false,

  addCallback(callbackFn, event) {
    log(`Adding callback to '${event}`, this);
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
      case constants.SUBTYPE_THERMOSTAT:
        changeInfo.on_off = changeInfo.changed;
        break;
    }

    return changeInfo;
  },

  getPowerState() {
    switch (this.subType) {
      case constants.SUBTYPE_THERMOSTAT:
      default:
        return this.powerState;
        break;
    }    
    
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
    this.state = {
      powerState: null,
    }
    this.powerState = false;
    this.isOnline = true; // Always online.
    
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

    this.state.target = this.settings.target ?? localConstants.thermostat.TARGET_DEFAULT;

    log(`Initializing ${this.subType} for location ${this.location}. Mode is ${ modes.join(' and ') }, hysteresis is ${this.settings.hysteresis}°C.`, this);
    this.start();
  },


  nudgeTarget(up) {
    const baseAmount = this.settings?.nudgeBy ?? 0.5;
    const amount = up ? baseAmount : -baseAmount

    this.setTarget(this.state.target + amount);
  },

  setTarget(tempC) {
    const minTarget = localConstants.thermostat.TARGET_MIN;
    const maxTarget = localConstants.thermostat.TARGET_MAX;

    if (!(tempC > 0 && tempC <= maxTarget && tempC >= minTarget)) {
      log(`Attempt to set invalid target temperature: ${tempC}°C. Allowed min/max: ${minTarget}°C / ${maxTarget}°C.`, this);
      return;
    }

    log(`Setting target to ${tempC}°C`, this);

    const currentState = this.state;
    const newState = {
      ...currentState,
      target: tempC,
    };
    
    this._updateState(newState);
  },

  setPowerState(newPowerState, triggerSwitchPosition, origin) {
    let originText = typeof origin === 'object' ? (origin.alias ?? origin.id ?? origin.ip ?? origin.text) : origin ? origin : 'unknown origin';
    log(`${cmdPrefix} [${originText}] setPowerState ${newPowerState ? 'on' : 'off'}`, this, 'cyan');  

    const currentState = this.state;
    const newState = {
      ...currentState,
      powerState: newPowerState,
    };
    
    this._updateState(newState);

    switch (this.subType) {
      case constants.SUBTYPE_THERMOSTAT:
        log(`Thermostat turned ${newPowerState ? 'on' : 'off'}.`, this);
        break;
        
    }    
    
  },



  // Start operating.
  start() {
    this.interval = 5000;// this._runPreChecks();

    if (!this.interval) {
      log(`Unable to start thermostat for ${this.location}. Check configuration.`, this, 'bgRed');
      return;
    }

    let modes = [];
    if (this.settings.heat) modes.push('heat');
    if (this.settings.cool) modes.push('cool');
    
    log(`Check-Interval: ${ Math.ceil(this.interval / constants.SECOND) } seconds. Target: ${this.settings.target}°C.`, this);

    // Turn off when first starting.
    this.setPowerState(false);

  },

  toggle(origin) {    
    this.setPowerState(!this.getPowerState(), null, origin);
  },

  updateIntervalHandler() {
    if (this._checkingIntervalHandler) {
      // Clear always. If needed it will be rescheduled below.
      clearInterval(this._checkingIntervalHandler);
    }

    if (this.interval) {

      switch (this.subType) {
        case constants.SUBTYPE_THERMOSTAT:
          thermostatIntervalHandler(this.devicePool, this, localConstants);
          break;
      }
    }
  },

  getLiveDevice() {
    return makeLiveDeviceObject(
      this, [
        // Include
        'powerState',
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

    switch (this.subType) {
      case constants.SUBTYPE_THERMOSTAT:
        data.powerState = this.getPowerState();
    }

    return data;
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

  _updateState(payload) {
    this.lastSeenAt = Date.now();

    if (!_.isEqual(this.state, payload)) {
      this.state = _.cloneDeep(payload);
      this.powerState = this.state.powerState;
      this.updateIntervalHandler();
      this.socketHandler.emitDeviceStateUpdate(this, this.analyzeStateChange(payload));      
    }    
  }
  

};

export default VirtualDeviceWrapper;