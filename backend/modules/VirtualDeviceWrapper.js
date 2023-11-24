import _ from 'lodash';
import axios, { all } from 'axios';
import constants from '../constants.js';
import { log, debug } from './Log.js';
import { globalConfig } from '../configuration.js';
import { resolveDeviceDependencies } from './DependencyResolver.js';
import { makeLiveDeviceObject } from './TargetDataProcessor.js';
import { getDeviceHandlerPlugins } from './VirtualDeviceHandlers.js';

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
    return this.state.powerState;    
  },

  init(cache, mapItem, globalConfig, deviceEventCallback, devicePool, socketHandler) {
    this.globalConfig = globalConfig;
    this.deviceEventCallback = deviceEventCallback;
    this.devicePool = devicePool;
    this.socketHandler = socketHandler;

    this.listeners = {
      'powerState': [],
    };

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
        
    // Initialize the cache for all Virtual devices
    if (!this.cache) {
      this.cache = cache;
    }

    // Initialize the cache for this device
    this.cache[mapItem.channel] = {};
    const cacheForThisDevice = this.cache[mapItem.channel];

    this.deviceHandler = {};         

    // Device-specific initialization (using plugin)
    const deviceHandlerPlugins = getDeviceHandlerPlugins();
    const handlerGenerator = deviceHandlerPlugins[`${this.subType}Handler`];

    if (handlerGenerator) {
      log(`Instantiating handler for device of type: ${this.type}/${this.subType}`, this);
      const getHandlerInstance = deviceHandlerPlugins[`${this.subType}Handler`].default;
      this.deviceHandler = getHandlerInstance(devicePool, this, cacheForThisDevice);  
    }
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

    log(`Power state change: ${this.subType} turned ${newPowerState ? 'on' : 'off'}.`, this);  
  },

  toggle(origin) {  
    this.setPowerState(!this.getPowerState(), null, origin);
  },


  getLiveDevice() {
    if (typeof this.deviceHandler.getLiveDevice === 'function') {
      return this.deviceHandler.getLiveDevice();
    }

    // Default
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
    const state = this._getState();
    const data = {
      state,
      powerState: state.powerState,
      channel: this.channel,
      isOnline: this.isOnline,      
    };

    return data;
  },

  subscribeListener(event, listenerFn) {
    switch (event) {
      case 'powerState':
        this.listeners.powerState.push(listenerFn);
    }
  },

  _emitDeviceStateUpdate(changeInfo) {
    this.socketHandler.emitDeviceStateUpdate(this.getLiveDeviceStateUpdate(), changeInfo);
  },

  /**
   * Get the state from the handler if it supports it.
   */
  _getState() {
    if (typeof this.deviceHandler.getState === 'function') {
      return this.deviceHandler.getState();
    }

    return this.state;
  },

  _trigger(event, data) {
    const functions = this.listeners[event];

    if (functions) {
      this.listeners[event].forEach(listenerFn => listenerFn(data));
    }
  },

  _updateOnlineState(isRunning) {
    if (isRunning) {
      this.isOnline = isRunning;
      this.lastSeenAt = Date.now();
    }      
  },

  _updateState(payload, force) {
    this.lastSeenAt = Date.now();
    if (force || !_.isEqual(this.state, payload)) {
      const changeInfo = this.deviceHandler.analyzeStateChange ?
       this.deviceHandler.analyzeStateChange(this.state, payload) :
       undefined;
      
      this.state = _.cloneDeep(payload);
      this.powerState = this.state.powerState;

      if (changeInfo?.on_off) {
        this._trigger('powerState', this.powerState);
      }

      this._emitDeviceStateUpdate(changeInfo);      
    }    
  }
  

};

export default VirtualDeviceWrapper;