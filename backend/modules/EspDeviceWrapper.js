import _ from 'lodash';
import axios from 'axios';
import constants from '../constants.js';
import { log, debug } from './Log.js';
import { globalConfig } from '../configuration.js';

const EspDeviceWrapper = {
  device: null,
  initialized: false,

  addCallback(callbackFn, event) {
    log(`Adding callback to '${event}`, this);
  },

  init(cache, mapItem, globalConfig, deviceEventCallback, devicePool, socketHandler) {
    this.globalConfig = globalConfig;
    this.deviceEventCallback = deviceEventCallback;
    this.devicePool = devicePool;
    this.socketHandler = socketHandler;
    // Shared cache to keep ESP responses in and avoid querying for the same data multiple times.
    this.cache = cache;

    const requiredFields = ['alias', 'channel', 'id', 'url', 'jsonPath', 'jsonPathId', 'display', 'locationId', 'type', 'subType'];

    this.alias = mapItem.alias;
    this.channel = mapItem.channel;
    this.id = mapItem.id;
    this.url = mapItem.url;
    this.jsonPath = mapItem.jsonPath;
    this.jsonPathId = mapItem.jsonPathId;
    this.display = mapItem.display;
    this.locationId = mapItem.locationId;
    this.type = mapItem.type;
    this.subType = mapItem.subType;
    
    requiredFields.forEach(field => {       
      if (!this.field) { 
        return false;
      }
    });

    if (!cache.espUrls) {
      // Init cache.
      cache.espUrls = [];
      cache.espData = {};
    }

    if (!cache.espUrls.includes(this.url)) {
      // Add this url to the urls array for polling.
      cache.espUrls.push(this.url);      
    }

    // Spin up a code that queries the esps at an interval and caches their responses.
    if (!cache._pollingIntervalHandler) {
      const pollInterval = globalConfig[this.type].pollInterval;

      cache._pollingIntervalHandler = setInterval(async () => {
        try {
          const response = await axios(this.url);

          cache.espData[this.url] = {
            timestamp: Date.now(),
            data: response?.data ?? null,
          }
        } catch(err) {
          log(`Polling error for ${this.url}: ${err.message}`);
        }
      }, pollInterval);
    }

    this.startPolling();
  },

  // This will only poll the cache
  startPolling() {
    const pollInterval = globalConfig[this.type].pollInterval;    
    log(`Polling and updating this ${this.type}-${this.subType} at ${this.url} every ${pollInterval} ms.`, this);
    this._pollingIntervalHandler = setInterval(async () => {

      try {

        const data = this.cache?.espData[this.url];        

        if (data?.data) {

          const payloadFieldKey = Object.keys(this.jsonPathId)[0];
          const payload = data.data[this.jsonPath].find(item => item[payloadFieldKey] === this.jsonPathId[payloadFieldKey]);
          const changeInfo = this.analyzeStateChange(payload);

          if (typeof changeInfo === 'undefined' || changeInfo.changed) {
            // This is the initial state update or an actual change: update in both cases.
            log(`Received initial state update.`, this);
            this._updateState(payload);
            this.socketHandler.emitDeviceStateUpdate(this, changeInfo);
          }

          // There was no change.
          if (!changeInfo?.changed) {
            return;
          }
      
          switch (this.subType) {
            case constants.SUBTYPE_THERMOMETER:
              if (!Array.isArray(data.data[this.jsonPath])) {
                throw new Error(`Bad data from device, expected array at jsonPath ${this.jsonPath} and got ${typeof data[this.jsonPath]}.`);
              }
                                  
              const { tempC } = this.state;
              
              log(`${this.alias} temperature: ${tempC} °C`, this);              
              break;

            default:
              break;
          }  
        } else {
          // No data in cache yet.
        }

      } catch(err) {
        log(`Polling error: ${err.message}`, this);
      }
      
    }, pollInterval);
  },

  /**
   * Compare newState against the current state of the device.
   * 
   * @param   {} newState 
   * @returns {} Infomation about the change or undefined if current state doesn't exist.
   */
  analyzeStateChange(newState) {
    console.log(`Analyzing statechange for `, this.type, this.subType, newState);
    if (this.state === undefined) {
      // Have no current state. Just received the first update.
      return undefined;
    }

    let changeInfo = {};
    changeInfo.changed = !_.isEqual(this.state, newState);

    return changeInfo;
    //let changed = 'changed': this?.state && tempC !== this?.state.tempC,


  },

  _updateState(data) {
    this.lastSeenAt = Date.now();
    this.state = _.cloneDeep(data);
  }
  

};

export default EspDeviceWrapper;